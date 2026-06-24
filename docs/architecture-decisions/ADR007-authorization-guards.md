# ADR-007: Authorization – NestJS JWT Guard

## Status
Accepted – Implemented

## Context
I needed to protect routes that require authentication (e.g., saving colleges, viewing saved items). NestJS provides `Guards` for this purpose.

## Decision
I used the built‑in `JwtAuthGuard` from `@nestjs/passport` with a `JwtStrategy`.

## Why
- **Declarative** – I can simply add `@UseGuards(JwtAuthGuard)` to any controller or route.
- **Reusable** – the guard extracts the token from the `Authorization` header and validates it.
- The `JwtStrategy` validates the token and attaches the user payload to the request.

## Consequences
- All protected routes must use the guard.
- Expired tokens are automatically rejected.

## Date
2026-06-22