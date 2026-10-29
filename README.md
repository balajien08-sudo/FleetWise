# FleetWise — Enterprise Fleet & Delivery Management Platform

> **Tagline:** Smart Dispatch. Zero Double-Booking. Complete Visibility.  
> **Contest:** IT HAPPENS @ RAALE #13  
> **Architecture:** Production-Grade Full-Stack SaaS (React 18 + TypeScript + Vite + Tailwind CSS + Node.js + Express + Prisma ORM + SQLite + Bcrypt + RBAC + Vitest)

---

## 🌟 Executive Summary

**FleetWise** is a commercial-grade, secure, database-backed fleet and delivery dispatch management platform engineered to resolve the operational and concurrency challenges of logistics resource allocation. The core engine guarantees **zero double-booking** through atomic database transactions and concurrency guards, while providing server-side role-based access control (RBAC), HttpOnly session cookies, brute-force rate limiting, and end-to-end visibility across deliveries, drivers, vehicles, and audit trails.

---

## 🔐 Security & Access Control Architecture

FleetWise implements defense-in-depth security principles across backend APIs, sessions, database transactions, and frontend UI guards:

### 1. Dual-Tier Server-Enforced RBAC
| Permission / Feature | Administrator (`ADMIN`) | Dispatcher (`DISPATCHER`) |
|---|:---:|:---:|
| **Operational Dashboards & Metrics** | ✅ Full Access | ✅ Full Access |
| **Smart Dispatch Workspace** | ✅ Full Access | ✅ Full Access |
| **Delivery Orders (Create, Edit, Transition)** | ✅ Full Access | ✅ Full Access |
| **Live Tracking & Route Timeline** | ✅ Full Access | ✅ Full Access |
| **Fleet & Driver Roster (View & Update)** | ✅ Full Access | ✅ Full Access |
| **Delete Fleet Vehicles & Drivers** | ✅ Authorized | ❌ Forbidden (HTTP 403) |
| **Hard-Delete Delivery Records** | ✅ Authorized | ❌ Forbidden (HTTP 403) |
| **Analytics & CSV Data Export** | ✅ Full Access | ✅ Full Access |
| **Audit Activity Log** | ✅ Full Access | ✅ Read-Only (HTTP 200) |
| **User & Role Administration (`/api/users`)** | ✅ Authorized | ❌ Forbidden (HTTP 403) |
| **System Demo Database Reset** | ✅ Authorized | ❌ Forbidden (HTTP 403) |

### 2. Authentication & Session Management
- **Password Security:** Salted and hashed using `bcrypt` (10 rounds). Plaintext passwords are never stored in the database or transmitted in frontend code.
- **Session Architecture:** Server-side `Session` table records cryptographically secure tokens. Raw tokens (32 random bytes) are hashed with SHA-256 before persistence.
- **HttpOnly Cookies:** Session tokens are delivered via `HttpOnly`, `SameSite: 'lax'`, `path: '/'` cookies, blocking cross-site scripting (XSS) extraction. Bearer tokens are also supported for headless API clients and integration test runners.
- **Anti-Brute-Force Rate Limiting:** Failed login attempts are tracked per IP and identifier. After 5 consecutive failures, the account is temporarily locked with HTTP 429 for 15 minutes.
- **Session Invalidation:** Logging out explicitly deletes the session record from the SQLite database and clears the client cookie.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts |
| **Backend** | Node.js, Express.js, TypeScript |
| **Security & Auth** | bcryptjs, cookie-parser, crypto, server-side RBAC middleware |
| **ORM & Database** | Prisma ORM, SQLite (`dev.db`) |
| **Validation** | Zod v3 schema validation |
| **Automated Testing** | Vitest v2, Supertest v7 (15/15 integration tests passing) |
| **Design System** | Midnight navy sidebar (`#0a0f1d`), soft-slate workspace (`#f8fafc`), electric blue accents (`#2563eb`), emerald green success states (`#10b981`), Inter typography |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### Installation & Database Initialization

```bash
# 1. Open the repository root
cd FLEETWISE

# 2. Configure backend environment
cd backend
cp .env.example .env

# 3. Install backend dependencies & sync schema
npm install
npx prisma db push
npm run seed

# 4. Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### Running the Application

Start both servers concurrently:

#### Terminal 1 — Backend API (Port 5001)
```bash
cd backend
npm run dev
# API runs on: http://localhost:5001
# Health check: http://localhost:5001/api/health
```

#### Terminal 2 — Frontend Application (Port 5173)
```bash
cd frontend
npm run dev
# Frontend runs on: http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Default Credentials & Provisioning

