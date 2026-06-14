from __future__ import annotations

import logging

from arq import cron
from arq.connections import RedisSettings

from worker.db import close_pool, get_pool
from worker.settings import settings
from worker.tasks import sync_all_users_job, sync_user_job

logging.basicConfig(level=settings.LOG_LEVEL.upper())


async def on_startup(ctx: dict) -> None:
    ctx["pool"] = await get_pool()


async def on_shutdown(ctx: dict) -> None:
    await close_pool()


class WorkerSettings:
    functions = [sync_user_job, sync_all_users_job]
    cron_jobs = [
        cron(sync_all_users_job, hour={6, 12, 18}, minute=0),  # 3x/day
    ]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    on_startup = on_startup
    on_shutdown = on_shutdown
