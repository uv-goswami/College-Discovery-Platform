# ADR-002: Search Strategy — PostgreSQL pg_trgm + tsvector

---

## Context

The College Discovery Platform requires a search capability over college names,
locations, and potentially course names. The assignment does not mandate a specific
search technology, leaving this as an open engineering decision.

Key constraints:
- Dataset size: ~50–500 colleges for MVP (seed data); potentially thousands at scale
- Search fields: college name, city, state, tags, courses
- Expected behavior: partial matches, minor typo tolerance, relevance ranking
- Infrastructure: preference for minimal external dependencies at MVP stage

## Decision

**We use PostgreSQL with the `pg_trgm` extension combined with `tsvector` columns
and GIN indexes.**

## Alternatives Considered

### Option A: PostgreSQL tsvector/tsquery only
- Native PostgreSQL full-text search
- Good for exact word matching and ranked document search
- **Limitation:** No fuzzy/typo-tolerant matching. "Mumbay" does not find "Mumbai".
  "IIT Bomaby" fails entirely.
- Ranking via `ts_rank` is functional but basic
- **Verdict: Rejected as sole strategy.** Acceptable floor but suboptimal UX.

### Option B: Elasticsearch
- Industry-standard search engine
- Excellent relevance tuning, fuzzy matching, faceted aggregations
- **Problems:**
  - Requires a separate service (additional infrastructure to deploy and maintain)
  - Data sync complexity: writes go to PostgreSQL, must propagate to ES index
  - Introduces eventual consistency between primary store and search index
  - Significantly overengineered for a dataset of < 10,000 colleges
- **Verdict: Rejected.** Complexity cost does not match the problem size.

### Option C: Typesense / Meilisearch
- Modern search engines with excellent DX and fast setup
- Still require a separate service and sync mechanism
- Same fundamental tradeoffs as Elasticsearch at smaller scale
- **Verdict: Rejected.** Same reasoning as Option B.

### Option D: PostgreSQL pg_trgm + tsvector (GIN indexes) ✓
- `pg_trgm`: trigram-based similarity matching. Enables fuzzy search and
  partial-string matching. "Bombay" can match "Mumbai" via learned similarity.
  Handles typos gracefully using similarity threshold tuning.
- `tsvector`: full-text search with relevance ranking via `ts_rank`
- GIN index on both columns: fast index lookups, suitable for concurrent reads
- Zero additional infrastructure — runs inside the existing PostgreSQL instance
- Search logic is fully encapsulated in the repository layer, making a future
  migration to Elasticsearch a clean, isolated swap
- Used in production by companies at scales far exceeding our target dataset
- **Verdict: Accepted.**

## Implementation Notes

```sql
-- Enable extension (run once in migration)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Example on colleges table
ALTER TABLE colleges ADD COLUMN search_vector tsvector;
CREATE INDEX idx_colleges_search ON colleges USING GIN(search_vector);
CREATE INDEX idx_colleges_trgm ON colleges USING GIN(name gin_trgm_ops);

-- search_vector updated via trigger on insert/update
-- Query combines tsvector rank with trigram similarity
```

Search queries will be composed in a dedicated `CollegeSearchRepository`
class, ensuring all search logic is isolated and testable independently.

## Consequences

**Positive:**
- No additional service to deploy, configure, or keep in sync
- Typo-tolerant search without Elasticsearch overhead
- GIN indexes provide fast lookups at MVP-relevant scale
- Isolated in repository layer → clean migration path if scale demands ES later
- Keeps the entire stack on a single PostgreSQL instance (simpler ops, simpler
  transactions, no eventual consistency)

**Negative:**
- `pg_trgm` similarity thresholds require tuning — wrong threshold returns
  too many or too few results
- At very large scale (millions of records), dedicated search engines will outperform
- `tsvector` does not understand semantic meaning (no vector/embedding search)

**Mitigations:**
- Similarity threshold exposed as a configurable constant, not hardcoded
- Repository layer designed against an interface — ES implementation can be
  swapped in without touching service or controller layers
- Semantic/vector search is explicitly out of scope for MVP; noted as future work

## Future Extensibility
If the platform grows beyond ~50,000 colleges or requires semantic search
("colleges known for research"), the repository interface can be re-implemented
against Elasticsearch or pgvector (PostgreSQL vector extension) without
changing any upstream code.

## References
- PostgreSQL pg_trgm docs: https://www.postgresql.org/docs/current/pgtrgm.html
- PostgreSQL Full Text Search: https://www.postgresql.org/docs/current/textsearch.html