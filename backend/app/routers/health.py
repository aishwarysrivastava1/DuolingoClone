"""Liveness probe for keep-alive pings and uptime monitors.

Deliberately has no dependencies (no database connection, no learner lookup)
so it stays cheap when pinged every few minutes and keeps answering even if
the database is unavailable. HEAD is accepted alongside GET because uptime
monitors such as UptimeRobot send HEAD requests by default.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.api_route("/health", methods=["GET", "HEAD"])
@router.api_route("/api/health", methods=["GET", "HEAD"], include_in_schema=False)
async def health() -> dict[str, str]:
    return {"status": "ok"}
