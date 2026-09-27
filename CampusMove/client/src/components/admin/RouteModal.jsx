import React, { useState } from 'react';
import { Navigation, X } from 'lucide-react';

export default function RouteModal({ isOpen, onClose, onSubmit, route = null, collegeCenter = [37.7749, -122.4194] }) {
  const [name, setName] = useState(route?.name || '');
  const [code, setCode] = useState(route?.code || '');
  const [origin, setOrigin] = useState(route?.origin || '');
  const [destination, setDestination] = useState(route?.destination || '');
  const [color, setColor] = useState(route?.color || '#2563eb');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // If creating new route and no coordinates exist, generate a realistic 5-point path around campus center
      const defaultPath = route?.path_coordinates?.length > 0 ? route.path_coordinates : [
        [collegeCenter[0], collegeCenter[1]],
        [collegeCenter[0] + 0.003, collegeCenter[1] + 0.003],
        [collegeCenter[0] + 0.007, collegeCenter[1] + 0.006],
        [collegeCenter[0] + 0.012, collegeCenter[1] + 0.010],
        [collegeCenter[0] + 0.018, collegeCenter[1] + 0.015],
      ];

      await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        origin: origin.trim(),
        destination: destination.trim(),
        color,
        pathCoordinates: defaultPath,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div class="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div class="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-campus-500/20 text-campus-400">
              <Navigation class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-extrabold text-base tracking-tight">{route ? 'Edit Route' : 'Create Campus Route'}</h3>
              <p class="text-xs text-slate-400">Define origin, destination, and timetable lines</p>
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
                Route Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. West Campus Express"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Route Code *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. WC-301"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500 uppercase"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Origin *
              </label>
              <input
                type="text"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Main Terminal"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Destination *
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Medical Plaza"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Route Map Color
            </label>
            <div class="flex items-center gap-3">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  class={`w-8 h-8 rounded-full border-2 transition transform active:scale-95 ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'border-white'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
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
              {submitting ? 'Saving...' : route ? 'Update Route' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
