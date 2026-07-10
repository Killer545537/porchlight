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
from models import User

router = APIRouter(prefix="/auth/google", tags=["auth"])


@router.get("/login")
def google_login() -> RedirectResponse:
    return RedirectResponse(google_authorize_url())


@router.get("/callback")
def google_callback(code: str, db: Session = Depends(get_db)) -> RedirectResponse:
    try:
        tokens = exchange_google_code(code)
        userinfo = fetch_google_userinfo(tokens["access_token"])
    except (urllib.error.URLError, KeyError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google authentication failed",
        ) from e

    if not userinfo.get("email_verified") or not userinfo.get("email"):
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

    token = create_access_token(subject=str(user.id))
    return RedirectResponse(f"{settings.frontend_url}/auth/callback?token={token}")
