from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from domain.favorite.service import FavoriteService
from domain.favorite.types import FavoriteCreate
from domain.listing.types import ListingOut
from models import Listing, User

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.post(
    "",
    response_model=ListingOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a listing to favorites",
    responses={
        404: {"description": "No listing with that ID"},
        409: {"description": "Already favorited"},
    },
)
def add_favorite(
    payload: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Listing:
    return FavoriteService(db).add_favorite(current_user.id, payload.listing_id)


@router.get(
    "/me",
    response_model=list[ListingOut],
    summary="My favorites",
)
def list_favorites(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[Listing]:
    return FavoriteService(db).list_favorites(current_user.id)


@router.delete(
    "/{listing_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a listing from favorites",
    responses={404: {"description": "Not favorited"}},
)
def remove_favorite(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    FavoriteService(db).remove_favorite(current_user.id, listing_id)
