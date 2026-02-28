# Cloakroom.ai

Cloakroom.ai is an AI-powered digital closet and outfit planning platform.  
Users can capture clothing photos, convert each item into a clean digital asset, organize their wardrobe, and mix-and-match tops, bottoms, shoes, and accessories before deciding what to wear in real life.

This repository includes:

- `backend/`: FastAPI backend for upload, categorization, closet inventory, and virtual try-on orchestration.
- `ios/`: SwiftUI app scaffold for capture flow, digital closet, styling carousel, and try-on result display.
- `docs/plans.md`: Product and implementation plan.
- `docs/mvp-credentials-setup.md`: Centralized credentials setup for MVP.

## Implemented Features

### Backend

- `POST /api/users/bootstrap`: Create or fetch a demo user.
- `POST /api/upload/`: Upload a clothing image, remove background, auto-categorize, persist item in DB.
- `GET /api/closet/{owner_id}`: Fetch all digitized clothing items for a user.
- `POST /api/tryon/`: Generate a mock or provider-backed try-on result and persist an outfit record.
- `GET /health`: Health check endpoint.

### iOS (SwiftUI)

- Digital closet tab with local SwiftData cache and manual server sync.
- Camera/photo picker flow to upload clothing item to backend.
- Styling tab with swipeable carousels for tops, bottoms, shoes, and accessories.
- Try-on action with loading state and result screen.

## Architecture

- **Frontend**: SwiftUI + SwiftData (local caching).
- **Backend**: FastAPI + SQLAlchemy.
- **Database**: SQLite by default for local/dev (`DATABASE_URL` configurable for PostgreSQL).
- **AI Preprocessing**: `rembg` for background removal, deterministic placeholder categorization.
- **VTON**: mock mode by default; pluggable provider call via `VTON_API_URL`/`VTON_API_KEY`.

## Local Setup

### 1) Backend

```bash
python3 -m pip install -r backend/requirements.txt
```

Create `backend/.env` (optional) to override defaults:

```env
DATABASE_URL=sqlite:///./cloakroom.db
STATIC_BASE_URL=http://localhost:8000
ENABLE_MOCK_VTON=true
VTON_API_URL=https://api.replicate.com/v1/predictions
VTON_API_KEY=
VTON_MODEL_VERSION=
```

Run API:

```bash
cd backend
uvicorn app.main:app --reload
```

### 2) iOS

The SwiftUI source is in `ios/Cloakroom/`.  
Point the app client to backend base URL `http://127.0.0.1:8000` (already set in `APIClient`).

## Testing

### Backend automated tests

```bash
python3 -m pytest backend/tests -q
```

Current suite validates:

- Health endpoint.
- End-to-end flow: bootstrap user -> upload image -> fetch closet -> request try-on.

### iOS verification

There is currently no committed `.xcodeproj`/`.xcworkspace`, so CI-style iOS build/test commands are not runnable from this repository state.

Recommended manual verification once an Xcode project is added:

1. Launch app and open `Closet` tab.
2. Upload item from camera/photo picker.
3. Confirm item appears in closet and in styling carousels.
4. Tap `Try it On` and verify loading state + generated result screen.

## Known Gaps / Next Priorities

- Replace placeholder auto-categorization with trained classifier (ViT/ResNet).
- Add real auth (Apple Sign-In/JWT) and per-user security controls.
- Replace mock VTON with production provider and queue/polling for long jobs.
- Add camera overlay capture guide using `AVFoundation` capture UI.
- Add migrations (Alembic) and production deployment configs.