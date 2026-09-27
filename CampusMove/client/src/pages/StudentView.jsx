import React, { useState, useEffect } from 'react';
import { Navigation, Clock, Users, AlertTriangle, Radio, RefreshCw, Compass } from 'lucide-react';
import { api } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import LiveBusMap from '../components/map/LiveBusMap';
import StopTimeline from '../components/student/StopTimeline';
import OccupancyBadge from '../components/student/OccupancyBadge';
import ZeroState from '../components/common/ZeroState';

export default function StudentView() {
  const { user } = useAuth();
  const { socket, joinTrip, leaveTrip } = useSocket();

  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [activeTrips, setActiveTrips] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [routesData, tripsData, alertsData] = await Promise.all([
          api.routes.getAll(),
          api.trips.getActive(),
          api.alerts.getAll(),
        ]);

        setRoutes(routesData);
        setActiveTrips(tripsData);
        setAlerts(alertsData);

        if (routesData.length > 0) {
          // If there's an active trip on a route, select that route by default; else first route
          const activeTrip = tripsData[0];
          const defaultRoute = activeTrip ? routesData.find((r) => r.id === activeTrip.route_id) : routesData[0];
          setSelectedRouteId(defaultRoute ? defaultRoute.id : routesData[0].id);
        }
      } catch (err) {
        console.error('[StudentView] Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Request student's location for "Distance to Stop"
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.log('Location access not granted:', err.message),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // 2. Fetch Selected Route Details (Stops & Path)
  useEffect(() => {
    if (!selectedRouteId) return;

    async function loadRouteDetails() {
      try {
        const details = await api.routes.getById(selectedRouteId);
        setSelectedRoute(details);
      } catch (err) {
        console.error('[StudentView] Route Details Error:', err);
      }
    }

    loadRouteDetails();
  }, [selectedRouteId]);

  // 3. Real-Time Socket Events
  useEffect(() => {
    if (!socket) return;

    // High frequency GPS telemetry update
    const handleTelemetry = (data) => {
      setActiveTrips((prevTrips) => {
        const index = prevTrips.findIndex((t) => t.id === data.tripId);
        if (index !== -1) {
          const updated = [...prevTrips];
          updated[index] = {
            ...updated[index],
            current_lat: data.lat,
            current_lng: data.lng,
            current_speed: data.speed,
            current_heading: data.heading,
            current_accuracy: data.accuracy,
            last_telemetry_at: data.lastTelemetryAt,
            stops: data.stops || updated[index].stops,
          };
          return updated;
        } else {
          // New trip appeared in telemetry
          return prevTrips;
        }
      });
    };

    // Trip started
    const handleTripStarted = (newTrip) => {
      setActiveTrips((prev) => {
        const filtered = prev.filter((t) => t.id !== newTrip.id);
        return [newTrip, ...filtered];
      });
      joinTrip(newTrip.id);
    };

    // Trip ended
    const handleTripEnded = ({ tripId }) => {
      setActiveTrips((prev) => prev.filter((t) => t.id !== tripId));
      leaveTrip(tripId);
    };

    // Occupancy updated
    const handleOccupancy = (data) => {
      setActiveTrips((prev) =>
        prev.map((t) =>
          t.id === data.tripId
            ? { ...t, occupancy_status: data.occupancyStatus, passenger_count: data.passengerCount }
            : t
        )
      );
    };

    // Alert broadcast
    const handleNewAlert = (alert) => {
      setAlerts((prev) => [alert, ...prev]);
    };

    const handleAlertResolved = ({ alertId }) => {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    };

    socket.on('trip:telemetry', handleTelemetry);
    socket.on('trip:started', handleTripStarted);
    socket.on('trip:ended', handleTripEnded);
    socket.on('trip:occupancy_update', handleOccupancy);
    socket.on('alert:broadcast', handleNewAlert);
    socket.on('alert:resolved', handleAlertResolved);

    return () => {
      socket.off('trip:telemetry', handleTelemetry);
      socket.off('trip:started', handleTripStarted);
      socket.off('trip:ended', handleTripEnded);
      socket.off('trip:occupancy_update', handleOccupancy);
      socket.off('alert:broadcast', handleNewAlert);
      socket.off('alert:resolved', handleAlertResolved);
    };
  }, [socket]);

  // Find active trip for current route
  const currentActiveTrip = activeTrips.find((t) => t.route_id === selectedRouteId);

  // Compute stops to display: prefer live stops with ETAs from active trip if available
  const stopsToDisplay = currentActiveTrip?.stops || selectedRoute?.stops || [];

  // Find next upcoming stop
  const nextStop = stopsToDisplay.find((s) => s.status === 'NEXT') || stopsToDisplay.find((s) => s.status === 'CURRENT');

  const campusCenter = [
    user?.college?.centerLat || 37.7749,
    user?.college?.centerLng || -122.4194,
  ];

  return (
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Broadcast Alert Banners */}
      {alerts.length > 0 && (
        <div class="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              class={`p-4 rounded-2xl border flex items-start gap-3 shadow-sm ${
                alert.severity === 'CRITICAL'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : alert.severity === 'WARNING'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <AlertTriangle class="w-5 h-5 shrink-0 mt-0.5" />
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-extrabold text-xs tracking-wide uppercase">
                    {alert.severity} NOTICE: {alert.title}
                  </span>
                  {alert.route_code && (
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/60 font-bold">
                      Route {alert.route_code}
                    </span>
                  )}
                </div>
                <p class="text-xs mt-0.5 leading-relaxed opacity-90">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Route Switcher Tabs */}
      <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const hasActiveBus = activeTrips.some((t) => t.route_id === route.id);

          return (
            <button
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              class={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition border flex items-center gap-2.5 ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-campus-500/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div
                class="w-3 h-3 rounded-full"
                style={{ backgroundColor: route.color || '#2563eb' }}
              />
              <span class="font-mono font-extrabold">{route.code}</span>
              <span>{route.name}</span>

              {/* Active Live Pill */}
              {hasActiveBus ? (
                <span class="flex items-center gap-1 text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE
                </span>
              ) : (
                <span class="text-[10px] text-slate-400 font-normal">
                  Idle
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Interactive Map & Live Stop Timeline */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Live Map & Active Bus Card (2 Cols on lg) */}
        <div class="lg:col-span-2 space-y-4">
          
          {/* Active Bus Status Card (If active) */}
          {currentActiveTrip ? (
            <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <div class="w-12 h-12 rounded-2xl bg-campus-600 text-white flex items-center justify-center shadow-md shadow-campus-600/30">
                  <Radio class="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-black text-base text-slate-900 tracking-tight">
                      {currentActiveTrip.bus_number}
                    </h3>
                    <span class="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                      {currentActiveTrip.license_plate}
                    </span>
                  </div>
                  <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>Driver: <strong class="text-slate-700">{currentActiveTrip.driver_name}</strong></span>
                    <span>•</span>
                    <span class="font-mono text-emerald-600 font-bold">
                      {Math.round(currentActiveTrip.current_speed || 0)} km/h
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                <OccupancyBadge
                  status={currentActiveTrip.occupancy_status}
                  count={currentActiveTrip.passenger_count}
                  capacity={currentActiveTrip.bus_capacity}
                />
              </div>
            </div>
          ) : (
            <ZeroState
              title={`No Active Buses Tracking on ${selectedRoute?.name || 'Selected Route'}`}
              message="The route schedule is shown below. When a driver starts their shift, the bus will appear moving on the map with live dynamic ETAs."
            />
          )}

          {/* Map Canvas */}
          <div class="h-[480px] w-full">
            <LiveBusMap
              center={campusCenter}
              zoom={14}
              route={selectedRoute}
              activeTrips={currentActiveTrip ? [currentActiveTrip] : []}
              selectedTripId={currentActiveTrip?.id}
              userLocation={userLocation}
            />
          </div>
        </div>

        {/* Right Column: Route Details & Stop Schedule Timeline */}
        <div class="space-y-4">
          <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col h-full max-h-[640px]">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span class="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                  ROUTE STOPS & LIVE ETAS
                </span>
                <h3 class="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedRoute?.origin} → {selectedRoute?.destination}
                </h3>
              </div>
              <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                {stopsToDisplay.length} Stops
              </span>
            </div>

            {/* Next Stop Callout Banner */}
            {currentActiveTrip && nextStop && (
              <div class="my-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span class="text-[10px] uppercase font-extrabold text-amber-700 block">
                    NEXT UPCOMING STOP
                  </span>
                  <span class="text-xs font-bold text-slate-900">{nextStop.name}</span>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-extrabold text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">
                    {nextStop.etaText || 'Approaching'}
                  </span>
                </div>
              </div>
            )}

            {/* Stop Sequence List */}
            <div class="flex-1 overflow-y-auto pr-1 mt-2">
              <StopTimeline
                stops={stopsToDisplay}
                activeTrip={currentActiveTrip}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
