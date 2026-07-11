from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class DomainError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class NotFoundError(DomainError):
    """The requested resource doesn't exist."""


class ForbiddenError(DomainError):
    """The caller isn't allowed to perform this action on this resource."""


class ConflictError(DomainError):
    """The request conflicts with existing state (e.g. a unique constraint)."""


class AuthenticationError(DomainError):
    """Credentials or a token were missing, invalid, or rejected."""


class BadRequestError(DomainError):
    """The request itself is malformed in a way field validation can't catch."""


_STATUS_CODES = {
    NotFoundError: 404,
    ForbiddenError: 403,
    ConflictError: 409,
    AuthenticationError: 401,
    BadRequestError: 400,
}


def _make_handler(status_code: int):
    def handler(request: Request, exc: Exception) -> JSONResponse:
        message = exc.message if isinstance(exc, DomainError) else str(exc)
        headers = {"WWW-Authenticate": "Bearer"} if status_code == 401 else None
        return JSONResponse(
            status_code=status_code, content={"detail": message}, headers=headers
        )

    return handler


def register_exception_handlers(app: FastAPI) -> None:
    for exc_type, status_code in _STATUS_CODES.items():
        app.add_exception_handler(exc_type, _make_handler(status_code))
