-- CampusMove Multi-Tenant Transportation Database Schema

CREATE TABLE IF NOT EXISTS colleges (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    center_lat REAL DEFAULT 0,
    center_lng REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    college_id VARCHAR(36) REFERENCES colleges(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    phone VARCHAR(50),
    student_id VARCHAR(50),
    license_number VARCHAR(50),
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buses (
    id VARCHAR(36) PRIMARY KEY,
    college_id VARCHAR(36) REFERENCES colleges(id) ON DELETE CASCADE,
    bus_number VARCHAR(50) NOT NULL,
    license_plate VARCHAR(50) NOT NULL,
    capacity INTEGER DEFAULT 40,
    model VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    default_driver_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routes (
    id VARCHAR(36) PRIMARY KEY,
    college_id VARCHAR(36) REFERENCES colleges(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    path_coordinates TEXT,
    color VARCHAR(20) DEFAULT '#2563eb',
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stops (
    id VARCHAR(36) PRIMARY KEY,
    college_id VARCHAR(36) REFERENCES colleges(id) ON DELETE CASCADE,
    route_id VARCHAR(36) REFERENCES routes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    landmark VARCHAR(255),
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    sequence_order INTEGER NOT NULL,
    scheduled_time VARCHAR(20),
    geofence_radius_meters INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
    id VARCHAR(36) PRIMARY KEY,
    college_id VARCHAR(36) REFERENCES colleges(id) ON DELETE CASCADE,
    route_id VARCHAR(36) REFERENCES routes(id) ON DELETE CASCADE,
    bus_id VARCHAR(36) REFERENCES buses(id) ON DELETE CASCADE,
    driver_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    direction VARCHAR(20) DEFAULT 'OUTBOUND',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    current_lat REAL,
    current_lng REAL,
    current_speed REAL DEFAULT 0,
    current_heading REAL DEFAULT 0,
    current_accuracy REAL DEFAULT 0,
    current_stop_id VARCHAR(36) REFERENCES stops(id) ON DELETE SET NULL,
    passenger_count INTEGER DEFAULT 0,
    occupancy_status VARCHAR(30) DEFAULT 'SEATS_AVAILABLE',
    last_telemetry_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gps_telemetry (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) REFERENCES trips(id) ON DELETE CASCADE,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    speed REAL DEFAULT 0,
    heading REAL DEFAULT 0,
    accuracy REAL DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(36) PRIMARY KEY,
    college_id VARCHAR(36) REFERENCES colleges(id) ON DELETE CASCADE,
    route_id VARCHAR(36) REFERENCES routes(id) ON DELETE SET NULL,
    bus_id VARCHAR(36) REFERENCES buses(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'INFO',
    is_active INTEGER DEFAULT 1,
    created_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_stop_events (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) REFERENCES trips(id) ON DELETE CASCADE,
    stop_id VARCHAR(36) REFERENCES stops(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_users_college ON users(college_id);
CREATE INDEX IF NOT EXISTS idx_buses_college ON buses(college_id);
CREATE INDEX IF NOT EXISTS idx_routes_college ON routes(college_id);
CREATE INDEX IF NOT EXISTS idx_stops_route ON stops(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_college_status ON trips(college_id, status);
CREATE INDEX IF NOT EXISTS idx_telemetry_trip ON gps_telemetry(trip_id);
CREATE INDEX IF NOT EXISTS idx_alerts_college_active ON alerts(college_id, is_active);
