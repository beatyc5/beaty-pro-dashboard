# Beaty Pro Dashboard — iPad Landscape & Preview PDF Checklist

This document is a step-by-step playbook to resume iPad landscape tweaks and fix Ship Drawings PDF loading in Vercel Preview when we’re ready.

Last updated: 2025-08-11

---

## 1) Current Status Snapshot
- __Auth/Nav__: Stable in prod and preview. Singleton Supabase client, no duplicate GoTrue warnings locally; production instrumentation present.
- __iPad Landscape__: Not shipped. Only minor responsive tweaks landed. Card/PWA views postponed.
- __Ship Drawings PDFs in Preview__: 404 from static `/pdfs/*` in some preview builds. API fallback added but may require GitHub access.
- __Production PDFs__: Work as expected (served from `public/pdfs/…`).

Key files:
- `src/app/ship-drawings/page.tsx` — viewer page, iOS PDF.js tweaks, `?debug=1` panel
- `src/pages/api/pdf.ts` — proxy to static `/pdfs` with fallbacks
- `src/pages/api/pdf-list.ts` — lists available PDFs from `public/pdfs` and `public/pdfs/cabin`
- `public/pdfs/.vercel-keep` — keeps PDFs included in builds

---

## 2) How to Reproduce Issues (Preview)
1. Deploy a Vercel preview build.
2. Open `/ship-drawings?debug=1`.
3. Use the top debug panel:
   - Observe `list_ok` vs `list_err` from `/api/pdf-list`.
   - Click a filename button (e.g., `DK_04.pdf`) to test load.
   - Watch lines: `select`, `probe`, `fetch` or `fetch_err`, `load_err`.
4. If you see 404 errors and `Available WiFi PDFs` shows “None,” preview static assets likely didn’t include the PDFs.

---

## 3) Preview PDF Strategy (Serverless Safe)
`/api/pdf` tries in order:
1. Static `/pdfs/...` on the same preview (for Range support).
2. GitHub Raw at the current commit (`VERCEL_GIT_COMMIT_SHA`).
3. GitHub Contents API (requires `GITHUB_TOKEN` for private repos; optional for public to avoid rate limit).

What you need if static is missing:
- Option A (recommended): add `GITHUB_TOKEN` to Vercel (Preview env). Minimal scope: read repo contents.
- Option B: make repo/files public so Raw works without token.
- Option C: host PDFs in a public Supabase bucket and update `/api/pdf` to stream from there.

Verification:
- Hit `/api/pdf?name=DK_04.pdf&scope=wifi` directly in the preview to confirm it returns `200` and `Content-Type: application/pdf`.

---

## 4) iPad Safari Testing Checklist
- __Device__: iPad, iPadOS current; Safari, Private mode off.
- __URL__: Production first, then Preview.
- __Login__: Confirm sign-in works; no dashboard flash before auth.
- __Ship Drawings__: 
  - Load `/ship-drawings?debug=1`.
  - Select `WiFi Public` and a deck (e.g., `DK_04.pdf`).
  - Observe: pages render, pinch/zoom works, panning buttons work, no infinite spinner.
  - Scroll across multiple pages without white screen or errors.
- __Console (if possible via Remote Debug)__: No repeated “Multiple GoTrueClient instances” warnings.

---

## 5) Landscape Responsive Tweaks (Option A scope)
When ready to ship minimal iPad landscape support (no card view/PWA):

- __Nav/Sidebar__
  - Ensure left filters panel in `ship-drawings` collapses below 1024px width.
  - Keep a sticky header with title and zoom controls.

- __Tables__: `public-cable-list`, `cabin-cable-list`, `remarks`
  - Preserve header + filters visible when results=0 (already done for Public list).
  - Ensure DK filter uses exact match, case-insensitive (already implemented).
  - Verify horizontal scrolling performance on iPad.

- __Touch Targets__
  - Increase button hit areas (min 40x40 points) for zoom and pagination.

- __Typography__
  - Reduce small text to at least 14px for readability.

- __QA Checklist__
  - iPad landscape view at 1024x768 and 1366x1024.
  - No clipped controls. No content overflow behind the footer.

---

## 6) Ship Drawings PDF.js Notes (iOS)
- We use `arrayBuffer` fetch first, then PDF.js `getDocument({ data })` for iOS reliability.
- We set `disableStream/disableRange/disableAutoFetch` for stability.
- We probe with a GET Range `bytes=0-0` (some CDNs fail HEAD on iOS).
- Debug info: visible via `?debug=1` at the top of the page.

If PDFs still fail:
- Confirm `/api/pdf-list` returns the expected filenames.
- If listed but load fails: check `/api/pdf` path, headers, 206 support, CORS, and fallback chain.

---

## 7) Align Dropdowns With Real Files
- Compare deck dropdown options in `src/app/ship-drawings/page.tsx` with `/api/pdf-list` output.
- Update option arrays to match actual filenames (case-sensitive) if mismatches are found.
- Commit and redeploy; re-test `/ship-drawings?debug=1`.

---

## 8) Env Vars and Build Flags
- `NEXT_PUBLIC_BUILD_ID` — injected in `next.config.ts` for runtime trace.
- `GITHUB_TOKEN` (Preview) — enables `/api/pdf` GitHub fallback on private repos.
- `VERCEL_GIT_COMMIT_SHA` — used to fetch Raw at the exact build commit.

---

## 9) Deployment Steps
1. Create a branch: `feature/ipad-landscape-tweaks`.
2. Land responsive tweaks and/or PDF fixes.
3. Push → Vercel Preview builds.
4. Validate on iPad (see checklist above).
5. Merge to main → Production deploy.

Rollback: revert PR or redeploy a previous build in Vercel.

---

## 10) Quick Commands
- Test API locally: `curl -I http://localhost:3000/api/pdf?name=DK_04.pdf&scope=wifi`
- List PDFs locally: `curl http://localhost:3000/api/pdf-list`

---

## 11) Open TODOs For Future Work
- [ ] Decide on preview fallback: GitHub token vs public assets vs Supabase bucket.
- [ ] Align Ship Drawings dropdown options with `/api/pdf-list` in preview.
- [ ] Ship minimal landscape tweaks (Option A scope above).
- [ ] Optional: Card view or PWA (if desired later).

---

## 12) Reference Endpoints
- `GET /api/pdf?name=<file.pdf>&scope=wifi|cabin`
- `GET /api/pdf-list`
- `GET /ship-drawings?debug=1`

If you need help resuming this work, follow this doc top-to-bottom, and ping me with any preview URLs and `?debug=1` logs.
