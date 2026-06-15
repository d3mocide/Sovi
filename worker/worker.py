from __future__ import annotations

import os

from arq import cron
from arq.connections import RedisSettings


REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")


async def startup(ctx: dict) -> None:
    pass


async def shutdown(ctx: dict) -> None:
    pass


class WorkerSettings:
    functions = []
    cron_jobs = []
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(REDIS_URL)
