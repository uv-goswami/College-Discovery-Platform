# ADR-001: Backend Framework Selection — NestJS
## Context

The assignment mandates the following backend stack:
- Node.js
- TypeScript
- **Next.js API Routes or NestJS**

A backend-only role requires a framework that can demonstrate API architecture,
validation systems, schema design, and backend patterns clearly. The framework
choice directly impacts how these capabilities are expressed and evaluated.

## Decision

**We adopt NestJS as the backend framework.**

## Alternatives Considered

### Option A: Next.js API Routes
- Designed for full-stack applications where the backend is a supporting concern
- No native dependency injection container
- No guard/interceptor/pipe lifecycle
- No module system for bounded context isolation
- Route handlers are flat functions — architectural patterns must be manually imposed
- Would require significant boilerplate to replicate what NestJS provides natively
- **Verdict: Rejected.** Technically compliant but architecturally weak for a backend-focused role.

### Option B: Express (not in the prescribed stack)
- Maximum control and flexibility
- But deviates from the prescribed stack without a strong enough justification
- Manual DI, manual middleware chaining, no structural guardrails
- **Verdict: Rejected.** Deviation from prescribed stack is not justified when NestJS
  satisfies all requirements more completely.

### Option C: NestJS ✓
- First-class TypeScript support
- Built-in DI container — each bounded context maps to a NestJS Module
- Guards → authentication and authorization enforcement
- Interceptors → response transformation, logging, timing
- Pipes → input validation at the framework boundary (class-validator / Zod)
- Exception filters → unified error response format
- Swagger/OpenAPI integration via @nestjs/swagger — decorators generate the spec
- **Verdict: Accepted.**

## Consequences

**Positive:**
- Module structure enforces bounded context separation (CollegeModule, AuthModule,
  ActivityModule) at the framework level — not just a convention
- Assessment reviewers can immediately read the architecture from the folder structure
- @nestjs/swagger generates OpenAPI spec from decorators, keeping docs and code in sync
- Exception filters ensure consistent error envelopes without repetitive try/catch
- Guards make auth enforcement visible and auditable

**Negative:**
- NestJS has a steeper initial learning curve than Express
- Decorator-heavy code can obscure logic for developers unfamiliar with Angular-style patterns
- DI container adds a layer of indirection

**Mitigations:**
- Bounded context modules are kept small and focused — DI graph stays simple
- Controller methods remain thin; business logic lives in Services
- No circular module dependencies by design

## References
- NestJS Documentation: https://docs.nestjs.com
- Assignment requirement: "Backend: Node.js, TypeScript, Next.js API Routes or NestJS"

