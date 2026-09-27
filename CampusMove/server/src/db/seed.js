import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import db from '../config/db.js';
import { runMigrations } from './migrate.js';

function generateId() {
  return crypto.randomUUID();
}

export async function seedDatabase() {
  console.log('[Seed] Seeding initial production data...');

  // Ensure tables exist
  await runMigrations();

  // Check if colleges already exist
  const existingColleges = await db.query('SELECT count(*) as count FROM colleges');
  const count = parseInt(existingColleges.rows[0].count, 10);
  if (count > 0) {
    console.log('[Seed] Database already seeded. Skipping.');
    return;
  }

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);
  const driverPasswordHash = await bcrypt.hash('driver123', saltRounds);
  const studentPasswordHash = await bcrypt.hash('student123', saltRounds);

  // 1. Colleges
  const apexCollegeId = generateId();
  const metroCollegeId = generateId();

  await db.query(
    `INSERT INTO colleges (id, name, slug, code, address, center_lat, center_lng)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      apexCollegeId,
      'Apex Institute of Technology',
      'apex-tech',
      'AIT',
      '100 University Ave, Tech District, CA',
      37.7749,
      -122.4194
    ]
  );

  await db.query(
    `INSERT INTO colleges (id, name, slug, code, address, center_lat, center_lng)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      metroCollegeId,
      'Metro State University',
      'metro-state',
      'MSU',
      '500 College Blvd, Metro Center, NY',
      40.7128,
      -74.0060
    ]
  );

  // 2. Users (Apex)
  const apexAdminId = generateId();
  const driver1Id = generateId();
  const driver2Id = generateId();
  const student1Id = generateId();

  await db.query(
    `INSERT INTO users (id, college_id, name, email, password_hash, role, phone, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
    [apexAdminId, apexCollegeId, 'Apex Campus Admin', 'admin@apex.edu', adminPasswordHash, 'ADMIN', '+1-555-0100']
  );

  await db.query(
    `INSERT INTO users (id, college_id, name, email, password_hash, role, phone, license_number, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)`,
    [driver1Id, apexCollegeId, 'Marcus Vance', 'driver1@apex.edu', driverPasswordHash, 'DRIVER', '+1-555-0192', 'CDL-99238']
  );

  await db.query(
    `INSERT INTO users (id, college_id, name, email, password_hash, role, phone, license_number, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)`,
    [driver2Id, apexCollegeId, 'Sarah Jenkins', 'driver2@apex.edu', driverPasswordHash, 'DRIVER', '+1-555-0184', 'CDL-88421']
  );

  await db.query(
    `INSERT INTO users (id, college_id, name, email, password_hash, role, student_id, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
    [student1Id, apexCollegeId, 'Alex Rivera', 'student@apex.edu', studentPasswordHash, 'STUDENT', 'AIT-2024-890']
  );

  // Users (Metro State - Multi-tenant isolation test)
  const metroAdminId = generateId();
  const metroStudentId = generateId();
  await db.query(
    `INSERT INTO users (id, college_id, name, email, password_hash, role, phone, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
    [metroAdminId, metroCollegeId, 'Metro Admin', 'admin@metro.edu', adminPasswordHash, 'ADMIN', '+1-555-0200']
  );

  await db.query(
    `INSERT INTO users (id, college_id, name, email, password_hash, role, student_id, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
    [metroStudentId, metroCollegeId, 'Jordan Lee', 'student@metro.edu', studentPasswordHash, 'STUDENT', 'MSU-2024-112']
  );

  // 3. Buses (Apex)
  const bus1Id = generateId();
  const bus2Id = generateId();
  const bus3Id = generateId();

  await db.query(
    `INSERT INTO buses (id, college_id, bus_number, license_plate, capacity, model, status, default_driver_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [bus1Id, apexCollegeId, 'Bus 101 (Apex Blue)', 'APX-101', 45, 'Volvo 9700 Luxury', 'ACTIVE', driver1Id]
  );

  await db.query(
    `INSERT INTO buses (id, college_id, bus_number, license_plate, capacity, model, status, default_driver_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [bus2Id, apexCollegeId, 'Bus 202 (Express Red)', 'APX-202', 36, 'Mercedes Tourismo', 'ACTIVE', driver2Id]
  );

  await db.query(
    `INSERT INTO buses (id, college_id, bus_number, license_plate, capacity, model, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [bus3Id, apexCollegeId, 'Bus 303 (Campus Eco)', 'APX-303', 50, 'BYD K9 Electric', 'ACTIVE']
  );

  // 4. Routes (Apex)
  const route1Id = generateId();
  const route2Id = generateId();

  // Route 1 path coordinates: Realistic campus path
  const route1Coords = [
    [37.7749, -122.4194],
    [37.7765, -122.4172],
    [37.7790, -122.4140],
    [37.7820, -122.4100],
    [37.7850, -122.4060],
    [37.7885, -122.4015],
    [37.7920, -122.3970],
    [37.7955, -122.3930]
  ];

  await db.query(
    `INSERT INTO routes (id, college_id, name, code, origin, destination, path_coordinates, color, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)`,
    [
      route1Id,
      apexCollegeId,
      'North Campus Express',
      'NC-101',
      'Apex Transit Hub',
      'North Innovation Park',
      JSON.stringify(route1Coords),
      '#2563eb'
    ]
  );

  // Route 2 path coordinates
  const route2Coords = [
    [37.7749, -122.4194],
    [37.7710, -122.4230],
    [37.7665, -122.4270],
    [37.7620, -122.4310],
    [37.7580, -122.4355]
  ];

  await db.query(
    `INSERT INTO routes (id, college_id, name, code, origin, destination, path_coordinates, color, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)`,
    [
      route2Id,
      apexCollegeId,
      'South Metro Link',
      'SM-202',
      'Apex Transit Hub',
      'South Metro Station',
      JSON.stringify(route2Coords),
      '#10b981'
    ]
  );

  // 5. Stops (Apex Route 1)
  const stopsR1 = [
    { name: 'Apex Transit Hub (Bay 1)', landmark: 'Main Gate & Student Union', lat: 37.7749, lng: -122.4194, seq: 1, time: '08:00 AM' },
    { name: 'Engineering & Computing Hall', landmark: 'Building 4B East Entrance', lat: 37.7790, lng: -122.4140, seq: 2, time: '08:12 AM' },
    { name: 'Science Quad & Bio-Labs', landmark: 'Opposite Central Fountain', lat: 37.7850, lng: -122.4060, seq: 3, time: '08:24 AM' },
    { name: 'North Residential Village', landmark: 'Dining Commons Pavilion', lat: 37.7885, lng: -122.4015, seq: 4, time: '08:38 AM' },
    { name: 'North Innovation Park', landmark: 'Terminal Gate & Biotech Hub', lat: 37.7955, lng: -122.3930, seq: 5, time: '08:50 AM' }
  ];

  for (const s of stopsR1) {
    await db.query(
      `INSERT INTO stops (id, college_id, route_id, name, landmark, lat, lng, sequence_order, scheduled_time, geofence_radius_meters)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 100)`,
      [generateId(), apexCollegeId, route1Id, s.name, s.landmark, s.lat, s.lng, s.seq, s.time]
    );
  }

  // Stops (Apex Route 2)
  const stopsR2 = [
    { name: 'Apex Transit Hub (Bay 3)', landmark: 'South Concourse', lat: 37.7749, lng: -122.4194, seq: 1, time: '08:15 AM' },
    { name: 'Athletics & Stadium Complex', landmark: 'Gate 2 Arena', lat: 37.7710, lng: -122.4230, seq: 2, time: '08:25 AM' },
    { name: 'Health & Wellness Center', landmark: 'Emergency Clinic Lot', lat: 37.7665, lng: -122.4270, seq: 3, time: '08:35 AM' },
    { name: 'South Metro Station Interchange', landmark: 'Train Platform Connector', lat: 37.7580, lng: -122.4355, seq: 4, time: '08:48 AM' }
  ];

  for (const s of stopsR2) {
    await db.query(
      `INSERT INTO stops (id, college_id, route_id, name, landmark, lat, lng, sequence_order, scheduled_time, geofence_radius_meters)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 100)`,
      [generateId(), apexCollegeId, route2Id, s.name, s.landmark, s.lat, s.lng, s.seq, s.time]
    );
  }

  // 6. Realistic Campus Alert
  await db.query(
    `INSERT INTO alerts (id, college_id, route_id, title, message, severity, is_active, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, 1, $7)`,
    [
      generateId(),
      apexCollegeId,
      route1Id,
      'Normal Schedule Resumed on Route NC-101',
      'Morning maintenance is complete. Drivers are on regular schedule.',
      'INFO',
      apexAdminId
    ]
  );

  console.log('[Seed] Database seeding completed successfully!');
  console.log('--- TEST ACCOUNTS SEEDED ---');
  console.log('College: Apex Institute of Technology (AIT)');
  console.log('Admin:   admin@apex.edu   / admin123');
  console.log('Driver1: driver1@apex.edu / driver123 (Marcus Vance)');
  console.log('Driver2: driver2@apex.edu / driver123 (Sarah Jenkins)');
  console.log('Student: student@apex.edu / student123 (Alex Rivera)');
  console.log('----------------------------');
}

// Run if called directly
import { fileURLToPath as fUrl } from 'node:url';
if (process.argv[1] === fUrl(import.meta.url)) {
  seedDatabase()
    .then(() => {
      console.log('[Seed] Finished!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}
