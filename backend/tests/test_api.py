import io
import os
import sys
from pathlib import Path
from PIL import Image
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite:///./test_cloakroom.db"
os.environ["ENABLE_MOCK_VTON"] = "true"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app  # noqa: E402


client = TestClient(app)


def _sample_image_bytes() -> bytes:
    image = Image.new("RGB", (120, 200), color=(200, 80, 120))
    stream = io.BytesIO()
    image.save(stream, format="JPEG")
    return stream.getvalue()


def test_healthcheck():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_bootstrap_upload_closet_tryon_flow():
    bootstrap = client.post(
        "/api/users/bootstrap",
        json={
            "email": "demo@cloakroom.ai",
            "full_name": "Demo User",
            "avatar_image_url": "https://via.placeholder.com/400x600.png?text=Avatar",
        },
    )
    assert bootstrap.status_code == 200
    user = bootstrap.json()
    user_id = user["id"]

    image_bytes = _sample_image_bytes()
    upload = client.post(
        "/api/upload/",
        data={"owner_id": str(user_id)},
        files={"file": ("item.jpg", image_bytes, "image/jpeg")},
    )
    assert upload.status_code == 200, upload.text
    upload_payload = upload.json()
    item = upload_payload["item"]
    assert item["owner_id"] == user_id
    assert item["processed_url"].startswith("/static/")
    assert item["category"] in {"top", "bottom", "outerwear", "shoes", "accessory"}

    closet = client.get(f"/api/closet/{user_id}")
    assert closet.status_code == 200
    closet_items = closet.json()
    assert len(closet_items) >= 1

    tryon = client.post(
        "/api/tryon/",
        json={
            "user_id": user_id,
            "top_id": item["id"],
        },
    )
    assert tryon.status_code == 200, tryon.text
    tryon_payload = tryon.json()
    assert tryon_payload["outfit_id"] >= 1
    assert tryon_payload["generated_image_url"].startswith("http")
