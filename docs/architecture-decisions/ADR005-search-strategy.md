# ADR-005: Search Strategy – PostgreSQL `pg_trgm`

## Status
Accepted – Implemented

## Context
The assignment required a searchable college listing. I needed a way to handle typos and partial matches (e.g., "Mumbay" should still find "Mumbai").

## Decision
I used PostgreSQL’s `pg_trgm` extension with trigram similarity and Prisma’s `contains`/`mode: insensitive` for now.

## Why
- **Zero additional infrastructure** – runs inside the existing PostgreSQL instance.
- `pg_trgm` provides trigram‑based fuzzy matching – handles typos and partial strings.
- Easy to implement – Prisma supports `contains` with `mode: insensitive` out of the box.
- For a dataset under 10,000 records, it’s sufficient.

## Alternatives Considered
- **Elasticsearch / Meilisearch** – excellent relevance, but require a separate service and introduce sync complexity.
- **Full‑text `tsvector` only** – no fuzzy matching; “Mumbay” would not find “Mumbai”.

## Consequences
- The search is not as advanced as Elasticsearch, but it’s good enough for MVP.
- We might add `search_vector` later if needed.

## Date
2026-06-22