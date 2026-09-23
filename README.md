# Hero Showroom — Premium Automotive Discovery Platform

## Overview
Hero Showroom is a production-grade, commercial-quality automotive discovery platform built to connect motorcycle and automotive buyers with premium brand showrooms, model catalogues, transparent specifications, and digital showroom experiences.

The product combines high-performance MERN architecture with a cinematic, luxury automotive visual design system.

---

## Tech Stack

### Frontend (`client/`)
- **Runtime & Build:** React, Vite
- **Styling & Design System:** Tailwind CSS
- **Motion & Interactions:** Framer Motion
- **Networking:** Axios
- **Iconography & Typography:** Refined modern automotive styling

### Backend (`server/`)
- **Runtime:** Node.js
- **Web Framework:** Express.js
- **Database & ODM:** MongoDB, Mongoose
- **Architecture:** Layered Architecture (`Routes → Controllers → Services → Models`)

### Tooling & Standards
- Git / GitHub
- Monorepo structure with npm workspaces
- Environment variable isolation (`.env`)

---

## Monorepo Architecture

```text
hero-showroom/
├── client/          # Frontend application (React + Vite)
├── server/          # Backend API services (Node.js + Express + Mongoose)
├── .gitignore       # Root Git ignore configuration
├── package.json     # Workspace management & root scripts
└── README.md        # Project documentation
```

### Module Responsibilities
- **`client/`**: Handles the user interface, cinematic motion, client-side routing, responsive UI components, design tokens, and HTTP communication via a centralized Axios instance.
- **`server/`**: Handles REST API routing, business logic in service layers, controller execution, schema definition, centralized error handling, and MongoDB Atlas connectivity.

---

## Planned Phase 1 Scope

Phase 1 establishes the production-ready architectural foundation and premium design system:

1. **Workspace & Monorepo Foundation** *(Step 1 - Current)*
   - Git repository setup, workspace orchestration scripts, and `.gitignore`.
2. **Backend API Foundation** *(Step 2)*
   - Express server configuration, CORS, JSON parsing, centralized error handling, 404 handler, MongoDB Atlas connection utility, and standardized `GET /api/health` endpoint.
3. **Frontend Application Foundation** *(Step 3)*
   - Vite + React scaffolding, Tailwind CSS automotive theme configuration, Framer Motion integration with `prefers-reduced-motion` compliance, and centralized Axios client.
4. **Design System & Reusable Components** *(Step 4)*
   - Premium component suite: Container, Section, Button, Card, Badge, Input, Loading, Error, and Empty states.
   - Global layout shell with responsive Header/Navigation and Footer.
5. **Routing & Homepage Foundation** *(Step 5)*
   - Route shells for `/`, `/showrooms`, `/bikes`, `/compare`, `/login`, `/register`, `/dashboard`, `/admin`.
   - Cinematic Homepage sections: Hero, Smart Search foundation, Top Brands, Popular Cities, Featured Bikes, Featured Showrooms, Benefits, and Final CTA.
6. **Integration Verification & Quality Checks** *(Step 6)*
   - Verification of frontend build, backend health endpoint, responsive layout without overflow, and clean console logs.

> **Note on Scope**: Business logic features (user authentication/JWT, showroom/bike CRUD, leads, test ride booking, customer reviews, favorites, and admin dashboards) are strictly scheduled for subsequent phases.

---

## Environment Variable Safety

Secrets, private keys, database credentials, and production tokens must **never** be committed to version control.
- Configuration templates are provided as `.env.example` in their respective directories.
- Actual `.env` files are ignored by `.gitignore` across the entire workspace.
- Each runtime environment reads its own isolated variables.

---

## Development Commands

Root-level convenience scripts for workspace orchestration:

| Command | Action |
| :--- | :--- |
| `npm run install:all` | Installs dependencies across both `server` and `client` |
| `npm run dev:client` | Starts the Vite development server (when client is initialized) |
| `npm run dev:server` | Starts the Express API server (when server is initialized) |
| `npm run build:client` | Builds production frontend bundle |
