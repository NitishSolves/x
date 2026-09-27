import React, { useState, useEffect } from 'react';
import {
  Bus,
  Navigation,
  Users,
  AlertTriangle,
  Radio,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  MapPin,
  Clock,
  Shield,
  Layers,
  FileText
} from 'lucide-react';
import { api } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import FleetOverview from '../components/admin/FleetOverview';
import LiveBusMap from '../components/map/LiveBusMap';
import BusModal from '../components/admin/BusModal';
import RouteModal from '../components/admin/RouteModal';
import StopModal from '../components/admin/StopModal';
import DriverModal from '../components/admin/DriverModal';
import BroadcastAlertModal from '../components/admin/BroadcastAlertModal';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState('radar'); // 'radar', 'fleet', 'routes', 'drivers', 'alerts', 'logs'
  const [stats, setStats] = useState(null);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [selectedRouteForStops, setSelectedRouteForStops] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [busModalOpen, setBusModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [targetRouteIdForStop, setTargetRouteIdForStop] = useState(null);
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  // 1. Initial Load of Admin Data
  const refreshAll = async () => {
    try {
      setLoading(true);
      const [statsData, busesData, routesData, driversData, alertsData, tripsData] = await Promise.all([
        api.analytics.getDashboard(),
        api.buses.getAll(),
        api.routes.getAll(),
        api.drivers.getAll(),
        api.alerts.getAll(),
        api.trips.getActive(),
      ]);

      setStats(statsData);
      setBuses(busesData);
      setRoutes(routesData);
      setDrivers(driversData);
      setAlerts(alertsData);
      setActiveTrips(tripsData);

      if (routesData.length > 0 && !selectedRouteForStops) {
        loadRouteStops(routesData[0].id);
      }
    } catch (err) {
      console.error('[AdminDashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const loadRouteStops = async (routeId) => {
    try {
      const routeDetail = await api.routes.getById(routeId);
      setSelectedRouteForStops(routeDetail);
    } catch (err) {
      console.error('Error loading route stops:', err);
    }
  };

  // 2. Real-time Telemetry Updates
  useEffect(() => {
    if (!socket) return;

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
        }
        return prevTrips;
      });
    };

    const handleTripStarted = (newTrip) => {
      setActiveTrips((prev) => [newTrip, ...prev]);
      refreshStatsOnly();
    };

    const handleTripEnded = ({ tripId }) => {
      setActiveTrips((prev) => prev.filter((t) => t.id !== tripId));
      refreshStatsOnly();
    };

    const handleNewAlert = (alert) => {
      setAlerts((prev) => [alert, ...prev]);
      refreshStatsOnly();
    };

    const handleAlertResolved = ({ alertId }) => {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      refreshStatsOnly();
    };

    socket.on('trip:telemetry', handleTelemetry);
    socket.on('trip:started', handleTripStarted);
    socket.on('trip:ended', handleTripEnded);
    socket.on('alert:broadcast', handleNewAlert);
    socket.on('alert:resolved', handleAlertResolved);

    return () => {
      socket.off('trip:telemetry', handleTelemetry);
      socket.off('trip:started', handleTripStarted);
      socket.off('trip:ended', handleTripEnded);
      socket.off('alert:broadcast', handleNewAlert);
      socket.off('alert:resolved', handleAlertResolved);
    };
  }, [socket]);

  const refreshStatsOnly = async () => {
    try {
      const s = await api.analytics.getDashboard();
      setStats(s);
    } catch (e) {
      // ignore
    }
  };

  // 3. Handlers for CRUD
  const handleSaveBus = async (busData) => {
    if (editingBus) {
      await api.buses.update(editingBus.id, busData);
    } else {
      await api.buses.create(busData);
    }
    const updated = await api.buses.getAll();
    setBuses(updated);
    refreshStatsOnly();
  };

  const handleDeleteBus = async (busId) => {
    if (!window.confirm('Delete this bus from the fleet?')) return;
    await api.buses.delete(busId);
    setBuses((prev) => prev.filter((b) => b.id !== busId));
    refreshStatsOnly();
  };

  const handleSaveRoute = async (routeData) => {
    if (editingRoute) {
      await api.routes.update(editingRoute.id, routeData);
    } else {
      await api.routes.create(routeData);
    }
    const updated = await api.routes.getAll();
    setRoutes(updated);
    refreshStatsOnly();
  };

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Delete this route and all its stops?')) return;
    await api.routes.delete(routeId);
    setRoutes((prev) => prev.filter((r) => r.id !== routeId));
    if (selectedRouteForStops?.id === routeId) setSelectedRouteForStops(null);
    refreshStatsOnly();
  };

  const handleSaveStop = async (stopData) => {
    if (!targetRouteIdForStop) return;
    await api.routes.createStop(targetRouteIdForStop, stopData);
    await loadRouteStops(targetRouteIdForStop);
  };

  const handleDeleteStop = async (stopId) => {
    if (!window.confirm('Delete this stop?')) return;
    await api.stops.delete(stopId);
    if (selectedRouteForStops) {
      await loadRouteStops(selectedRouteForStops.id);
    }
  };

  const handleCreateDriver = async (driverData) => {
    await api.drivers.create(driverData);
    const updated = await api.drivers.getAll();
    setDrivers(updated);
    refreshStatsOnly();
  };

  const handleBroadcastAlert = async (alertData) => {
    await api.alerts.create(alertData);
    const updated = await api.alerts.getAll();
    setAlerts(updated);
    refreshStatsOnly();
  };

  const handleResolveAlert = async (alertId) => {
    await api.alerts.resolve(alertId);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    refreshStatsOnly();
  };

  const campusCenter = [user?.college?.centerLat || 37.7749, user?.college?.centerLng || -122.4194];

  return (
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Overview Metrics */}
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs uppercase font-extrabold tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              TENANT CONTROL TOWER
            </span>
          </div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {user?.college?.name || 'Campus'} Operations
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Real-time fleet tracking, timetable route management, driver rosters, and incident broadcasting.
          </p>
        </div>

        {/* Global Action: Quick Broadcast Notice */}
        <button
          onClick={() => setAlertModalOpen(true)}
          class="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition active:scale-95 flex items-center gap-2 self-start sm:self-auto"
        >
          <AlertTriangle class="w-4 h-4 stroke-[2.5]" />
          <span>Broadcast Notice</span>
        </button>
      </div>

      {/* Overview Analytics Counter Cards */}
      <FleetOverview stats={stats} />

      {/* Tabs Navigation */}
      <div class="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'radar', label: 'Live Fleet Radar', icon: Radio },
          { id: 'fleet', label: 'Bus Fleet', icon: Bus },
          { id: 'routes', label: 'Routes & Stops', icon: Navigation },
          { id: 'drivers', label: 'Driver Roster', icon: Users },
          { id: 'alerts', label: 'Broadcast Alerts', icon: AlertTriangle },
          { id: 'logs', label: 'Trip Logs', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              class={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon class="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.id === 'radar' && activeTrips.length > 0 && (
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE FLEET RADAR */}
      {activeTab === 'radar' && (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-4">
            <div class="h-[520px] w-full">
              <LiveBusMap
                center={campusCenter}
                zoom={13}
                activeTrips={activeTrips}
                interactive={true}
              />
            </div>
          </div>

          {/* Active Trips Radar List */}
          <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col h-[520px]">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <span class="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                ACTIVE VEHICLES ({activeTrips.length})
              </span>
              <span class="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE RADAR
              </span>
            </div>

            <div class="flex-1 overflow-y-auto mt-3 space-y-3 pr-1">
              {activeTrips.length === 0 ? (
                <div class="py-16 text-center text-xs text-slate-400">
                  <Radio class="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                  No buses currently on road.<br />
                  Trips will appear in real time when drivers start their shifts.
                </div>
              ) : (
                activeTrips.map((trip) => (
                  <div
                    key={trip.id}
                    class="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-campus-300 transition space-y-2"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span class="font-extrabold text-xs text-slate-900">{trip.bus_number}</span>
                        <span class="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                          {trip.license_plate}
                        </span>
                      </div>
                      <span class="text-[10px] font-bold text-campus-700 bg-campus-50 px-2 py-0.5 rounded border border-campus-200">
                        {trip.route_code}
                      </span>
                    </div>

                    <div class="text-xs text-slate-600">
                      Driver: <strong class="text-slate-800">{trip.driver_name}</strong>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-xs bg-white p-2 rounded-xl border border-slate-200">
                      <div>
                        <span class="text-[10px] text-slate-400 block">SPEED</span>
                        <span class="font-mono font-bold text-slate-800">
                          {Math.round(trip.current_speed || 0)} km/h
                        </span>
                      </div>
                      <div>
                        <span class="text-[10px] text-slate-400 block">GPS ACCURACY</span>
                        <span class="font-mono font-bold text-emerald-600">
                          ±{Math.round(trip.current_accuracy || 5)}m
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUS FLEET MANAGEMENT */}
      {activeTab === 'fleet' && (
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-extrabold text-slate-900 tracking-tight">Bus Fleet Inventory</h3>
              <p class="text-xs text-slate-500">Manage vehicles, seating capacity, and driver assignments</p>
            </div>
            <button
              onClick={() => {
                setEditingBus(null);
                setBusModalOpen(true);
              }}
              class="px-4 py-2 rounded-xl bg-campus-600 hover:bg-campus-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Plus class="w-4 h-4" />
              <span>Add Vehicle</span>
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th class="py-3 px-4">Bus Identifier</th>
                  <th class="py-3 px-4">License Plate</th>
                  <th class="py-3 px-4">Capacity</th>
                  <th class="py-3 px-4">Model</th>
                  <th class="py-3 px-4">Default Driver</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-xs">
                {buses.map((bus) => (
                  <tr key={bus.id} class="hover:bg-slate-50/80 transition">
                    <td class="py-3 px-4 font-bold text-slate-900">{bus.bus_number}</td>
                    <td class="py-3 px-4 font-mono font-semibold text-slate-600">{bus.license_plate}</td>
                    <td class="py-3 px-4 font-mono">{bus.capacity} seats</td>
                    <td class="py-3 px-4 text-slate-600">{bus.model || 'Standard Coach'}</td>
                    <td class="py-3 px-4 text-slate-700">{bus.default_driver_name || 'Unassigned'}</td>
                    <td class="py-3 px-4">
                      <span
                        class={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bus.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : bus.status === 'MAINTENANCE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {bus.status}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingBus(bus);
                          setBusModalOpen(true);
                        }}
                        class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                        title="Edit Bus"
                      >
                        <Edit2 class="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBus(bus.id)}
                        class="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                        title="Delete Bus"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ROUTE & STOP MANAGEMENT */}
      {activeTab === 'routes' && (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Route List */}
          <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-extrabold text-slate-900 tracking-tight">Routes</h3>
                <p class="text-xs text-slate-500">College transit corridors</p>
              </div>
              <button
                onClick={() => {
                  setEditingRoute(null);
                  setRouteModalOpen(true);
                }}
                class="p-2 rounded-xl bg-campus-600 hover:bg-campus-500 text-white shadow transition"
                title="Create New Route"
              >
                <Plus class="w-4 h-4" />
              </button>
            </div>

            <div class="space-y-2">
              {routes.map((route) => {
                const isSelected = selectedRouteForStops?.id === route.id;
                return (
                  <div
                    key={route.id}
                    onClick={() => loadRouteStops(route.id)}
                    class={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <div class="flex items-center gap-2">
                        <div
                          class="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: route.color || '#2563eb' }}
                        />
                        <span class="font-mono font-bold text-xs">{route.code}</span>
                        <span class="font-bold text-xs">{route.name}</span>
                      </div>
                      <div class={`text-[11px] mt-1 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                        {route.origin} → {route.destination}
                      </div>
                    </div>

                    <div class="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRoute(route);
                          setRouteModalOpen(true);
                        }}
                        class={`p-1.5 rounded-lg ${
                          isSelected ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white text-slate-500'
                        }`}
                        title="Edit Route"
                      >
                        <Edit2 class="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoute(route.id);
                        }}
                        class={`p-1.5 rounded-lg ${
                          isSelected ? 'hover:bg-slate-800 text-rose-400' : 'hover:bg-white text-rose-500'
                        }`}
                        title="Delete Route"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stops for Selected Route */}
          <div class="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 class="text-base font-extrabold text-slate-900 tracking-tight">
                  Stops on {selectedRouteForStops ? `${selectedRouteForStops.code} — ${selectedRouteForStops.name}` : 'Route'}
                </h3>
                <p class="text-xs text-slate-500">Ordered sequence of geofenced pickup stations</p>
              </div>

              {selectedRouteForStops && (
                <button
                  onClick={() => {
                    setTargetRouteIdForStop(selectedRouteForStops.id);
                    setStopModalOpen(true);
                  }}
                  class="px-3.5 py-2 rounded-xl bg-campus-600 hover:bg-campus-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>Add Stop</span>
                </button>
              )}
            </div>

            <div class="space-y-2">
              {!selectedRouteForStops || selectedRouteForStops.stops?.length === 0 ? (
                <div class="py-12 text-center text-xs text-slate-400">
                  No stops configured for this route yet. Click "Add Stop" to place a pickup point.
                </div>
              ) : (
                selectedRouteForStops.stops.map((stop) => (
                  <div
                    key={stop.id}
                    class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-slate-200 font-bold text-xs flex items-center justify-center text-slate-700">
                        {stop.sequence_order}
                      </div>
                      <div>
                        <div class="font-bold text-xs text-slate-900">{stop.name}</div>
                        <div class="text-[11px] text-slate-500 mt-0.5">
                          {stop.landmark ? `${stop.landmark} • ` : ''}
                          <span class="font-mono text-slate-400 font-bold">
                            Lat: {stop.lat.toFixed(4)}, Lng: {stop.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <span class="text-xs font-mono font-bold text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                        {stop.scheduled_time || 'N/A'}
                      </span>
                      <button
                        onClick={() => handleDeleteStop(stop.id)}
                        class="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DRIVER ROSTER */}
      {activeTab === 'drivers' && (
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-extrabold text-slate-900 tracking-tight">Driver Roster</h3>
              <p class="text-xs text-slate-500">Authorized drivers broadcasting real-time bus telemetry</p>
            </div>
            <button
              onClick={() => setDriverModalOpen(true)}
              class="px-4 py-2 rounded-xl bg-campus-600 hover:bg-campus-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Plus class="w-4 h-4" />
              <span>Register Driver</span>
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th class="py-3 px-4">Driver Name</th>
                  <th class="py-3 px-4">Email</th>
                  <th class="py-3 px-4">Contact Phone</th>
                  <th class="py-3 px-4">Commercial License</th>
                  <th class="py-3 px-4">Assigned Vehicle</th>
                  <th class="py-3 px-4">Shift Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-xs">
                {drivers.map((d) => (
                  <tr key={d.id} class="hover:bg-slate-50/80 transition">
                    <td class="py-3 px-4 font-bold text-slate-900">{d.name}</td>
                    <td class="py-3 px-4 text-slate-600 font-mono">{d.email}</td>
                    <td class="py-3 px-4 text-slate-600">{d.phone || 'N/A'}</td>
                    <td class="py-3 px-4 font-mono font-semibold text-slate-700">{d.license_number || 'CDL-Active'}</td>
                    <td class="py-3 px-4 font-medium text-slate-800">
                      {d.assigned_bus_number ? `${d.assigned_bus_number} (${d.assigned_bus_plate})` : 'Unassigned'}
                    </td>
                    <td class="py-3 px-4">
                      {d.active_trip_id ? (
                        <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          ON ROAD NOW
                        </span>
                      ) : (
                        <span class="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Off Shift
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: BROADCAST ALERTS */}
      {activeTab === 'alerts' && (
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-extrabold text-slate-900 tracking-tight">Active Broadcast Advisories</h3>
              <p class="text-xs text-slate-500">Emergency bulletins, road delay alerts, and transit announcements</p>
            </div>
            <button
              onClick={() => setAlertModalOpen(true)}
              class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Plus class="w-4 h-4" />
              <span>Create Announcement</span>
            </button>
          </div>

          <div class="space-y-3">
            {alerts.length === 0 ? (
              <div class="py-12 text-center text-xs text-slate-400">
                No active service advisories. All routes operating normally.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  class="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4"
                >
                  <div class="flex items-start gap-3">
                    <div
                      class={`p-2 rounded-xl ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700'
                          : alert.severity === 'WARNING'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      <AlertTriangle class="w-5 h-5" />
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-extrabold text-xs text-slate-900">{alert.title}</span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                          {alert.severity}
                        </span>
                        {alert.route_code && (
                          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-campus-50 text-campus-700 border border-campus-200 font-bold">
                            Route {alert.route_code}
                          </span>
                        )}
                      </div>
                      <p class="text-xs text-slate-600 mt-1 leading-relaxed">{alert.message}</p>
                      <div class="text-[11px] text-slate-400 mt-2">
                        Broadcasted by: {alert.author_name || 'Admin'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
                  >
                    Resolve / Archive
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: TRIP LOGS */}
      {activeTab === 'logs' && (
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 class="text-base font-extrabold text-slate-900 tracking-tight">Recent Trip Logs & Telemetry Audit</h3>
            <p class="text-xs text-slate-500">Historical records of finished shifts and route execution</p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th class="py-3 px-4">Route</th>
                  <th class="py-3 px-4">Bus</th>
                  <th class="py-3 px-4">Driver</th>
                  <th class="py-3 px-4">Start Time</th>
                  <th class="py-3 px-4">End Time</th>
                  <th class="py-3 px-4">Passengers</th>
                  <th class="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-xs">
                {!stats?.recentCompletedTrips || stats.recentCompletedTrips.length === 0 ? (
                  <tr>
                    <td colSpan={7} class="py-8 text-center text-slate-400">
                      No completed trips logged yet.
                    </td>
                  </tr>
                ) : (
                  stats.recentCompletedTrips.map((log) => (
                    <tr key={log.id} class="hover:bg-slate-50/80 transition">
                      <td class="py-3 px-4 font-bold text-slate-900">{log.route_code} — {log.route_name}</td>
                      <td class="py-3 px-4 font-semibold text-slate-700">{log.bus_number}</td>
                      <td class="py-3 px-4 text-slate-600">{log.driver_name}</td>
                      <td class="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td class="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(log.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td class="py-3 px-4 font-mono">{log.passenger_count || 0} riders</td>
                      <td class="py-3 px-4">
                        <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle class="w-3 h-3 text-emerald-600" />
                          COMPLETED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD MODALS */}
      <BusModal
        isOpen={busModalOpen}
        onClose={() => setBusModalOpen(false)}
        onSubmit={handleSaveBus}
        bus={editingBus}
        drivers={drivers}
      />

      <RouteModal
        isOpen={routeModalOpen}
        onClose={() => setRouteModalOpen(false)}
        onSubmit={handleSaveRoute}
        route={editingRoute}
        collegeCenter={campusCenter}
      />

      <StopModal
        isOpen={stopModalOpen}
        onClose={() => setStopModalOpen(false)}
        onSubmit={handleSaveStop}
        defaultCoords={campusCenter}
      />

      <DriverModal
        isOpen={driverModalOpen}
        onClose={() => setDriverModalOpen(false)}
        onSubmit={handleCreateDriver}
      />

      <BroadcastAlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onSubmit={handleBroadcastAlert}
        routes={routes}
      />
    </div>
  );
}
