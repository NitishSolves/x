import React, { useState, useEffect, useRef } from 'react';
import { Bus, Navigation, Play, Square, AlertTriangle, CheckCircle, Radio, Compass, MapPin, Gauge } from 'lucide-react';
import { api } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import GpsStatusBadge from '../components/driver/GpsStatusBadge';
import OccupancyControl from '../components/driver/OccupancyControl';
import EmergencyModal from '../components/driver/EmergencyModal';

export default function DriverView() {
  const { user } = useAuth();
  const { socket, joinTrip, leaveTrip } = useSocket();

  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedBusId, setSelectedBusId] = useState('');
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live Telemetry State
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentAccuracy, setCurrentAccuracy] = useState(5);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  const watchIdRef = useRef(null);
  const testIntervalRef = useRef(null);

  // 1. Load Driver's College Routes and Buses
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [routesList, busesList, activeTrips] = await Promise.all([
          api.routes.getAll(),
          api.buses.getAll(),
          api.trips.getActive(),
        ]);

        setRoutes(routesList);
        setBuses(busesList);

        if (routesList.length > 0) setSelectedRouteId(routesList[0].id);

        // Pre-select assigned bus for this driver if configured
        const myBus = busesList.find((b) => b.default_driver_id === user?.id);
        if (myBus) {
          setSelectedBusId(myBus.id);
        } else if (busesList.length > 0) {
          setSelectedBusId(busesList[0].id);
        }

        // Check if driver already has an in-progress trip
        const myActiveTrip = activeTrips.find((t) => t.driver_id === user?.id);
        if (myActiveTrip) {
          setActiveTrip(myActiveTrip);
          setSelectedRouteId(myActiveTrip.route_id);
          setSelectedBusId(myActiveTrip.bus_id);
          joinTrip(myActiveTrip.id);
        }
      } catch (err) {
        console.error('[DriverView] Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.id]);

  // 2. Start Trip Handler
  const handleStartTrip = async () => {
    if (!selectedRouteId || !selectedBusId) {
      alert('Please select both a Route and a Bus.');
      return;
    }

    try {
      const trip = await api.trips.start({
        routeId: selectedRouteId,
        busId: selectedBusId,
        direction: 'OUTBOUND',
      });

      setActiveTrip(trip);
      joinTrip(trip.id);
    } catch (err) {
      alert(`Could not start trip: ${err.message}`);
    }
  };

  // 3. End Trip Handler
  const handleEndTrip = async () => {
    if (!activeTrip) return;
    const confirm = window.confirm('Are you sure you want to end this trip? Real-time broadcasting will stop.');
    if (!confirm) return;

    try {
      await api.trips.end(activeTrip.id);
      leaveTrip(activeTrip.id);
      setActiveTrip(null);
      stopTracking();
    } catch (err) {
      alert(`Failed to end trip: ${err.message}`);
    }
  };

  // 4. GPS Tracking Logic (Device HTML5 Geolocation API vs Route Test Drive Mode)
  useEffect(() => {
    if (!activeTrip) {
      stopTracking();
      return;
    }

    if (isTestMode) {
      // TEST DRIVE MODE: Simulate movement along the route coordinates at realistic bus speed
      startRouteSimulation();
    } else {
      // PRODUCTION REAL GPS MODE: Use browser Geolocation API
      startDeviceGps();
    }

    return () => {
      stopTracking();
    };
  }, [activeTrip?.id, isTestMode]);

  const startDeviceGps = () => {
    stopTracking();

    if (!('geolocation' in navigator)) {
      alert('Geolocation API is not supported on this browser.');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading, accuracy } = pos.coords;
        const speedKmH = speed ? speed * 3.6 : 28; // realistic default if stationary
        const head = heading || 45;

        setCurrentCoords([latitude, longitude]);
        setCurrentSpeed(speedKmH);
        setCurrentAccuracy(accuracy || 5);
        setCurrentHeading(head);

        // Send telemetry ping via Socket.IO
        emitTelemetry(latitude, longitude, speedKmH, head, accuracy || 5);
      },
      (err) => {
        console.warn('[Driver GPS Error]:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );
  };

  const startRouteSimulation = () => {
    stopTracking();

    const selectedRoute = routes.find((r) => r.id === activeTrip.route_id);
    const coords = selectedRoute?.path_coordinates || [
      [37.7749, -122.4194],
      [37.7790, -122.4140],
      [37.7850, -122.4060],
      [37.7885, -122.4015],
      [37.7955, -122.3930],
    ];

    let step = 0;
    testIntervalRef.current = setInterval(() => {
      const point = coords[step % coords.length];
      const nextPoint = coords[(step + 1) % coords.length];
      const speedKmH = 32 + Math.floor(Math.random() * 8); // 32-40 km/h
      const heading = (step * 45) % 360;

      setCurrentCoords(point);
      setCurrentSpeed(speedKmH);
      setCurrentAccuracy(3.5);
      setCurrentHeading(heading);

      emitTelemetry(point[0], point[1], speedKmH, heading, 3.5);
      step++;
    }, 3000);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
  };

  const emitTelemetry = (lat, lng, speed, heading, accuracy) => {
    if (!activeTrip) return;

    const payload = {
      tripId: activeTrip.id,
      lat,
      lng,
      speed,
      heading,
      accuracy,
    };

    if (socket && socket.connected) {
      socket.emit('driver:telemetry', payload);
    } else {
      // Fallback to REST endpoint if socket disconnected
      api.trips.postTelemetry(payload).catch((e) => console.warn('REST telemetry ping error:', e));
    }
  };

  // 5. Occupancy Updates
  const handleOccupancyStatusChange = async (status) => {
    if (!activeTrip) return;
    try {
      await api.trips.updateOccupancy(activeTrip.id, { occupancyStatus: status });
      setActiveTrip((prev) => ({ ...prev, occupancy_status: status }));
    } catch (e) {
      console.error('Failed to update occupancy:', e);
    }
  };

  const handlePassengerCountChange = async (count) => {
    if (!activeTrip) return;
    try {
      await api.trips.updateOccupancy(activeTrip.id, { passengerCount: count });
      setActiveTrip((prev) => ({ ...prev, passenger_count: count }));
    } catch (e) {
      console.error('Failed to update passenger count:', e);
    }
  };

  // 6. Stop Arrival Check-In
  const handleStopCheckin = async (stopId) => {
    if (!activeTrip) return;
    try {
      await api.trips.checkinStop(activeTrip.id, { stopId });
      setActiveTrip((prev) => ({ ...prev, current_stop_id: stopId }));
    } catch (e) {
      console.error('Failed to checkin at stop:', e);
    }
  };

  // 7. Incident Broadcast
  const handleBroadcastAlert = async (alertPayload) => {
    if (!activeTrip) return;
    await api.alerts.create({
      ...alertPayload,
      routeId: activeTrip.route_id,
      busId: activeTrip.bus_id,
    });
  };

  const currentRoute = routes.find((r) => r.id === (activeTrip ? activeTrip.route_id : selectedRouteId));
  const currentBus = buses.find((b) => b.id === (activeTrip ? activeTrip.bus_id : selectedBusId));
  const stops = activeTrip?.stops || currentRoute?.stops || [];
  const nextStop = stops.find((s) => s.status === 'NEXT') || stops[0];

  return (
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Driver Cockpit Header */}
      <div class="bg-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/30">
            <Bus class="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div class="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
              DRIVER COCKPIT
            </div>
            <h2 class="text-xl font-black tracking-tight">{user?.name}</h2>
            <div class="text-xs text-slate-400 mt-0.5">
              License: <span class="font-mono text-slate-200 font-semibold">{user?.licenseNumber || 'CDL-Active'}</span>
            </div>
          </div>
        </div>

        {/* Test Drive Toggle (Desktop / Lab testing) */}
        <div class="flex flex-col items-end">
          <label class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Test Drive Mode
          </label>
          <button
            onClick={() => setIsTestMode(!isTestMode)}
            class={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isTestMode
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
            title="Toggle between real phone GPS and automated route drive"
          >
            <span>{isTestMode ? '⚡ Active Simulator' : '📱 Real Device GPS'}</span>
          </button>
        </div>
      </div>

      {/* Main Shift View: Pre-Trip vs Active Trip */}
      {!activeTrip ? (
        /* Pre-Trip Selector & Big Start Button */
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 class="text-base font-extrabold text-slate-900 tracking-tight">
              Start Scheduled Shift
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Select your assigned vehicle and route line to begin broadcasting live GPS.
            </p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Assigned Route Line *
              </label>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                class="w-full px-4 py-3 rounded-2xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
              >
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} — {r.name} ({r.origin} → {r.destination})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Bus Vehicle *
              </label>
              <select
                value={selectedBusId}
                onChange={(e) => setSelectedBusId(e.target.value)}
                class="w-full px-4 py-3 rounded-2xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
              >
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bus_number} — {b.license_plate} (Capacity: {b.capacity} seats)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Giant Start Button */}
          <button
            onClick={handleStartTrip}
            class="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm tracking-wide shadow-xl shadow-emerald-600/30 transition active:scale-98 flex items-center justify-center gap-2.5"
          >
            <Play class="w-5 h-5 fill-current" />
            <span>START TRIP & BROADCAST GPS</span>
          </button>
        </div>
      ) : (
        /* Active Trip Cockpit */
        <div class="space-y-4">
          
          {/* Live Telemetry Readout */}
          <GpsStatusBadge
            isTracking={true}
            accuracy={currentAccuracy}
            speed={currentSpeed}
          />

          {/* Current Stop & Next Stop Check-In Card */}
          <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                NEXT STOP ARRIVAL
              </span>
              <h3 class="text-lg font-black text-slate-900 mt-1">
                {nextStop?.name || 'End of Line'}
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                {nextStop?.landmark || 'Approaching station'}
              </p>
            </div>

            {nextStop && (
              <button
                onClick={() => handleStopCheckin(nextStop.id || nextStop.stopId)}
                class="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center gap-2"
              >
                <CheckCircle class="w-4 h-4 stroke-[2.5]" />
                <span>Mark Arrived / Boarding</span>
              </button>
            )}
          </div>

          {/* Quick Occupancy Control */}
          <OccupancyControl
            currentStatus={activeTrip.occupancy_status}
            passengerCount={activeTrip.passenger_count || 0}
            capacity={currentBus?.capacity || 40}
            onStatusChange={handleOccupancyStatusChange}
            onCountChange={handlePassengerCountChange}
          />

          {/* Action Row: Emergency Broadcast & Finish Trip */}
          <div class="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setIsEmergencyOpen(true)}
              class="py-3.5 px-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 font-extrabold text-xs transition active:scale-95 flex items-center justify-center gap-2 shadow-sm"
            >
              <AlertTriangle class="w-4 h-4" />
              <span>Report Incident / SOS</span>
            </button>

            <button
              onClick={handleEndTrip}
              class="py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/30"
            >
              <Square class="w-4 h-4 fill-current text-rose-400" />
              <span>Complete & End Trip</span>
            </button>
          </div>
        </div>
      )}

      {/* Emergency Incident Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        onSubmit={handleBroadcastAlert}
      />
    </div>
  );
}
