import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import UTC, datetime, timedelta

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.orm import Session

from database import get_db
from middleware.logging import request_logger
from models import User

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    secret_key: str = "dev-insecure-secret-change-me"  # ponytail: fine for local/demo, override via env in prod
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week, no refresh rotation

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    frontend_url: str = "http://localhost:3000"


settings = Settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(UTC) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as e:
        request_logger.warning("token rejected: %s", e)
        raise credentials_exception from e

    user = db.get(User, int(user_id))
    if user is None:
        request_logger.warning("token rejected: user id %s no longer exists", user_id)
        raise credentials_exception
    return user


def google_authorize_url() -> str:
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
    }
    return f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"


def exchange_google_code(code: str) -> dict:
    data = urllib.parse.urlencode(
        {
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        }
    ).encode()
    request = urllib.request.Request(GOOGLE_TOKEN_URL, data=data, method="POST")
    with urllib.request.urlopen(request) as response:  # noqa: S310
        return json.load(response)


def fetch_google_userinfo(access_token: str) -> dict:
    request = urllib.request.Request(
        GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"}
    )
    with urllib.request.urlopen(request) as response:  # noqa: S310
        return json.load(response)


def demo() -> None:
    """ponytail: hashing/JWT self-check, run with `uv run python auth.py`."""
    hashed = hash_password("correct horse battery staple")
    assert verify_password("correct horse battery staple", hashed)
    assert not verify_password("wrong password", hashed)

    token = create_access_token(subject="42")
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    assert payload["sub"] == "42"

    expired = create_access_token(subject="42", expires_delta=timedelta(minutes=-1))
    try:
        jwt.decode(expired, settings.secret_key, algorithms=[settings.algorithm])
        raise AssertionError("expired token should not decode")
    except JWTError:
        pass

    tampered = token[:-1] + ("A" if token[-1] != "A" else "B")
    try:
        jwt.decode(tampered, settings.secret_key, algorithms=[settings.algorithm])
        raise AssertionError("tampered token should not decode")
    except JWTError:
        pass

    settings.google_client_id = "test-client-id"
    settings.google_redirect_uri = "http://localhost:8000/auth/google/callback"
    url = google_authorize_url()
    assert "client_id=test-client-id" in url
    assert (
        "redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fauth%2Fgoogle%2Fcallback" in url
    )
    assert "response_type=code" in url

    print("auth.py self-check passed")


if __name__ == "__main__":
    demo()
