# ADR-008: Pagination Strategy – Offset Pagination

## Status
✅ Accepted – Implemented

## Context
The college listing endpoint needed pagination. I initially considered cursor-based pagination but switched to offset-based (`page` + `limit`) after realising it’s simpler for MVP and provides the `total` count needed for UI controls.

## Decision
I used **offset‑based pagination** with `page`, `limit`, `total`, and `totalPages` in the response metadata.

## Why
- Easier for frontend developers to understand and implement.
- Provides `total` count, which is useful for UI pagination controls.
- Offsets work well for datasets up to thousands of records (our size).

## Alternatives Considered
- **Cursor‑based** – more efficient for large datasets, but requires a `cursor` field and careful ordering.
- **Limit/Offset** – simpler, but becomes inefficient for very large datasets.

## Consequences
- The API contract was updated to reflect `page` instead of `cursor`.
- The `meta` object now returns `total`, `page`, `limit`, `totalPages`.

## Date
2026-06-24