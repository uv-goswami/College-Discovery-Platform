# ADR-019: Prisma Adapter – Keep for Consistent Connection Pooling

## Status
Accepted – Implemented

## Context
When setting up Prisma, I had two options: use the standard `PrismaClient` (which reads `DATABASE_URL` directly) or use the `@prisma/adapter-pg` with `pg` to manage the connection pool explicitly. The seed script initially failed with the standard client, but started working when I added the adapter.

## Decision
I decided to **keep the adapter** and use it consistently across both the NestJS application and the seed script.

## Why
- **It worked** – the seed script ran successfully with the adapter, so I didn’t want to risk breaking it.
- **Consistent connection management** – the same pool is used for both the app and the seed, avoiding mismatches.
- **Future flexibility** – the adapter allows custom pooling configurations if needed later.
- **Removed the `as any` cast** – by adding `previewFeatures = ["driverAdapters"]` to `schema.prisma`, TypeScript no longer complains.

## How We Made It Work
1. Added `previewFeatures = ["driverAdapters"]` to the `generator client` block in `prisma/schema.prisma`.
2. Re‑generated the Prisma client.
3. Created the `pool` and `adapter` in both `PrismaService` and `seed.ts`, then passed the adapter to `PrismaClient`.
4. Removed the `as any` cast – the types now match correctly.

## Alternatives Considered
- **Removing the adapter** – would have required reverting to the standard client and possibly re‑debugging seed issues.
- **Using the adapter only in the seed** – inconsistent, would have created two different connection paths.

## Consequences
- We keep the `pg` and `@prisma/adapter-pg` packages in `package.json`.
- The code is consistent and works reliably.
- The seed script runs without TypeScript errors.

## Date
2026-06-24