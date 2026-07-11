"""Populate the local SQLite database with demo content.

Mirrors the editorial listings from the Porchlight design spec so the frontend
has something real to render. Idempotent — running it again does nothing unless
you pass --force (which wipes and reseeds).

    uv run python seed.py            # seed if empty
    uv run python seed.py --force    # wipe + reseed

Log in as the demo guest with  guest@porchlight.test / porchlight
or the demo host with          host@porchlight.test  / porchlight
"""

import sys
from datetime import date, timedelta

import models  # noqa: F401  # registers tables
from auth import hash_password
from database import Base, SessionLocal, engine
from models import Amenity, Booking, Favorite, Listing, Photo, Review, User

PASSWORD = "porchlight"

LISTINGS = [
    {
        "title": "Sea Ledge",
        "city": "Big Sur",
        "country": "US",
        "lat": 36.2704,
        "lng": -121.8081,
        "price": 412.0,
        "guests": 6,
        "bedrooms": 3,
        "bathrooms": 2,
        "amenities": ["wifi", "kitchen", "fireplace", "free parking", "hot tub", "workspace"],
        "description": (
            "A low concrete-and-glass house set into the cliff above a private cove. "
            "Whale spouts from the kitchen sink, fog rolling in by four, and a wood stove "
            "for when it does. Three bedrooms face the water; the cove path takes eight "
            "minutes and is worth every one."
        ),
        "reviews": [
            ("Priya", 5, "The fog show alone is worth it. Spotless, warm, quieter than seems possible."),
            ("Tom", 5, "Best kitchen view I have ever chopped an onion in front of."),
        ],
    },
    {
        "title": "The A-Frame at Pinecrest",
        "city": "Tahoe",
        "country": "US",
        "lat": 39.19,
        "lng": -120.23,
        "price": 238.0,
        "guests": 4,
        "bedrooms": 2,
        "bathrooms": 1,
        "amenities": ["wifi", "kitchen", "fireplace", "free parking", "pets ok"],
        "description": (
            "A 1968 A-frame rebuilt board by board — cedar inside, snow-proof outside, "
            "string lights on the deck. The loft sleeps two under the peak window; two "
            "more fit downstairs. Trailhead at the end of the drive, bakery twelve minutes "
            "down the hill."
        ),
        "reviews": [
            ("Jae", 5, "Fell asleep counting stars through the peak window. Perfect weekend."),
            ("Marisol", 4, "Cozy and immaculate. Bring chains in spring, the last mile is dirt."),
        ],
    },
    {
        "title": "Meridian Loft",
        "city": "Portland",
        "country": "US",
        "lat": 45.5152,
        "lng": -122.6784,
        "price": 174.0,
        "guests": 2,
        "bedrooms": 1,
        "bathrooms": 1,
        "amenities": ["wifi", "kitchen", "workspace", "ev charger", "ac"],
        "description": (
            "Top floor of a 1912 printworks — double-height windows, worn fir floors, and "
            "a mezzanine bed above a kitchen that actually gets used. Coffee, records and "
            "dumplings are each under three blocks away. Streetcar at the corner."
        ),
        "reviews": [
            ("Devon", 5, "Light for days. Walked everywhere, drove nowhere."),
            ("Anouk", 4, "Gorgeous space. Mezzanine ladder is not for midnight water runs."),
        ],
    },
    {
        "title": "Lantern Point Keeper's Cottage",
        "city": "Mendocino",
        "country": "US",
        "lat": 39.3076,
        "lng": -123.7995,
        "price": 325.0,
        "guests": 3,
        "bedrooms": 2,
        "bathrooms": 1,
        "amenities": ["wifi", "kitchen", "fireplace", "free parking"],
        "description": (
            "The keeper's cottage at a working 1909 lighthouse. The lamp still turns; "
            "you'll stop noticing it around the second glass of wine. Thick stone walls, a "
            "round bedroom window, and a tour of the lamp room with your stay."
        ),
        "reviews": [
            ("Ruth", 5, "Slept inside a postcard. The lamp room tour is unmissable."),
            ("Caleb", 5, "Watched a storm roll in with tea and a blanket. Ten out of five."),
        ],
    },
    {
        "title": "Canopy House",
        "city": "Olympic Peninsula",
        "country": "US",
        "lat": 47.8021,
        "lng": -123.6044,
        "price": 289.0,
        "guests": 2,
        "bedrooms": 1,
        "bathrooms": 1,
        "amenities": ["wifi", "kitchen", "hot tub", "pets ok"],
        "description": (
            "Forty feet up a Sitka spruce, reached by a cedar bridge. A real house — "
            "insulated, plumbed — that happens to live in a tree. The bed sits level with "
            "the canopy, so mornings start with birds instead of alarms. Yes, it sways a "
            "little. That is the point."
        ),
        "reviews": [
            ("Ines", 5, "Swayed like a very slow boat. Slept better than I have in years."),
            ("Marcus", 4, "Magical. Pack light — the bridge and your suitcase will disagree."),
        ],
    },
    {
        "title": "High Desert Courtyard House",
        "city": "Joshua Tree",
        "country": "US",
        "lat": 34.1347,
        "lng": -116.3131,
        "price": 198.0,
        "guests": 5,
        "bedrooms": 3,
        "bathrooms": 2,
        "amenities": ["wifi", "kitchen", "free parking", "ac", "ev charger", "pets ok"],
        "description": (
            "Rammed-earth walls around a courtyard pool. Shade all day, stars all night, "
            "and a roof deck aimed at the sunset. Three bedrooms open onto the courtyard, "
            "so the pool is never more than ten steps away. National park entrance is nine "
            "minutes east."
        ),
        "reviews": [
            ("Sofia", 5, "The courtyard makes the heat irrelevant. Stars were absurd."),
            ("Ben", 5, "Roof deck sunset with a cold drink — the whole trip, honestly."),
        ],
    },
]


