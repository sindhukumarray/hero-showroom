# Hero Showroom — Backend API Foundation

## Purpose
This service provides the Node.js/Express REST API foundation and MongoDB/Mongoose data layer for the Hero Showroom discovery platform.

- **Phase 1 Established:** Modular architecture, centralized error handling, environment configuration, database connection scaffolding, and standardized health check endpoints.
- **Phase 2 Step 1 Established:** Complete Mongoose model foundation for core discovery entities (`Brand`, `City`, `Showroom`, `Bike`, `BikeVariant`), entity relationships, indexing, and database connection lifecycle management.
- **Phase 2 Step 2A Established:** Layered architecture (`Route → Controller → Validator → Service → Model`) for Catalogue APIs with read-only endpoints for `Brand` and `City`, standardized pagination metadata, safe query escaping, and database availability protection.
- **Phase 2 Step 2B Established:** Read-only Showroom Discovery API with multi-field filtering, relationship population (`Brand`, `City`), stable sorting whitelist, and geospatial discovery groundwork (`/api/showrooms/nearby` using `2dsphere` index and GeoJSON `Point`).
- **Phase 2 Step 2C Established:** Read-only Bike Model and Variant Catalogue APIs with multi-field filtering (`brand`, `category`, `fuelType`, `transmission`, `minPrice`, `maxPrice`, `isActive`, `search`), relationship population, price range validation, and parent-child variant querying (`/api/bikes/:slug/variants`).

---

## Architecture

The backend strictly follows a layered architectural pattern:
`Request → Route → Controller → Validator → Service → Model → MongoDB`

```text
server/
├── src/
│   ├── config/          # Configuration modules (database, env)
│   ├── controllers/     # HTTP request handling (brand, city, showroom, bike, bikeVariant, health)
│   ├── middleware/      # Centralized error handler, 404 handler, CORS, body parsers
│   ├── models/          # Mongoose data schemas (Brand, City, Showroom, Bike, BikeVariant)
│   ├── routes/          # Express route definitions (brand, city, showroom, bike, bikeVariant, health)
│   ├── services/        # Business logic & safe queries (brand, city, showroom, bike, bikeVariant)
│   ├── validators/      # Request parameter & query validation (brand, city, showroom, bike, bikeVariant)
│   ├── utils/           # Shared response utilities (sendSuccess, sendError)
│   ├── app.js           # Express application configuration
│   └── server.js        # Server bootstrap & lifecycle management
├── test-step2.js        # Health check & error handling tests
├── test-step2-models.js # Mongoose models schema & index audit
├── test-step2a-catalogue-api.js # Brand & City Catalogue API test suite
├── test-step2b-showroom-api.js  # Showroom Discovery & Geospatial API test suite
├── test-step2c-bike-api.js      # Bike & Variant Catalogue API test suite
├── .env.example         # Environment variable template
├── package.json         # Server dependencies and scripts
└── README.md            # Backend documentation
```

---

## Catalogue & Discovery Endpoints

> [!NOTE]
> All Brand, City, Showroom, Bike, and BikeVariant endpoints are strictly **read-only** at this stage. Seed data has not yet been populated into the database. Write operations (POST/PUT/PATCH/DELETE), comparison engine, EMI calculator, and authentication are deferred to subsequent steps.

### Standard Response Envelope
All endpoints use the standardized API response structure:

