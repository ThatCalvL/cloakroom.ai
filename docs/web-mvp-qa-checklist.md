# Web MVP QA Checklist

Use this checklist before handing off or demoing the Next.js website frontend.

## Preconditions

- Backend is running at `http://127.0.0.1:8000`
- Backend health endpoint is reachable: `GET /health`
- Web app env is set in `web/.env.local`

## 1) Landing Health Check

- Open `/` in web app.
- Confirm backend health message shows success.
- Confirm navigation links to Upload, Closet, Styling are visible.

## 2) Upload Flow

- Open `/upload`.
- Confirm owner is bootstrapped automatically (owner ID appears).
- Select one clothing image from disk.
- Confirm image preview renders.
- Click Upload and wait for success message.
- Confirm returned metadata includes item id/category/processed URL.

## 3) Closet Flow

- Open `/closet`.
- Confirm uploaded item appears in the grid.
- Test category filter chips (`top`, `bottom`, `shoes`, `accessory`, `outerwear`).
- Confirm refresh button re-fetches data and updates list.

## 4) Styling / Try-On Flow

- Open `/styling`.
- Select at least one available item in dropdowns.
- Click `Generate Try-On`.
- Confirm loading state is shown.
- Confirm success message and generated image are displayed.
- Confirm image open link works in new tab.

## 5) Error Handling

- Stop backend and refresh a page.
- Confirm API/network errors are shown with readable message.
- Restart backend and verify recovery works after refresh.

## 6) Smoke Tests

Run:

```bash
cd web
npm run test
```

Expected:

- API client smoke tests pass.

## 7) MVP Constraints to Remember

- Uses local storage for owner test session.
- Uses existing backend endpoints as-is.
- Try-on output quality/latency depends on backend VTON mode.
