from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "alice@example.com",
                "password": "correct horse battery staple",
                "name": "Alice",
            }
        }
    )

    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    name: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    created_at: datetime


class Token(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
            }
        }
    )

    access_token: str
    token_type: str = "bearer"
