from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_user, hash_password, verify_password
from database import get_db
from middleware.logging import request_logger
from models import User
from schemas import Token, UserCreate, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.post(
    "/signup",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Create an account",
    description="Creates a new user and immediately returns an access token, "
    "so the frontend doesn't need a separate login call right after signup.",
    responses={409: {"description": "Email already registered"}},
)
def signup(payload: UserCreate, db: Session = Depends(get_db)) -> Token:
    if db.query(User).filter(User.email == payload.email).first():
        request_logger.info(
            "signup rejected: email already registered (%s)", payload.email
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    user = User(
        email=payload.email,
        name=payload.name,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    request_logger.info("signup: new user id=%s email=%s", user.id, user.email)
    return Token(access_token=create_access_token(subject=str(user.id)))


@router.post(
    "/login",
    response_model=Token,
    summary="Log in with email and password",
    description="Form-encoded (not JSON) — put the email in the `username` field. "
    "This is the standard OAuth2 password-flow shape, which is also what makes "
    "Swagger's own 'Authorize' button work against this endpoint.",
    responses={
        401: {"description": "Incorrect email/password, or the account is Google-only"}
    },
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> Token:
    user = db.query(User).filter(User.email == form_data.username).first()
    if user is None or user.hashed_password is None:
        request_logger.warning(
            "login failed: %s (%s)",
            "unknown email" if user is None else "google-only account",
            form_data.username,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
            if user is None
            else "This account signs in with Google",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(form_data.password, user.hashed_password):
        request_logger.warning("login failed: bad password (user_id=%s)", user.id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    request_logger.info("login: user_id=%s", user.id)
    return Token(access_token=create_access_token(subject=str(user.id)))


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get the current user",
    responses={401: {"description": "Missing, invalid, or expired bearer token"}},
)
def read_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
