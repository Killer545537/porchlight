from datetime import date

from sqlalchemy.orm import Session

from models import Booking, Listing


class BookingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, booking_id: int) -> Booking | None:
        return self.db.get(Booking, booking_id)

    def list_for_guest(self, guest_id: int) -> list[Booking]:
        return self.db.query(Booking).filter(Booking.guest_id == guest_id).all()

    def list_for_host(self, host_id: int) -> list[Booking]:
        return (
            self.db.query(Booking)
            .join(Listing, Booking.listing_id == Listing.id)
            .filter(Listing.host_id == host_id)
            .all()
        )

    def has_overlap(
        self,
        listing_id: int,
        check_in: date,
        check_out: date,
        exclude_booking_id: int | None = None,
    ) -> bool:
        query = self.db.query(Booking).filter(
            Booking.listing_id == listing_id,
            Booking.check_in < check_out,
            Booking.check_out > check_in,
        )
        if exclude_booking_id is not None:
            query = query.filter(Booking.id != exclude_booking_id)
        return query.first() is not None

    def has_completed_stay(self, listing_id: int, guest_id: int, before: date) -> bool:
        return (
            self.db.query(Booking)
            .filter(
                Booking.listing_id == listing_id,
                Booking.guest_id == guest_id,
                Booking.check_out <= before,
            )
            .first()
            is not None
        )

    def create(
        self,
        guest_id: int,
        listing_id: int,
        check_in: date,
        check_out: date,
        guests: int,
        total_price: float,
    ) -> Booking:
        booking = Booking(
            guest_id=guest_id,
            listing_id=listing_id,
            check_in=check_in,
            check_out=check_out,
            guests=guests,
            total_price=total_price,
        )
        self.db.add(booking)
        self.db.commit()
        self.db.refresh(booking)
        return booking

    def update(
        self,
        booking: Booking,
        check_in: date,
        check_out: date,
        guests: int,
        total_price: float,
    ) -> Booking:
        booking.check_in = check_in
        booking.check_out = check_out
        booking.guests = guests
        booking.total_price = total_price
        self.db.commit()
        self.db.refresh(booking)
        return booking

    def delete(self, booking: Booking) -> None:
        self.db.delete(booking)
        self.db.commit()
