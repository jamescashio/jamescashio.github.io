#!/usr/bin/env python3
"""Public-safe ZeusApollo routing bridge reference.

This repository intentionally contains no production hostnames, private addresses,
container identifiers, or credentials. Configure every endpoint and secret through
environment variables. Keep the operational version in a private repository.
"""

from __future__ import annotations

import os
import secrets
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

APP_NAME = "ZeusApollo Public-Safe Swarm Reference"
API_KEY = os.environ.get("SWARM_API_KEY", "").strip()
PRIMARY_ENDPOINT = os.environ.get("PRIMARY_MODEL_ENDPOINT", "").strip()
FALLBACK_ENDPOINT = os.environ.get("FALLBACK_MODEL_ENDPOINT", "").strip()
ALLOWED_ORIGINS = {
    item.strip()
    for item in os.environ.get("SWARM_ALLOWED_ORIGINS", "https://cashio.us").split(",")
    if item.strip()
}
MAX_PROMPT_CHARS = int(os.environ.get("MAX_PROMPT_CHARS", "32000"))
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "4096"))

if not API_KEY:
    raise SystemExit("SWARM_API_KEY is required; refusing to start without authentication")

for name, endpoint in {
    "PRIMARY_MODEL_ENDPOINT": PRIMARY_ENDPOINT,
    "FALLBACK_MODEL_ENDPOINT": FALLBACK_ENDPOINT,
}.items():
    if not endpoint:
        raise SystemExit(f"{name} is required")
    parsed = urlparse(endpoint)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise SystemExit(f"{name} must be a valid HTTP(S) URL")

app = FastAPI(title=APP_NAME, docs_url=None, redoc_url=None)
client = httpx.AsyncClient(timeout=60.0)


def authorized(request: Request) -> bool:
    supplied = request.headers.get("X-API-Key", "")
    if not supplied:
        bearer = request.headers.get("Authorization", "")
        if bearer.startswith("Bearer "):
            supplied = bearer[7:]
    return secrets.compare_digest(supplied, API_KEY)


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    if request.url.path != "/health" and not authorized(request):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})

    origin = request.headers.get("Origin")
    if origin and origin not in ALLOWED_ORIGINS:
        return JSONResponse(status_code=403, content={"error": "Origin not allowed"})

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    return response


@app.get("/health")
async def health():
    return {"status": "ok", "service": "routing-bridge"}


@app.post("/v1/chat/completions")
async def completions(request: Request):
    try:
        try:
            body = await request.json()
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid JSON") from exc

        messages = body.get("messages")
        if not isinstance(messages, list) or not messages:
            raise HTTPException(status_code=400, detail="messages must be a non-empty list")

        prompt_size = sum(len(str(item.get("content", ""))) for item in messages if isinstance(item, dict))
        if prompt_size > MAX_PROMPT_CHARS:
            raise HTTPException(status_code=400, detail="Prompt exceeds configured limit")

        requested_tokens = body.get("max_tokens", 512)
        if not isinstance(requested_tokens, int) or requested_tokens < 1:
            raise HTTPException(status_code=400, detail="max_tokens must be a positive integer")
        body["max_tokens"] = min(requested_tokens, MAX_TOKENS)

        last_error: Exception | None = None
        for endpoint in (PRIMARY_ENDPOINT, FALLBACK_ENDPOINT):
            try:
                response = await client.post(endpoint, json=body)
                response.raise_for_status()
                return response.json()
            except Exception as exc:
                last_error = exc

        raise HTTPException(status_code=502, detail="Upstream model service unavailable") from last_error
    except HTTPException:
        raise
    except Exception:
        # SECURITY: Prevent internal state leakage on unexpected exceptions
        raise HTTPException(status_code=500, detail="Internal Server Error") from None
