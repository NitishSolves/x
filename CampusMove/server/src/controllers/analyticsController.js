import db from '../config/db.js';

export async function getDashboardStats(req, res) {
  try {
    const collegeId = req.user.collegeId;

    // 1. Total buses
    const busesResult = await db.query(
      `SELECT COUNT(*) as total_buses,
              SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_buses,
              SUM(CASE WHEN status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance_buses
       FROM buses
       WHERE college_id = $1`,
      [collegeId]
    );

    // 2. Active trips on road right now
    const tripsResult = await db.query(
      `SELECT COUNT(*) as trips_on_road,
              SUM(passenger_count) as total_passengers_onboard
       FROM trips
       WHERE college_id = $1 AND status = 'IN_PROGRESS'`,
      [collegeId]
    );

    // 3. Total routes
    const routesResult = await db.query(
      `SELECT COUNT(*) as total_routes FROM routes WHERE college_id = $1 AND is_active = 1`,
      [collegeId]
    );

    // 4. Total drivers
    const driversResult = await db.query(
      `SELECT COUNT(*) as total_drivers FROM users WHERE college_id = $1 AND role = 'DRIVER' AND is_active = 1`,
      [collegeId]
    );

    // 5. Active alerts
    const alertsResult = await db.query(
      `SELECT COUNT(*) as active_alerts FROM alerts WHERE college_id = $1 AND is_active = 1`,
      [collegeId]
    );

    // 6. Completed trips count
    const completedTripsResult = await db.query(
      `SELECT COUNT(*) as completed_trips FROM trips WHERE college_id = $1 AND status = 'COMPLETED'`,
      [collegeId]
    );

    // 7. Recent completed trips log
    const recentTripsResult = await db.query(
      `SELECT t.id, t.direction, t.start_time, t.end_time, t.passenger_count,
              b.bus_number, r.name as route_name, r.code as route_code, u.name as driver_name
       FROM trips t
       JOIN buses b ON t.bus_id = b.id
       JOIN routes r ON t.route_id = r.id
       JOIN users u ON t.driver_id = u.id
       WHERE t.college_id = $1 AND t.status = 'COMPLETED'
       ORDER BY t.end_time DESC
       LIMIT 10`,
      [collegeId]
    );

    const busesData = busesResult.rows[0];
    const tripsData = tripsResult.rows[0];

    res.json({
      totalBuses: parseInt(busesData.total_buses || 0, 10),
      activeBuses: parseInt(busesData.active_buses || 0, 10),
      maintenanceBuses: parseInt(busesData.maintenance_buses || 0, 10),
      tripsOnRoad: parseInt(tripsData.trips_on_road || 0, 10),
      passengersOnboard: parseInt(tripsData.total_passengers_onboard || 0, 10),
      totalRoutes: parseInt(routesResult.rows[0].total_routes || 0, 10),
      totalDrivers: parseInt(driversResult.rows[0].total_drivers || 0, 10),
      activeAlerts: parseInt(alertsResult.rows[0].active_alerts || 0, 10),
      completedTrips: parseInt(completedTripsResult.rows[0].completed_trips || 0, 10),
      recentCompletedTrips: recentTripsResult.rows
    });
  } catch (err) {
    console.error('[Get Dashboard Stats Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics.' });
  }
}
