# ADR-010: Refresh Token Location – Request Body (not Header)

## Status
Accepted – Implemented

## Context
I had to decide where to send the refresh token for the `/auth/refresh` and `/auth/logout` endpoints. The initial design used the `Authorization` header, but I changed it to the request body.

## Decision
The refresh token is passed in the **request body** (e.g., `{ "refreshToken": "..." }`), not in the `Authorization` header.

## Why
- **Semantic correctness** – the `Bearer` header is meant for access tokens, not refresh tokens.
- **Security** – request bodies are less likely to be logged by web servers/proxies than headers.
- **Consistency** – both `/refresh` and `/logout` use the same body format, simplifying client code.

## Alternatives Considered
- `Authorization: Bearer <refresh_token>` – common but semantically wrong and risks logging.

## Consequences
- I updated the API contract and OpenAPI spec to reflect this.
- The `JwtAuthGuard` is **not** used on `/refresh` or `/logout`; we manually verify the refresh token.

## Date
2026-06-24