```json
{
  "success": true,
  "message": "Bikes retrieved successfully",
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
- `GET /api/showrooms` — List physical dealerships and flagship lounges with populated `brand` and `city` references.
- `GET /api/showrooms/nearby` — Geospatial discovery ordered by distance using MongoDB `$near` and `2dsphere` index (must supply `lat`, `lng`, and optional `maxDistance`).
- `GET /api/showrooms/:slug` — Retrieve comprehensive showroom details with populated `brand` and `city` references.

---

### Bike Endpoints (`/api/bikes`)

#### 1. List Bike Models
- **Method / Path:** `GET /api/bikes`
- **Description:** Retrieve paginated motorcycle catalogue models with populated `brand` (`_id`, `name`, `slug`, `logo`).
- **Query Parameters:**
  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `page` | integer | `1` | Page number (must be $\ge 1$) |
  | `limit` | integer | `20` | Items per page (integer between `1` and `100`) |
  | `search` | string | — | Case-insensitive search on `name`, `tagline`, and `description` |
  | `brand` | string | — | 24-character hex MongoDB ObjectId of the Brand |
  | `category` | string | — | Whitelisted enum: `'Commuter'`, `'Sport'`, `'Cruiser'`, `'Tourer'`, `'Adventure'`, `'Scooter'`, `'Electric'` |
  | `fuelType` | string | — | Whitelisted enum: `'Petrol'`, `'Electric'`, `'Hybrid'` |
  | `transmission` | string | — | Transmission type string (e.g. `'Manual'`) |
  | `minPrice` | number | — | Non-negative number for lower price bound |
  | `maxPrice` | number | — | Non-negative number for upper price bound (must be $\ge \text{minPrice}$) |
  | `isActive` | boolean | — | Filter by status (`'true'` or `'false'`) |
  | `sort` | string | `'newest'` | Whitelisted sort: `'nameAsc'`, `'nameDesc'`, `'priceLow'`, `'priceHigh'`, `'newest'` |

#### 2. Get Bike Model by Slug
- **Method / Path:** `GET /api/bikes/:slug`
- **Description:** Retrieve single bike model details with populated `brand` (`_id`, `name`, `slug`, `logo`, `website`, `originCountry`, `description`).
- **Responses:**
  - `200 OK`: Bike object returned in `data`.
  - `400 Bad Request`: Invalid slug format.
  - `404 Not Found`: No bike model found with the requested slug.

#### 3. List Variants for a Bike Model
- **Method / Path:** `GET /api/bikes/:slug/variants`
- **Description:** Retrieve paginated trims, colorways, and configurations for a specific parent bike model.
- **Route Precedence:** Registered *before* `/:slug` to prevent dynamic path shadowing.
- **Query Parameters:**
  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `page` | integer | `1` | Page number (must be $\ge 1$) |
  | `limit` | integer | `20` | Items per page (between `1` and `100`) |
  | `minPrice` | number | — | Minimum ex-showroom price ($\ge 0$) |
  | `maxPrice` | number | — | Maximum ex-showroom price (must be $\ge \text{minPrice}$) |
  | `isActive` | boolean | — | Filter active/inactive variants (`'true'` or `'false'`) |
  | `sort` | string | `'priceLow'` | Whitelisted sort: `'priceLow'`, `'priceHigh'`, `'nameAsc'`, `'nameDesc'`, `'newest'` |
- **Responses:**
  - `200 OK`: Array of variant documents in `data` with parent `bike` summary and pagination `meta`.
  - `404 Not Found`: Parent bike model does not exist.

---

## Database Connection & Resilience
- **Database Safety:** All queries explicitly whitelist and map supported parameters. Arbitrary MongoDB operators (starting with `$`) are strictly forbidden and rejected with `400 Bad Request`.
- **Offline / Disconnected Behavior:** When MongoDB is disconnected, API endpoints fail gracefully with status `503 Service Unavailable` and standardized error envelopes, avoiding hanging connections or credential leakage.

---

## Testing & Verification

```bash
# Run full server test battery
npm test --prefix server

# Run Phase 2 Step 2C Bike & Variant API audit specifically
node server/test-step2c-bike-api.js

# Run Phase 2 Step 2B Showroom API audit
node server/test-step2b-showroom-api.js

# Run Phase 2 Step 2A Brand & City API audit
node server/test-step2a-catalogue-api.js

# Run Phase 2 Step 1 Model audit
node server/test-step2-models.js
```

---

## Scope & Deferred Boundaries

### Implemented in Phase 2 Step 2C
- Read-only Bike listing, slug retrieval, and parent-child variant discovery
- Pagination and pagination metadata (`page`, `limit`, `total`, `pages`)
- Explicit query filters: `brand`, `category`, `fuelType`, `transmission`, `minPrice`, `maxPrice`, `isActive`, `search`
- Whitelisted stable sorting options for bikes and variants
- Relationship population: `Bike.brand` and `BikeVariant.brand`
- Parent bike model resolution before variant querying

### Intentionally Deferred Scope
- Database seed data has **NOT** yet been populated.
- Bike and Variant write operations (POST, PUT, PATCH, DELETE) deferred to admin management (Phase 6).
- Vehicle comparison engine & EMI calculator (Phase 4).
- User authentication, JWT sessions, customer registration (Phase 3).
- Lead submission & test-ride booking (Phase 5).
- Admin management endpoints (Phase 6).
