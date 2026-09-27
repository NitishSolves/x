import React, { useState } from 'react';
import { Bus, X } from 'lucide-react';

export default function BusModal({ isOpen, onClose, onSubmit, bus = null, drivers = [] }) {
  const [busNumber, setBusNumber] = useState(bus?.bus_number || '');
  const [licensePlate, setLicensePlate] = useState(bus?.license_plate || '');
  const [capacity, setCapacity] = useState(bus?.capacity || 40);
  const [model, setModel] = useState(bus?.model || '');
  const [status, setStatus] = useState(bus?.status || 'ACTIVE');
  const [defaultDriverId, setDefaultDriverId] = useState(bus?.default_driver_id || '');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        busNumber,
        licensePlate,
        capacity: Number(capacity),
        model,
        status,
        defaultDriverId: defaultDriverId || null,
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
              <Bus class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-extrabold text-base tracking-tight">{bus ? 'Edit Fleet Bus' : 'Add New Bus to Fleet'}</h3>
              <p class="text-xs text-slate-400">Register vehicle in college transport inventory</p>
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
                Bus Identifier / Name *
              </label>
              <input
                type="text"
                required
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                placeholder="e.g. Bus 104 (Blue Line)"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                License Plate *
              </label>
              <input
                type="text"
                required
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="e.g. APX-404"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500 uppercase"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Seating Capacity
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Vehicle Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Volvo 9700 / BYD K9"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Operational Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500 bg-white"
              >
                <option value="ACTIVE">ACTIVE (In Service)</option>
                <option value="MAINTENANCE">MAINTENANCE (Workshop)</option>
                <option value="RETIRED">RETIRED (Inactive)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Default Assigned Driver
              </label>
              <select
                value={defaultDriverId}
                onChange={(e) => setDefaultDriverId(e.target.value)}
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500 bg-white"
              >
                <option value="">-- Unassigned --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone || 'No phone'})
                  </option>
                ))}
              </select>
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
              {submitting ? 'Saving...' : bus ? 'Update Bus' : 'Save Bus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
