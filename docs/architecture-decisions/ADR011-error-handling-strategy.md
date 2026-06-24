# ADR-011: Error Handling – Global Exception Filter

## Status
Accepted – Implemented

## Context
I needed a consistent way to handle errors across all endpoints. NestJS provides `ExceptionFilters` for this purpose.

## Decision
I implemented a global `HttpExceptionFilter` that catches all exceptions and returns a standard error envelope.

## Why
- **Consistency** – every error response has the same shape (`success: false, error: { code, message }`).
- **Centralised logic** – I handle Prisma errors (P2002, P2025) in one place and map them to the correct HTTP status and error code.
- **Clean controllers** – controllers don’t need try/catch blocks; they throw exceptions and the filter handles them.

## Consequences
- All error responses follow the same structure, making them easy to parse on the frontend.
- The filter differentiates between `USER_ALREADY_EXISTS` (email conflict) and `ALREADY_SAVED` (saved college/comparison conflict) based on the Prisma error metadata.

## Date
2026-06-22