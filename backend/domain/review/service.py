from datetime import date

from sqlalchemy.orm import Session

from domain.booking.repository import BookingRepository
from domain.errors import ConflictError, ForbiddenError, NotFoundError
from domain.listing.repository import ListingRepository
from domain.review.repository import ReviewRepository
from domain.review.types import ReviewCreate, ReviewUpdate
from middleware.logging import request_logger
from models import Review


class ReviewService:
    def __init__(self, db: Session):
        self.repo = ReviewRepository(db)
        self.booking_repo = BookingRepository(db)
        self.listing_repo = ListingRepository(db)

    def create_review(self, listing_id: int, author_id: int, data: ReviewCreate) -> Review:
        listing = self.listing_repo.get_by_id(listing_id)
        if listing is None:
            raise NotFoundError(f"Listing {listing_id} not found")
        if not self.booking_repo.has_completed_stay(listing_id, author_id, before=date.today()):
            raise ForbiddenError("You can only review a listing after a completed stay")
        if self.repo.get_by_listing_and_author(listing_id, author_id) is not None:
            raise ConflictError("You've already reviewed this listing")

        review = self.repo.create(listing_id, author_id, data)
        request_logger.info(
            "review created: id=%s listing_id=%s author_id=%s", review.id, listing_id, author_id
        )
        return review

    def list_for_listing(self, listing_id: int) -> list[Review]:
        return self.repo.list_for_listing(listing_id)

    def update_review(self, review_id: int, author_id: int, data: ReviewUpdate) -> Review:
        review = self.repo.get_by_id(review_id)
        if review is None:
            raise NotFoundError(f"Review {review_id} not found")
        if review.author_id != author_id:
            raise ForbiddenError("You do not own this review")
        review = self.repo.update(review, data)
        request_logger.info("review updated: id=%s", review.id)
        return review

    def delete_review(self, review_id: int, author_id: int) -> None:
        review = self.repo.get_by_id(review_id)
        if review is None:
            raise NotFoundError(f"Review {review_id} not found")
        if review.author_id != author_id:
            raise ForbiddenError("You do not own this review")
        self.repo.delete(review)
        request_logger.info("review deleted: id=%s", review_id)
