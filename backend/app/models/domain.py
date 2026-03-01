from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class CategoryEnum(enum.Enum):
    TOP = "top"
    BOTTOM = "bottom"
    OUTERWEAR = "outerwear"
    SHOES = "shoes"
    ACCESSORY = "accessory"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=False)
    avatar_image_url = Column(String, nullable=True)  # The base photo for VTON
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    clothing_items = relationship("ClothingItem", back_populates="owner", cascade="all, delete-orphan")
    outfits = relationship("Outfit", back_populates="owner", cascade="all, delete-orphan")


class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=True)
    image_url = Column(String, nullable=False)  # Processed transparent image
    original_image_url = Column(String, nullable=True)
    category = Column(Enum(CategoryEnum), nullable=False)
    color = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="clothing_items")
    photos = relationship(
        "ClothingItemPhoto",
        back_populates="item",
        cascade="all, delete-orphan",
        order_by="ClothingItemPhoto.created_at",
    )
    outfit_tops = relationship("Outfit", foreign_keys="Outfit.top_id", back_populates="top")
    outfit_bottoms = relationship("Outfit", foreign_keys="Outfit.bottom_id", back_populates="bottom")
    outfit_shoes = relationship("Outfit", foreign_keys="Outfit.shoes_id", back_populates="shoes")
    outfit_accessories = relationship("Outfit", foreign_keys="Outfit.accessory_id", back_populates="accessory")


class ClothingItemPhoto(Base):
    __tablename__ = "clothing_item_photos"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("clothing_items.id"), nullable=False)
    image_url = Column(String, nullable=False)
    original_image_url = Column(String, nullable=True)
    angle_label = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    item = relationship("ClothingItem", back_populates="photos")


class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    top_id = Column(Integer, ForeignKey("clothing_items.id"), nullable=True)
    bottom_id = Column(Integer, ForeignKey("clothing_items.id"), nullable=True)
    shoes_id = Column(Integer, ForeignKey("clothing_items.id"), nullable=True)
    accessory_id = Column(Integer, ForeignKey("clothing_items.id"), nullable=True)
    generated_image_url = Column(String, nullable=True)  # VTON result
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="outfits")
    top = relationship("ClothingItem", foreign_keys=[top_id], back_populates="outfit_tops")
    bottom = relationship("ClothingItem", foreign_keys=[bottom_id], back_populates="outfit_bottoms")
    shoes = relationship("ClothingItem", foreign_keys=[shoes_id], back_populates="outfit_shoes")
    accessory = relationship("ClothingItem", foreign_keys=[accessory_id], back_populates="outfit_accessories")
