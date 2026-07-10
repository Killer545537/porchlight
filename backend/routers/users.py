from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from domain.user.service import UserService
from domain.user.types import Token, UserCreate, UserOut
from models import User

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
    return UserService(db).signup(payload)


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
    return UserService(db).login(form_data.username, form_data.password)


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get the current user",
    responses={401: {"description": "Missing, invalid, or expired bearer token"}},
)
def read_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
