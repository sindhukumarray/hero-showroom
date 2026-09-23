# Hero Showroom — Backend API Foundation

## Purpose
This service provides the Node.js/Express REST API foundation for the Hero Showroom discovery platform. In Phase 1, it establishes a modular architecture, centralized error handling, environment configuration, database connection scaffolding, and standardized health check endpoints.

---

## Architecture

The backend follows a clean, layered architectural pattern:
`Routes → Controllers → Services → Models → MongoDB`

```text
server/
├── src/
│   ├── config/          # Configuration modules (database, env)
│   ├── controllers/     # HTTP request handling and response delegation
│   ├── middleware/      # Error handlers, 404 handler, CORS, parsers
│   ├── models/          # Mongoose data schemas (Phase 2+)
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic operations (Phase 2+)
│   ├── validators/      # Request validation schemas (Phase 2+)
│   ├── utils/           # Shared response & utility functions
│   ├── app.js           # Express application configuration
│   └── server.js        # Server bootstrap & lifecycle management
├── .env.example         # Environment variable template
├── package.json         # Server dependencies and scripts
└── README.md            # Backend documentation
```

---

## Environment Variables

Copy `.env.example` to `.env` in the `server/` directory:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Listening port for Express | `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string | *Required for live database* |
| `CLIENT_URL` | Allowed origin for CORS headers | `http://localhost:5173` |
| `NODE_ENV` | Application environment mode | `development` |

*Note: Real `.env` files must never be committed to source control.*

---

## Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Start Production Server
```bash
npm start
```

---

## Verified Endpoints (Phase 1)

### Health Check
- **Route:** `GET /api/health`
- **Description:** Verifies that the API service is active and responsive.
- **Response Format:**
  ```json
  {
    "success": true,
    "message": "Hero Showroom API is running"
  }
  ```

### Standard Error Handling
- **404 Handling:** Requests to non-existent endpoints return standardized error payloads:
  ```json
  {
    "success": false,
    "message": "Route not found: GET /api/unknown",
    "errors": ["The requested endpoint '/api/unknown' does not exist on this server."]
  }
  ```
