import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Navigation, Compass, Layers, Crosshair } from 'lucide-react';

export default function LiveBusMap({
  center = [37.7749, -122.4194],
  zoom = 14,
  route = null,
  activeTrips = [],
  selectedTripId = null,
  onSelectBus = null,
  onSelectStop = null,
  userLocation = null,
  interactive = true,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({
    buses: new Map(),
    stops: new Map(),
    routeLine: null,
    userMarker: null,
  });

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true,
    });

    // Add crisp, high-resolution modern CartoDB Positron tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render / Update Route Polyline & Stops
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const { stops: stopMarkers, routeLine } = markersRef.current;

    // Clear existing stops
    stopMarkers.forEach((marker) => marker.remove());
    stopMarkers.clear();

    // Clear existing route line
    if (routeLine) {
      routeLine.remove();
      markersRef.current.routeLine = null;
    }

    if (!route) return;

    // Draw route polyline
    if (route.path_coordinates && route.path_coordinates.length > 0) {
      const line = L.polyline(route.path_coordinates, {
        color: route.color || '#2563eb',
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      markersRef.current.routeLine = line;

      // Fit map to route bounds initially if no active trip selected
      if (!selectedTripId && route.path_coordinates.length > 1) {
        try {
          map.fitBounds(line.getBounds(), { padding: [50, 50], maxZoom: 16 });
        } catch (e) {
          // ignore
        }
      }
    }

    // Draw stops
    if (route.stops && route.stops.length > 0) {
      route.stops.forEach((stop) => {
        const isCurrent = stop.status === 'CURRENT';
        const isNext = stop.status === 'NEXT';

        const stopIconHtml = `
          <div class="relative group cursor-pointer">
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 border-white transition-transform transform hover:scale-125 ${
              isCurrent
                ? 'bg-emerald-600 text-white animate-bounce'
                : isNext
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-white'
            }">
              ${stop.sequenceOrder || stop.sequence_order || '•'}
            </div>
            ${
              stop.etaText && stop.etaText !== 'Departed'
                ? `<div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow">
                    ${stop.etaText}
                   </div>`
                : ''
            }
          </div>
        `;

        const stopIcon = L.divIcon({
          html: stopIconHtml,
          className: 'custom-stop-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(map);

        marker.bindPopup(`
          <div class="p-1 font-sans">
            <div class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Stop #${stop.sequenceOrder || stop.sequence_order}</div>
            <div class="font-bold text-sm text-slate-900">${stop.name}</div>
            ${stop.landmark ? `<div class="text-xs text-slate-500 mt-0.5">${stop.landmark}</div>` : ''}
            <div class="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="text-slate-500">Scheduled:</span>
              <span class="font-semibold text-slate-800">${stop.scheduled_time || stop.scheduledTime || 'N/A'}</span>
            </div>
            ${
              stop.etaText
                ? `<div class="mt-1 flex items-center justify-between text-xs">
                     <span class="text-slate-500">Live ETA:</span>
                     <span class="font-bold text-emerald-600">${stop.etaText}</span>
                   </div>`
                : ''
            }
          </div>
        `);

        if (onSelectStop) {
          marker.on('click', () => onSelectStop(stop));
        }

        stopMarkers.set(stop.id, marker);
      });
    }
  }, [route]);

  // 3. Render / Update Active Bus Markers with Directional Arrows & Real Coordinates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const { buses: busMarkers } = markersRef.current;
    const currentTripIds = new Set(activeTrips.map((t) => t.id));

    // Remove markers for trips that have ended
    busMarkers.forEach((marker, tripId) => {
      if (!currentTripIds.has(tripId)) {
        marker.remove();
        busMarkers.delete(tripId);
      }
    });

    // Add or update active bus markers
    activeTrips.forEach((trip) => {
      if (!trip.current_lat || !trip.current_lng) return;

      const isSelected = selectedTripId === trip.id;
      const heading = trip.current_heading || 0;
      const speedKmH = Math.round(trip.current_speed || 0);

      const busIconHtml = `
        <div class="relative flex flex-col items-center cursor-pointer transition-transform duration-300">
          <!-- Pulse halo -->
          <div class="absolute -top-1 w-12 h-12 rounded-full bg-emerald-400 opacity-40 animate-ping"></div>

          <!-- Bus Pin Container with Heading Arrow -->
          <div class="relative z-10 w-11 h-11 rounded-full ${
            isSelected ? 'bg-campus-600 ring-4 ring-campus-300' : 'bg-slate-900 ring-2 ring-white'
          } shadow-xl flex items-center justify-center text-white">
            <svg class="w-6 h-6 transition-transform duration-500" style="transform: rotate(${heading}deg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <!-- Directional navigation arrow indicator -->
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
          </div>

          <!-- Bus Number & Speed Pill -->
          <div class="mt-1 whitespace-nowrap bg-slate-900/95 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-slate-700 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>${trip.bus_number || 'Bus'}</span>
            <span class="text-slate-400 font-mono text-[10px]">${speedKmH} km/h</span>
          </div>
        </div>
      `;

      const busIcon = L.divIcon({
        html: busIconHtml,
        className: 'custom-bus-marker',
        iconSize: [44, 60],
        iconAnchor: [22, 22],
      });

      if (busMarkers.has(trip.id)) {
        // Smoothly update existing marker position and icon
        const existingMarker = busMarkers.get(trip.id);
        existingMarker.setLatLng([trip.current_lat, trip.current_lng]);
        existingMarker.setIcon(busIcon);
      } else {
        // Create new bus marker
        const marker = L.marker([trip.current_lat, trip.current_lng], {
          icon: busIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        marker.bindPopup(`
          <div class="p-1 font-sans">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="font-bold text-slate-900">${trip.bus_number || 'Live Bus'}</span>
              <span class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">${trip.license_plate || ''}</span>
            </div>
            <div class="text-xs text-slate-600 mb-2">Driver: <strong class="text-slate-800">${trip.driver_name || 'Driver'}</strong></div>
            <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded border border-slate-200">
              <div>
                <span class="text-slate-500 block text-[10px]">CURRENT SPEED</span>
                <span class="font-mono font-bold text-slate-800">${speedKmH} km/h</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">GPS ACCURACY</span>
                <span class="font-mono font-bold text-emerald-600">±${Math.round(trip.current_accuracy || 5)}m</span>
              </div>
            </div>
          </div>
        `);

        if (onSelectBus) {
          marker.on('click', () => onSelectBus(trip));
        }

        busMarkers.set(trip.id, marker);
      }

      // If this trip is specifically selected, smoothly pan the map
      if (isSelected) {
        map.panTo([trip.current_lat, trip.current_lng], { animate: true, duration: 0.6 });
      }
    });
  }, [activeTrips, selectedTripId]);

  // 4. Render User Location (Blue Dot)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation && userLocation[0] && userLocation[1]) {
      const userIconHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full bg-blue-500/30 animate-ping absolute"></div>
          <div class="w-4 h-4 rounded-full bg-blue-600 ring-2 ring-white shadow-md relative z-10"></div>
        </div>
      `;
      const userIcon = L.divIcon({
        html: userIconHtml,
        className: 'user-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (markersRef.current.userMarker) {
        markersRef.current.userMarker.setLatLng(userLocation);
      } else {
        markersRef.current.userMarker = L.marker(userLocation, { icon: userIcon }).addTo(map);
      }
    } else if (markersRef.current.userMarker) {
      markersRef.current.userMarker.remove();
      markersRef.current.userMarker = null;
    }
  }, [userLocation]);

  // Map control buttons
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedTripId) {
      const activeTrip = activeTrips.find((t) => t.id === selectedTripId);
      if (activeTrip && activeTrip.current_lat) {
        map.flyTo([activeTrip.current_lat, activeTrip.current_lng], 16, { duration: 1 });
        return;
      }
    }

    if (markersRef.current.routeLine) {
      map.fitBounds(markersRef.current.routeLine.getBounds(), { padding: [50, 50], maxZoom: 16 });
    } else {
      map.flyTo(center, zoom, { duration: 1 });
    }
  };

  const handleCenterUser = () => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    map.flyTo(userLocation, 16, { duration: 1 });
  };

  return (
    <div class="relative w-full h-full min-h-[350px] overflow-hidden rounded-2xl border border-slate-200/80 shadow-inner bg-slate-100">
      <div ref={mapContainerRef} class="w-full h-full" />

      {/* Floating Map Action Controls */}
      <div class="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          class="p-2.5 rounded-xl bg-white/90 backdrop-blur shadow-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition active:scale-95"
          title="Recenter on Bus / Route"
        >
          <Crosshair class="w-5 h-5" />
        </button>

        {userLocation && (
          <button
            onClick={handleCenterUser}
            class="p-2.5 rounded-xl bg-white/90 backdrop-blur shadow-lg border border-slate-200 hover:bg-slate-50 text-blue-600 transition active:scale-95"
            title="My Location"
          >
            <Compass class="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Live Status Watermark */}
      <div class="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/85 backdrop-blur shadow-sm border border-slate-200 text-xs font-semibold text-slate-700">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Telemetry Engine</span>
          <span class="text-slate-400">|</span>
          <span class="text-slate-500">{activeTrips.length} active on road</span>
        </div>
      </div>
    </div>
  );
}
