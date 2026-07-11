from sqlalchemy.orm import Session

from domain.booking.repository import BookingRepository
from domain.booking.types import BookingCreate, BookingUpdate
from domain.booking.validation import validate_date_range
from domain.errors import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from domain.listing.repository import ListingRepository
from middleware.logging import request_logger
from models import Booking


class BookingService:
    def __init__(self, db: Session):
        self.repo = BookingRepository(db)
        self.listing_repo = ListingRepository(db)

    def create_booking(self, guest_id: int, data: BookingCreate) -> Booking:
        listing = self.listing_repo.get_by_id(data.listing_id)
        if listing is None:
            raise NotFoundError(f"Listing {data.listing_id} not found")
        if listing.host_id == guest_id:
            raise BadRequestError("You can't book your own listing")
        if data.guests > listing.max_guests:
            raise BadRequestError(f"This listing sleeps at most {listing.max_guests} guests")
        if self.repo.has_overlap(data.listing_id, data.check_in, data.check_out):
            raise ConflictError("Those dates are no longer available")

        nights = (data.check_out - data.check_in).days
        total_price = nights * listing.price_per_night
        booking = self.repo.create(
            guest_id=guest_id,
            listing_id=data.listing_id,
            check_in=data.check_in,
            check_out=data.check_out,
            guests=data.guests,
            total_price=total_price,
        )
        request_logger.info(
            "booking created: id=%s listing_id=%s guest_id=%s",
            booking.id,
            data.listing_id,
            guest_id,
        )
        return booking

    def get_booking(self, booking_id: int, user_id: int) -> Booking:
        booking = self.repo.get_by_id(booking_id)
        if booking is None:
            raise NotFoundError(f"Booking {booking_id} not found")
        if booking.guest_id != user_id and booking.listing.host_id != user_id:
            raise ForbiddenError("You don't have access to this booking")
        return booking

    def list_my_trips(self, guest_id: int) -> list[Booking]:
        return self.repo.list_for_guest(guest_id)

    def list_hosting(self, host_id: int) -> list[Booking]:
        bookings = self.repo.list_for_host(host_id)
        for b in bookings:
            b.guest_name = b.guest.name
        return bookings

    def list_availability(self, listing_id: int) -> list[Booking]:
        listing = self.listing_repo.get_by_id(listing_id)
        if listing is None:
            raise NotFoundError(f"Listing {listing_id} not found")
        return self.repo.list_for_listing(listing_id)

    def update_booking(
        self, booking_id: int, guest_id: int, data: BookingUpdate
    ) -> Booking:
        booking = self.repo.get_by_id(booking_id)
        if booking is None:
            raise NotFoundError(f"Booking {booking_id} not found")
        if booking.guest_id != guest_id:
            raise ForbiddenError("You do not own this booking")

        new_check_in = data.check_in if data.check_in is not None else booking.check_in
        new_check_out = data.check_out if data.check_out is not None else booking.check_out
        new_guests = data.guests if data.guests is not None else booking.guests
        validate_date_range(new_check_in, new_check_out)

        listing = booking.listing
        if new_guests > listing.max_guests:
            raise BadRequestError(f"This listing sleeps at most {listing.max_guests} guests")
        if self.repo.has_overlap(
            booking.listing_id, new_check_in, new_check_out, exclude_booking_id=booking.id
        ):
            raise ConflictError("Those dates are no longer available")

        nights = (new_check_out - new_check_in).days
        total_price = nights * listing.price_per_night
        booking = self.repo.update(
            booking,
            check_in=new_check_in,
            check_out=new_check_out,
            guests=new_guests,
            total_price=total_price,
        )
        request_logger.info("booking updated: id=%s", booking.id)
        return booking

    def cancel_booking(self, booking_id: int, guest_id: int) -> None:
        booking = self.repo.get_by_id(booking_id)
        if booking is None:
            raise NotFoundError(f"Booking {booking_id} not found")
        if booking.guest_id != guest_id:
            raise ForbiddenError("You do not own this booking")
        self.repo.delete(booking)
        request_logger.info("booking cancelled: id=%s", booking_id)


