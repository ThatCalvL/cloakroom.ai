from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from fastapi import Depends
from app.services.vton_service import generate_vton_image
from app.database import get_db
from app.models.domain import User, ClothingItem, Outfit
from app.schemas import TryOnRequest, TryOnResponse
from app.core.config import settings

router = APIRouter()

@router.post("/tryon/", response_model=TryOnResponse)
async def create_tryon(request: TryOnRequest, db: Session = Depends(get_db)):
    if not request.top_id and not request.bottom_id and not request.shoes_id and not request.accessory_id:
        raise HTTPException(status_code=400, detail="Must provide at least one garment to try on.")

    user = db.get(User, request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    garment_id = request.top_id or request.bottom_id or request.shoes_id or request.accessory_id
    garment = db.get(ClothingItem, garment_id) if garment_id else None
    if not garment or garment.owner_id != request.user_id:
        raise HTTPException(status_code=404, detail="Selected clothing item not found for user.")

    avatar_url = user.avatar_image_url or "https://via.placeholder.com/400x600.png?text=Avatar"
    garment_url = f"{settings.STATIC_BASE_URL}{garment.image_url}"

    try:
        result_url = await generate_vton_image(
            user_avatar_url=avatar_url,
            garment_url=garment_url,
            category="upper_body"
        )

        outfit = Outfit(
            owner_id=request.user_id,
            top_id=request.top_id,
            bottom_id=request.bottom_id,
            shoes_id=request.shoes_id,
            accessory_id=request.accessory_id,
            generated_image_url=result_url,
        )
        db.add(outfit)
        db.commit()
        db.refresh(outfit)

        return TryOnResponse(
            outfit_id=outfit.id,
            generated_image_url=result_url,
            message="Try-on generated successfully",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VTON Generation failed: {str(e)}")
