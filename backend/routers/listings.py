from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from domain.booking.service import BookingService
from domain.booking.types import BookingRangeOut, ListingAvailabilityOut
from domain.listing.service import ListingService
from domain.listing.types import ListingCreate, ListingFilters, ListingOut, ListingUpdate
from models import Listing, User

router = APIRouter(prefix="/listings", tags=["listings"])


@router.post(
    "",
    response_model=ListingOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a listing",
    responses={401: {"description": "Missing, invalid, or expired bearer token"}},
)
def create_listing(
    payload: ListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Listing:
    return ListingService(db).create_listing(current_user.id, payload)


@router.get(
    "",
    response_model=list[ListingOut],
    summary="Search listings",
    description="Public — no auth required. Filters are all optional and combine with AND. "
    "min_latitude/max_latitude/min_longitude/max_longitude filter to a map viewport's "
    "bounding box, for an interactive map fetching pins for its current view.",
)
def list_listings(
    filters: Annotated[ListingFilters, Query()],
    db: Session = Depends(get_db),
) -> list[Listing]:
    return ListingService(db).list_listings(filters)


@router.get(
    "/{listing_id}",
    response_model=ListingOut,
    summary="Get a listing",
    responses={404: {"description": "No listing with that ID"}},
)
def get_listing(listing_id: int, db: Session = Depends(get_db)) -> Listing:
    return ListingService(db).get_listing(listing_id)


@router.get(
    "/{listing_id}/availability",
    response_model=ListingAvailabilityOut,
    summary="List booked date ranges for a listing",
    description="Public — no auth required. Returns check_in/check_out for each booking.",
    responses={404: {"description": "No listing with that ID"}},
)
def get_listing_availability(
    listing_id: int, db: Session = Depends(get_db)
) -> ListingAvailabilityOut:
    bookings = BookingService(db).list_availability(listing_id)
    return ListingAvailabilityOut(
        bookings=[
            BookingRangeOut(check_in=b.check_in, check_out=b.check_out) for b in bookings
        ]
    )


@router.patch(
    "/{listing_id}",
    response_model=ListingOut,
    summary="Update a listing",
    description="Host-only — only the user who created the listing may update it. "
    "All fields are optional; only the fields you send are changed.",
    responses={
        403: {"description": "You aren't the host of this listing"},
        404: {"description": "No listing with that ID"},
    },
)
def update_listing(
    listing_id: int,
    payload: ListingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Listing:
    return ListingService(db).update_listing(listing_id, current_user.id, payload)


@router.delete(
    "/{listing_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a listing",
    description="Host-only — only the user who created the listing may delete it.",
    responses={
        403: {"description": "You aren't the host of this listing"},
        404: {"description": "No listing with that ID"},
    },
)
def delete_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    ListingService(db).delete_listing(listing_id, current_user.id)
