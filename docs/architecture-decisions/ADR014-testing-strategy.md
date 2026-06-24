# ADR-014: Testing – Unit Tests with Jest

## Status
Accepted – Implemented

## Context
The assignment emphasises reliable error handling and validation systems. Testing is essential to ensure these work as expected.

## Decision
I wrote unit tests for `AuthService` and `CollegesService` using Jest.

## Why
- **Critical path coverage** – authentication and college search are the most important features.
- **Edge cases** – duplicate email, invalid credentials, missing colleges, invalid comparison count.
- **Mocking** – I mocked `PrismaService` and `bcrypt` to isolate the service logic.

## Consequences
- Tests run automatically via `npm run test`.
- The test suite covers 11 scenarios, all passing.

## Date
2026-06-24