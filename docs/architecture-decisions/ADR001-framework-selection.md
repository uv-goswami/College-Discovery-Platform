# ADR-001: Backend Framework — NestJS

## Decision
Use NestJS as the backend framework.

## Reasons
- Prescribed in the assignment (NestJS or Next.js API Routes)
- Module system maps directly onto bounded contexts
- Built-in DI, guards, interceptors, and pipes reduce boilerplate
- `@nestjs/swagger` generates OpenAPI spec from decorators — no drift

## Alternatives Considered
**Next.js API Routes** — flat route handlers, no DI, no guard/interceptor lifecycle.
Technically compliant but architecturally weak for a backend-only role.

## Consequences
- Decorator-heavy code; unfamiliar to developers outside Angular/NestJS ecosystem
- DI container adds indirection — mitigated by keeping modules small and focused