# ADR-002: Search Strategy — PostgreSQL pg_trgm + tsvector

## Decision
Use PostgreSQL `pg_trgm` extension combined with `tsvector` columns and GIN indexes.

## Reasons
- `pg_trgm` provides trigram-based fuzzy matching — handles typos and partial strings
- `tsvector` provides ranked full-text search
- Zero additional infrastructure — runs inside the existing PostgreSQL instance
- Search logic isolated in the repository layer; clean migration path to
  Elasticsearch if scale demands it later

## Alternatives Considered
**Elasticsearch / Meilisearch / Typesense** — excellent relevance and fuzzy search,
but require a separate service, data sync, and introduce eventual consistency.
Unjustified for a dataset under 10,000 records.

**tsvector only** — no fuzzy matching; "Mumbay" does not find "Mumbai".

## Consequences
- Similarity threshold requires tuning; exposed as a configurable constant
- At very large scale (millions of records), a dedicated search engine will outperform
- No semantic/vector search — acceptable for MVP scope