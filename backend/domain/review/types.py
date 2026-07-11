from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {"rating": 5, "comment": "Great stay, would book again."}
        }
    )

    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1)


class ReviewUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = Field(default=None, min_length=1)


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    author_id: int
    rating: int
    comment: str
    created_at: datetime
