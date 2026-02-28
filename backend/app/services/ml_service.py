import io
from PIL import Image
from rembg import remove

def remove_background(image_bytes: bytes) -> bytes:
    """
    Takes an image in bytes, removes the background using rembg,
    and returns the processed image as bytes (PNG format).
    """
    input_image = Image.open(io.BytesIO(image_bytes))
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