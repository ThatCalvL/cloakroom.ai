import io

import pillow_heif
from PIL import Image, UnidentifiedImageError
from rembg import remove

# Register HEIF/HEIC opener so uploads from Apple devices decode correctly.
pillow_heif.register_heif_opener()


class InvalidImageError(ValueError):
    """Raised when uploaded bytes are not a supported image format."""


def remove_background(image_bytes: bytes) -> bytes:
    """
    Takes an image in bytes, removes the background using rembg,
    and returns the processed image as bytes (PNG format).
    """
    try:
        input_image = Image.open(io.BytesIO(image_bytes))
        input_image.load()
    except UnidentifiedImageError as exc:
        raise InvalidImageError(
            "Unsupported image format. Please upload a valid JPG, PNG, or WEBP file."
        ) from exc

    try:
        output_image = remove(input_image)
    except Exception:
        # Fallback path for environments where rembg dependencies are unavailable.
        output_image = input_image.convert("RGBA")

    img_byte_arr = io.BytesIO()
    output_image.save(img_byte_arr, format="PNG")
    return img_byte_arr.getvalue()

def auto_categorize(image_bytes: bytes) -> str:
    """
    Placeholder for an ML-based categorization model (e.g., ViT or ResNet).
    For MVP, use deterministic hashing for stable outputs in tests.
    """
    categories = ["top", "bottom", "outerwear", "shoes", "accessory"]
    return categories[hash(image_bytes) % len(categories)]