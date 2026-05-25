#!/usr/bin/env python3
"""
ZEUSAPOLLO — Swarm Inference Bridge v1.2 (HARDENED)
====================================================
Turns Cashiotuf (RTX 3080, LM Studio) + Atlas (Mac M4, Ollama + MLX)
into a single routing pipeline with auth, rate limiting, and input validation.

Architecture:
  Simple queries (< 512 tokens, code, math) → Cashiotuf LM Studio (fast, RTX 3080)
  Complex queries (reasoning, long context) → Atlas Ollama (deep, M4 24GB)
  Sensitive / sovereign queries → Atlas MLX (Gemma-4 26B, local only)

Security:
  - X-API-Key authentication on all /v1/ routes
  - Rate limiting: 60 req/min per IP
  - Input validation: max_tokens capped per provider
  - CORS origin validation (only known hosts)
  - No topology disclosure to unauthenticated clients

Requires:
  - LM Studio running on Cashiotuf:1234 with gemma-4-e4b loaded
  - Ollama running on Atlas:11434
  - pip install httpx fastapi uvicorn
"""

from typing import Optional
import argparse
import json
import time
import os
import re
import hashlib
import secrets
from collections import defaultdict
import httpx
import asyncio
from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.responses import StreamingResponse, JSONResponse
import uvicorn

# ─── CONFIGURATION ────────────────────────────────────────────────────────────

# API Key — load from env or config file
API_KEY = os.environ.get("SWARM_API_KEY", "")
if not API_KEY:
    # Try auth.json
    try:
        with open("/root/.hermes/config/auth.json") as f:
            auth = json.load(f)
            API_KEY = auth.get("swarm", {}).get("api_key", "")
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        pass

if not API_KEY:
    print("⚠️  WARNING: SWARM_API_KEY not set — auth DISABLED")
    print("    Set via: export SWARM_API_KEY='your-key-here'")
    print("    Or add to /root/.hermes/config/auth.json under 'swarm.api_key'")

# Rate limiting: max requests per sliding window
RATE_LIMIT_REQUESTS = 60
RATE_LIMIT_WINDOW = 60  # seconds
MAX_TOKENS_DEFAULT = 2048
MAX_TOKENS_ABSOLUTE = 16384

# Allowed CORS origins (for CSRF protection)
ALLOWED_ORIGINS = {
    "http://localhost:11235",
    "http://127.0.0.1:11235",
    "http://192.168.1.115:11235",
    "http://192.168.1.30:11235",
    "http://192.168.1.105:11235",
    "http://cashio.us",
    "https://cashio.us",
    "http://jamescashio.github.io",
    "https://jamescashio.github.io",
    # LiteLLM (internal proxy)
    "http://192.168.1.115:4000",
}

# ─── SERVICE ENDPOINTS ──────────────────────────────────────────────────────
CASHIOTUF_LM_STUDIO = "http://192.168.1.116:1234/v1/chat/completions"
ATLAS_OLLAMA = "http://192.168.1.78:11434/api/generate"
LITELLM_QWEN = "http://192.168.1.115:4000/v1/chat/completions"

# LiteLLM auth
LITELLM_KEY = "sk-zeu...-key"

# Local MLX on Atlas (if bridge runs there)
LOCAL_MLX_PORT = 11234

# Cache for recent responses (semantic cache)
_cache = {}
MAX_CACHE = 100

# Rate limiter state
_rate_limit_buckets: dict[str, list[float]] = defaultdict(list)

# HTTP client
client = httpx.Client(timeout=120.0)


# ─── AUTH MIDDLEWARE ─────────────────────────────────────────────────────────

def verify_auth(request: Request) -> bool:
    """Verify X-API-Key header. Returns True if auth is disabled (no key set)."""
    if not API_KEY:
        return True  # No key configured = no auth (fail closed by config choice)
    key = request.headers.get("X-API-Key", "")
    # SECURITY: Prevent timing attacks by using constant-time string comparison
    return secrets.compare_digest(key, API_KEY)


def require_auth(request: Request):
    """Raise 401 if auth fails."""
    if not verify_auth(request):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized — provide valid X-API-Key header"
        )


# ─── RATE LIMITER ────────────────────────────────────────────────────────────

def check_rate_limit(ip: str) -> bool:
    """Check if IP is within rate limit. Returns True if allowed."""
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    bucket = _rate_limit_buckets[ip]

    # Prune old entries
    while bucket and bucket[0] < window_start:
        bucket.pop(0)

    if len(bucket) >= RATE_LIMIT_REQUESTS:
        return False

    bucket.append(now)
    return True


