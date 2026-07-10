from fastapi import APIRouter, Depends, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from auth import google_authorize_url, settings
from database import get_db
from domain.user.service import UserService

router = APIRouter(prefix="/auth/google", tags=["auth"])


@router.get(
    "/login",
    summary="Start Google sign-in",
    description="Redirects the browser to Google's consent screen. Meant to be "
    "navigated to directly (e.g. an `<a href>`), not called as a JSON API — "
    "Swagger's 'Try it out' will just show a 307, not complete the flow.",
    response_class=RedirectResponse,
    status_code=status.HTTP_307_TEMPORARY_REDIRECT,
)
def google_login() -> RedirectResponse:
    return RedirectResponse(google_authorize_url())


@router.get(
    "/callback",
    summary="Google OAuth callback",
    description="Google redirects here after consent, with `?code=`. Exchanges "
    "the code for a Porchlight JWT and redirects to `FRONTEND_URL/auth/callback?token=...`. "
    "Not meant to be called directly.",
    response_class=RedirectResponse,
    responses={
        400: {
            "description": "Code exchange failed, or Google reports the email isn't verified"
        }
    },
)
def google_callback(code: str, db: Session = Depends(get_db)) -> RedirectResponse:
    token = UserService(db).google_callback(code)
    return RedirectResponse(f"{settings.frontend_url}/auth/callback?token={token.access_token}")
