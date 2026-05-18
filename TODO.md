## Vercel 404 NOT_FOUND fix (SSR catch-all)

- [x] Inspected TanStack Start + Vercel custom output setup (`vercel.json`, `scripts/vercel-build.mjs`).
- [x] Determined 404 was caused by Vercel routing non-API requests to the static `index.html` rather than SSR handler.
- [x] Updated `scripts/vercel-build.mjs` to generate `.vercel/output/config.json` so:
  - `/api/*` -> `/api/server.js`
  - static assets -> served directly
  - all other routes -> `/api/server.js`
- [ ] Redeploy and verify:
  - `GET /` returns the landing page (not `404 NOT_FOUND`)
  - `GET /login` returns login page
  - `GET /dashboard` returns expected auth behavior
- [ ] If still 404, next checks:
  - verify Vercel is using the generated `.vercel/output/config.json` (not overridden)
  - verify SSR function entry exists at `.vercel/output/functions/api/server.js`
  - ensure the function is actually executed (add temporary logging headers/body)

