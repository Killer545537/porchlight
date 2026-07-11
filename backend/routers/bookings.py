from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from domain.booking.service import BookingService
from domain.booking.types import BookingCreate, BookingOut, BookingUpdate
from models import Booking, User

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post(
    "",
    response_model=BookingOut,
    status_code=status.HTTP_201_CREATED,
    summary="Book a listing",
    responses={
        400: {"description": "Booking your own listing, or over the guest limit"},
        404: {"description": "No listing with that ID"},
        409: {"description": "Those dates overlap an existing booking"},
    },
)
def create_booking(
    payload: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Booking:
    return BookingService(db).create_booking(current_user.id, payload)


@router.get(
    "/me",
    response_model=list[BookingOut],
    summary="My trips",
    description="Bookings made by the current user as a guest.",
)
def list_my_trips(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[Booking]:
    return BookingService(db).list_my_trips(current_user.id)


@router.get(
    "/hosting",
    response_model=list[BookingOut],
    summary="Bookings on my listings",
    description="Every booking made on any listing the current user hosts.",
)
def list_hosting(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[Booking]:
    return BookingService(db).list_hosting(current_user.id)


@router.get(
    "/{booking_id}",
    response_model=BookingOut,
    summary="Get a booking",
    description="Visible to the guest who made it or the host of that listing.",
    responses={
        403: {"description": "You're neither the guest nor the host on this booking"},
        404: {"description": "No booking with that ID"},
    },
)
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Booking:
    return BookingService(db).get_booking(booking_id, current_user.id)


@router.patch(
    "/{booking_id}",
    response_model=BookingOut,
    summary="Change a booking's dates or guest count",
    description="Guest-only. Re-validates the guest limit and date overlap against "
    "the listing's other bookings.",
    responses={
        400: {"description": "Over the guest limit"},
        403: {"description": "You aren't the guest on this booking"},
        404: {"description": "No booking with that ID"},
        409: {"description": "Those dates overlap another booking"},
    },
)
def update_booking(
    booking_id: int,
    payload: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Booking:
    return BookingService(db).update_booking(booking_id, current_user.id, payload)


@router.delete(
    "/{booking_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel a booking",
    description="Guest-only. Cancellation is a hard delete — there's no status/history kept.",
    responses={
        403: {"description": "You aren't the guest on this booking"},
        404: {"description": "No booking with that ID"},
    },
)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    BookingService(db).cancel_booking(booking_id, current_user.id)
