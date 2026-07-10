import urllib.error

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from auth import (
    create_access_token,
    exchange_google_code,
    fetch_google_userinfo,
    google_authorize_url,
    settings,
)
from database import get_db
from middleware.logging import request_logger
from models import User

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
    try:
        tokens = exchange_google_code(code)
        userinfo = fetch_google_userinfo(tokens["access_token"])
    except (urllib.error.URLError, KeyError) as e:
        request_logger.warning(
            "google oauth failed: token/userinfo exchange error: %s", e
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google authentication failed",
        ) from e

    if not userinfo.get("email_verified") or not userinfo.get("email"):
        request_logger.warning(
            "google oauth rejected: email not verified (%s)", userinfo.get("email")
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email not verified",
        )

    email = userinfo["email"]
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(email=email, name=userinfo.get("name", email))
        db.add(user)
        db.commit()
        db.refresh(user)
        request_logger.info(
            "google oauth: created new user id=%s email=%s", user.id, email
        )
    else:
        request_logger.info("google oauth: login user_id=%s", user.id)

    token = create_access_token(subject=str(user.id))
    return RedirectResponse(f"{settings.frontend_url}/auth/callback?token={token}")
