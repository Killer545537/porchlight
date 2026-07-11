from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from domain.photo.service import PhotoService
from domain.photo.types import PhotoOut
from models import Photo, User

router = APIRouter(tags=["uploads"])


@router.post(
    "/listings/{listing_id}/photos",
    response_model=PhotoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a listing photo",
    description="Host-only. Multipart form upload, field name `file`. "
    "JPEG/PNG/WebP/GIF, 5MB max. Stored on local disk, URL saved on the listing.",
    responses={
        400: {"description": "Unsupported file type or file too large"},
        403: {"description": "You do not own this listing"},
        404: {"description": "No listing with that ID"},
    },
)
def upload_photo(
    listing_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Photo:
    return PhotoService(db).add_photo(listing_id, current_user.id, file)


@router.delete(
    "/listings/{listing_id}/photos/{photo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a listing photo",
    description="Host-only.",
    responses={
        403: {"description": "You do not own this listing"},
        404: {"description": "No listing or photo with that ID"},
    },
)
def delete_photo(
    listing_id: int,
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    PhotoService(db).remove_photo(listing_id, photo_id, current_user.id)
