from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from domain.review.service import ReviewService
from domain.review.types import ReviewCreate, ReviewOut, ReviewUpdate
from models import Review, User

router = APIRouter(tags=["reviews"])


@router.post(
    "/listings/{listing_id}/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
    summary="Leave a review",
    description="Requires a completed stay — a booking on this listing by the current "
    "user whose check_out date has already passed. One review per listing per user.",
    responses={
        403: {"description": "No completed stay on this listing"},
        404: {"description": "No listing with that ID"},
        409: {"description": "You've already reviewed this listing"},
    },
)
def create_review(
    listing_id: int,
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Review:
    return ReviewService(db).create_review(listing_id, current_user.id, payload)


@router.get(
    "/listings/{listing_id}/reviews",
    response_model=list[ReviewOut],
    summary="List a listing's reviews",
    description="Public — no auth required.",
)
def list_reviews(listing_id: int, db: Session = Depends(get_db)) -> list[Review]:
    return ReviewService(db).list_for_listing(listing_id)


@router.patch(
    "/reviews/{review_id}",
    response_model=ReviewOut,
    summary="Edit a review",
    description="Author-only.",
    responses={
        403: {"description": "You aren't the author of this review"},
        404: {"description": "No review with that ID"},
    },
)
def update_review(
    review_id: int,
    payload: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Review:
    return ReviewService(db).update_review(review_id, current_user.id, payload)


@router.delete(
    "/reviews/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a review",
    description="Author-only.",
    responses={
        403: {"description": "You aren't the author of this review"},
        404: {"description": "No review with that ID"},
    },
)
def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    ReviewService(db).delete_review(review_id, current_user.id)
