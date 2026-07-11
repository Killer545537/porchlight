from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.listing import Listing
    from models.user import User


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id"))
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    check_in: Mapped[date] = mapped_column(Date)
    check_out: Mapped[date] = mapped_column(Date)
    guests: Mapped[int]
    total_price: Mapped[float]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    listing: Mapped[Listing] = relationship(back_populates="bookings")
    guest: Mapped[User] = relationship(back_populates="bookings")
