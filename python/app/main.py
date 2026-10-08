import logging
import os

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.security import add_token_middleware

logger = logging.getLogger(__name__)


def create_app(token: str, test_routes: bool) -> FastAPI:
    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
    add_token_middleware(app, token)

    @app.exception_handler(Exception)
    async def handle_error(request: Request, error: Exception) -> JSONResponse:
        logger.exception("unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse({"code": "INTERNAL", "message": "Backend error"}, status_code=500)

    @app.get("/health")
    async def health() -> dict[str, object]:
        return {"status": "ok", "pid": os.getpid()}

    @app.post("/shutdown")
    async def shutdown() -> dict[str, str]:
        app.state.server.should_exit = True
        return {"status": "stopping"}

    if test_routes:

        @app.get("/test/raise")
        async def raise_error() -> None:
            raise RuntimeError("test raise")

    return app


def run(port: int, token: str) -> None:
    app = create_app(token, os.environ.get("NS_TEST_BACKEND_RAISE") == "1")
    config = uvicorn.Config(app, host="127.0.0.1", port=port, log_config=None, access_log=False, server_header=False)
    app.state.server = uvicorn.Server(config)
    app.state.server.run()
