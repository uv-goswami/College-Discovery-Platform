# Database Design

This document describes the database schema for the College Discovery Platform backend.  
All tables are managed via Prisma and PostgreSQL.

---

## Tables

### users
Stores registered user accounts.

| Column     | Type     | Constraints        |
|------------|----------|--------------------|
| id         | String   | PK, CUID           |
| name       | String   |                    |
| email      | String   | UNIQUE, NOT NULL   |
| password   | String   | NOT NULL (hashed)  |
| created_at | DateTime | DEFAULT now()      |
| updated_at | DateTime | auto‑updated       |

### refresh_tokens
Stores hashed refresh tokens for rotation and logout.

| Column     | Type     | Constraints              |
|------------|----------|--------------------------|
| id         | String   | PK, CUID                 |
| token_hash | String   | UNIQUE, NOT NULL         |
| user_id    | String   | FK → users.id CASCADE    |
| expires_at | DateTime | NOT NULL                 |
| created_at | DateTime | DEFAULT now()            |

Indexes: `token_hash` (lookup), `user_id` (cascade queries)

### College
Core entity. Placements data is embedded as columns (one‑to‑one, never queried independently).  
The actual table name in PostgreSQL is `"College"` (capitalised) because Prisma uses the model name by default.

| Column          | Type     | Constraints                 |
|-----------------|----------|-----------------------------|
| id              | String   | PK, CUID                    |
| name            | String   | NOT NULL                    |
| about           | String   |                             |
| city            | String   | NOT NULL                    |
| state           | String   | NOT NULL                    |
| type            | Enum     | `PUBLIC`, `PRIVATE`, `DEEMED` |
| annual_fees     | Int      | NOT NULL (INR)              |
| logo_url        | String?  |                             |
| website         | String?  |                             |
| established     | Int      |                             |
| avg_package     | Int      | NOT NULL (INR)              |
| highest_package | Int      | NOT NULL (INR)              |
| placement_rate  | Float    | 0.0 to 100.0                |
| search_vector   | tsvector | (optional) for full‑text search |
| created_at      | DateTime | DEFAULT now()               |
| updated_at      | DateTime | auto‑updated                |

**Indexes** (added for performance):
- GIN index on `search_vector` (if used)
- GIN trigram indexes on `name`, `city`, `state` (for fuzzy search with `pg_trgm`)
- B‑tree index on `state`, `city`, `annual_fees` (for exact filters)

**Rating**: computed at query time via `AVG(reviews.rating)`. Not stored — avoids sync complexity for MVP.

### Course
Courses offered by a college.

| Column         | Type   | Constraints                 |
|----------------|--------|-----------------------------|
| id             | String | PK, CUID                    |
| college_id     | String | FK → `"College"`.id CASCADE |
| name           | String | NOT NULL                    |
| degree         | String | NOT NULL                    |
| duration_years | Int    |                             |
| annual_fees    | Int    |                             |
| created_at     | DateTime | DEFAULT now()              |

Index: `college_id`

### Review
College reviews. Anonymous in MVP — no `user_id`.

| Column     | Type     | Constraints                 |
|------------|----------|-----------------------------|
| id         | String   | PK, CUID                    |
| college_id | String   | FK → `"College"`.id CASCADE |
| rating     | Float    | 1.0 to 5.0                  |
| comment    | String   |                             |
| created_at | DateTime | DEFAULT now()               |

Indexes: `college_id`, composite `(college_id, created_at DESC)`

### saved_college
User's saved colleges. Unique per user‑college pair.

| Column     | Type     | Constraints                 |
|------------|----------|-----------------------------|
| id         | String   | PK, CUID                    |
| user_id    | String   | FK → users.id CASCADE       |
| college_id | String   | FK → `"College"`.id CASCADE |
| created_at | DateTime | DEFAULT now()               |

Unique constraint: `(user_id, college_id)`  
Index: `user_id`

### saved_comparison
User's saved comparisons (each stores 2–3 college IDs as a JSON array).

| Column      | Type     | Constraints                 |
|-------------|----------|-----------------------------|
| id          | String   | PK, CUID                    |
| user_id     | String   | FK → users.id CASCADE       |
| college_ids | JSON     | NOT NULL (array of college IDs) |
| created_at  | DateTime | DEFAULT now()               |

Index: `user_id`  
Constraint: array length between 2 and 3 is enforced at the application layer.  
**Note**: No FK constraint on individual `college_ids` for simplicity; existence is validated in the application code.

---

## Relationships

- `users` → `refresh_tokens`: one‑to‑many
- `users` → `saved_college`: one‑to‑many
- `users` → `saved_comparison`: one‑to‑many
- `"College"` → `saved_college`: one‑to‑many
- `"College"` → `Course`: one‑to‑many
- `"College"` → `Review`: one‑to‑many

---

## Key Decisions

- **Placements embedded** – placements are a one‑to‑one relationship with a college and are never queried independently, so they are stored as columns in the `College` table.
- **Rating computed on the fly** – average rating is calculated via `AVG(reviews.rating)` at query time. This avoids the complexity of keeping a denormalised column in sync.
- **Refresh tokens stored as hash** – the raw refresh token is never persisted; only a bcrypt hash is stored, and rotation is implemented by deleting the old token and creating a new one.
- **Reviews are anonymous** – in the MVP, reviews do not require a `user_id`; this can be added later if needed.
- **All monetary values are integers** – fees and packages are stored in INR as integers to avoid floating‑point precision issues.
- **Primary keys are CUIDs** – CUIDs are used instead of UUIDs for better performance and readability.
- **Saved comparisons use JSON** – because each comparison contains a variable‑length list (2–3 IDs), storing them as a JSON array avoids the need for a junction table, simplifying the schema.

---

## Search Indexes

To support both **ILIKE (exact/substring)** and **fuzzy (pg_trgm)** search, the following GIN indexes have been created:

```sql
CREATE INDEX IF NOT EXISTS colleges_name_trgm_idx ON "College" USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS colleges_city_trgm_idx ON "College" USING gin (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS colleges_state_trgm_idx ON "College" USING gin (state gin_trgm_ops);
```

These indexes speed up trigram‑based similarity queries used in the fallback fuzzy search path.
