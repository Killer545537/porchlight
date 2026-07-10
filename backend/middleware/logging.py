import logging
import sys
import time
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")
logger = logging.getLogger("porchlight")
_SKIP_PATHS = {"/favicon.ico"}


class _DefaultRequestId(logging.Filter):
    def filter(self, record):
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return True


def setup_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)-8s | %(name)s | req=%(request_id)s | %(message)s",
        stream=sys.stdout,
    )
    logging.getLogger().addFilter(_DefaultRequestId())


class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.url.path in _SKIP_PATHS:
            return Response(status_code=204)

        rid = str(uuid.uuid4())[:8]
        request_id_ctx.set(rid)
        start = time.perf_counter()
        logger.info(f"→ {request.method} {request.url.path}", extra={"request_id": rid})

        response = await call_next(request)

        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            f"← {request.method} {request.url.path} {response.status_code} ({duration_ms:.1f}ms)",
            extra={"request_id": rid},
        )
        response.headers["X-Request-ID"] = rid
        return response
