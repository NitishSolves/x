import React, { useState } from 'react';
import { AlertTriangle, Wrench, TrafficCone, Siren, X, Check } from 'lucide-react';

export default function EmergencyModal({ isOpen, onClose, onSubmit }) {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const incidents = [
    {
      id: 'BREAKDOWN',
      title: 'Bus Breakdown / Mechanical',
      desc: 'Vehicle failure, engine issue, or flat tire',
      severity: 'CRITICAL',
      icon: Wrench,
      color: 'bg-rose-50 border-rose-300 text-rose-800',
    },
    {
      id: 'TRAFFIC',
      title: 'Heavy Traffic Congestion',
      desc: 'Significant road delays (> 10-15 mins)',
      severity: 'WARNING',
      icon: TrafficCone,
      color: 'bg-amber-50 border-amber-300 text-amber-800',
    },
    {
      id: 'DETOUR',
      title: 'Route Detour / Road Closed',
      desc: 'Bypassing construction or blocked street',
      severity: 'WARNING',
      icon: AlertTriangle,
      color: 'bg-orange-50 border-orange-300 text-orange-800',
    },
    {
      id: 'EMERGENCY',
      title: 'Medical / Safety Incident',
      desc: 'Urgent assistance needed on bus',
      severity: 'CRITICAL',
      icon: Siren,
      color: 'bg-red-100 border-red-400 text-red-900',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: selectedIncident.title,
        message: details.trim() || selectedIncident.desc,
        severity: selectedIncident.severity,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div class="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div class="p-5 bg-rose-600 text-white flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-white/20">
              <AlertTriangle class="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 class="font-extrabold text-base tracking-tight">Report Incident / Alert</h3>
              <p class="text-xs text-rose-100">Broadcasts instant notification to college</p>
            </div>
          </div>
          <button
            onClick={onClose}
            class="p-2 rounded-xl hover:bg-white/20 text-white transition"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} class="p-6 space-y-4">
          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Incident Type
            </label>
            <div class="space-y-2">
              {incidents.map((item) => {
                const isSelected = selectedIncident?.id === item.id;
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedIncident(item)}
                    class={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                      isSelected
                        ? `${item.color} ring-2 ring-rose-500 shadow-sm`
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div class="p-2 rounded-xl bg-white shadow-sm">
                      <Icon class="w-5 h-5 text-slate-800" />
                    </div>
                    <div class="flex-1">
                      <div class="text-xs font-bold text-slate-900">{item.title}</div>
                      <div class="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                    {isSelected && (
                      <div class="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center">
                        <Check class="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Expecting 15 min delay due to accident at Main St crossing..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
            />
          </div>

          <div class="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedIncident || submitting}
              class="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700 disabled:opacity-50 transition active:scale-95"
            >
              {submitting ? 'Broadcasting...' : 'Broadcast Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
