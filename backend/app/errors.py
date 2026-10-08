"""Domain errors and their JSON representation."""

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

logger = logging.getLogger("uvicorn.error")


class AppError(Exception):
    """An expected failure the client can act on, identified by a stable `code`."""

    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )


class UnhandledErrorMiddleware:
    """Turn unexpected exceptions into the API's JSON error shape.

    Registered *inside* the CORS middleware: Starlette's default 500 handler sits
    outside it, so its plain-text responses lack CORS headers and the browser
    reports them as a network failure instead of a server error.
    """

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        response_started = False

        async def tracking_send(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, receive, tracking_send)
        except Exception:
            logger.exception("Unhandled error on %s %s", scope.get("method"), scope.get("path"))
            if response_started:
                raise
            message = "Something went wrong on our side. Please try again."
            response = JSONResponse(
                status_code=500, content={"error": {"code": "internal_error", "message": message}}
            )
            await response(scope, receive, send)
