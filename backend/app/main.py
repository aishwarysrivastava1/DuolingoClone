"""FastAPI application factory."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings, load_settings
from app.database import connect, init_schema, is_seeded
from app.errors import register_error_handlers
from app.routers import course, dev, leaderboard, me, sessions
from app.seed import seed_database


def bootstrap_database(settings: Settings) -> None:
    """Create the schema and seed the course on first start."""
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    conn = connect(settings.database_path)
    try:
        init_schema(conn)
        if not is_seeded(conn):
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
        description="Course content, lesson sessions and gamification for the Duolingo clone.",
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=settings.cors_origin_regex,
        allow_methods=["GET", "POST", "PATCH"],
        allow_headers=["Content-Type", "X-Timezone"],
    )
    register_error_handlers(app)

    for router in (me.router, course.router, sessions.router, leaderboard.router):
        app.include_router(router, prefix="/api")
    if settings.enable_dev_routes:
        app.include_router(dev.router, prefix="/api")

    @app.get("/api/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