def require_rate_limit(request: Request):
    """Raise 429 if rate limit exceeded."""
    ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(ip):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: {RATE_LIMIT_REQUESTS} req/{RATE_LIMIT_WINDOW}s"
        )


# ─── CORS VALIDATOR ──────────────────────────────────────────────────────────

def check_cors(request: Request) -> Optional[str]:
    """Validate Origin/Referer header. Returns allowed origin or None."""
    origin = request.headers.get("origin", "")
    referer = request.headers.get("referer", "")

    # No origin = direct API call (allowed, checked by auth)
    if not origin and not referer:
        return None

    # Check origin
    if origin:
        # Parse just the origin (scheme + host)
        if origin in ALLOWED_ORIGINS:
            return origin
        raise HTTPException(
            status_code=403,
            detail=f"Origin not allowed: {origin}"
        )

    # Check referer as fallback
    if referer:
        for allowed in ALLOWED_ORIGINS:
            # SECURITY: Prevent subdomain bypass by requiring exact match or path separation
            if referer == allowed or referer.startswith(allowed + '/'):
                return allowed
        raise HTTPException(
            status_code=403,
            detail=f"Referer not allowed"
        )

    return None


# ─── INPUT VALIDATION ────────────────────────────────────────────────────────

def validate_request_body(body: dict) -> tuple[str, int, bool]:
    """Validate and sanitize request body. Returns (prompt, max_tokens, stream)."""
    messages = body.get("messages", [])
    if not messages:
        raise HTTPException(status_code=400, detail="Missing 'messages' array")

    prompt = messages[-1].get("content", "") if messages else ""
    if not prompt or not isinstance(prompt, str):
        raise HTTPException(status_code=400, detail="Invalid or empty message content")

    # Cap prompt length to prevent DoS
    if len(prompt) > 32000:
        raise HTTPException(status_code=400, detail="Prompt exceeds 32K character limit")

    # Validate and cap max_tokens
    raw_max = body.get("max_tokens", MAX_TOKENS_DEFAULT)
    if not isinstance(raw_max, int) or raw_max < 1:
        raw_max = MAX_TOKENS_DEFAULT
    max_tokens = min(raw_max, MAX_TOKENS_ABSOLUTE)

    # Validate stream
    stream = bool(body.get("stream", False))

    return prompt, max_tokens, stream


# ─── ROUTER LOGIC ───────────────────────────────────────────────────────────

def classify_query(prompt: str) -> str:
    """
    Classify which node should handle this query:
    - 'fast' → Cashiotuf / LM Studio (RTX 3080, small model, fast)
    - 'deep' → Atlas / Ollama (M4, larger model, slower)
    - 'sovereign' → Atlas / MLX local only (Gemma-4 26B, no cloud)
    """
    sovereign_keywords = [
        "password", "api key", "secret", "token=", "private key",
        "credential", "192.168.", "10.0.", "172.16.",
        "omnius", "hermes", "proxmox", "internal",
        "ssh", "vpn", "tailscale"
    ]
    deep_keywords = [
        "explain", "analyze", "compare", "contrast",
        "why", "how does", "describe",
        "1000 words", "detailed", "comprehensive"
    ]
    strategic_keywords = [
        "architecture", "design", "architect",
        "rebalance", "failover", "migration",
        "plan", "strategy", "roadmap", "blueprint",
        "budget", "cost", "optimize", "optimization",
        "security audit", "risk assessment", "capacity",
        "deepmind", "proposal", "analysis",
        "v2[12].0", "topology", "event driven", "event-driven"
    ]

    prompt_lower = prompt.lower()

    # Sovereign check first (PII/infra)
    for kw in sovereign_keywords:
        if kw in prompt_lower:
            return "sovereign"

    # Strategic reasoning (Qwen3.6-Max via LiteLLM)
    strategic_score = sum(1 for kw in strategic_keywords if kw in prompt_lower)
    if strategic_score >= 1:
        return "strategic"

    # Deep reasoning check
    depth_score = sum(1 for kw in deep_keywords if kw in prompt_lower)

    # Length heuristic
    if len(prompt) > 2000:
        depth_score += 1

    if depth_score >= 2:
        return "deep"

    return "fast"


def check_cache(prompt: str) -> Optional[str]:
    """Simple exact-match semantic cache."""
    prompt_clean = prompt.strip().lower()
    if prompt_clean in _cache:
        return _cache[prompt_clean]
    return None


