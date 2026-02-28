from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Form
import os
import uuid
from sqlalchemy.orm import Session
from app.services.ml_service import remove_background, auto_categorize
from app.models.domain import CategoryEnum
from app.models.domain import ClothingItem, User
from app.database import get_db
from app.schemas import UploadResponse, ClothingItemResponse

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/", response_model=UploadResponse)
async def upload_image(
    owner_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    user = db.get(User, owner_id)
    if not user:
        raise HTTPException(status_code=404, detail="Owner user was not found.")

    # Read the file
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    # Process image (Remove background) and auto-tag.
    processed_image_bytes = remove_background(image_bytes)
    # Predict Category
    predicted_category = auto_categorize(image_bytes)

    # Generate unique filenames
    unique_id = str(uuid.uuid4())
    orig_filename = f"{unique_id}_orig.jpg"
    proc_filename = f"{unique_id}_proc.png"
    
    orig_path = os.path.join(UPLOAD_DIR, orig_filename)
    proc_path = os.path.join(UPLOAD_DIR, proc_filename)

    # Save original
    with open(orig_path, "wb") as f:
        f.write(image_bytes)
        
    # Save processed
    with open(proc_path, "wb") as f:
        f.write(processed_image_bytes)

    item = ClothingItem(
        owner_id=owner_id,
        original_image_url=f"/static/{orig_filename}",
        image_url=f"/static/{proc_filename}",
        category=CategoryEnum(predicted_category),
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return UploadResponse(
        item=ClothingItemResponse(
            id=item.id,
            owner_id=item.owner_id,
            original_url=item.original_image_url,
            processed_url=item.image_url,
            category=item.category.value,
            color=item.color,
            created_at=item.created_at,
        ),
        message="Image uploaded, background removed, and categorized successfully",
    )


@router.get("/closet/{owner_id}", response_model=list[ClothingItemResponse])
def list_closet(owner_id: int, db: Session = Depends(get_db)):
    items = (
        db.query(ClothingItem)
        .filter(ClothingItem.owner_id == owner_id)
        .order_by(ClothingItem.created_at.desc())
        .all()
    )
    return [
        ClothingItemResponse(
            id=item.id,
            owner_id=item.owner_id,
            original_url=item.original_image_url,
            processed_url=item.image_url,
            category=item.category.value,
            color=item.color,
            created_at=item.created_at,
        )
        for item in items
    ]