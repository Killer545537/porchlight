from models.amenity import Amenity
from models.booking import Booking
from models.favorite import Favorite
from models.listing import Listing, listing_amenities
from models.photo import Photo
from models.review import Review
from models.user import User

__all__ = [
    "Amenity",
    "Booking",
    "Favorite",
    "Listing",
    "Photo",
    "Review",
    "User",
    "listing_amenities",
    "demo",
]


def demo() -> None:
    from datetime import date

    from database import Base
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    with Session(engine) as db:
        host = User(email="host@test.com", hashed_password="x", name="Host")
        guest = User(email="guest@test.com", hashed_password="x", name="Guest")
        wifi = Amenity(name="wifi")
        listing = Listing(
            host=host,
            title="Cabin",
            description="Cozy",
            city="Tahoe",
            country="US",
            price_per_night=100.0,
            max_guests=4,
            bedrooms=2,
            bathrooms=1,
            amenities=[wifi],
        )
        db.add_all([host, guest, listing])
        db.commit()

        booking = Booking(
            listing=listing,
            guest=guest,
            check_in=date(2026, 8, 1),
            check_out=date(2026, 8, 5),
            total_price=400.0,
        )
        review = Review(listing=listing, author=guest, rating=5, comment="Great stay")
        favorite = Favorite(user=guest, listing=listing)
        db.add_all([booking, review, favorite])
        db.commit()

        assert listing.host.email == "host@test.com"
        assert wifi in listing.amenities
        assert listing.bookings[0].guest.email == "guest@test.com"
        assert listing.reviews[0].rating == 5
        assert listing.favorited_by[0].user_id == guest.id

        db.delete(listing)
        db.commit()
        assert db.query(Photo).count() == 0
        assert db.query(Booking).count() == 0

    print("models self-check passed")
