from middleware.logging import request_logger
from models import Listing
from sqlalchemy.orm import Session

from domain.errors import ForbiddenError, NotFoundError
from domain.listing.repository import ListingRepository
from domain.listing.types import ListingCreate, ListingFilters, ListingUpdate
from domain.photo import storage as photo_storage


class ListingService:
    def __init__(self, db: Session):
        self.repo = ListingRepository(db)

    def create_listing(self, host_id: int, data: ListingCreate) -> Listing:
        amenities = self.repo.get_or_create_amenities(data.amenities)
        listing = self.repo.create(host_id, data, amenities)
        request_logger.info("listing created: id=%s host_id=%s", listing.id, host_id)
        return listing

    def _enrich_review_stats(self, listings: list[Listing]) -> list[Listing]:
        stats = self.repo.get_review_stats([listing.id for listing in listings])
        for listing in listings:
            avg, count = stats.get(listing.id, (None, 0))
            setattr(listing, "avg_rating", avg)
            setattr(listing, "review_count", count)
        return listings

    def get_listing(self, listing_id: int) -> Listing:
        listing = self.repo.get_by_id(listing_id)
        if listing is None:
            raise NotFoundError(f"Listing {listing_id} not found")
        return self._enrich_review_stats([listing])[0]

    def list_listings(self, filters: ListingFilters) -> list[Listing]:
        return self._enrich_review_stats(self.repo.list_all(filters))

    def update_listing(
        self, listing_id: int, host_id: int, data: ListingUpdate
    ) -> Listing:
        listing = self.get_listing(listing_id)
        if listing.host_id != host_id:
            raise ForbiddenError("You do not own this listing")

        amenities = (
            self.repo.get_or_create_amenities(data.amenities)
            if data.amenities is not None
            else None
        )
        listing = self.repo.update(listing, data, amenities)
        request_logger.info("listing updated: id=%s", listing.id)
        return listing

    def delete_listing(self, listing_id: int, host_id: int) -> None:
        listing = self.get_listing(listing_id)
        if listing.host_id != host_id:
            raise ForbiddenError("You do not own this listing")
        for photo in listing.photos:
            photo_storage.delete_upload(photo.url)
        self.repo.delete(listing)
        request_logger.info("listing deleted: id=%s", listing_id)


def demo() -> None:
    import pydantic
    from database import Base
    from models import User
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session as SASession

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    with SASession(engine) as db:
        host = User(email="host@test.com", hashed_password="x", name="Host")
        other = User(email="other@test.com", hashed_password="x", name="Other")
        db.add_all([host, other])
        db.commit()

        service = ListingService(db)

        listing = service.create_listing(
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
                amenities=["WiFi", "Parking", "wifi"],
            ),
        )
        assert sorted(a.name for a in listing.amenities) == ["parking", "wifi"]
        assert service.get_listing(listing.id).id == listing.id
        assert len(service.list_listings(ListingFilters(city="Tahoe"))) == 1

        in_bounds = ListingFilters(
            min_latitude=38.0, max_latitude=40.0, min_longitude=-121.0, max_longitude=-119.0
        )
        assert len(service.list_listings(in_bounds)) == 1

        out_of_bounds = ListingFilters(min_latitude=0.0, max_latitude=1.0)
        assert len(service.list_listings(out_of_bounds)) == 0

        try:
            ListingFilters(min_latitude=10, max_latitude=5)
            raise AssertionError("expected ValidationError")
        except pydantic.ValidationError:
            pass

        try:
            service.get_listing(999_999)
            raise AssertionError("expected NotFoundError")
        except NotFoundError:
            pass

        try:
            service.update_listing(
                listing.id, other.id, ListingUpdate(title="Hijacked")
            )
            raise AssertionError("expected ForbiddenError")
        except ForbiddenError:
            pass

        updated = service.update_listing(
            listing.id, host.id, ListingUpdate(title="Updated Cabin")
        )
        assert updated.title == "Updated Cabin"

        try:
            ListingFilters(min_price=100, max_price=50)
            raise AssertionError("expected ValidationError")
        except pydantic.ValidationError:
            pass

        try:
            service.delete_listing(listing.id, other.id)
            raise AssertionError("expected ForbiddenError")
        except ForbiddenError:
            pass

        service.delete_listing(listing.id, host.id)
        assert service.repo.get_by_id(listing.id) is None

    print("domain.listing.service self-check passed")


if __name__ == "__main__":
    demo()