def demo() -> None:
    """ponytail: self-check, run with `uv run python -m domain.booking.service`."""
    from datetime import date

    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session as SASession

    from database import Base
    from domain.listing.service import ListingService
    from domain.listing.types import ListingCreate
    from models import User

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    with SASession(engine) as db:
        host = User(email="host@test.com", hashed_password="x", name="Host")
        guest = User(email="guest@test.com", hashed_password="x", name="Guest")
        db.add_all([host, guest])
        db.commit()

        listing = ListingService(db).create_listing(
            host.id,
            ListingCreate(
                title="Cabin",
                description="Cozy",
                city="Tahoe",
                country="US",
                latitude=39.0968,
                longitude=-120.0324,
                price_per_night=100.0,
                max_guests=4,
                bedrooms=2,
                bathrooms=1,
            ),
        )

        booking_service = BookingService(db)

        booking = booking_service.create_booking(
            guest.id,
            BookingCreate(
                listing_id=listing.id,
                check_in=date(2026, 8, 1),
                check_out=date(2026, 8, 5),
                guests=2,
            ),
        )
        assert booking.total_price == 4 * listing.price_per_night

        try:
            booking_service.create_booking(
                guest.id,
                BookingCreate(
                    listing_id=listing.id,
                    check_in=date(2026, 8, 3),
                    check_out=date(2026, 8, 7),
                    guests=2,
                ),
            )
            raise AssertionError("expected ConflictError for overlapping dates")
        except ConflictError:
            pass

        non_overlapping = booking_service.create_booking(
            guest.id,
            BookingCreate(
                listing_id=listing.id,
                check_in=date(2026, 8, 10),
                check_out=date(2026, 8, 12),
                guests=2,
            ),
        )
        assert non_overlapping.id != booking.id

        try:
            booking_service.create_booking(
                host.id,
                BookingCreate(
                    listing_id=listing.id,
                    check_in=date(2026, 9, 1),
                    check_out=date(2026, 9, 3),
                    guests=1,
                ),
            )
            raise AssertionError("expected BadRequestError for booking own listing")
        except BadRequestError:
            pass

        try:
            booking_service.create_booking(
                guest.id,
                BookingCreate(
                    listing_id=listing.id,
                    check_in=date(2026, 9, 1),
                    check_out=date(2026, 9, 3),
                    guests=99,
                ),
            )
            raise AssertionError("expected BadRequestError for over-capacity")
        except BadRequestError:
            pass

        try:
            booking_service.update_booking(
                non_overlapping.id,
                guest.id,
                BookingUpdate(check_in=date(2026, 8, 2), check_out=date(2026, 8, 4)),
            )
            raise AssertionError("expected ConflictError updating into another booking")
        except ConflictError:
            pass

        updated = booking_service.update_booking(
            non_overlapping.id,
            guest.id,
            BookingUpdate(check_in=date(2026, 8, 10), check_out=date(2026, 8, 11)),
        )
        assert updated.check_out == date(2026, 8, 11)
        assert updated.total_price == 1 * listing.price_per_night

        try:
            booking_service.get_booking(booking.id, 9999)
            raise AssertionError("expected ForbiddenError")
        except ForbiddenError:
            pass

        assert booking_service.get_booking(booking.id, host.id).id == booking.id
        assert len(booking_service.list_my_trips(guest.id)) == 2
        assert len(booking_service.list_hosting(host.id)) == 2

        booking_service.cancel_booking(booking.id, guest.id)
        try:
            booking_service.get_booking(booking.id, guest.id)
            raise AssertionError("expected NotFoundError after cancel")
        except NotFoundError:
            pass

    print("domain.booking.service self-check passed")


if __name__ == "__main__":
    demo()
