from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from domain.listing.validation import (
    normalize_amenities,
    validate_bounds,
    validate_price_range,
)


class ListingCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Sunny cabin by the lake",
                "description": "Two-bedroom cabin with a private dock.",
                "city": "Tahoe",
                "country": "US",
                "latitude": 39.0968,
                "longitude": -120.0324,
                "price_per_night": 150.0,
                "max_guests": 4,
                "bedrooms": 2,
                "bathrooms": 1,
                "amenities": ["wifi", "parking"],
            }
        }
    )

    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    city: str = Field(min_length=1)
    country: str = Field(min_length=1)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    price_per_night: float = Field(gt=0)
    max_guests: int = Field(ge=1)
    bedrooms: int = Field(ge=0)
    bathrooms: int = Field(ge=0)
    amenities: list[str] = Field(default_factory=list)

    @field_validator("amenities")
    @classmethod
    def _normalize_amenities(cls, v: list[str]) -> list[str]:
        return normalize_amenities(v)


class ListingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1)
    city: str | None = Field(default=None, min_length=1)
    country: str | None = Field(default=None, min_length=1)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    price_per_night: float | None = Field(default=None, gt=0)
    max_guests: int | None = Field(default=None, ge=1)
    bedrooms: int | None = Field(default=None, ge=0)
    bathrooms: int | None = Field(default=None, ge=0)
    amenities: list[str] | None = None

    @field_validator("amenities")
    @classmethod
    def _normalize_amenities(cls, v: list[str] | None) -> list[str] | None:
        return None if v is None else normalize_amenities(v)


class ListingFilters(BaseModel):
    city: str | None = None
    min_price: float | None = Field(default=None, ge=0)
    max_price: float | None = Field(default=None, ge=0)
    max_guests: int | None = Field(default=None, ge=1)
    min_latitude: float | None = Field(default=None, ge=-90, le=90)
    max_latitude: float | None = Field(default=None, ge=-90, le=90)
    min_longitude: float | None = Field(default=None, ge=-180, le=180)
    max_longitude: float | None = Field(default=None, ge=-180, le=180)
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def _check_ranges(self) -> "ListingFilters":
        validate_price_range(self.min_price, self.max_price)
        validate_bounds(
            self.min_latitude, self.max_latitude, self.min_longitude, self.max_longitude
        )
        return self


class ListingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    host_id: int
    title: str
    description: str
    city: str
    country: str
    latitude: float
    longitude: float
    price_per_night: float
    max_guests: int
    bedrooms: int
    bathrooms: int
    amenities: list[str]
    created_at: datetime

    @field_validator("amenities", mode="before")
    @classmethod
    def _amenity_names(cls, v: list) -> list[str]:
        return [a.name if hasattr(a, "name") else a for a in v]