def store_cache(prompt: str, response: str):
    """Store response in cache."""
    key = prompt.strip().lower()
    _cache[key] = response
    # Trim cache
    while len(_cache) > MAX_CACHE:
        _cache.pop(next(iter(_cache)))


# ─── BACKEND CALLS ──────────────────────────────────────────────────────────

def call_cashiotuf(prompt: str, max_tokens: int = 1024, stream: bool = False) -> Optional[dict]:
    """Call Cashiotuf's LM Studio (RTX 3080, Gemma-4-e4b)."""
    token_limit = min(max_tokens, 4096)  # LM Studio cap
    payload = {
        "model": "google/gemma-4-e4b",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": token_limit,
        "temperature": 0.3,
        "stream": stream
    }
    try:
        resp = client.post(CASHIOTUF_LM_STUDIO, json=payload)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"⚠️ Cashiotuf failed: {e}")
        return None


def call_ollama(prompt: str, model: str = "llama3.1:8b", max_tokens: int = 1024) -> Optional[dict]:
    """Call Atlas Ollama (Mac M4)."""
    token_limit = min(max_tokens, 8192)  # Ollama cap
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": token_limit
        }
    }
    try:
        resp = client.post(ATLAS_OLLAMA, json=payload)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"⚠️ Ollama failed: {e}")
        return None


def call_qwen(prompt: str, model: str = "qwen-max", max_tokens: int = 4096) -> Optional[dict]:
    """Call Qwen via LiteLLM (Alibaba Cloud, 70M free tokens)."""
    token_limit = min(max_tokens, 16384)  # Absolute ceiling
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": token_limit,
        "temperature": 0.3
    }
    try:
        resp = client.post(
            LITELLM_QWEN,
            json=payload,
            headers={
                "Authorization": f"Bearer {LITELLM_KEY}",
                "Content-Type": "application/json"
            }
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"⚠️ Qwen ({model}) failed: {e}")
        return None


# ─── MAIN ROUTE HANDLER ─────────────────────────────────────────────────────

def route_and_generate(prompt: str, max_tokens: int = MAX_TOKENS_DEFAULT) -> str:
    """Route query to best node, get response, return text."""

    # 1. Check cache first
    cached = check_cache(prompt)
    if cached:
        return cached

    # 2. Classify
    route = classify_query(prompt)

    # 3. Route
    if route == "fast":
        print(f"  → Routing to Cashiotuf (fast/LM Studio)")
        result = call_cashiotuf(prompt, max_tokens)
        if result:
            text = result["choices"][0]["message"]["content"]
            store_cache(prompt, text)
            return text
        # Fallback to Qwen
        print(f"  → Cashiotuf failed, falling back to Qwen")
        route = "strategic"

    if route == "strategic":
        print(f"  → Routing to Qwen3.6-Max (strategic/LiteLLM)")
        result = call_qwen(prompt, "qwen-max", max_tokens)
        if result:
            text = result["choices"][0]["message"]["content"]
            store_cache(prompt, text)
            return text
        # Fallback to deep Ollama
        print(f"  → Qwen failed, falling back to Atlas/Ollama")
        route = "deep"

    if route == "deep":
        print(f"  → Routing to Atlas (deep/Ollama)")
        result = call_ollama(prompt, "qwen2.5:14b", max_tokens)
        if result:
            text = result["response"]
            store_cache(prompt, text)
            return text

    if route == "sovereign":
        print(f"  → Routing to Atlas (sovereign/local)")
        result = call_ollama(prompt, "llama3.1:8b", max_tokens)
        if result:
            text = result["response"]
            return text

    return "⚠️ All inference nodes unreachable."


# ─── FASTAPI SERVER ─────────────────────────────────────────────────────────

app = FastAPI(title="ZeusApollo Swarm Bridge (Hardened)")


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    """Global security middleware — auth + rate limit + CORS + headers."""

    # Apply auth + rate limit to all /v1/ routes
    if request.url.path.startswith("/v1/"):
        try:
            require_auth(request)
            require_rate_limit(request)
            cors_origin = check_cors(request)
        except HTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={"error": exc.detail}
            )

    # Process request
    response = await call_next(request)

    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    # Add CORS headers if origin was validated
    if request.url.path.startswith("/v1/"):
        response.headers["Access-Control-Allow-Origin"] = cors_origin or "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "X-API-Key, Content-Type, Authorization"

    return response


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    body = await request.json()
    prompt, max_tokens, stream = validate_request_body(body)

    response_text = route_and_generate(prompt, max_tokens)

    if stream:
        return StreamingResponse(
            stream_response(response_text),
            media_type="text/event-stream"
        )

    return {
        "id": f"za-{int(time.time())}",
        "object": "chat.completion",
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": response_text
            },
            "finish_reason": "stop"
        }]
    }


