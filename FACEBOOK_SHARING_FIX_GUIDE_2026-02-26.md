# Facebook Sharing Fix Guide (Vendor Panel) — 2026-02-26

## Goal
Stabilize Facebook share behavior so every product share consistently uses the correct product URL, title, and image.

## Symptoms addressed
1. From product list:
   - Modal preview looked correct.
   - Copied/shared link sometimes produced wrong product preview (wrong title/image, poor quality).
2. From product detail:
   - Shared post could have correct title but missing image.

## Root causes found
1. Share URL was built from `product?.handle || ""` in modal runtime state.
   - If handle is not yet available (or not included in partial fields), URL can degrade to generic `/products/` path.
   - Generic path lets Facebook scrape unrelated content and can show wrong product preview.
2. Share actions were enabled even when URL was not ready.
3. Modal relied only on async `useProduct` data, not on already-known product info from parent list/detail row.
4. No per-product share-version marker in URL, increasing chance of Facebook preview cache collisions.

## Implemented fixes

### 1) URL builder hardening
File: `src/lib/facebook-share.ts`

- `buildProductShareUrl` now:
  - returns empty string when handle is missing,
  - trims handle,
  - normalizes storefront URL (removes trailing slash),
  - safely URL-encodes handle path segments,
  - accepts optional `shareVersion` param and appends it as `v=<value>`.

Result: no malformed product URLs, safe handles, optional per-product cache-busting key.

---

### 2) Modal data reliability + action guards
File: `src/routes/products/common/facebook-promote-modal.tsx`

- Added optional props:
  - `initialProductHandle`
  - `initialProductTitle`
  - `initialProductThumbnail`
- Extended `useProduct` fields to explicitly include `title,handle,thumbnail,images.url` plus existing variant/category fields.
- Added resolved fallbacks:
  - `resolvedHandle`, `resolvedTitle`, `resolvedThumbnail`
- Share URL now built from resolved handle + vendor id + product id as version key:
  - `buildProductShareUrl(resolvedHandle, vendorId, productId)`
- Added `canShare` guard:
  - disable share buttons until URL is ready,
  - show clear message when handle is still loading,
  - prevent copy/share actions and show error toast if triggered too early.
- Synced editable caption text when product/captions change.

Result: share operations cannot run on incomplete product state.

---

### 3) Parent-to-modal product context propagation
Files:
- `src/routes/products/product-list/components/product-list-table/product-list-table.tsx`
- `src/routes/products/product-detail/components/product-general-section/product-general-section.tsx`

- Both call sites now pass:
  - `initialProductHandle={product.handle}`
  - `initialProductTitle={product.title}`
  - `initialProductThumbnail={product.thumbnail}`

Result: modal has immediate stable product identity before async fetch completes.

## Why this should fix your reported behavior
1. Wrong product in Facebook preview is typically a wrong/empty shared URL or stale OG scrape target.
   - We now prevent empty-handle URLs and add deterministic per-product key (`v=productId`).
2. Missing image cases often happen when crawler receives a non-product URL or metadata scrape fallback.
   - We now ensure the shared URL is product-specific and only enable sharing when product handle exists.

## Validation checklist (manual)
1. Open product list, share 3 different products quickly:
   - verify generated links differ by handle and `v=` value.
   - verify copied URL always contains `/products/<handle>`.
2. Share from detail page for a product with thumbnail:
   - Facebook preview should show matching title + image.
3. Open modal and instantly click share before load:
   - button should be disabled or show "not ready" message.
4. Use Facebook Sharing Debugger for one sample URL:
   - force scrape and verify `og:title`, `og:image`, `og:url` correspond to product.

## Operational note
If preview is still stale for already-shared links, run Facebook Sharing Debugger "Scrape Again" for that URL.
This is external cache behavior, not app logic.

## Lint/type verification status
Attempted `yarn lint` in `vendor-panel`, but environment returned:
`'eslint' is not recognized as an internal or external command`.
So lint verification could not be completed in this workspace runtime.
