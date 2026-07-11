from pydantic import BaseModel


class FavoriteCreate(BaseModel):
    listing_id: int
