# ADR-018: API Contract Consistency – Aligning Spec and Implementation

## Status
Accepted – Implemented

## Context
During development, I discovered mismatches between the API contract (OpenAPI / markdown) and the actual implementation – specifically regarding pagination (`cursor` vs `page`) and the location of the refresh token (header vs body).

## Decision
I updated both the **OpenAPI spec** and the **API contract markdown** to match the actual implementation.

## Why
- The spec and implementation must be aligned to avoid confusion for frontend developers.
- The implementation had already been tested and was working, so it was safer to update the spec than to change the code.

## Consequences
- The `api-contract.md` now describes offset pagination (`page`, `limit`, `total`, `totalPages`).
- The refresh token is correctly documented as being in the request body.
- The spec is now the single source of truth for the API.

## Date
2026-06-24