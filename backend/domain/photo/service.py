from fastapi import UploadFile
from sqlalchemy.orm import Session

from domain.errors import ForbiddenError, NotFoundError
from domain.listing.repository import ListingRepository
from domain.photo import storage
from domain.photo.repository import PhotoRepository
from middleware.logging import request_logger
from models import Photo


class PhotoService:
    def __init__(self, db: Session):
        self.repo = PhotoRepository(db)
        self.listing_repo = ListingRepository(db)

    def add_photo(self, listing_id: int, host_id: int, file: UploadFile) -> Photo:
        listing = self.listing_repo.get_by_id(listing_id)
        if listing is None:
            raise NotFoundError(f"Listing {listing_id} not found")
        if listing.host_id != host_id:
            raise ForbiddenError("You do not own this listing")

        url = storage.save_upload(file)
        photo = self.repo.create(listing_id, url)
        request_logger.info("photo added: id=%s listing_id=%s", photo.id, listing_id)
        return photo

    def remove_photo(self, listing_id: int, photo_id: int, host_id: int) -> None:
        listing = self.listing_repo.get_by_id(listing_id)
        if listing is None:
            raise NotFoundError(f"Listing {listing_id} not found")
        if listing.host_id != host_id:
            raise ForbiddenError("You do not own this listing")

        photo = self.repo.get_by_id(photo_id)
        if photo is None or photo.listing_id != listing_id:
            raise NotFoundError(f"Photo {photo_id} not found on this listing")

        storage.delete_upload(photo.url)
        self.repo.delete(photo)
        request_logger.info("photo removed: id=%s listing_id=%s", photo_id, listing_id)
