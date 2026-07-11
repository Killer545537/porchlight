from sqlalchemy.orm import Session

from domain.errors import ConflictError, NotFoundError
from domain.favorite.repository import FavoriteRepository
from domain.listing.repository import ListingRepository
from middleware.logging import request_logger
from models import Listing


class FavoriteService:
    def __init__(self, db: Session):
        self.repo = FavoriteRepository(db)
        self.listing_repo = ListingRepository(db)

    def add_favorite(self, user_id: int, listing_id: int) -> Listing:
        listing = self.listing_repo.get_by_id(listing_id)
        if listing is None:
            raise NotFoundError(f"Listing {listing_id} not found")
        if self.repo.get(user_id, listing_id) is not None:
            raise ConflictError("Already favorited")

        self.repo.create(user_id, listing_id)
        request_logger.info(
            "favorite added: user_id=%s listing_id=%s", user_id, listing_id
        )
        return listing

    def list_favorites(self, user_id: int) -> list[Listing]:
        return [favorite.listing for favorite in self.repo.list_for_user(user_id)]

    def remove_favorite(self, user_id: int, listing_id: int) -> None:
        favorite = self.repo.get(user_id, listing_id)
        if favorite is None:
            raise NotFoundError("Not favorited")
        self.repo.delete(favorite)
        request_logger.info(
            "favorite removed: user_id=%s listing_id=%s", user_id, listing_id
        )
