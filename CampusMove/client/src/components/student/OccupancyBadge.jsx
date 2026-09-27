import React from 'react';
import { Users } from 'lucide-react';

export default function OccupancyBadge({ status = 'SEATS_AVAILABLE', count = 0, capacity = 40 }) {
  const getBadgeConfig = () => {
    switch (status) {
      case 'EMPTY':
        return {
          label: 'Plenty of Seats',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'SEATS_AVAILABLE':
        return {
          label: 'Seats Available',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
        };
      case 'STANDING_ONLY':
        return {
          label: 'Standing Room Only',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'FULL':
        return {
          label: 'Bus Full / At Capacity',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: 'Normal Capacity',
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
      <Users class="w-3.5 h-3.5 opacity-80" />
      <span class={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      <span>{config.label}</span>
      {count > 0 && (
        <span class="ml-1 opacity-75 font-mono text-[10px]">
          ({count}/{capacity})
        </span>
      )}
    </div>
  );
}
