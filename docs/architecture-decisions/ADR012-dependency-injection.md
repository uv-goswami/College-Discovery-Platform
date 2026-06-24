# ADR-012: Dependency Injection – PrismaService as a Shared Provider

## Status
Accepted – Implemented

## Context
I needed to share the Prisma client across multiple services (Auth, Colleges, Saved). NestJS’s DI system allows providers to be injected wherever needed.

## Decision
I created a `PrismaService` that extends `PrismaClient` and registered it as a global provider using `@Global()`.

## Why
- **Single instance** – only one Prisma client is created, reused across all services.
- **Simplifies services** – each service can inject `PrismaService` without re‑initialising the client.
- **Lifecycle management** – `onModuleInit` and `onModuleDestroy` handle connection/disconnection.

## Consequences
- All services now depend on `PrismaService` instead of creating their own `PrismaClient`.
- The client is available everywhere through dependency injection.

## Date
2026-06-22