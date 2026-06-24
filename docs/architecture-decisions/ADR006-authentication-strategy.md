# ADR-006: Authentication – JWT with Refresh Token Rotation

## Status
Accepted – Implemented

## Context
Users needed to register, log in, and access protected routes. I needed a stateless authentication mechanism that could also support long‑lived sessions.

## Decision
I used **JWT (JSON Web Tokens) with refresh token rotation**.

## Why
- **Stateless** – no server‑side session storage, which scales well.
- **Access Token** – short‑lived (15 min), reduces risk of misuse.
- **Refresh Token** – long‑lived (7 days), stored hashed in the database for rotation and logout.
- **Rotation** – each refresh generates a new refresh token and invalidates the old one, improving security.

## Alternatives Considered
- **Session‑based** – simpler but requires server‑side storage; less scalable.
- **Single JWT (no refresh)** – user would need to re‑login every time the token expires.

## Consequences
- More complex implementation than simple session‑based auth.
- Refresh token must be stored securely on the client.

## Date
2026-06-22