#!/usr/bin/env python3
"""Public-safe speculative bridge reference.

Production topology, model paths, hostnames, and credentials are intentionally
excluded. Supply all operational values through environment variables and keep
the deployed implementation in a private repository.
"""

from __future__ import annotations

import os
import secrets
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

BRIDGE_API_KEY = os.environ.get("BRIDGE_API_KEY", "").strip()
DRAFT_ENDPOINT = os.environ.get("DRAFT_MODEL_ENDPOINT", "").strip()
TARGET_ENDPOINT = os.environ.get("TARGET_MODEL_ENDPOINT", "").strip()
MAX_PROMPT_CHARS = int(os.environ.get("MAX_PROMPT_CHARS", "32000"))
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "4096"))

if not BRIDGE_API_KEY:
    raise SystemExit("BRIDGE_API_KEY is required; refusing to start without authentication")

for name, endpoint in {
    "DRAFT_MODEL_ENDPOINT": DRAFT_ENDPOINT,
    "TARGET_MODEL_ENDPOINT": TARGET_ENDPOINT,
}.items():
    if not endpoint:
        raise SystemExit(f"{name} is required")
    parsed = urlparse(endpoint)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise SystemExit(f"{name} must be a valid HTTP(S) URL")

app = FastAPI(title="ZeusApollo Public-Safe Bridge Reference", docs_url=None, redoc_url=None)
client = httpx.AsyncClient(timeout=60.0)


def verify_auth(request: Request) -> bool:
    supplied = request.headers.get("X-API-Key", "")
    if not supplied:
        bearer = request.headers.get("Authorization", "")
        if bearer.startswith("Bearer "):
            supplied = bearer[7:]
    return secrets.compare_digest(supplied, BRIDGE_API_KEY)


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    if request.url.path != "/health" and not verify_auth(request):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    return response


@app.get("/health")
async def health():
    return {"status": "ok", "service": "speculative-bridge"}


@app.post("/v1/completions")
async def completions(request: Request):
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON") from exc

    prompt = body.get("prompt", "")
    if not isinstance(prompt, str):
        raise HTTPException(status_code=400, detail="prompt must be a string")
    if len(prompt) > MAX_PROMPT_CHARS:
        raise HTTPException(status_code=400, detail="Prompt exceeds configured limit")

    requested_tokens = body.get("max_tokens", 512)
    if not isinstance(requested_tokens, int) or requested_tokens < 1:
        raise HTTPException(status_code=400, detail="max_tokens must be a positive integer")
    body["max_tokens"] = min(requested_tokens, MAX_TOKENS)

    draft_payload = dict(body)
    draft_payload["max_tokens"] = min(body["max_tokens"], 8)

    try:
        draft_response = await client.post(DRAFT_ENDPOINT, json=draft_payload)
        draft_response.raise_for_status()
        draft = draft_response.json()

        target_payload = dict(body)
        target_payload["draft"] = draft
        target_response = await client.post(TARGET_ENDPOINT, json=target_payload)
        target_response.raise_for_status()
        return target_response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Upstream model service unavailable") from exc
