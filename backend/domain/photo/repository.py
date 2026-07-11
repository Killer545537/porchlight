from sqlalchemy.orm import Session

from models import Photo


class PhotoRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, photo_id: int) -> Photo | None:
        return self.db.get(Photo, photo_id)

    def create(self, listing_id: int, url: str) -> Photo:
        photo = Photo(listing_id=listing_id, url=url)
        self.db.add(photo)
        self.db.commit()
        self.db.refresh(photo)
        return photo

    def delete(self, photo: Photo) -> None:
        self.db.delete(photo)
        self.db.commit()
