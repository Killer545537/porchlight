import models  # noqa: F401  # registers ORM tables on Base.metadata
from config import settings
from database import Base, engine
from domain.errors import register_exception_handlers
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from middleware.logging import RequestLogMiddleware, setup_logging
from routers.auth import router as google_auth_router
from routers.bookings import router as bookings_router
from routers.favorites import router as favorites_router
from routers.listings import router as listings_router
from routers.reviews import router as reviews_router
from routers.users import router as users_router

setup_logging()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Porchlight API",
    description="API for the Porchlight project",
    version="0.1.0",
    openapi_tags=[
        {"name": "system", "description": "Health checks and service status."},
        {
            "name": "users",
            "description": "Email/password signup, login, and the current user's profile.",
        },
        {
            "name": "auth",
            "description": "Google OAuth sign-in — redirect-based, not called directly by API clients.",
        },
        {
            "name": "listings",
            "description": "Search, create, and manage listings. Writes are host-only.",
        },
        {
            "name": "bookings",
            "description": "Book a stay, view your trips or your listings' bookings, "
            "change or cancel a booking.",
        },
        {
            "name": "reviews",
            "description": "Leave a review after a completed stay, list a listing's reviews.",
        },
        {
            "name": "favorites",
            "description": "A user's wishlist — add, list, and remove favorited listings.",
        },
    ],
)

register_exception_handlers(app)

app.add_middleware(RequestLogMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(users_router)
app.include_router(google_auth_router)
app.include_router(listings_router)
app.include_router(bookings_router)
app.include_router(reviews_router)
app.include_router(favorites_router)


@app.get("/health", tags=["system"], summary="Health check")
def health():
    return {"status": "ok"}
