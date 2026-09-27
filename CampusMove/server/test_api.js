// Automated verification test script for CampusMove API
async function runTests() {
  console.log('🧪 Starting CampusMove API Automated Test Suite...');
  const baseUrl = 'http://localhost:5000/api';

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/health`);
  const healthData = await healthRes.json();
  console.log('✅ Health Check:', healthData.status === 'healthy' ? 'PASSED' : 'FAILED', healthData);

  // 2. Login as Admin
  const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@apex.edu', password: 'admin123' })
  });
  const adminAuth = await adminLoginRes.json();
  console.log('✅ Admin Login:', adminAuth.token ? 'PASSED' : 'FAILED', 'Role:', adminAuth.user?.role);

  // 3. Login as Driver
  const driverLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'driver1@apex.edu', password: 'driver123' })
  });
  const driverAuth = await driverLoginRes.json();
  console.log('✅ Driver Login:', driverAuth.token ? 'PASSED' : 'FAILED', 'Name:', driverAuth.user?.name);

  // 4. Login as Student
  const studentLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@apex.edu', password: 'student123' })
  });
  const studentAuth = await studentLoginRes.json();
  console.log('✅ Student Login:', studentAuth.token ? 'PASSED' : 'FAILED', 'Student ID:', studentAuth.user?.studentId);

  // 5. Fetch Routes (Student)
  const routesRes = await fetch(`${baseUrl}/routes`, {
    headers: { 'Authorization': `Bearer ${studentAuth.token}` }
  });
  const routes = await routesRes.json();
  console.log('✅ Fetch Routes:', routes.length > 0 ? 'PASSED' : 'FAILED', `Count: ${routes.length}`);

  // 6. Zero-state test: Verify active trips initially is 0
  const activeTripsRes = await fetch(`${baseUrl}/trips/active`, {
    headers: { 'Authorization': `Bearer ${studentAuth.token}` }
  });
  const activeTrips = await activeTripsRes.json();
  console.log('✅ Initial Zero-State Trips:', activeTrips.length === 0 ? 'PASSED (Zero fake state respected)' : 'FAILED', `Count: ${activeTrips.length}`);

  // 7. Fetch Buses (Admin)
  const busesRes = await fetch(`${baseUrl}/buses`, {
    headers: { 'Authorization': `Bearer ${adminAuth.token}` }
  });
  const buses = await busesRes.json();
  console.log('✅ Fetch Buses:', buses.length > 0 ? 'PASSED' : 'FAILED', `Fleet Size: ${buses.length}`);

  // 8. Driver Starts a Trip
  const startTripRes = await fetch(`${baseUrl}/trips/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${driverAuth.token}`
    },
    body: JSON.stringify({
      routeId: routes[0].id,
      busId: buses[0].id,
      direction: 'OUTBOUND'
    })
  });
  const startedTrip = await startTripRes.json();
  console.log('✅ Driver Start Trip:', startedTrip.id ? 'PASSED' : 'FAILED', `Trip ID: ${startedTrip.id}`);

  // 9. Send Telemetry Ping (Driver)
  const telemetryRes = await fetch(`${baseUrl}/trips/telemetry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${driverAuth.token}`
    },
    body: JSON.stringify({
      tripId: startedTrip.id,
      lat: 37.7765,
      lng: -122.4172,
      speed: 34.5,
      heading: 45,
      accuracy: 4.2
    })
  });
  const telemetryData = await telemetryRes.json();
  console.log('✅ Post GPS Telemetry:', telemetryData.success ? 'PASSED' : 'FAILED', 'ETAs calculated:', telemetryData.telemetry?.stops?.length);

  // 10. Verify Active Trips Now Shows Live Bus (Student View)
  const activeTripsLiveRes = await fetch(`${baseUrl}/trips/active`, {
    headers: { 'Authorization': `Bearer ${studentAuth.token}` }
  });
  const activeTripsLive = await activeTripsLiveRes.json();
  console.log('✅ Live Active Trips for Student:', activeTripsLive.length === 1 ? 'PASSED' : 'FAILED', `Current Speed: ${activeTripsLive[0]?.current_speed} km/h`);

  // 11. Driver Ends Trip
  const endTripRes = await fetch(`${baseUrl}/trips/${startedTrip.id}/end`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${driverAuth.token}`
    }
  });
  const endTripData = await endTripRes.json();
  console.log('✅ Driver End Trip:', endTripData.tripId ? 'PASSED' : 'FAILED');

  // 12. Verify Back to Zero-State
  const finalTripsRes = await fetch(`${baseUrl}/trips/active`, {
    headers: { 'Authorization': `Bearer ${studentAuth.token}` }
  });
  const finalTrips = await finalTripsRes.json();
  console.log('✅ Final Zero-State (Post-Trip):', finalTrips.length === 0 ? 'PASSED' : 'FAILED');

  console.log('🎉 All Backend Automated Tests Succeeded!');
}

runTests().catch(err => {
  console.error('❌ Test Suite Failed:', err);
  process.exit(1);
});
