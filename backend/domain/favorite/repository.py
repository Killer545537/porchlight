from sqlalchemy.orm import Session

from models import Favorite


class FavoriteRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: int, listing_id: int) -> Favorite | None:
        return (
            self.db.query(Favorite)
            .filter(Favorite.user_id == user_id, Favorite.listing_id == listing_id)
            .first()
        )

    def list_for_user(self, user_id: int) -> list[Favorite]:
        return self.db.query(Favorite).filter(Favorite.user_id == user_id).all()

    def create(self, user_id: int, listing_id: int) -> Favorite:
        favorite = Favorite(user_id=user_id, listing_id=listing_id)
        self.db.add(favorite)
        self.db.commit()
        self.db.refresh(favorite)
        return favorite

    def delete(self, favorite: Favorite) -> None:
        self.db.delete(favorite)
        self.db.commit()
