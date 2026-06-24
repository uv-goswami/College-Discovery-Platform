
# College Discovery Platform - Backend

This is the backend service for the College Discovery Platform, a RESTful API built with NestJS, Prisma, and PostgreSQL. It provides user authentication, college search with filters, comparison between colleges, and user-scoped saved items.

---

## Tech Stack

- NestJS (TypeScript)
- PostgreSQL
- Prisma ORM (with `@prisma/adapter-pg` and `pg` for connection pooling)
- Zod (validation via `nestjs-zod`)
- JWT (access + refresh tokens, bcrypt for hashing)
- Jest (unit testing)

---


## Directory Structure

```
backend/
├── docs/
│   ├── API/
│   │   ├── api-contract.md       # Human-readable API contract
│   │   └── openapi.json          # OpenAPI 3.0.3 specification
│   ├── architecture-decisions/   # ADR files (decisions and rationale)
│   └── database-design.md        # Database schema and relationships
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── seed.ts                   # Seeding script
│   └── migrations/               # Generated migration files
├── src/
│   ├── auth/                     # Authentication module (register, login, refresh, logout)
│   ├── college/                  # College module (search, detail, compare, reviews)
│   ├── common/                   # Shared utilities (filters, interceptors, decorators, DTOs)
│   ├── prisma/                   # Prisma service (global provider)
│   ├── saved/                    # Saved items module (colleges and comparisons)
│   ├── app.module.ts             # Root module
│   └── main.ts                   # Application entry point
├── test/                         # End-to-end test files (if any)
├── .env.example                  # Example environment variables
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- PostgreSQL (local or remote)

### Installation

```bash
git clone <repository-url>
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the root directory with the following content (adjust values accordingly):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/college_discovery?schema=public"
JWT_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"
PORT=3000
```

### Database Setup

Run Prisma migrations to create the database schema:

```bash
npx prisma migrate dev --name init
```

### Seeding

Populate the database with sample data:

```bash
npx prisma db seed
```

The seed creates a test user (`test@student.com` / `Password123!`) and 10 colleges with reviews and a saved comparison.

### Run the Server

Development:

```bash
npm run start:dev
```

Production:

```bash
npm run build
npm run start:prod
```

---

## API Overview

All endpoints are prefixed with `/api/v1`.  
Authentication uses JWT. Protected routes require the `Authorization: Bearer <accessToken>` header.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/auth/register` | Register a new user |
| POST   | `/auth/login` | Login and receive tokens |
| POST   | `/auth/refresh` | Refresh access token (requires refresh token in body) |
| POST   | `/auth/logout` | Invalidate refresh token (requires refresh token in body) |
| GET    | `/colleges` | Search colleges with filters and pagination (`page`, `limit`, `search`, `state`, `city`, `minFees`, `maxFees`, `minRating`) |
| GET    | `/colleges/compare` | Compare 2–3 colleges (comma-separated IDs) |
| GET    | `/colleges/:id` | Get full college detail |
| GET    | `/colleges/:id/reviews` | Get paginated reviews for a college |
| GET    | `/me/saved-colleges` | List saved colleges (authenticated) |
| POST   | `/me/saved-colleges` | Save a college (authenticated) |
| DELETE | `/me/saved-colleges/:collegeId` | Remove a saved college (authenticated) |
| GET    | `/me/saved-comparisons` | List saved comparisons (authenticated) |
| POST   | `/me/saved-comparisons` | Save a comparison (authenticated, 2–3 IDs) |
| DELETE | `/me/saved-comparisons/:comparisonId` | Remove a saved comparison (authenticated) |

### Example Request

Register a user:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"secure123"}'
```

Login:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secure123"}'
```

Search colleges:

```bash
curl "http://localhost:3000/api/v1/colleges?search=iit&page=1&limit=10"
```

Save a college (use the access token from login):

```bash
curl -X POST http://localhost:3000/api/v1/me/saved-colleges \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"collegeId":"<collegeId>"}'
```

Full API documentation is available in `docs/API/api-contract.md` and `docs/API/openapi.json`.

---

## Deployment

The application is deployed on Render (or similar platform). The live base URL is:

```
https://<your-app-name>.onrender.com/api/v1
```

All environment variables must be set on the hosting platform.

---

## Testing

Run unit tests:

```bash
npm run test
```

Test coverage:

```bash
npm run test:cov
```

---

## License
```

This project was created as part of an internship assignment for evaluation purposes only. It is not intended for commercial use or distribution. All rights reserved.
```