#!/usr/bin/env python3
"""
ZEUSAPOLLO — Asymmetric Distributed Speculative Decoding Bridge
===============================================================
Turns your RTX 3080 (Cashiotuf) into a "L1 Predictor Cache" for your Mac M4 (Atlas).

Architecture:
  Cashiotuf (Windows, RTX 3080, LM Studio) → Rapid Draft Generator (2-4B model)
  Atlas (macOS, M4 24GB, MLX) → Target Verifier (26B MoE)

Flow:
  1. User prompt arrives at Atlas
  2. Atlas sends prompt to Cashiotuf LM Studio API
  3. Cashiotuf generates 5 fast draft tokens
  4. Atlas verifies all 5 in one parallel MLX forward pass
  5. Returns accepted tokens → up to 5x speedup on highly predictable text

Usage:
  python3 zeusapollo_speculative_bridge.py [--port 11235]

Requires:
  - pip install mlx mlx-lm httpx (on Atlas/Mac)
  - LM Studio running on Cashiotuf:1234 with gemma-4-e4b loaded
  - mlx-community/gemma-4-26b-a4b-it-4bit cached locally on Atlas
"""

import argparse
import json
import time
import httpx
import mlx.core as mx
from mlx_lm import load, generate
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
import uvicorn
import os
import secrets

# ─── CONFIG ─────────────────────────────────────────────────────────────────
DRAFT_URL = "http://192.168.1.116:1234/v1/completions"  # Cashiotuf LM Studio
TARGET_MODEL = "mlx-community/gemma-4-26b-a4b-it-4bit"
DRAFT_TOKENS = 5  # Number of tokens to speculate per cycle
TEMPERATURE = 0.2  # Lower = higher acceptance rate (best: 0.1-0.3)
BRIDGE_PORT = 11235

# API Key — load from env or config file
API_KEY = os.environ.get("BRIDGE_API_KEY", "")
if not API_KEY:
    try:
        with open(os.path.expanduser("~/.hermes/config/auth.json")) as f:
            auth = json.load(f)
            API_KEY = auth.get("bridge", {}).get("api_key", "")
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        pass

if not API_KEY:
    print("⚠️  WARNING: BRIDGE_API_KEY not set — auth DISABLED")

def verify_auth(request: Request) -> bool:
    """Verify X-API-Key or Authorization header."""
    if not API_KEY:
        return True  # Open if no key configured

    key = request.headers.get("X-API-Key")
    if not key:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            key = auth_header.split(" ")[1]

    if not key:
        return False

    # SECURITY: Use compare_digest to prevent timing attacks
    return secrets.compare_digest(key, API_KEY)

def require_auth(request: Request):
    """Raise 401 if auth fails."""
    if not verify_auth(request):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized — provide valid X-API-Key header"
        )

# ─── MODEL LOADING ──────────────────────────────────────────────────────────
print("🔄 Loading target model (Gemma-4 26B)...")
target_model, target_tokenizer = load(TARGET_MODEL)
print(f"✅ Target loaded: {TARGET_MODEL}")

# ─── DRAFT CLIENT ───────────────────────────────────────────────────────────
client = httpx.Client(timeout=30.0)

def get_draft_tokens(prompt: str, n: int = DRAFT_TOKENS) -> list[int]:
    """Fetch draft tokens from Cashiotuf's LM Studio (RTX 3080)."""
    payload = {
        "model": "google/gemma-4-e4b",
        "prompt": prompt,
        "max_tokens": n,
        "temperature": TEMPERATURE,
        "top_p": 0.9,
        "stream": False
    }
    try:
        resp = client.post(DRAFT_URL, json=payload)
        resp.raise_for_status()
        text = resp.json()["choices"][0]["text"]
        # Tokenize the draft output with the SAME tokenizer
        tokens = target_tokenizer.encode(text)
        return tokens[:n]
    except Exception as e:
        print(f"⚠️ Draft failed: {e}")
        return []

