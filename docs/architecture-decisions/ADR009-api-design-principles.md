# ADR-009: API Design – RESTful and Consistent

## Status
Accepted – Implemented

## Context
I needed to design endpoints that are intuitive, consistent, and follow best practices. The assignment emphasised REST API quality.

## Decision
I followed RESTful principles:
- **Resource‑based URLs** – `/colleges`, `/colleges/:id`, `/me/saved-colleges`.
- **HTTP methods** – GET (read), POST (create), DELETE (remove).
- **Consistent error envelope** – all errors return `{ success: false, error: { code, message } }`.
- **Success envelope** – all success responses return `{ success: true, data, meta? }`.

## Why
- REST is widely understood and easy to consume by frontend applications.
- Consistent envelopes make error handling on the client side predictable.

## Consequences
- The `ResponseInterceptor` wraps all successful responses.
- The `HttpExceptionFilter` standardises all error responses.

## Date
2026-06-22