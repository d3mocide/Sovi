from __future__ import annotations

from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.config import settings
from app.database import close_db, init_db
from app.routers import health
from app.routers import auth as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialise database pool
    await init_db()
    # Initialise Redis connection pool
    app.state.redis = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )
    yield
    # Teardown
    await close_db()
    await app.state.redis.aclose()


app = FastAPI(
    title="Sovi API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"],
)

app.include_router(health.router)
app.include_router(auth_router.router, prefix="/auth")
