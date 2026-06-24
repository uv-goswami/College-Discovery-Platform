# ADR-016: API Documentation – OpenAPI

## Status
Accepted – Implemented

## Context
The assignment required clear API documentation. I needed a machine‑readable format that could also serve as a reference for frontend developers.

## Decision
I used **OpenAPI 3.0.3** to document the API, with a corresponding `api-contract.md` for human‑readable details.

## Why
- **Standardised** – OpenAPI is widely supported and can be imported into tools like Postman, Swagger UI, etc.
- **Consistency** – the spec matches the implementation exactly.
- **Versioned** – both files are stored in the repository under `docs/API`.

## Consequences
- The spec must be updated whenever the API changes.
- It serves as a single source of truth for the API design.

## Date
2026-06-24