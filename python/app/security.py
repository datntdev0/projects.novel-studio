import hmac
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

TOKEN_HEADER = "X-Session-Token"


def add_token_middleware(app: FastAPI, token: str) -> None:
    @app.middleware("http")
    async def check_token(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        received = request.headers.get(TOKEN_HEADER, "")
        if not hmac.compare_digest(received.encode(), token.encode()):
            return JSONResponse({"code": "BACKEND_UNAUTHORIZED", "message": "Unauthorized"}, status_code=401)
        return await call_next(request)
