from __future__ import annotations

from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from arq import create_pool as arq_create_pool
from arq.connections import RedisSettings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.auth.crypto import get_master_key
from app.config import settings
from app.database import close_db, init_db
from app.routers import health
from app.routers import auth as auth_router
from app.routers import simplefin as simplefin_router
from app.routers import accounts as accounts_router
from app.routers import debt as debt_router
from app.routers import simulate as simulate_router
from app.routers import categories as categories_router
from app.routers import transactions as transactions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Decode and cache master key in app state (avoids repeated hex-decoding)
    app.state.master_key = get_master_key()
    # Initialise database pool
    await init_db()
    # Initialise Redis connection pool (for pub/sub, caching, sessions)
    app.state.redis = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )
    # Initialise arq Redis pool (for job enqueueing)
    app.state.arq_redis = await arq_create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    yield
    # Teardown
    await close_db()
    await app.state.redis.aclose()
    await app.state.arq_redis.aclose()


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
app.include_router(simplefin_router.router, prefix="/simplefin")
app.include_router(accounts_router.router, prefix="/accounts")
app.include_router(debt_router.router)
app.include_router(simulate_router.router)
app.include_router(categories_router.router)
app.include_router(transactions_router.router, prefix="/transactions")
