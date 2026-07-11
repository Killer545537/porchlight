from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from domain.booking.validation import validate_date_range


class BookingCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "listing_id": 1,
                "check_in": "2026-08-01",
                "check_out": "2026-08-05",
                "guests": 2,
            }
        }
    )

    listing_id: int
    check_in: date
    check_out: date
    guests: int = Field(ge=1)

    @model_validator(mode="after")
    def _check_dates(self) -> "BookingCreate":
        validate_date_range(self.check_in, self.check_out)
        return self


class BookingUpdate(BaseModel):
    check_in: date | None = None
    check_out: date | None = None
    guests: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def _check_dates(self) -> "BookingUpdate":
        if self.check_in is not None and self.check_out is not None:
            validate_date_range(self.check_in, self.check_out)
        return self


class BookingRangeOut(BaseModel):
    check_in: date
    check_out: date


class ListingAvailabilityOut(BaseModel):
    bookings: list[BookingRangeOut]


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    guest_id: int
    check_in: date
    check_out: date
    guests: int
    total_price: float
    created_at: datetime
    guest_name: str = ""
