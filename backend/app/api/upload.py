import os
import uuid
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Form
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.domain import CategoryEnum
from app.models.domain import ClothingItem, ClothingItemPhoto, User
from app.schemas import (
    ClothingItemPhotoResponse,
    ClothingItemResponse,
    ItemUpdateRequest,
    UploadResponse,
)
from app.services.ml_service import InvalidImageError, auto_categorize, remove_background

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _serialize_photo(photo: ClothingItemPhoto) -> ClothingItemPhotoResponse:
    return ClothingItemPhotoResponse(
        id=photo.id,
        item_id=photo.item_id,
        original_url=photo.original_image_url,
        processed_url=photo.image_url,
        angle_label=photo.angle_label,
        created_at=photo.created_at,
    )


def _serialize_item(item: ClothingItem) -> ClothingItemResponse:
    return ClothingItemResponse(
        id=item.id,
        owner_id=item.owner_id,
        name=item.name,
        original_url=item.original_image_url,
        processed_url=item.image_url,
        category=item.category.value,
        color=item.color,
        created_at=item.created_at,
        photos=[_serialize_photo(photo) for photo in item.photos],
    )


def _normalize_item_name(item_name: str | None, fallback_filename: str | None) -> str | None:
    if item_name is not None:
        normalized = item_name.strip()
        return normalized or None

    if fallback_filename:
        stem = Path(fallback_filename).stem.strip()
        return stem or None

    return None


def _process_and_store_image(file_name_hint: str | None, image_bytes: bytes) -> tuple[str, str, str]:
    upload_message = "Image uploaded, background removed, and categorized successfully"
    try:
        processed_image_bytes = remove_background(image_bytes)
    except InvalidImageError:
        # Keep MVP upload flow resilient for odd but browser-decodable images.
        processed_image_bytes = image_bytes
        upload_message = (
            "Image uploaded and categorized successfully. "
            "Background removal was skipped for this file format."
        )

    unique_id = str(uuid.uuid4())
    original_suffix = Path(file_name_hint or "").suffix.lower() or ".jpg"
    original_filename = f"{unique_id}_orig{original_suffix}"
    processed_filename = f"{unique_id}_proc.png"

    original_path = os.path.join(UPLOAD_DIR, original_filename)
    processed_path = os.path.join(UPLOAD_DIR, processed_filename)

    with open(original_path, "wb") as output_file:
        output_file.write(image_bytes)

    with open(processed_path, "wb") as output_file:
        output_file.write(processed_image_bytes)

    return f"/static/{original_filename}", f"/static/{processed_filename}", upload_message


def _validate_image_file(file: UploadFile) -> None:
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
    file_extension = Path(file.filename or "").suffix.lower()
    is_image_content_type = bool(file.content_type and file.content_type.startswith("image/"))
    if not is_image_content_type and file_extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="File provided is not an image.")


@router.post("/upload/", response_model=UploadResponse)
async def upload_image(
    owner_id: int = Form(...),
    item_name: str | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    _validate_image_file(file)

    user = db.get(User, owner_id)
    if not user:
        raise HTTPException(status_code=404, detail="Owner user was not found.")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    original_url, processed_url, upload_message = _process_and_store_image(file.filename, image_bytes)
    predicted_category = auto_categorize(image_bytes)

    item = ClothingItem(
        owner_id=owner_id,
        name=_normalize_item_name(item_name, file.filename),
        original_image_url=original_url,
        image_url=processed_url,
        category=CategoryEnum(predicted_category),
    )
    db.add(item)
    db.flush()

    first_photo = ClothingItemPhoto(
        item_id=item.id,
        original_image_url=original_url,
        image_url=processed_url,
        angle_label="front",
    )
    db.add(first_photo)

    db.commit()
    db.refresh(item)

    return UploadResponse(item=_serialize_item(item), message=upload_message)


@router.post("/items/{item_id}/photos", response_model=ClothingItemResponse)
async def add_item_photos(
    item_id: int,
    files: list[UploadFile] = File(...),
    angle_label: str | None = Form(default=None),
    db: Session = Depends(get_db),
):
    if not files:
        raise HTTPException(status_code=400, detail="At least one photo must be provided.")

    item = (
        db.query(ClothingItem)
        .options(selectinload(ClothingItem.photos))
        .filter(ClothingItem.id == item_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Clothing item not found.")

    for file in files:
        _validate_image_file(file)
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail=f"Uploaded image '{file.filename}' is empty.")

        original_url, processed_url, _ = _process_and_store_image(file.filename, image_bytes)
        photo = ClothingItemPhoto(
            item_id=item.id,
            original_image_url=original_url,
            image_url=processed_url,
            angle_label=(angle_label.strip() if angle_label else None),
        )
        db.add(photo)

    db.commit()

    refreshed_item = (
        db.query(ClothingItem)
        .options(selectinload(ClothingItem.photos))
        .filter(ClothingItem.id == item_id)
        .first()
    )
    if not refreshed_item:
        raise HTTPException(status_code=404, detail="Clothing item not found after update.")

    return _serialize_item(refreshed_item)


@router.patch("/items/{item_id}", response_model=ClothingItemResponse)
def update_item(item_id: int, payload: ItemUpdateRequest, db: Session = Depends(get_db)):
    normalized_name = payload.name.strip()
    if not normalized_name:
        raise HTTPException(status_code=400, detail="Item name cannot be empty.")

    item = (
        db.query(ClothingItem)
        .options(selectinload(ClothingItem.photos))
        .filter(ClothingItem.id == item_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Clothing item not found.")

    item.name = normalized_name
    db.add(item)
    db.commit()
    db.refresh(item)

    return _serialize_item(item)


@router.get("/closet/{owner_id}", response_model=list[ClothingItemResponse])
def list_closet(owner_id: int, db: Session = Depends(get_db)):
    items = (
        db.query(ClothingItem)
        .options(selectinload(ClothingItem.photos))
        .filter(ClothingItem.owner_id == owner_id)
        .order_by(ClothingItem.created_at.desc())
        .all()
    )
    return [_serialize_item(item) for item in items]
