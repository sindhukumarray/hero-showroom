# Hero Showroom — Backend API Foundation

## Purpose
This service provides the Node.js/Express REST API foundation and MongoDB/Mongoose data layer for the Hero Showroom discovery platform.

- **Phase 1 Established:** Modular architecture, centralized error handling, environment configuration, database connection scaffolding, and standardized health check endpoints.
- **Phase 2 Step 1 Established:** Complete Mongoose model foundation for core discovery entities (`Brand`, `City`, `Showroom`, `Bike`, `BikeVariant`), entity relationships, indexing, and database connection lifecycle management.
- **Phase 2 Step 2A Established:** Layered architecture (`Route → Controller → Validator → Service → Model`) for Catalogue APIs with read-only endpoints for `Brand` and `City`, standardized pagination metadata, safe query escaping, and database availability protection.
- **Phase 2 Step 2B Established:** Read-only Showroom Discovery API with multi-field filtering, relationship population (`Brand`, `City`), stable sorting whitelist, and geospatial discovery groundwork (`/api/showrooms/nearby` using `2dsphere` index and GeoJSON `Point`).

---

## Architecture

The backend strictly follows a layered architectural pattern:
`Request → Route → Controller → Validator → Service → Model → MongoDB`

```text
server/
├── src/
│   ├── config/          # Configuration modules (database, env)
│   ├── controllers/     # HTTP request handling (brandController, cityController, showroomController, healthController)
│   ├── middleware/      # Centralized error handler, 404 handler, CORS, body parsers
│   ├── models/          # Mongoose data schemas (Brand, City, Showroom, Bike, BikeVariant)
│   ├── routes/          # Express route definitions (brandRoutes, cityRoutes, showroomRoutes, healthRoutes)
│   ├── services/        # Business logic & safe queries (brandService, cityService, showroomService)
│   ├── validators/      # Request parameter & query validation (brandValidator, cityValidator, showroomValidator)
│   ├── utils/           # Shared response utilities (sendSuccess, sendError)
│   ├── app.js           # Express application configuration
│   └── server.js        # Server bootstrap & lifecycle management
├── test-step2.js        # Health check & error handling tests
├── test-step2-models.js # Mongoose models schema & index audit
├── test-step2a-catalogue-api.js # Brand & City Catalogue API test suite
├── test-step2b-showroom-api.js  # Showroom Discovery & Geospatial API test suite
├── .env.example         # Environment variable template
├── package.json         # Server dependencies and scripts
└── README.md            # Backend documentation
```

---

## Catalogue & Discovery Endpoints

> [!NOTE]
> All Brand, City, and Showroom endpoints are strictly **read-only** at this stage. Seed data has not yet been populated into the database. Write operations (POST/PUT/PATCH/DELETE), Bike/BikeVariant CRUD, and authentication are deferred to subsequent steps.

### Standard Response Envelope
All endpoints use the standardized API response structure:

