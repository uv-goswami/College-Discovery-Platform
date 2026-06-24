# ADR-005: Search Strategy – ILIKE First, Fuzzy Fallback with pg_trgm

## Status
✅ Accepted – Implemented

## Context
The College Discovery Platform needed a search feature that is both **precise** (exact matches) and **tolerant** (handles typos and misspellings). Users might search for "Ramanujan" and expect the college with that exact name to appear first, while "Ramanunjan" should still return the correct college.

I had to choose a strategy that balances relevance, performance, and simplicity.

## Decision
I implemented a **two‑stage search**:

1. **First stage: ILIKE** (case‑insensitive substring) using Prisma’s `contains` with `mode: 'insensitive'`.  
   - Returns results where the search term appears anywhere in `name`, `city`, or `state`.
   - Sorted alphabetically by `name`.
   - This ensures exact/partial matches are returned first.

2. **Second stage: Fuzzy search** using PostgreSQL’s `pg_trgm` extension (trigram similarity), **only if ILIKE returns no results**.  
   - Uses `similarity()` with a threshold of `0.15`.
   - Searches across `name`, `city`, and `state`.
   - Results are ordered by the highest similarity score.

3. **No search term** – uses a simpler query without any search condition (just filters and pagination).

## Why
- **Exact matches are most relevant** – users expect that searching for a college name returns that college immediately, not a list of loosely related matches.
- **ILIKE is fast and simple** – it works well for small to medium datasets (up to thousands of records).
- **Fuzzy search acts as a fallback** – it handles typos and misspellings without polluting the results when exact matches exist.
- **Performance** – fuzzy search is only executed when needed, reducing overhead.

## Alternatives Considered
- **Fuzzy search only (pg_trgm)** – would return more results, but the ordering might not prioritise exact matches. Users could see less relevant results first.
- **Full‑text search (tsvector)** – good for natural language but doesn't handle typos natively.
- **Elasticsearch/Meilisearch** – excellent relevance and typo tolerance, but require a separate service and sync logic. Overkill for MVP.

## Consequences
- Requires the `pg_trgm` extension and GIN indexes on `name`, `city`, and `state` for good performance.
- The ILIKE path uses Prisma’s built‑in `contains`, which is index‑friendly (B‑tree or trigram indexes can speed it up).
- The fallback path adds some complexity, but it is isolated and only runs when no ILIKE results are found.
- Search results are predictable: users get the most relevant (exact) matches first, and typos are still handled.

## Implementation Notes
- The `SIMILARITY_THRESHOLD` is set to `0.15` based on testing with college names (e.g., "Ramanujan" vs "Ramanujan College, University of Delhi" gave 0.263).
- The raw SQL for fuzzy search uses `public."College"` (quoted) to preserve the table name case.
- The `minRating` filter is still applied in memory, as it is computed from reviews after fetching.

## Date
2026-06-24