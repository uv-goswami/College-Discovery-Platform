# Database Design

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
| updated_at | DateTime | auto-updated       |

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

### colleges
Core entity. Placements data is embedded as columns (one-to-one,
never queried independently).

| Column          | Type     | Constraints     |
|-----------------|----------|-----------------|
| id              | String   | PK, CUID        |
| name            | String   | NOT NULL        |
| about           | String   |                 |
| city            | String   | NOT NULL        |
| state           | String   | NOT NULL        |
| type            | Enum     | PUBLIC/PRIVATE/DEEMED |
| annual_fees     | Int      | NOT NULL (INR)  |
| logo_url        | String?  |                 |
| website         | String?  |                 |
| established     | Int      |                 |
| avg_package     | Int      | NOT NULL (INR)  |
| highest_package | Int      | NOT NULL (INR)  |
| placement_rate  | Float    | 0.0 to 100.0    |
| search_vector   | tsvector | GIN indexed     |
| created_at      | DateTime | DEFAULT now()   |
| updated_at      | DateTime | auto-updated    |

Indexes:
- GIN on `search_vector`
- GIN trigram on `name`
- B-tree on `state`, `city`, `annual_fees`

Rating is computed at query time via AVG(reviews.rating).
Not stored — avoids sync complexity for MVP.

### courses
Courses offered by a college.

| Column         | Type   | Constraints              |
|----------------|--------|--------------------------|
| id             | String | PK, CUID                 |
| college_id     | String | FK → colleges.id CASCADE |
| name           | String | NOT NULL                 |
| degree         | String | NOT NULL                 |
| duration_years | Int    |                          |
| annual_fees    | Int    |                          |
| created_at     | DateTime |                        |

Index: `college_id`

### reviews
College reviews. Anonymous in MVP — no user_id.

| Column     | Type     | Constraints              |
|------------|----------|--------------------------|
| id         | String   | PK, CUID                 |
| college_id | String   | FK → colleges.id CASCADE |
| rating     | Float    | 1.0 to 5.0               |
| comment    | String   |                          |
| created_at | DateTime | DEFAULT now()            |

Indexes: `college_id`, composite `(college_id, created_at DESC)`

### saved_colleges
User's saved colleges. Unique per user-college pair.

| Column     | Type     | Constraints              |
|------------|----------|--------------------------|
| id         | String   | PK, CUID                 |
| user_id    | String   | FK → users.id CASCADE    |
| college_id | String   | FK → colleges.id CASCADE |
| created_at | DateTime | DEFAULT now()            |

Unique constraint: `(user_id, college_id)`
Index: `user_id`

## Relationships
- users → refresh_tokens: one-to-many
- users → saved_colleges: one-to-many
- colleges → saved_colleges: one-to-many
- colleges → courses: one-to-many
- colleges → reviews: one-to-many

## Key Decisions
- Placements embedded on colleges — one-to-one with no independent queries
- Rating computed via AVG aggregate — not stored
- Refresh tokens stored as hash — raw token never persisted
- Reviews anonymous in MVP — user_id added as nullable FK when needed
- All monetary values in INR as integers — no float precision issues
- CUID for all primary keys