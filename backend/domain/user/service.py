import urllib.error

from sqlalchemy.orm import Session

from auth import (
    create_access_token,
    exchange_google_code,
    fetch_google_userinfo,
    google_authorize_url,
    hash_password,
    verify_password,
)
from domain.errors import AuthenticationError, BadRequestError, ConflictError
from domain.user.repository import UserRepository
from domain.user.types import Token, UserCreate
from domain.user.validation import normalize_email
from middleware.logging import request_logger


class UserService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def signup(self, payload: UserCreate) -> Token:
        if self.repo.get_by_email(payload.email):
            request_logger.info(
                "signup rejected: email already registered (%s)", payload.email
            )
            raise ConflictError("Email already registered")

        user = self.repo.create(
            email=payload.email,
            name=payload.name,
            hashed_password=hash_password(payload.password),
        )
        request_logger.info("signup: new user id=%s email=%s", user.id, user.email)
        return Token(access_token=create_access_token(subject=str(user.id)))

    def login(self, email: str, password: str) -> Token:
        email = normalize_email(email)
        user = self.repo.get_by_email(email)
        if user is None or user.hashed_password is None:
            request_logger.warning(
                "login failed: %s (%s)",
                "unknown email" if user is None else "google-only account",
                email,
            )
            raise AuthenticationError(
                "Incorrect email or password"
                if user is None
                else "This account signs in with Google"
            )
        if not verify_password(password, user.hashed_password):
            request_logger.warning("login failed: bad password (user_id=%s)", user.id)
            raise AuthenticationError("Incorrect email or password")

        request_logger.info("login: user_id=%s", user.id)
        return Token(access_token=create_access_token(subject=str(user.id)))

    def google_login_url(self) -> str:
        return google_authorize_url()

    def google_callback(self, code: str) -> Token:
        try:
            tokens = exchange_google_code(code)
            userinfo = fetch_google_userinfo(tokens["access_token"])
        except (urllib.error.URLError, KeyError) as e:
            request_logger.warning(
                "google oauth failed: token/userinfo exchange error: %s", e
            )
            raise BadRequestError("Google authentication failed") from e

        if not userinfo.get("email_verified") or not userinfo.get("email"):
            request_logger.warning(
                "google oauth rejected: email not verified (%s)", userinfo.get("email")
            )
            raise BadRequestError("Google account email not verified")

        email = normalize_email(userinfo["email"])
        user = self.repo.get_by_email(email)
        if user is None:
            user = self.repo.create(
                email=email, name=userinfo.get("name", email), hashed_password=None
            )
            request_logger.info(
                "google oauth: created new user id=%s email=%s", user.id, email
            )
        else:
            request_logger.info("google oauth: login user_id=%s", user.id)

        return Token(access_token=create_access_token(subject=str(user.id)))
