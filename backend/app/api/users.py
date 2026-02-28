from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import User
from app.schemas import UserBootstrapRequest, UserResponse

router = APIRouter()


@router.post("/users/bootstrap", response_model=UserResponse)
def bootstrap_user(payload: UserBootstrapRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        return existing

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        avatar_image_url=payload.avatar_image_url,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user
