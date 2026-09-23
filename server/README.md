# Hero Showroom — Backend API Foundation

## Purpose
This service provides the Node.js/Express REST API foundation and MongoDB/Mongoose data layer for the Hero Showroom discovery platform.

- **Phase 1 Established:** Modular architecture, centralized error handling, environment configuration, database connection scaffolding, and standardized health check endpoints.
- **Phase 2 Step 1 Established:** Complete Mongoose model foundation for core discovery entities (`Brand`, `City`, `Showroom`, `Bike`, `BikeVariant`), entity relationships, indexing, and database connection lifecycle management.

---

## Architecture

The backend strictly follows a layered architectural pattern:
`Routes → Controllers → Services → Models → MongoDB`

```text
server/
├── src/
│   ├── config/          # Configuration modules (database, env)
│   ├── controllers/     # HTTP request handling and response delegation
│   ├── middleware/      # Error handlers, 404 handler, CORS, parsers
│   ├── models/          # Mongoose data schemas (Brand, City, Showroom, Bike, BikeVariant)
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic operations (deferred to future steps)
│   ├── validators/      # Request validation schemas (deferred to future steps)
│   ├── utils/           # Shared response & utility functions
│   ├── app.js           # Express application configuration
│   └── server.js        # Server bootstrap & lifecycle management
├── .env.example         # Environment variable template
├── package.json         # Server dependencies and scripts
└── README.md            # Backend documentation
```

---

## MongoDB & Environment Configuration

### Database Connection Architecture
- Managed in `src/config/database.js` via `connectDatabase()` and `disconnectDatabase()`.
- Validates that `MONGODB_URI` is supplied; throws a descriptive error if missing.
- During development and automated testing without a live MongoDB Atlas cluster, the server gracefully warns and allows health check validation without crashing.
- *Live database connection requires an active MongoDB Atlas cluster.*

### Configuring `server/.env`
Copy `.env.example` to `.env` in the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hero_showroom?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Listening port for Express | `5000` |
| `MONGODB_URI` | MongoDB connection URI | *Required for live database operations* |
| `CLIENT_URL` | Allowed origin for CORS headers | `http://localhost:5173` |
| `NODE_ENV` | Application environment mode | `development` |

*Note: Real `.env` files must never be committed to source control.*

---

## Core Data Models (Phase 2 Step 1)

All models are located in `src/models/` and exported via `src/models/index.js`:

1. **`Brand` (`Brand.js`)**:
   - Represents motorcycle manufacturers and premium divisions (e.g., Hero MotoCorp, Hero Premia, Vida).
   - Fields: `name`, `slug` (unique), `logo`, `description`, `originCountry`, `website`, `isActive`, `timestamps`.

2. **`City` (`City.js`)**:
   - Represents geographic discovery hubs across metropolitan and regional areas.
   - Fields: `name`, `slug` (unique), `state`, `country`, `tier`, `coordinates`, `isActive`, `timestamps`.

3. **`Showroom` (`Showroom.js`)**:
   - Authorized physical dealership locations and flagship lounges.
   - Fields: `name`, `slug` (unique), `brand` (ref: `Brand`), `city` (ref: `City`), `dealerName`, `showroomType`, `address` (structured), `contact` (structured), `location` (GeoJSON Point with `2dsphere` index), `openingHours`, `facilities`, `images`, `rating`, `isVerified`, `isActive`, `timestamps`.

4. **`Bike` (`Bike.js`)**:
   - Motorcycle catalogue models.
   - Fields: `brand` (ref: `Brand`), `name`, `slug` (unique), `category` (enum), `tagline`, `description`, `images`, `engine` (structured specs), `fuelType` (enum), `transmission`, `brakes`, `mileage`, `priceRange` (min/max), `isFeatured`, `isActive`, `timestamps`.

5. **`BikeVariant` (`BikeVariant.js`)**:
   - Specific trims, colorways, and price tiers for each model.
   - Fields: `bike` (ref: `Bike`), `brand` (ref: `Brand`), `name`, `slug` (compound unique with `bike`), `exShowroomPrice`, `colors`, `keySpecifications`, `keyFeatures`, `isActive`, `timestamps`.

---

## Testing & Verification

```bash
# Run server test battery (health check + model schema audit)
npm test

# Run model audit specifically
node test-step2-models.js
```

---

## Verified Endpoints & Scope Boundaries

### Verified Endpoints
- **Health Check:** `GET /api/health` → `{ "success": true, "message": "Hero Showroom API is running" }`
- **404 Catch-All:** `GET /api/*` → `{ "success": false, "message": "Route not found...", "errors": [...] }`

### Intentionally Deferred Scope (Not Implemented in Step 1)
- Showroom CRUD endpoints & query filters (Phase 2 Step 2+)
- Bike catalogue CRUD endpoints & query filters (Phase 2 Step 2+)
- User authentication, JWT sessions, customer registration (Phase 3)
- Vehicle comparison engine & EMI calculator (Phase 4)
- Lead submission & test-ride booking (Phase 5)
- Admin management endpoints (Phase 6)
