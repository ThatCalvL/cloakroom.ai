# Cloakroom.ai MVP Credentials Setup Guide

This guide shows exactly where to store credentials for the MVP, what values are required, and where to get each credential.

## 1) Single centralized credentials file

For this MVP codebase, keep all runtime credentials in one file:

- `backend/.env`

The backend already loads environment variables from `.env` (see `backend/app/core/config.py`), so this is the one place to update for database, AI endpoint, and API keys.

## 2) Fast path (minimum needed to run locally)

If you just want the app running locally (no cloud services yet), you can use mock mode and local SQLite.

### Step 1: Create the env file

From project root:

```bash
cp backend/.env.example backend/.env
```

### Step 2: Use local MVP values

Set these in `backend/.env`:

```env
PROJECT_NAME=Cloakroom.ai API
DATABASE_URL=sqlite:///./cloakroom.db
STATIC_BASE_URL=http://127.0.0.1:8000
CORS_ALLOW_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ENABLE_MOCK_VTON=true
VTON_API_URL=https://api.replicate.com/v1/predictions
VTON_API_KEY=
VTON_MODEL_VERSION=replace-with-provider-model-version
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=cloakroom-assets
```

In this local mode:

- No paid AI key is required.
- No cloud database is required.
- No AWS key is required.

## 3) What each credential is for

- `DATABASE_URL`: SQL database connection string.
- `STATIC_BASE_URL`: Public base URL used to build image URLs (must match your running backend URL).
- `CORS_ALLOW_ORIGINS`: Comma-separated web origins allowed to call backend APIs from browser.
- `ENABLE_MOCK_VTON`: `true` means fake try-on image is returned (fast MVP mode).
- `VTON_API_URL`: VTON provider endpoint.
- `VTON_API_KEY`: Bearer token for VTON provider.
- `VTON_MODEL_VERSION`: provider model identifier/version.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`: storage credentials (reserved for cloud asset storage flow).

## 4) Where to get real credentials (when you leave mock mode)

Use this section when you set `ENABLE_MOCK_VTON=false`.

### A) Database credentials (`DATABASE_URL`)

You can get PostgreSQL credentials from:

- **Neon**: create project -> copy connection string
- **Supabase**: Project Settings -> Database -> Connection string
- **Railway**: PostgreSQL service -> Connect tab -> URI
- **Render**: PostgreSQL instance -> Internal/External Database URL

Format example:

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:5432/DB_NAME
```

### B) VTON API credentials (`VTON_API_URL`, `VTON_API_KEY`, `VTON_MODEL_VERSION`)

If you use Replicate for VTON:

1. Create account at `https://replicate.com`
2. Open API Tokens page and create token
3. Put token into `VTON_API_KEY`
4. Set `VTON_API_URL=https://api.replicate.com/v1/predictions`
5. Copy your selected model version hash into `VTON_MODEL_VERSION`
6. Set `https://api.replicate.com/v1/predictions`

If you use RunPod/Modal/Baseten:

- Use that provider's prediction endpoint URL for `VTON_API_URL`
- Use that provider API key for `VTON_API_KEY`
- Put deployed model/version ID in `VTON_MODEL_VERSION`

### C) Storage credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`)

If you move uploads to S3:

1. Create AWS account
2. Create S3 bucket (for example `cloakroom-assets`)
3. Create IAM user with programmatic access
4. Attach minimal S3 policy for that bucket only
5. Copy access key ID + secret access key into `.env`

## 5) Recommended credential profiles for MVP

### Profile 1: Local demo (recommended first run)

```env
DATABASE_URL=sqlite:///./cloakroom.db
ENABLE_MOCK_VTON=true
```

### Profile 2: Real DB + mock AI

```env
DATABASE_URL=postgresql://...
ENABLE_MOCK_VTON=true
```

### Profile 3: Real DB + real VTON

```env
DATABASE_URL=postgresql://...
ENABLE_MOCK_VTON=false
VTON_API_URL=...
VTON_API_KEY=...
VTON_MODEL_VERSION=...
```

## 6) Run steps with centralized config

1. Update `backend/.env`
2. Start backend:

```bash
cd backend
uvicorn app.main:app --reload
```

3. Verify health:

```bash
curl http://127.0.0.1:8000/health
```

4. Run backend tests:

```bash
cd ..
python3 -m pytest backend/tests -q
```

## 7) iOS app credentials note

For this MVP, iOS does not require cloud secret keys directly. Keep secrets on backend only.

Only non-secret backend URL is needed on iOS:

- `ios/Cloakroom/Services/APIClient.swift` -> `baseURL`

For simulator use:

- `http://127.0.0.1:8000` (if backend runs on same machine)

## 8) Security checklist (important even for MVP)

- Never commit `backend/.env` to git.
- Rotate leaked keys immediately.
- Use least-privilege IAM permissions.
- Keep production and development credentials separate.
- Prefer backend-managed secrets only; do not ship private keys in iOS app binaries.