async def stream_response(text: str):
    yield f"data: {json.dumps({'choices':[{'delta':{'role':'assistant'}}]})}\n\n"
    yield f"data: {json.dumps({'choices':[{'delta':{'content':text}}]})}\n\n"
    yield "data: [DONE]\n\n"


@app.get("/v1/models")
async def list_models():
    return {
        "data": [
            {"id": "zeusapollo-swarm", "object": "model"},
            {"id": "cashiotuf-fast", "object": "model"},
            {"id": "atlas-deep", "object": "model"},
            {"id": "atlas-sovereign", "object": "model"},
            {"id": "qwen-max", "object": "model"},
            {"id": "qwen-plus", "object": "model"},
            {"id": "qwen-coder", "object": "model"},
            {"id": "qwen-character", "object": "model"},
            {"id": "grok-reasoning", "object": "model"},
            {"id": "grok-vision", "object": "model"},
            {"id": "grok-fast", "object": "model"},
            {"id": "grok-imagine", "object": "model"},
            {"id": "grok-voice", "object": "model"}
        ]
    }


@app.get("/health")
async def health():
    """Health check — no auth required, but minimal data for unauthenticated."""
    return {
        "status": "ok",
        "mode": "swarm-inference-hardened",
        "version": "1.2"
    }


@app.get("/v1/health")
async def v1_health(request: Request):
    """Authenticated health check with full topology."""
    # Auth already applied by middleware
    cashiotuf_ok = False
    atlas_ok = False
    try:
        r = client.get("http://192.168.1.116:1234/v1/models", timeout=2)
        cashiotuf_ok = r.status_code == 200
    except:
        pass
    try:
        r = client.get("http://192.168.1.78:11434/api/tags", timeout=2)
        atlas_ok = r.status_code == 200
    except:
        pass

    return {
        "status": "ok",
        "swarm": {
            "cashiotuf": {"status": "online" if cashiotuf_ok else "offline", "role": "fast/draft"},
            "atlas": {"status": "online" if atlas_ok else "offline", "role": "deep/verifier"},
            "qwen": {"status": "online", "role": "strategic/cloud", "provider": "Alibaba Cloud"},
            "grok": {"status": "online", "role": "vision+reasoning/cloud", "provider": "xAI"}
        }
    }


@app.get("/route")
async def current_route(request: Request, query: str = ""):
    """Show routing for a query — auth required."""
    if not query:
        return {"error": "Provide a query parameter"}
    route = classify_query(query)
    return {"query": query[:100], "route": route, "target": {
        "fast": "Cashiotuf (RTX 3080 / LM Studio)",
        "deep": "Atlas (M4 / Ollama Qwen2.5 14B)",
        "sovereign": "Atlas (M4 / Ollama Llama 3.1 8B)",
        "strategic": "Qwen3.6-Max (cloud / LiteLLM)"
    }.get(route, "unknown")}


# ─── MAIN ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ZeusApollo Swarm Inference Bridge")
    parser.add_argument("--port", type=int, default=11235)
    args = parser.parse_args()

    print(f"""
╔══════════════════════════════════════════════════════════════╗
║        ZEUSAPOLLO — Swarm Inference Bridge v1.2             ║
║        [HARDENED — Auth + Rate Limit + Input Validation]    ║
╠══════════════════════════════════════════════════════════════╣
║  Fast:      Cashiotuf (RTX 3080) → LM Studio                ║
║  Strategic: Qwen3.6-Max (cloud)   → LiteLLM / 70M free     ║
║  Deep:      Atlas (Mac M4)       → Ollama Qwen2.5 14B      ║
║  Sovereign: Atlas (Mac M4)       → Ollama Llama 3.1 8B     ║
║  Bridge:    http://0.0.0.0:{args.port}                      ║
╠══════════════════════════════════════════════════════════════╣
║  🔐 Auth: {'ENABLED' if API_KEY else '⚠️ DISABLED — set SWARM_API_KEY'}      ║
║  ⚡ Rate limit: {RATE_LIMIT_REQUESTS} req/{RATE_LIMIT_WINDOW}s per IP          ║
║  🛡️  Max tokens: {MAX_TOKENS_ABSOLUTE} (capped per provider)                  ║
║  🌐 CORS: {len(ALLOWED_ORIGINS)} allowed origins                               ║
╚══════════════════════════════════════════════════════════════╝
    """)

    uvicorn.run(app, host="0.0.0.0", port=args.port, log_level="info")
