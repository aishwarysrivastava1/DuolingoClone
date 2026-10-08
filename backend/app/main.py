"""FastAPI application factory."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings, load_settings
from app.database import connect, describe_database, init_schema, is_seeded
from app.errors import UnhandledErrorMiddleware, register_error_handlers
from app.routers import course, dev, health, leaderboard, me, sessions
from app.seed import seed_database


logger = logging.getLogger("uvicorn.error")


def bootstrap_database(settings: Settings) -> None:
    """Create any missing tables and seed the course on first start.

    If Turso is configured but unreachable this raises, so the app fails fast
    instead of silently writing to a throwaway local file.
    """
    logger.info("Database: %s", describe_database(settings))
    conn = connect(settings)
    try:
        init_schema(conn)
        if not is_seeded(conn):
            logger.info("Database is empty; seeding the demo course")
            seed_database(conn)
    finally:
        conn.close()


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or load_settings()

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        bootstrap_database(settings)
        yield

    app = FastAPI(
        title="Duolingo Clone API",
        version="1.0.0",
        description="Course content, lesson sessions and gamification for the Duolingo clone. Built by Aishwary Srivastava.",
        contact={"name": "Aishwary Srivastava", "email": "asrivastava1_be23@thapar.edu"},
        lifespan=lifespan,
    )
    app.state.settings = settings
    # Order matters: middleware added later wraps earlier ones, so CORS headers
    # also reach the JSON 500s produced by UnhandledErrorMiddleware.
    app.add_middleware(UnhandledErrorMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=settings.cors_origin_regex,
        allow_methods=["GET", "POST", "PATCH"],
        allow_headers=["Content-Type", "X-Timezone"],
    )
    register_error_handlers(app)

    app.include_router(health.router)
    for router in (me.router, course.router, sessions.router, leaderboard.router):
        app.include_router(router, prefix="/api")
    if settings.enable_dev_routes:
        app.include_router(dev.router, prefix="/api")

    return app


app = create_app()
