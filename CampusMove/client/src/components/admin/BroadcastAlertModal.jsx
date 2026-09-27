import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function BroadcastAlertModal({ isOpen, onClose, onSubmit, routes = [] }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('INFO');
  const [routeId, setRouteId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        message: message.trim(),
        severity,
        routeId: routeId || null,
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
            <div class="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertCircle class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-extrabold text-base tracking-tight">Broadcast Campus Notice</h3>
              <p class="text-xs text-slate-400">Instantly displays alert banner across student and driver apps</p>
            </div>
          </div>
          <button onClick={onClose} class="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inclement Weather Route Adjustment"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Notice Details / Advisory Message *
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter instructions for students and drivers..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-campus-500 resize-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500 bg-white"
              >
                <option value="INFO">INFO (General announcement)</option>
                <option value="WARNING">WARNING (Traffic or delays)</option>
                <option value="CRITICAL">CRITICAL (Suspension / Emergency)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Target Route
              </label>
              <select
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-campus-500 bg-white"
              >
                <option value="">All Campus Routes</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.name}
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
              class="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-amber-600 text-white shadow-lg shadow-amber-600/30 hover:bg-amber-700 disabled:opacity-50 transition active:scale-95"
            >
              {submitting ? 'Sending...' : 'Broadcast Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
