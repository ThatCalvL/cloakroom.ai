from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBootstrapRequest(BaseModel):
    email: EmailStr
    full_name: str
    avatar_image_url: str | None = None


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    avatar_image_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ClothingItemResponse(BaseModel):
    id: int
    owner_id: int
    original_url: str | None = None
    processed_url: str
    category: str
    color: str | None = None
    created_at: datetime


class UploadResponse(BaseModel):
    item: ClothingItemResponse
    message: str


class TryOnRequest(BaseModel):
    user_id: int
    top_id: int | None = None
    bottom_id: int | None = None
    shoes_id: int | None = None
    accessory_id: int | None = None


class TryOnResponse(BaseModel):
    outfit_id: int
    generated_image_url: str
    message: str
