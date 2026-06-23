# API Contract

Base URL: `/api/v1`
Auth: `Authorization: Bearer <token>` on protected routes

---

## Response Envelope

All responses follow this structure:

Success:
{
  "success": true,
  "data": <object | array | null>,
  "meta": <object>            -- only on paginated responses
}

Error:
{
  "success": false,
  "error": {
    "code": "<SCREAMING_SNAKE_CASE>",
    "message": "<human readable>"
  }
}

---

## Error Codes

| Code                  | HTTP | When                                      |
|-----------------------|------|-------------------------------------------|
| VALIDATION_ERROR      | 422  | Request body or query param fails schema  |
| INVALID_CREDENTIALS   | 401  | Wrong email or password                   |
| UNAUTHORIZED          | 401  | Missing or expired access token           |
| INVALID_TOKEN         | 401  | Malformed or unrecognised token           |
| TOKEN_EXPIRED         | 401  | Token signature valid but past expiry     |
| RESOURCE_NOT_FOUND    | 404  | Entity does not exist                     |
| USER_ALREADY_EXISTS   | 409  | Email already registered                  |
| ALREADY_SAVED         | 409  | User already saved this college           |
| INVALID_PARAM         | 400  | ids count outside 2–3 range               |
| INTERNAL_ERROR        | 500  | Unhandled server error                    |

---

## Pagination

Cursor-based. Cursor is the `id` of the last item in the previous response.
On first request, omit cursor. Pass `meta.nextCursor` from previous response
as the `cursor` param on the next request. `meta.hasMore: false` means no
further pages exist.

---

## Endpoints

---

### Auth

---

#### POST /auth/register

Request:
{
  "name": "string",
  "email": "string (valid email)",
  "password": "string (min 8 characters)"
}

Response 201:
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "email": "string"
    },
    "accessToken": "string",
    "refreshToken": "string"
  }
}

Errors: 409 USER_ALREADY_EXISTS, 422 VALIDATION_ERROR

---

#### POST /auth/login

Request:
{
  "email": "string",
  "password": "string"
}

Response 200:
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "email": "string"
    },
    "accessToken": "string",
    "refreshToken": "string"
  }
}

Errors: 401 INVALID_CREDENTIALS, 422 VALIDATION_ERROR

---

#### POST /auth/refresh

Header: Authorization: Bearer <refresh_token>

Response 200:
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}

Errors: 401 INVALID_TOKEN, 401 TOKEN_EXPIRED

---

#### POST /auth/logout

Header: Authorization: Bearer <access_token>

Response 200:
{
  "success": true,
  "data": null
}

Errors: 401 UNAUTHORIZED

---

### Colleges

---

#### GET /colleges

Query params:
  search?    string   Fuzzy search on name, city, state
  state?     string   Exact filter
  city?      string   Exact filter
  minFees?   number   Annual fees lower bound
  maxFees?   number   Annual fees upper bound
  minRating? number   0.0 to 5.0
  cursor?    string   Pagination cursor (opaque — pass as received)
  limit?     number   Default 20, max 50

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "city": "string",
      "state": "string",
      "type": "PUBLIC | PRIVATE | DEEMED",
      "rating": "number",
      "annualFees": "number",
      "logoUrl": "string | null"
    }
  ],
  "meta": {
    "nextCursor": "string | null",
    "limit": "number",
    "hasMore": "boolean"
  }
}

---

#### GET /colleges/compare

Note: This route must be registered before GET /colleges/:id in NestJS
to prevent the string "compare" being captured as an :id param.

Query params:
  ids  string (required)  Comma-separated college ids, 2 to 3 values
                          Example: ?ids=clx1abc,clx2def,clx3ghi

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "city": "string",
      "state": "string",
      "type": "PUBLIC | PRIVATE | DEEMED",
      "rating": "number",
      "annualFees": "number",
      "placements": {
        "averagePackage": "number",
        "highestPackage": "number",
        "placementRate": "number"
      },
      "topCourses": [
        {
          "name": "string",
          "degree": "string",
          "annualFees": "number"
        }
      ]
    }
  ]
}

Errors: 400 INVALID_PARAM, 404 RESOURCE_NOT_FOUND

---

#### GET /colleges/:id

Response 200:
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "city": "string",
    "state": "string",
    "type": "PUBLIC | PRIVATE | DEEMED",
    "rating": "number",
    "annualFees": "number",
    "logoUrl": "string | null",
    "about": "string",
    "established": "number",
    "website": "string | null",
    "courses": [
      {
        "id": "string",
        "name": "string",
        "degree": "B.Tech | MBA | M.Tech | BCA | MCA",
        "durationYears": "number",
        "annualFees": "number"
      }
    ],
    "placements": {
      "averagePackage": "number",
      "highestPackage": "number",
      "placementRate": "number"
    },
    "reviews": [
      {
        "id": "string",
        "rating": "number",
        "comment": "string",
        "createdAt": "string (ISO 8601)"
      }
    ]
  }
}

Errors: 404 RESOURCE_NOT_FOUND

---

### Activity (all routes require Authorization header)

---

#### GET /me/saved-colleges

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "string",
      "savedAt": "string (ISO 8601)",
      "college": {
        "id": "string",
        "name": "string",
        "city": "string",
        "state": "string",
        "rating": "number",
        "annualFees": "number"
      }
    }
  ]
}

Errors: 401 UNAUTHORIZED

---

#### POST /me/saved-colleges

Request:
{
  "collegeId": "string"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "string",
    "collegeId": "string",
    "savedAt": "string (ISO 8601)"
  }
}

Errors: 401 UNAUTHORIZED, 404 RESOURCE_NOT_FOUND, 409 ALREADY_SAVED

---

#### DELETE /me/saved-colleges/:collegeId

Response 200:
{
  "success": true,
  "data": null
}

Errors: 401 UNAUTHORIZED, 404 RESOURCE_NOT_FOUND

---

#### GET /me/saved-comparisons

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "string",
      "savedAt": "string (ISO 8601)",
      "collegeIds": ["string"]
    }
  ]
}

Errors: 401 UNAUTHORIZED

---

#### POST /me/saved-comparisons

Request:
{
  "collegeIds": ["string", "string"]
}

Response 201:
{
  "success": true,
  "data": {
    "id": "string",
    "collegeIds": ["string"],
    "savedAt": "string (ISO 8601)"
  }
}

Errors: 401 UNAUTHORIZED, 400 INVALID_PARAM, 404 RESOURCE_NOT_FOUND, 409 ALREADY_SAVED

---

#### DELETE /me/saved-comparisons/:comparisonId

Response 200:
{
  "success": true,
  "data": null
}

Errors: 401 UNAUTHORIZED, 404 RESOURCE_NOT_FOUND