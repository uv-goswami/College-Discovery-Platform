# ADR-001: Backend Framework Selection

## Status
Accepted – Implemented

## Context
I needed to choose a backend framework for the College Discovery Platform. The assignment allowed either NestJS or Next.js API Routes. I had to pick one that would support the required features (search, pagination, authentication, database operations) while keeping the code maintainable.

## Decision
I chose **NestJS**.

## Why
- NestJS has a **module system** – I could separate features (Auth, Colleges, Saved Items) into clean, independent modules.
- It provides **built‑in Dependency Injection**, which makes testing easier and keeps services decoupled.
- It has **Guards** (for authentication), **Interceptors** (for response formatting), and **Pipes** (for validation) – reducing boilerplate.
- The assignment specifically mentioned NestJS as a preferred option.

## Alternatives Considered
**Next.js API Routes**  
- Simpler, but lacks a built‑in DI container and global interceptor pipeline.  
- Would have been harder to enforce consistent error/response formatting across all endpoints.

## Consequences
- I had to learn decorator‑based syntax (`@Controller`, `@Injectable`, etc.), which was new to me.  
- The DI container adds a layer of indirection, but I kept modules small to avoid confusion.

## Date
2026-06-22