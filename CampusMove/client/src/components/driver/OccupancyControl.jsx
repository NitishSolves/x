import React from 'react';
import { Users, Plus, Minus, Check } from 'lucide-react';

export default function OccupancyControl({
  currentStatus = 'SEATS_AVAILABLE',
  passengerCount = 0,
  capacity = 40,
  onStatusChange,
  onCountChange
}) {
  const options = [
    { id: 'EMPTY', label: 'Empty', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-700' },
    { id: 'SEATS_AVAILABLE', label: 'Seats Open', color: 'border-blue-500 bg-blue-500/10 text-blue-700' },
    { id: 'STANDING_ONLY', label: 'Standing Only', color: 'border-amber-500 bg-amber-500/10 text-amber-700' },
    { id: 'FULL', label: 'Full / Packed', color: 'border-rose-500 bg-rose-500/10 text-rose-700' },
  ];

  return (
    <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <Users class="w-4 h-4 text-slate-600" />
          <span class="text-xs font-bold uppercase tracking-wider text-slate-700">Live Occupancy Status</span>
        </div>
        <div class="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-xl">
          <button
            onClick={() => onCountChange(Math.max(0, passengerCount - 1))}
            class="p-1 rounded-lg bg-white shadow-sm hover:bg-slate-50 text-slate-700 active:scale-95 transition"
            title="Decrease passengers"
          >
            <Minus class="w-3.5 h-3.5" />
          </button>
          <span class="font-mono font-bold text-xs text-slate-800 min-w-8 text-center">
            {passengerCount} / {capacity}
          </span>
          <button
            onClick={() => onCountChange(Math.min(capacity + 15, passengerCount + 1))}
            class="p-1 rounded-lg bg-white shadow-sm hover:bg-slate-50 text-slate-700 active:scale-95 transition"
            title="Increase passengers"
          >
            <Plus class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1-Tap Quick Status Buttons */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {options.map((opt) => {
          const isSelected = currentStatus === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onStatusChange(opt.id)}
              class={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition flex items-center justify-center gap-1.5 active:scale-95 ${
                isSelected
                  ? `${opt.color} ring-2 ring-offset-1 ring-slate-400 font-extrabold shadow-sm`
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isSelected && <Check class="w-3.5 h-3.5 stroke-[3]" />}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
