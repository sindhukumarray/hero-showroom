# Hero Showroom — Backend API Foundation

## Purpose
This service provides the Node.js/Express REST API foundation and MongoDB/Mongoose data layer for the Hero Showroom discovery platform.

- **Phase 1 Established:** Modular architecture, centralized error handling, environment configuration, database connection scaffolding, and standardized health check endpoints.
- **Phase 2 Step 1 Established:** Complete Mongoose model foundation for core discovery entities (`Brand`, `City`, `Showroom`, `Bike`, `BikeVariant`), entity relationships, indexing, and database connection lifecycle management.
- **Phase 2 Step 2A Established:** Layered architecture (`Route → Controller → Validator → Service → Model`) for Catalogue APIs with read-only endpoints for `Brand` and `City`, standardized pagination metadata, safe query escaping, and database availability protection.

---

## Architecture

The backend strictly follows a layered architectural pattern:
`Request → Route → Controller → Validator → Service → Model → MongoDB`

```text
server/
├── src/
│   ├── config/          # Configuration modules (database, env)
│   ├── controllers/     # HTTP request parsing, response dispatch (brandController, cityController, healthController)
│   ├── middleware/      # Centralized error handler, 404 handler, CORS, body parsers
│   ├── models/          # Mongoose data schemas (Brand, City, Showroom, Bike, BikeVariant)
│   ├── routes/          # Express route definitions (brandRoutes, cityRoutes, healthRoutes)
│   ├── services/        # Business logic & safe query builders (brandService, cityService)
│   ├── validators/      # Request parameter & query validation (brandValidator, cityValidator)
│   ├── utils/           # Shared response utilities (sendSuccess, sendError)
│   ├── app.js           # Express application configuration
│   └── server.js        # Server bootstrap & lifecycle management
├── test-step2.js        # Health check & error handling tests
├── test-step2-models.js # Mongoose models schema & index audit
├── test-step2a-catalogue-api.js # Brand & City Catalogue API test suite
├── .env.example         # Environment variable template
├── package.json         # Server dependencies and scripts
└── README.md            # Backend documentation
```

---

## Catalogue API Endpoints (Phase 2 Step 2A)

> [!NOTE]
> All Brand and City endpoints are strictly **read-only** at this stage. Seed data has not yet been populated into the database. Write operations (POST/PUT/PATCH/DELETE), Showroom/Bike CRUD, and authentication are deferred to subsequent steps.

### Standard Response Envelope
All endpoints use the standardized API response structure:

```json
{
  "success": true,
  "message": "Brands retrieved successfully",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "pages": 0
  }
}
```

---

### Brand Endpoints

#### 1. List Brands
- **Method / Path:** `GET /api/brands`
- **Description:** Retrieve paginated list of automotive brands sorted stably by name (`{ name: 1, _id: 1 }`).
- **Query Parameters:**
  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `page` | integer | `1` | Page number (must be $\ge 1$) |
  | `limit` | integer | `20` | Items per page (integer between `1` and `100`) |
  | `search` | string | — | Case-insensitive search on brand `name` (sanitized regex) |
  | `isActive` | boolean | — | Filter by status (`'true'` or `'false'`) |

#### 2. Get Brand by Slug
- **Method / Path:** `GET /api/brands/:slug`
- **Description:** Retrieve a single brand by its unique URL slug.
- **Parameters:**
  | Parameter | Type | Description |
  | :--- | :--- | :--- |
  | `slug` | string | URL-safe identifier (e.g., `hero-motocorp`, `hero-premia`, `vida`) |
- **Responses:**
  - `200 OK`: Brand object returned in `data`.
  - `400 Bad Request`: Invalid slug format (must be URL-safe alphanumeric with hyphens).
  - `404 Not Found`: No brand found with the requested slug.

---

### City Endpoints

#### 1. List Cities
- **Method / Path:** `GET /api/cities`
- **Description:** Retrieve paginated list of geographic discovery hubs sorted stably (`{ state: 1, name: 1, _id: 1 }`).
- **Query Parameters:**
  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `page` | integer | `1` | Page number (must be $\ge 1$) |
  | `limit` | integer | `20` | Items per page (integer between `1` and `100`) |
  | `search` | string | — | Case-insensitive search on city `name` (sanitized regex) |
  | `state` | string | — | Case-insensitive filter by `state` (e.g. `Maharashtra`, `Delhi`) |
  | `isActive` | boolean | — | Filter by status (`'true'` or `'false'`) |

#### 2. Get City by Slug
- **Method / Path:** `GET /api/cities/:slug`
- **Description:** Retrieve a single city by its unique URL slug.
- **Parameters:**
  | Parameter | Type | Description |
  | :--- | :--- | :--- |
  | `slug` | string | URL-safe identifier (e.g., `mumbai`, `new-delhi`, `bengaluru`) |
- **Responses:**
  - `200 OK`: City object returned in `data`.
  - `400 Bad Request`: Invalid slug format.
  - `404 Not Found`: No city found with the requested slug.

---

## Database Connection & Resilience
- **Database Safety:** All queries explicitly whitelist and map supported parameters. Arbitrary MongoDB operators (starting with `$`) are strictly forbidden and rejected with `400 Bad Request`.
- **Offline / Disconnected Behavior:** When MongoDB is disconnected, API endpoints fail gracefully with status `503 Service Unavailable` and standardized error envelopes, avoiding hanging connections or credential leakage.

---

## Testing & Verification

```bash
# Run full server test battery
npm test --prefix server

# Run Phase 2 Step 2A API audit specifically
node server/test-step2a-catalogue-api.js

# Run Phase 2 Step 1 Model audit
node server/test-step2-models.js
```

---

## Scope & Deferred Boundaries

### Implemented in Phase 2 Step 2A
- Layered architecture for Brand and City read operations
- Pagination and pagination metadata (`page`, `limit`, `total`, `pages`)
- Query validation, injection prevention, and slug validation
- Safe regex escaping for case-insensitive search

### Intentionally Deferred Scope
- Database seed data has **NOT** yet been populated.
- Showroom CRUD endpoints & query filters (Phase 2 Step 2B)
- Bike and BikeVariant catalogue CRUD endpoints (Phase 2 Step 2C)
- User authentication, JWT sessions, customer registration (Phase 3)
- Vehicle comparison engine & EMI calculator (Phase 4)
- Lead submission & test-ride booking (Phase 5)
- Admin management endpoints & write operations (Phase 6)
