from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Column, ForeignKey, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.amenity import Amenity
    from models.booking import Booking
    from models.favorite import Favorite
    from models.photo import Photo
    from models.review import Review
    from models.user import User

listing_amenities = Table(
    "listing_amenities",
    Base.metadata,
    Column("listing_id", ForeignKey("listings.id"), primary_key=True),
    Column("amenity_id", ForeignKey("amenities.id"), primary_key=True),
)


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str]
    description: Mapped[str]
    city: Mapped[str] = mapped_column(index=True)
    country: Mapped[str]
    price_per_night: Mapped[float]
    max_guests: Mapped[int]
    bedrooms: Mapped[int]
    bathrooms: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    host: Mapped[User] = relationship(back_populates="listings")
    photos: Mapped[list[Photo]] = relationship(
        back_populates="listing", cascade="all, delete-orphan"
    )
    amenities: Mapped[list[Amenity]] = relationship(
        secondary=listing_amenities, back_populates="listings"
    )
    bookings: Mapped[list[Booking]] = relationship(
        back_populates="listing", cascade="all, delete-orphan"
    )
    reviews: Mapped[list[Review]] = relationship(
        back_populates="listing", cascade="all, delete-orphan"
    )
    favorited_by: Mapped[list[Favorite]] = relationship(
        back_populates="listing", cascade="all, delete-orphan"
    )
