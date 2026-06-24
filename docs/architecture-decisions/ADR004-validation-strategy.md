# ADR-004: Input Validation – Zod

## Status
Accepted – Implemented

## Context
I needed a validation library for request bodies and query parameters. NestJS supports both `class‑validator` (decorator‑based) and `Zod` (schema‑based). I wanted strong type inference and minimal boilerplate.

## Decision
I chose **Zod** with the `nestjs-zod` integration.

## Why
- Single source of truth – the Zod schema defines both runtime validation AND TypeScript types.
- `nestjs-zod` bridges Zod to NestJS pipes and `@nestjs/swagger` without manual annotation.
- Stronger type inference than `class‑validator` – the DTO class already has the correct type.

## Alternatives Considered
- **class‑validator** – native to NestJS, but types and validation rules are declared separately. More boilerplate.

## Consequences
- I had to install `nestjs-zod` (a third‑party bridge), which requires monitoring for compatibility.
- Validation errors are automatically transformed into the standard error envelope.

## Date
2026-06-22