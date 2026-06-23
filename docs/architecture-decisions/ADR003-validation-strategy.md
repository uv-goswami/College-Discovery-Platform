# ADR-003: Input Validation — Zod via nestjs-zod

## Decision
Use Zod with `nestjs-zod` for input validation across all API endpoints.

## Reasons
- Single Zod schema is the source of truth for TypeScript type, runtime validation,
  and OpenAPI spec — no duplication
- `nestjs-zod` bridges Zod to NestJS pipes and `@nestjs/swagger` without manual
  annotation
- Stronger type inference than class-based alternatives

## Alternatives Considered
**class-validator + class-transformer** — native to NestJS, but types and validation
rules are declared separately. More boilerplate, weaker inference.

## Consequences
- `nestjs-zod` is a third-party bridge; must be monitored for NestJS compatibility
- Schemas and DTOs colocated with their modules — see `docs/standards/validation.md`
  for conventions