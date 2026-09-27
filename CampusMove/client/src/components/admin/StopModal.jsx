import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';

export default function StopModal({ isOpen, onClose, onSubmit, stop = null, defaultCoords = [37.7749, -122.4194] }) {
  const [name, setName] = useState(stop?.name || '');
  const [landmark, setLandmark] = useState(stop?.landmark || '');
  const [lat, setLat] = useState(stop?.lat || defaultCoords[0]);
  const [lng, setLng] = useState(stop?.lng || defaultCoords[1]);
  const [sequenceOrder, setSequenceOrder] = useState(stop?.sequence_order || 1);
  const [scheduledTime, setScheduledTime] = useState(stop?.scheduled_time || '08:00 AM');
  const [geofenceRadius, setGeofenceRadius] = useState(stop?.geofence_radius_meters || 100);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        landmark: landmark.trim() || null,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        sequenceOrder: parseInt(sequenceOrder, 10),
        scheduledTime: scheduledTime.trim() || null,
        geofenceRadius: parseInt(geofenceRadius, 10),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div class="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div class="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-campus-500/20 text-campus-400">
              <MapPin class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-extrabold text-base tracking-tight">{stop ? 'Edit Bus Stop' : 'Add Stop to Route'}</h3>
              <p class="text-xs text-slate-400">Specify GPS geofence and stop schedule</p>
            </div>
          </div>
          <button onClick={onClose} class="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Stop Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Science Quad"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Landmark / Description
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Gate 4 East Concourse"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Latitude *
              </label>
              <input
                type="number"
                step="any"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Longitude *
              </label>
              <input
                type="number"
                step="any"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Stop Order #
              </label>
              <input
                type="number"
                min="1"
                required
                value={sequenceOrder}
                onChange={(e) => setSequenceOrder(e.target.value)}
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Scheduled Time
              </label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="e.g. 08:30 AM"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Geofence (m)
              </label>
              <input
                type="number"
                min="20"
                max="500"
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(e.target.value)}
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>
          </div>

          <div class="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              class="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-campus-600 text-white shadow-lg shadow-campus-600/30 hover:bg-campus-700 disabled:opacity-50 transition active:scale-95"
            >
              {submitting ? 'Saving...' : stop ? 'Update Stop' : 'Add Stop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
