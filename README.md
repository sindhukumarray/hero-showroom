# Hero Showroom — Premium Automotive Showroom Discovery Platform

## 1. Overview
Hero Showroom is a commercial-grade automotive showroom and motorcycle discovery web application built on the MERN stack (MongoDB, Express, React, Node.js). It is engineered to connect riders with authorized dealer showrooms, flagship motorcycle catalogues, transparent technical specifications, and digital dealership discovery.

---

## 2. Project Architecture
The platform is organized as a clean, unified monorepo:

```text
hero-showroom/
├── client/                     # Frontend Application (React 18 + Vite)
│   ├── src/
│   │   ├── animations/         # Framer Motion variants & reduced-motion sanitizer
│   │   ├── assets/             # Media and static assets
│   │   ├── components/         # Reusable UI component library (Container, Card, etc.)
│   │   ├── constants/          # Application-wide constants
│   │   ├── hooks/              # Custom hooks (useSEO, usePrefersReducedMotion)
│   │   ├── layouts/            # Top-level chrome layout (RootLayout, Header, Footer)
│   │   ├── pages/              # Route page shells (Home, Showrooms, Bikes, etc.)
│   │   ├── routes/             # Route table definitions (AppRoutes)
│   │   ├── services/           # Centralized Axios client & API helpers (api.js)
│   │   ├── utils/              # Client utility functions
│   │   ├── App.jsx             # Router and dev connectivity provider
│   │   ├── index.css           # Global typography tokens & Tailwind base
│   │   └── main.jsx            # Application entrypoint
│   ├── .env.example            # Client environment template
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend API Service (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Database connection & env validation
│   │   ├── controllers/        # Request controllers (healthController)
│   │   ├── middleware/         # Centralized error handler, 404 handler, CORS
│   │   ├── models/             # Mongoose schemas (deferred to Phase 2+)
│   │   ├── routes/             # Express route definitions (healthRoutes, /api)
│   │   ├── services/           # Business logic services (deferred to Phase 2+)
│   │   ├── utils/              # Standardized API response helpers (apiResponse.js)
│   │   ├── validators/         # Request input validators (deferred to Phase 2+)
│   │   ├── app.js              # Express app setup and middleware configuration
│   │   └── server.js           # Server process bootstrap and lifecycle management
│   ├── .env.example            # Server environment template
│   └── package.json
│
├── .gitignore                  # Comprehensive root ignore rules
├── package.json                # Monorepo workspace configuration
├── README.md                   # Project documentation
└── test-phase1-integration.mjs # Phase 1 integration audit suite
```

**Backend Principle:** `Routes → Controllers → Services → Models → MongoDB`
**Frontend Principle:** Component-driven, fluid clamp typography, luxury dark mode tokens, accessible motion.

---

## 3. Client Setup
```bash
cd client
npm install
```

## 4. Server Setup
```bash
cd server
npm install
```

---

## 5. Environment Variables
Real environment files (`.env`) are strictly ignored by `.gitignore` to prevent secret leakage. Templates are maintained in both sub-packages:

### `client/.env.example`
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### `server/.env.example`
```env
PORT=5000
MONGODB_URI=
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## 6. Development Commands

### Monorepo Root Commands
| Command | Action |
| :--- | :--- |
| `npm run dev:client` | Starts Vite development server (`http://localhost:5173`) |
| `npm run dev:server` | Starts Express backend server with nodemon (`http://localhost:5000`) |
| `npm run build:client` | Compiles production bundle for client |
| `npm test --prefix server` | Runs server foundation and health check tests |
| `npm test --prefix client` | Runs client component and homepage tests |

---

## 7. Current Phase 1 Status
Phase 1 establishes the production-ready architectural foundation and UI design system:
- [x] Monorepo workspace and Git architecture
- [x] Express REST backend with CORS, centralized error handling, and 404 handler
- [x] Standardized API response format (`{ success, message, data/errors }`)
- [x] React + Vite + Tailwind CSS design system with fluid clamp typography
- [x] Framer Motion animation system with strict `prefers-reduced-motion` compliance
- [x] Reusable component suite (`Container`, `Section`, `Button`, `Card`, `Badge`, `Input`, `Loading`, `ErrorState`, `EmptyState`)
- [x] Responsive layout shell (`Header`, `Footer`, `RootLayout`)
- [x] 8-section Homepage foundation (Cinematic Hero, Smart Search shell, Brands, Cities, Featured Bikes, Showrooms, Benefits, Final CTA)
- [x] Automated test suites and production build validation (100% passing)

---

## 8. How to Run Frontend
```bash
cd client
npm run dev
```
Access at `http://localhost:5173`.

---

## 9. How to Run Backend
```bash
cd server
npm run dev
```
API runs on `http://localhost:5000`.

---

## 10. How to Verify Backend Health
Send an HTTP GET request to:
```bash
curl http://localhost:5000/api/health
```
**Expected Response:**
```json
{
  "success": true,
  "message": "Hero Showroom API is running"
}
```

---

## 11. Testing & Build Commands

```bash
# Run server test suite
npm test --prefix server

# Run client regression tests
node client/test-step3.js
node client/test-step4.js

# Run full Phase 1 end-to-end integration audit
node test-phase1-integration.mjs

# Build client production bundle
npm run build --prefix client
```

---

## 12. Intentionally NOT Implemented in Phase 1 (Deferred Scope)
To preserve architectural boundaries, the following modules belong strictly to subsequent phases:
- User authentication, JWT sessions, registration/login forms, password hashing (Phase 3)
- Showroom database CRUD, geo-location filtering, dealer onboarding (Phase 2)
- Bike catalogue database CRUD, 360-degree model viewer, specifications database (Phase 2)
- Side-by-side vehicle comparison business engine and EMI calculators (Phase 4)
- Lead capture, test ride scheduling, inquiries (Phase 5)
- User dashboard, saved favorites, dealer portal management (Phase 5)
- Admin analytics, catalogue synchronization, role-based access control (Phase 6)
