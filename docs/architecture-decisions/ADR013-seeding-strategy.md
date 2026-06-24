# ADR-013: Seeding – Script for Development Data

## Status
Accepted – Implemented

## Context
I needed sample data to test the API during development. The assignment allowed mock/generated datasets, but all data must come from the database.

## Decision
I created a `prisma/seed.ts` script that:
- Cleans existing data (using `deleteMany` in the correct order).
- Creates a test user with a hashed password.
- Creates 10 colleges with realistic data.
- Adds reviews and a saved comparison for testing.

## Why
- **Reproducible** – anyone can run `npx prisma db seed` to get the same dataset.
- **Realistic** – the data mimics real Indian colleges.
- **Consistent** – the seed script ensures the database state is predictable for development and testing.

## Consequences
- The seed script must be updated whenever the schema changes.
- It’s run automatically when setting up the project.

## Date
2026-06-23