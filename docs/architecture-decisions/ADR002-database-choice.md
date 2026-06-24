# ADR-002: Database – PostgreSQL

## Status
Accepted – Implemented

## Context
I needed a relational database to store colleges, courses, reviews, users, and saved items. The data is well‑structured (colleges have courses, reviews, etc.), so a relational database was a natural fit.

## Decision
I chose **PostgreSQL**.

## Why
- PostgreSQL is the most widely used open‑source relational database.
- It supports **JSON columns** (for `SavedComparison.collegeIds`), which simplified storing variable‑length arrays without a junction table.
- It has **extensions** like `pg_trgm` for fuzzy search – essential for college name/typo‑tolerant search.
- The assignment recommended PostgreSQL with Prisma.

## Alternatives Considered
- **SQLite** – too lightweight; not suitable for a production‑grade deployment.
- **MongoDB** – document‑based, but our data is relational (colleges ↔ courses, users ↔ saved items).

## Consequences
- I had to set up a PostgreSQL server locally and on the deployment host.
- Migrations are managed via Prisma, which requires careful schema updates.

## Date
2026-06-22