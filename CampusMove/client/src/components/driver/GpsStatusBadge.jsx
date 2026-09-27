import React from 'react';
import { Radio, Gauge, Navigation } from 'lucide-react';

export default function GpsStatusBadge({ isTracking = false, accuracy = 0, speed = 0, lastPing = null }) {
  const getAccuracyQuality = (acc) => {
    if (acc <= 10) return { label: 'Excellent', color: 'text-emerald-500' };
    if (acc <= 25) return { label: 'Good', color: 'text-blue-500' };
    if (acc <= 50) return { label: 'Moderate', color: 'text-amber-500' };
    return { label: 'Low', color: 'text-rose-500' };
  };

  const quality = getAccuracyQuality(accuracy);

  return (
    <div class="grid grid-cols-3 gap-2 p-3 bg-slate-900 rounded-2xl border border-slate-800 text-white shadow-lg">
      {/* 1. Broadcasting Status */}
      <div class="flex items-center gap-2.5">
        <div class={`w-9 h-9 rounded-xl flex items-center justify-center ${
          isTracking ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
        }`}>
          <Radio class={`w-5 h-5 ${isTracking ? 'animate-pulse' : ''}`} />
        </div>
        <div>
          <div class="text-[10px] uppercase font-bold text-slate-400">TELEMETRY</div>
          <div class="text-xs font-extrabold flex items-center gap-1.5">
            {isTracking ? (
              <>
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-emerald-400">BROADCASTING</span>
              </>
            ) : (
              <span class="text-slate-500">IDLE / PAUSED</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Speed */}
      <div class="flex items-center gap-2.5 border-l border-slate-800 pl-3">
        <div class="w-9 h-9 rounded-xl bg-campus-500/20 text-campus-400 flex items-center justify-center">
          <Gauge class="w-5 h-5" />
        </div>
        <div>
          <div class="text-[10px] uppercase font-bold text-slate-400">LIVE SPEED</div>
          <div class="text-xs font-mono font-extrabold text-white">
            {Math.round(speed)} <span class="text-[10px] font-normal text-slate-400">km/h</span>
          </div>
        </div>
      </div>

      {/* 3. Accuracy */}
      <div class="flex items-center gap-2.5 border-l border-slate-800 pl-3">
        <div class="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
          <Navigation class="w-5 h-5" />
        </div>
        <div>
          <div class="text-[10px] uppercase font-bold text-slate-400">ACCURACY</div>
          <div class="text-xs font-mono font-extrabold text-white flex items-center gap-1">
            <span>±{Math.round(accuracy)}m</span>
            <span class={`text-[10px] font-sans font-bold ${quality.color}`}>({quality.label})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
