from sqlalchemy import func
from sqlalchemy.orm import Session

from domain.listing.types import ListingCreate, ListingFilters, ListingUpdate
from models import Amenity, Listing, Review


class ListingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, listing_id: int) -> Listing | None:
        return self.db.get(Listing, listing_id)

    def get_review_stats(
        self, listing_ids: list[int]
    ) -> dict[int, tuple[float | None, int]]:
        if not listing_ids:
            return {}
        rows = (
            self.db.query(
                Review.listing_id,
                func.avg(Review.rating),
                func.count(Review.id),
            )
            .filter(Review.listing_id.in_(listing_ids))
            .group_by(Review.listing_id)
            .all()
        )
        return {
            listing_id: (float(avg) if avg is not None else None, count)
            for listing_id, avg, count in rows
        }

    def list_all(self, filters: ListingFilters) -> list[Listing]:
        query = self.db.query(Listing)
        if filters.city:
            query = query.filter(Listing.city.ilike(filters.city))
        if filters.min_price is not None:
            query = query.filter(Listing.price_per_night >= filters.min_price)
        if filters.max_price is not None:
            query = query.filter(Listing.price_per_night <= filters.max_price)
        if filters.max_guests is not None:
            query = query.filter(Listing.max_guests >= filters.max_guests)
        if filters.min_latitude is not None:
            query = query.filter(Listing.latitude >= filters.min_latitude)
        if filters.max_latitude is not None:
            query = query.filter(Listing.latitude <= filters.max_latitude)
        if filters.min_longitude is not None:
            query = query.filter(Listing.longitude >= filters.min_longitude)
        if filters.max_longitude is not None:
            query = query.filter(Listing.longitude <= filters.max_longitude)
        return (
            query.order_by(Listing.id).offset(filters.offset).limit(filters.limit).all()
        )

    def get_or_create_amenities(self, names: list[str]) -> list[Amenity]:
        amenities = []
        for name in names:
            amenity = self.db.query(Amenity).filter(Amenity.name == name).first()
            if amenity is None:
                amenity = Amenity(name=name)
                self.db.add(amenity)
                self.db.flush()
            amenities.append(amenity)
        return amenities

    def create(
        self, host_id: int, data: ListingCreate, amenities: list[Amenity]
    ) -> Listing:
        listing = Listing(
            host_id=host_id,
            amenities=amenities,
            **data.model_dump(exclude={"amenities"}),
        )
        self.db.add(listing)
        self.db.commit()
        self.db.refresh(listing)
        return listing

    def update(
        self,
        listing: Listing,
        data: ListingUpdate,
        amenities: list[Amenity] | None,
    ) -> Listing:
        for field, value in data.model_dump(
            exclude_unset=True, exclude={"amenities"}
        ).items():
            setattr(listing, field, value)
        if amenities is not None:
            listing.amenities = amenities
        self.db.commit()
        self.db.refresh(listing)
        return listing

    def delete(self, listing: Listing) -> None:
        self.db.delete(listing)
        self.db.commit()
