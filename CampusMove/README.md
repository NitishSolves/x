# CampusMove — Real-Time Campus Bus Tracking Platform

Production-ready, multi-college campus transportation platform featuring real-time GPS bus tracking, mobile driver cockpits, student live views with dynamic stop ETAs, and an administrative control tower.

---

## 🌟 Core Product Principles

1. **Real-Time First**: Low-latency Socket.IO telemetry pipeline. Live moving bus markers, heading angle rotation, and dynamic stop arrival estimation based on rolling velocity.
2. **No Fake State**: Strictly zero simulated passengers or fictitious buses in production. Honest zero-states (*"No active buses currently tracking on this route"*) are rendered until a driver starts their shift.
3. **Smartphone as GPS Beacon**: No proprietary hardware boxes required. Drivers use their standard phone browser to broadcast GPS coordinates.
4. **Multi-Tenant Isolation**: Strict tenant scoping by College ID across all database queries, API endpoints, and Socket rooms.
5. **PostgreSQL on Neon Ready**: Native PostgreSQL connection pooling with standard ANSI SQL migrations, with an automatic zero-dependency local SQLite engine fallback for instant local execution.

---

## 🏗️ Architecture

```
CampusMove/
├── server/                        # Express + Socket.IO + PostgreSQL (Neon) / SQLite
│   ├── src/
│   │   ├── config/                # Unified DB adapter & environment config
│   │   ├── db/                    # schema.sql, migrate.js, seed.js
│   │   ├── middleware/            # JWT authentication, role guards, tenant scoping
│   │   ├── controllers/           # Auth, Buses, Routes, Stops, Drivers, Trips, Alerts, Analytics
│   │   ├── routes/                # Express API routes
│   │   ├── services/              # GPS validation, Haversine formula, dynamic ETAs
│   │   ├── sockets/               # Real-time telemetry gateway & room broadcasts
│   │   └── index.js               # Server entry point
├── client/                        # React 18 + Vite + Tailwind CSS + Leaflet
│   ├── src/
│   │   ├── api/                   # API client with token interceptor
│   │   ├── context/               # AuthContext, SocketContext
│   │   ├── components/            # LiveBusMap, StopTimeline, GpsStatusBadge, OccupancyControl, Modals
│   │   ├── pages/                 # LandingPage, LoginPage, RegisterPage, StudentView, DriverView, AdminDashboard
│   │   ├── App.jsx
│   │   └── main.jsx
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18+ (Node 24 recommended)
- **npm**: v9+

### 2. Install Dependencies
```bash
# In the root directory:
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 3. Initialize & Seed Database
```bash
npm run seed
```

### 4. Run Fullstack Application
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Seed Test Accounts

All accounts belong to the seed tenant **Apex Institute of Technology (AIT)**:

| Role | Email | Password | Features Accessible |
|---|---|---|---|
| **Admin** | `admin@apex.edu` | `admin123` | Multi-bus Live Fleet Radar, Fleet CRUD, Route & Stop Builder, Driver Roster, Incident Dispatcher |
| **Driver 1** | `driver1@apex.edu` | `driver123` | Mobile Cockpit, Start/End Trip, Live GPS Broadcast, Stop Check-In, Occupancy +/- Toggle, Emergency SOS |
| **Driver 2** | `driver2@apex.edu` | `driver123` | Assigned to Bus 202 (Express Red) |
| **Student** | `student@apex.edu` | `student123` | Live Bus Tracking Map, Dynamic Stop ETAs, Occupancy Indicator, Route Timetables, Campus Alerts |

*(You can also use the 1-click **Instant Interactive Demo** buttons on the Landing Page or Login Page).*

---

## ☁️ Deploying to Neon PostgreSQL

To connect to a production **PostgreSQL on Neon** database:

1. Create a PostgreSQL project on [Neon.tech](https://neon.tech).
2. Copy your connection string (`postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`).
3. Set the environment variable in your production host (or `server/.env`):
   ```env
   DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Run migrations on your Neon database:
   ```bash
   npm run seed
   ```
   CampusMove automatically detects the `DATABASE_URL` and switches from local SQLite to PostgreSQL on Neon with connection pooling!

---

## 📡 Real-Time Socket.IO Telemetry Events

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join:trip` | Client → Server | `tripId` | Subscribes client to high-frequency telemetry of a trip |
| `driver:telemetry` | Driver → Server | `{ tripId, lat, lng, speed, heading, accuracy }` | Ingests GPS point, validates bounds/speed, recalculates stop ETAs |
| `trip:telemetry` | Server → Room | `{ tripId, lat, lng, speed, heading, accuracy, stops: [...] }` | Broadcasts live coordinates and dynamic ETAs to waiting students & admin radar |
| `driver:occupancy_update` | Driver → Server | `{ tripId, occupancyStatus, passengerCount }` | Updates live seat capacity (Empty / Seats Open / Standing / Full) |
| `driver:stop_checkin` | Driver → Server | `{ tripId, stopId }` | Records arrival event and advances next upcoming stop |
| `alert:broadcast` | Admin/Driver → Server | `{ id, title, message, severity, routeId }` | Instant college-wide notice banner |