The database seed provisions two default accounts safely without wiping them on subsequent demo resets:

| Role | Username / Identifier | Email | Password |
|---|---|---|---|
| **Administrator** | `admin` | `admin@fleetwise.in` | `Admin@12345` |
| **Dispatcher** | `dispatcher` | `dispatcher@fleetwise.in` | `Dispatch@12345` |

*Quick login buttons on the login screen automatically populate these credentials for convenient evaluation.*

---

## 🧪 Automated Testing (15 Core Test Scenarios)

The automated test suite verifies authentication, RBAC authorization, persistence, concurrency conflict handling, delivery state transitions, and audit logging.

To run the complete test suite:

```bash
cd backend
npm test
```

### Verified Test Results

```
 ✓ tests/fleetwise.test.ts (15) 3686ms
   ✓ FleetWise — Full-Stack Security, Dispatch Reliability & Verification (15) 3686ms
     ✓ 1. Unauthenticated users cannot access protected APIs (HTTP 401)
     ✓ 2. Dispatcher users cannot invoke administrator-only endpoints (HTTP 403)
     ✓ 3. Invalid credentials are rejected (HTTP 401) and rate-limited
     ✓ 4. Valid users can log in and log out safely with session invalidation
     ✓ 5. A newly created delivery remains persisted in database
     ✓ 6. Invalid vehicle, driver, cargo capacity, and delivery status are rejected
     ✓ 7. A vehicle already assigned to an active delivery cannot be double-booked
     ✓ 8. A driver already assigned to an active delivery cannot be double-booked
     ✓ 9. Concurrent dispatch requests competing for the same vehicle result in at most one success
     ✓ 10. Failed dispatch operations leave no partial assignment and do not corrupt resource availability
     ✓ 11. Completing or cancelling a delivery releases eligible resources correctly
     ✓ 12. Dashboard and analytics metrics match persisted database records
     ✓ 13. Audit entries are created for successful and rejected dispatch operations
     ✓ 14. System health endpoint accurately reflects real database connectivity
     ✓ 15. Administrator can create, list, update, and manage user accounts

 Test Files  1 passed (1)
      Tests  15 passed (15)
```

---

## 🛡️ Atomic Zero-Double-Booking Dispatch Engine

The core business rule states that a vehicle or driver must never be allocated to two overlapping active deliveries.

```
                    [ DISPATCH INITIATION ]
                              │
                    [ BEGIN TX (SQLite) ]
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
   [ Check Delivery State ]          [ Check Vehicle State ]
   - Must exist                      - Must exist
   - Must be 'pending'               - Must be 'available'
   - Cargo capacity <= vehicle cap   - Not in maintenance/inactive
             │                                 │
             └────────────────┬────────────────┘
                              │
                     [ Check Driver State ]
                     - Must exist
                     - Availability == 'available'
                              │
                [ Strict Secondary Query ]
                - No active assignment for vehicle
                - No active assignment for driver
                              │
             ┌────────────────┴────────────────┐
             ▼ (Any check fails)               ▼ (All pass)
     [ HTTP 409 CONFLICT ]            [ Commit Assignment ]
     - Rollback all changes           - Update Delivery: assigned
     - Log ASSIGNMENT_REJECTED        - Update Vehicle: assigned
     - Zero partial state             - Update Driver: assigned
                                      - Insert Assignment row
                                      - Log ASSIGNMENT_CREATED
                                      - COMMIT TRANSACTION
```

---

## 📋 Delivery Lifecycle State Transitions

```
[ PENDING ] ──(Assign)──> [ ASSIGNED ] ──(Dispatch)──> [ IN TRANSIT ] ──(Complete)──> [ DELIVERED ]
     │                          │                              │                              │
     └──(Cancel)────────────────┴──────(Cancel)────────────────┴──────(Cancel)────────────────┘
                                                │
                                       [ CANCELLED ]
                       (Releases Vehicle & Driver to 'available')
```

---

## 🔍 Troubleshooting & FAQs

### 1. Port 5000 in use on macOS
macOS Monterey and newer reserve port 5000 for Apple AirPlay Receiver (`ControlCenter`). FleetWise is pre-configured to run the backend on **Port 5001** and proxy Vite dev requests from port 5173 to port 5001.

### 2. Resetting the Demo Environment
Administrators can click **"Reset Demo"** in the top navigation bar or navigate to **System Settings** and trigger the baseline reset. This repopulates delivery **D-204** (pending, 500kg cargo), vehicle **V-101** (available, 1200kg), and driver **D-01** (Rajesh Kumar, available) while preserving user accounts.
