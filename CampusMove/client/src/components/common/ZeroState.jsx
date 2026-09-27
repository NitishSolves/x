import React from 'react';
import { Bus, Clock, AlertCircle } from 'lucide-react';

export default function ZeroState({
  title = "No Active Buses Tracking",
  message = "There are currently no buses broadcasting live GPS on this route. Real-time location will appear automatically once a driver initiates the trip.",
  icon = "bus"
}) {
  return (
    <div class="flex flex-col items-center justify-center p-8 text-center bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
        {icon === 'clock' ? (
          <Clock class="w-7 h-7 text-slate-400" />
        ) : icon === 'alert' ? (
          <AlertCircle class="w-7 h-7 text-amber-500" />
        ) : (
          <Bus class="w-7 h-7 text-slate-400" />
        )}
      </div>
      <h3 class="text-sm font-bold text-slate-800 tracking-tight mb-1">{title}</h3>
      <p class="text-xs text-slate-500 max-w-sm leading-relaxed">{message}</p>
    </div>
  );
}
