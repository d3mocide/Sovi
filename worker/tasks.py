from __future__ import annotations

import logging

from worker.db import get_pool
from worker.sync import sync_user

logger = logging.getLogger(__name__)


async def sync_user_job(ctx: dict, user_id: str) -> dict:
    """arq job: sync one user's SimpleFIN data."""
    logger.info("sync_user_job starting for user_id=%s", user_id)
    pool = ctx.get("pool") or await get_pool()
    async with pool.acquire() as db:
        from worker.sync import _sync_user_with_conn
        result = await _sync_user_with_conn(db, user_id)
    logger.info("sync_user_job completed for user_id=%s: %s", user_id, result)
    return result


async def sync_all_users_job(ctx: dict) -> dict:
    """arq job: enqueue sync jobs for all active SimpleFIN users."""
    pool = ctx.get("pool") or await get_pool()
    async with pool.acquire() as db:
        rows = await db.fetch(
            "SELECT user_id FROM simplefin_credentials WHERE status='active'"
        )

    enqueued = 0
    arq_redis = ctx.get("redis")
    if arq_redis is None:
        logger.error("sync_all_users_job: no arq redis in context, cannot enqueue jobs")
        return {"enqueued": 0}

    for row in rows:
        await arq_redis.enqueue_job("sync_user_job", str(row["user_id"]))
        enqueued += 1

    logger.info("sync_all_users_job: enqueued %d sync jobs", enqueued)
    return {"enqueued": enqueued}
