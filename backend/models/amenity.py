from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.listing import listing_amenities

if TYPE_CHECKING:
    from models.listing import Listing


class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)

    listings: Mapped[list[Listing]] = relationship(
        secondary=listing_amenities, back_populates="amenities"
    )