```json
{
  "success": true,
  "message": "Showrooms retrieved successfully",
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

### Brand Endpoints (`/api/brands`)
- `GET /api/brands` — List brands with pagination (`page`, `limit` max 100), search, and `isActive` filter.
- `GET /api/brands/:slug` — Retrieve single brand details by unique slug.

---

### City Endpoints (`/api/cities`)
- `GET /api/cities` — List cities with pagination (`page`, `limit` max 100), search, `state` filter, and `isActive` filter.
- `GET /api/cities/:slug` — Retrieve single city details by unique slug.

---

### Showroom Endpoints (`/api/showrooms`)

#### 1. List Showrooms
- **Method / Path:** `GET /api/showrooms`
- **Description:** Retrieve paginated list of physical dealerships and flagship lounges with populated `brand` (`_id`, `name`, `slug`, `logo`) and `city` (`_id`, `name`, `slug`, `state`).
- **Query Parameters:**
  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `page` | integer | `1` | Page number (must be $\ge 1$) |
  | `limit` | integer | `20` | Items per page (integer between `1` and `100`) |
  | `search` | string | — | Case-insensitive search on `name`, `address.fullAddress`, or `address.area` |
  | `brand` | string | — | 24-character hex MongoDB ObjectId of the Brand |
  | `city` | string | — | 24-character hex MongoDB ObjectId of the City |
  | `showroomType` | string | — | Whitelisted enum: `'Standard Dealership'`, `'Premia Flagship'`, `'Experience Center'`, `'Service Hub'` |
  | `isActive` | boolean | — | Filter by status (`'true'` or `'false'`) |
  | `sort` | string | `'newest'` | Whitelisted sort: `'nameAsc'`, `'nameDesc'`, `'ratingDesc'`, `'newest'` |

#### 2. Nearby Showrooms (Geospatial Discovery)
- **Method / Path:** `GET /api/showrooms/nearby`
- **Description:** Find showrooms within a specified radial distance from geographic coordinates, sorted by distance from closest to farthest using MongoDB `$near` and `2dsphere` index.
- **Route Precedence:** Registered *before* `/:slug` to avoid path collisions.
- **Query Parameters:**
  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `lat` | number | *required* | Latitude (between `-90` and `90`) |
  | `lng` | number | *required* | Longitude (between `-180` and `180`) |
  | `maxDistance` | number | `50000` | Search radius in meters (positive number up to `500000` m / 500 km) |
  | `limit` | integer | `20` | Items to return (between `1` and `100`) |
  | `brand` | string | — | Optional Brand ObjectId filter |
  | `showroomType` | string | — | Optional showroom type enum filter |
  | `isActive` | boolean | — | Optional active status filter |

#### 3. Get Showroom by Slug
- **Method / Path:** `GET /api/showrooms/:slug`
- **Description:** Retrieve comprehensive showroom details with populated `brand` and `city` references.
- **Parameters:**
  | Parameter | Type | Description |
  | :--- | :--- | :--- |
  | `slug` | string | URL-safe identifier (e.g., `hero-premia-south-mumbai`) |
- **Responses:**
  - `200 OK`: Showroom object returned in `data`.
  - `400 Bad Request`: Invalid slug format.
  - `404 Not Found`: No showroom found with the requested slug.

---

## Geospatial Structure & Coordinate Conventions
All showroom spatial locations follow standard GeoJSON:

```json
{
  "type": "Point",
  "coordinates": [72.8258, 18.975]
}
```

> [!IMPORTANT]
> GeoJSON coordinate order is strictly **`[longitude, latitude]`** as specified in RFC 7946, not `[lat, lng]`.

---

## Database Connection & Resilience
- **Database Safety:** All queries explicitly whitelist and map supported parameters. Arbitrary MongoDB operators (starting with `$`) are strictly forbidden and rejected with `400 Bad Request`.
- **Offline / Disconnected Behavior:** When MongoDB is disconnected, API endpoints fail gracefully with status `503 Service Unavailable` and standardized error envelopes, avoiding hanging connections or credential leakage.

---

## Testing & Verification

```bash
# Run full server test battery
npm test --prefix server

# Run Phase 2 Step 2B Showroom API audit specifically
node server/test-step2b-showroom-api.js

# Run Phase 2 Step 2A Brand & City API audit
node server/test-step2a-catalogue-api.js

# Run Phase 2 Step 1 Model audit
node server/test-step2-models.js
```

---

## Scope & Deferred Boundaries

### Implemented in Phase 2 Step 2B
- Read-only Showroom listing, slug retrieval, and geospatial radius discovery
- Pagination and pagination metadata (`page`, `limit`, `total`, `pages`)
- Explicit query filters: `brand`, `city`, `showroomType`, `isActive`, `search`
- Whitelisted stable sorting options: `nameAsc`, `nameDesc`, `ratingDesc`, `newest`
- Safe population of Brand and City relationships
- Geospatial groundwork (`2dsphere`, `$near`, coordinate bounds validation)

### Intentionally Deferred Scope
- Database seed data has **NOT** yet been populated.
- Showroom write operations (POST, PUT, PATCH, DELETE) deferred to admin management (Phase 6).
- Bike and BikeVariant catalogue CRUD endpoints (Phase 2 Step 2C).
- User authentication, JWT sessions, customer registration (Phase 3).
- Vehicle comparison engine & EMI calculator (Phase 4).
- Lead submission & test-ride booking (Phase 5).
- Admin management endpoints (Phase 6).
