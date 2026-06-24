# ADR-015: Deployment – Railway / Render

## Status
Pending – To be implemented

## Context
The assignment requires a live URL for the deployed backend. I needed a hosting platform that supports Node.js and PostgreSQL.

## Decision
I will deploy to **Railway** or **Render** (whichever is faster to set up).

## Why
- **Free tier** – both offer free hosting suitable for a demo.
- **PostgreSQL built‑in** – both provide managed PostgreSQL databases.
- **Git integration** – automatic deployment on push to the main branch.
- **Environment variables** – easy to set `DATABASE_URL`, `JWT_SECRET`, etc.

## Alternatives Considered
- **Vercel** – great for Next.js frontend, but less ideal for a standalone NestJS backend.
- **AWS / GCP** – more powerful but overkill for a demo.

## Consequences
- I need to create accounts and set up the project.
- I must migrate the database to the production instance.

## Date
2026-06-24