def get_or_create_amenity(db, cache, name):
    if name not in cache:
        cache[name] = Amenity(name=name)
        db.add(cache[name])
    return cache[name]


def seed(force: bool) -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(Listing).count()
        if existing and not force:
            print(f"Database already has {existing} listings — nothing to do (use --force to reseed).")
            return
        if force:
            for model in (Favorite, Review, Booking, Photo, Listing, User, Amenity):
                db.query(model).delete()
            db.commit()

        host = User(email="host@porchlight.test", name="Ana Morgan", hashed_password=hash_password(PASSWORD))
        guest = User(email="guest@porchlight.test", name="Sam Rivera", hashed_password=hash_password(PASSWORD))
        db.add_all([host, guest])
        db.flush()

        amenity_cache: dict[str, Amenity] = {}
        reviewer_cache: dict[str, User] = {}
        listings: list[Listing] = []

        for data in LISTINGS:
            listing = Listing(
                host=host,
                title=data["title"],
                description=data["description"],
                city=data["city"],
                country=data["country"],
                latitude=data["lat"],
                longitude=data["lng"],
                price_per_night=data["price"],
                max_guests=data["guests"],
                bedrooms=data["bedrooms"],
                bathrooms=data["bathrooms"],
                amenities=[get_or_create_amenity(db, amenity_cache, a) for a in data["amenities"]],
            )
            db.add(listing)
            db.flush()
            listings.append(listing)

            for name, rating, text in data["reviews"]:
                if name not in reviewer_cache:
                    reviewer_cache[name] = User(
                        email=f"{name.lower()}@porchlight.test",
                        name=name,
                        hashed_password=hash_password(PASSWORD),
                    )
                    db.add(reviewer_cache[name])
                    db.flush()
                db.add(Review(listing=listing, author=reviewer_cache[name], rating=rating, comment=text))

        # Give the demo guest one past stay (reviewable) and one upcoming trip.
        today = date.today()
        past = listings[0]
        upcoming = listings[3]
        db.add(
            Booking(
                listing=past,
                guest=guest,
                check_in=today - timedelta(days=30),
                check_out=today - timedelta(days=26),
                guests=2,
                total_price=past.price_per_night * 4,
            )
        )
        db.add(
            Booking(
                listing=upcoming,
                guest=guest,
                check_in=today + timedelta(days=21),
                check_out=today + timedelta(days=25),
                guests=2,
                total_price=upcoming.price_per_night * 4,
            )
        )
        db.add(Favorite(user=guest, listing=listings[1]))
        db.add(Favorite(user=guest, listing=listings[4]))

        db.commit()
        print(f"Seeded {len(listings)} listings, reviews, 2 bookings, 2 favorites.")
        print("Guest login: guest@porchlight.test / porchlight")
        print("Host login:  host@porchlight.test / porchlight")
    finally:
        db.close()


if __name__ == "__main__":
    seed(force="--force" in sys.argv)
