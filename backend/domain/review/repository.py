from sqlalchemy.orm import Session

from domain.review.types import ReviewCreate, ReviewUpdate
from models import Review


class ReviewRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, review_id: int) -> Review | None:
        return self.db.get(Review, review_id)

    def get_by_listing_and_author(self, listing_id: int, author_id: int) -> Review | None:
        return (
            self.db.query(Review)
            .filter(Review.listing_id == listing_id, Review.author_id == author_id)
            .first()
        )

    def list_for_listing(self, listing_id: int) -> list[Review]:
        return self.db.query(Review).filter(Review.listing_id == listing_id).all()

    def create(self, listing_id: int, author_id: int, data: ReviewCreate) -> Review:
        review = Review(
            listing_id=listing_id, author_id=author_id, rating=data.rating, comment=data.comment
        )
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def update(self, review: Review, data: ReviewUpdate) -> Review:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(review, field, value)
        self.db.commit()
        self.db.refresh(review)
        return review

    def delete(self, review: Review) -> None:
        self.db.delete(review)
        self.db.commit()
