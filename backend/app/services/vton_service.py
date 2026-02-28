import asyncio
import httpx
from app.core.config import settings


async def generate_vton_image(user_avatar_url: str, garment_url: str, category: str) -> str:
    """
    Calls a serverless GPU provider (e.g., Replicate) to run a VTON model (like IDM-VTON).
    For MVP, we simulate a delay and return a dummy result URL.
    """
    
    if settings.ENABLE_MOCK_VTON:
        # Simulated delay for model generation (5-10 seconds in reality, we use 2 for MVP testing)
        await asyncio.sleep(2)
        return "https://via.placeholder.com/400x600.png?text=VTON+Result"

    if not settings.VTON_API_KEY:
        raise RuntimeError("VTON_API_KEY is required when ENABLE_MOCK_VTON is false.")

    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(
            settings.VTON_API_URL,
            headers={"Authorization": f"Bearer {settings.VTON_API_KEY}"},
            json={
                "version": settings.VTON_MODEL_VERSION,
                "input": {
                    "human_image": user_avatar_url,
                    "garm_image": garment_url,
                    "category": category,
                    "garment_des": "a piece of clothing",
                },
            },
        )
        response.raise_for_status()
        payload = response.json()

    output = payload.get("output")
    if isinstance(output, str):
        return output
    if isinstance(output, list) and output:
        return str(output[-1])
    raise RuntimeError("Unexpected VTON provider response payload.")
