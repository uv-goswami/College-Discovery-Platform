# ADR-003: ORM – Prisma

## Status
Accepted – Implemented

## Context
I needed an ORM to interact with PostgreSQL. The options were Prisma, TypeORM, or raw SQL. I wanted something that would make database operations type‑safe and easy to maintain.

## Decision
I chose **Prisma**.

## Why
- **Type‑safe queries** – Prisma generates TypeScript types from the schema, reducing runtime errors.
- **Declarative schema** – I can define models in `schema.prisma` and generate migrations automatically.
- **Prisma Studio** – a built‑in GUI for browsing data, helpful for debugging during development.
- The assignment specifically recommended Prisma with PostgreSQL.

## Alternatives Considered
- **TypeORM** – more complex to configure, and type inference is weaker.
- **Raw SQL** – would have been faster but less maintainable and not type‑safe.

## Consequences
- I had to learn Prisma’s query syntax (e.g., `findMany`, `create`, `include`).
- Migrations must be generated and applied carefully to avoid data loss.

## Date
2026-06-22