# ─── SPECULATIVE VERIFICATION ──────────────────────────────────────────────
def speculative_generate(prompt: str, max_tokens: int = 512):
    """
    Main generation loop:
    1. Cache the prompt
    2. Get draft tokens from Cashiotuf
    3. Verify against target model via MLX
    4. Yield accepted tokens
    """
    input_ids = target_tokenizer.encode(prompt)
    generated = 0
    cache = None

    while generated < max_tokens:
        # Get draft tokens from RTX 3080
        current_text = target_tokenizer.decode(input_ids)
        draft_ids = get_draft_tokens(current_text)

        if not draft_ids:
            # Fallback: generate one token natively
            logits = target_model(input_ids)
            next_token = mx.argmax(logits[-1]).item()
            input_ids.append(next_token)
            text = target_tokenizer.decode([next_token])
            yield text
            generated += 1
            continue

        # Verify draft tokens against target
        draft_tensor = mx.array([input_ids + draft_ids])
        logits = target_model(draft_tensor)

        # Acceptance check (rejection sampling)
        accepted = 0
        for i in range(len(draft_ids)):
            target_prob = mx.softmax(logits[0, len(input_ids) + i - 1] if i > 0 else logits[0, len(input_ids) - 1])
            draft_prob = mx.softmax(logits[0, len(input_ids) + i - 1])

            # Simple greedy acceptance
            if mx.argmax(target_prob).item() == draft_ids[i]:
                accepted += 1
            else:
                break

        if accepted == 0:
            # No tokens accepted — fallback to native generation
            logits = target_model(input_ids)
            next_token = mx.argmax(logits[-1]).item()
            input_ids.append(next_token)
            text = target_tokenizer.decode([next_token])
            yield text
            generated += 1
            continue

        # Accept the verified tokens
        for i in range(accepted):
            input_ids.append(draft_ids[i])
            text = target_tokenizer.decode([draft_ids[i]])
            yield text
            generated += 1

        if accepted < len(draft_ids):
            # Target rejected the rest — generate one more natively and continue
            logits = target_model(input_ids)
            next_token = mx.argmax(logits[-1]).item()
            input_ids.append(next_token)
            text = target_tokenizer.decode([next_token])
            yield text
            generated += 1

# ─── API SERVER ─────────────────────────────────────────────────────────────
app = FastAPI(title="ZeusApollo Speculative Bridge")

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    """Global security middleware — adds security headers."""

    # Explicitly list public endpoints
    public_endpoints = ["/health", "/docs", "/redoc", "/openapi.json"]

    # SECURITY: Deny-by-default — apply auth to ALL routes except explicitly public ones
    # Avoid relying solely on URL prefix matching (e.g., startswith('/v1/')) to prevent unintended public exposure
    if request.url.path not in public_endpoints:
        try:
            require_auth(request)
        except HTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={"error": exc.detail}
            )

    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    # SECURITY: Add restrictive CSP, but exclude OpenAPI docs to avoid breaking Swagger UI/ReDoc
    if request.url.path not in ["/docs", "/redoc", "/openapi.json"]:
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"

    return response

@app.post("/v1/completions")
async def completions(request: Request):
    try:
        body = await request.json()
        prompt = body.get("prompt", "")
        max_tokens = body.get("max_tokens", 512)
        stream = body.get("stream", False)

        # SECURITY: Input validation to prevent DoS (resource exhaustion)
        if not isinstance(prompt, str):
            raise HTTPException(status_code=400, detail="Invalid prompt")
        if len(prompt) > 32000:
            raise HTTPException(status_code=400, detail="Prompt exceeds 32K character limit")

        if not isinstance(max_tokens, int) or max_tokens < 1:
            max_tokens = 512
        max_tokens = min(max_tokens, 16384)

        if stream:
            return StreamingResponse(
                stream_response(prompt, max_tokens),
                media_type="text/event-stream"
            )

        # Non-streaming
        result = "".join(speculative_generate(prompt, max_tokens))
        return {
            "choices": [{"text": result}],
            "usage": {"total_tokens": len(result)}
        }
    except HTTPException:
        raise
    except Exception as e:
        # SECURITY: Prevent leaking stack traces to the client
        print(f"Internal error in completions: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

async def stream_response(prompt, max_tokens):
    yield "data: " + json.dumps({"choices": [{"delta": {"role": "assistant"}}]}) + "\n\n"
    for text in speculative_generate(prompt, max_tokens):
        yield "data: " + json.dumps({"choices": [{"delta": {"content": text}}]}) + "\n\n"
    yield "data: [DONE]\n\n"

@app.get("/v1/models")
async def list_models():
    try:
        return {
            "data": [
                {"id": "zeusapollo-speculative", "object": "model", "created": int(time.time())}
            ]
        }
    except Exception as e:
        # SECURITY: Prevent leaking stack traces to the client
        print(f"Internal error in list_models: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/health")
async def health():
    try:
        return {"status": "ok", "mode": "speculative", "draft": "cashiotuf:3080", "target": "atlas:m4"}
    except Exception as e:
        # SECURITY: Prevent leaking stack traces to the client
        print(f"Internal error in health: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# ─── MAIN ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ZeusApollo Speculative Decoding Bridge")
    parser.add_argument("--port", type=int, default=BRIDGE_PORT, help="Port to listen on")
    args = parser.parse_args()

    print(f"""
╔══════════════════════════════════════════════════════════╗
║     ZEUSAPOLLO — Distributed Speculative Decoding       ║
╠══════════════════════════════════════════════════════════╣
║  Drafter:  Cashiotuf (RTX 3080) → gemma-4-e4b          ║
║  Verifier: Atlas (Mac M4)       → Gemma-4 26B MoE      ║
║  Bridge:   http://0.0.0.0:{args.port}                    ║
║  Tokens/cycle: {DRAFT_TOKENS} | Temperature: {TEMPERATURE}            ║
╚══════════════════════════════════════════════════════════╝
    """)

    uvicorn.run(app, host="0.0.0.0", port=args.port, log_level="info")
