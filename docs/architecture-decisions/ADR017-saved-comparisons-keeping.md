# ADR-017: Saved Comparisons – Keep Feature

## Status
Accepted – Implemented

## Context
I initially considered removing the saved comparisons feature because it wasn’t explicitly required. However, I had already implemented it, and it was already documented in the OpenAPI spec from the beginning.

## Decision
I **kept** the saved comparisons feature.

## Why
- Already implemented and working – removing it would have been wasted effort.
- Already documented – the spec already had `GET`, `POST`, `DELETE /me/saved-comparisons`.
- Adds value – users can save and retrieve comparison sets, which is a useful feature for the College Discovery Platform.

## Alternatives Considered
- Removing it – would have required deleting code, DTOs, and the model from the schema, which was more work than keeping it.

## Consequences
- The feature is fully functional and documented.
- The `SavedComparison` model remains in the Prisma schema.

## Date
2026-06-24