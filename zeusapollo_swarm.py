#!/usr/bin/env python3
"""
ZEUSAPOLLO — Swarm Inference Bridge v1.0
=========================================
Turns Cashiotuf (RTX 3080, LM Studio) + Atlas (Mac M4, Ollama + MLX)
into a single routing pipeline.

Architecture:
  Simple queries (< 512 tokens, code, math) → Cashiotuf LM Studio (fast, RTX 3080)
  Complex queries (reasoning, long context) → Atlas Ollama (deep, M4 24GB)
  Sensitive / sovereign queries → Atlas MLX (Gemma-4 26B, local only)

Usage:
  python3 zeusapollo_swarm.py --port 11235

Requires:
  - LM Studio running on Cashiotuf:1234 with gemma-4-e4b loaded
  - Ollama running on Atlas:11434
  - pip install httpx fastapi uvicorn
"""

import argparse
import json
import time
import httpx
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
import uvicorn

# ─── SERVICE ENDPOINTS ──────────────────────────────────────────────────────
CASHIOTUF_LM_STUDIO = "http://192.168.1.116:1234/v1/chat/completions"
ATLAS_OLLAMA = "http://192.168.1.78:11434/api/generate"

# Local MLX on Atlas (if bridge runs there)
LOCAL_MLX_PORT = 11234

# Cache for recent responses (semantic cache)
_cache = {}
MAX_CACHE = 100

# HTTP client
client = httpx.Client(timeout=120.0)

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
        "architecture", "design", "architecture",
        "why", "how does", "describe",
        "1000 words", "detailed", "comprehensive"
    ]

    prompt_lower = prompt.lower()

    # Sovereign check first
    for kw in sovereign_keywords:
        if kw in prompt_lower:
            return "sovereign"

    # Deep reasoning check
    depth_score = sum(1 for kw in deep_keywords if kw in prompt_lower)

    # Length heuristic
    if len(prompt) > 2000:
        depth_score += 1

    if depth_score >= 2:
        return "deep"

    return "fast"


def check_cache(prompt: str) -> str | None:
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
def call_cashiotuf(prompt: str, stream: bool = False) -> dict | None:
    """Call Cashiotuf's LM Studio (RTX 3080, Gemma-4-e4b)."""
    payload = {
        "model": "google/gemma-4-e4b",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1024,
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


def call_ollama(prompt: str, model: str = "llama3.1:8b") -> dict | None:
    """Call Atlas Ollama (Mac M4)."""
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": 1024
        }
    }
    try:
        resp = client.post(ATLAS_OLLAMA, json=payload)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"⚠️ Ollama failed: {e}")
        return None


# ─── MAIN ROUTE HANDLER ─────────────────────────────────────────────────────
def route_and_generate(prompt: str) -> str:
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
        result = call_cashiotuf(prompt)
        if result:
            text = result["choices"][0]["message"]["content"]
            store_cache(prompt, text)
            return text
        # Fallback to Ollama
        print(f"  → Cashiotuf failed, falling back to Ollama")
        route = "deep"

    if route == "deep":
        print(f"  → Routing to Atlas (deep/Ollama)")
        result = call_ollama(prompt, "qwen2.5:14b")
        if result:
            text = result["response"]
            store_cache(prompt, text)
            return text

    if route == "sovereign":
        print(f"  → Routing to Atlas (sovereign/local)")
        result = call_ollama(prompt, "llama3.1:8b")
        if result:
            text = result["response"]
            return text

    return "⚠️ All inference nodes unreachable."


# ─── FASTAPI SERVER ─────────────────────────────────────────────────────────
app = FastAPI(title="ZeusApollo Swarm Bridge")


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    prompt = messages[-1]["content"] if messages else ""
    stream = body.get("stream", False)

    response_text = route_and_generate(prompt)

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
            {"id": "atlas-sovereign", "object": "model"}
        ]
    }


@app.get("/health")
async def health():
    # Check both nodes
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
            "atlas": {"status": "online" if atlas_ok else "offline", "role": "deep/verifier"}
        },
        "mode": "swarm-inference",
        "next_up": "speculative-decoding (waiting on mlx-lm gemma4 support)"
    }


@app.get("/route")
async def current_route(query: str = ""):
    if not query:
        return {"error": "Provide a query parameter"}
    route = classify_query(query)
    return {"query": query[:100], "route": route, "target": {
        "fast": "Cashiotuf (RTX 3080 / LM Studio)",
        "deep": "Atlas (M4 / Ollama Qwen2.5 14B)",
        "sovereign": "Atlas (M4 / Ollama Llama 3.1 8B)"
    }.get(route, "unknown")}


# ─── MAIN ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ZeusApollo Swarm Inference Bridge")
    parser.add_argument("--port", type=int, default=11235)
    args = parser.parse_args()

    print(f"""
╔══════════════════════════════════════════════════════════╗
║        ZEUSAPOLLO — Swarm Inference Bridge v1.0         ║
╠══════════════════════════════════════════════════════════╣
║  Fast:      Cashiotuf (RTX 3080) → LM Studio            ║
║  Deep:      Atlas (Mac M4)       → Ollama Qwen2.5 14B   ║
║  Sovereign: Atlas (Mac M4)       → Ollama Llama 3.1 8B  ║
║  Bridge:    http://0.0.0.0:{args.port}                    ║
╠══════════════════════════════════════════════════════════╣
║  Speculative decoding: PENDING — awaiting mlx-lm        ║
║  gemma4 support from MLX community. Script saved.       ║
║  (check https://github.com/ml-explore/mlx-lm/issues)    ║
╚══════════════════════════════════════════════════════════╝
    """)

    uvicorn.run(app, host="0.0.0.0", port=args.port, log_level="info")
