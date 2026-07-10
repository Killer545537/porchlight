from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.booking import Booking
    from models.favorite import Favorite
    from models.listing import Listing
    from models.review import Review


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    hashed_password: Mapped[str]
    name: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    listings: Mapped[list[Listing]] = relationship(back_populates="host")
    bookings: Mapped[list[Booking]] = relationship(back_populates="guest")
    reviews: Mapped[list[Review]] = relationship(back_populates="author")
    favorites: Mapped[list[Favorite]] = relationship(back_populates="user")
