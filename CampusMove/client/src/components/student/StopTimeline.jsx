import React from 'react';
import { MapPin, CheckCircle2, Clock, Navigation, CircleDot } from 'lucide-react';

export default function StopTimeline({ stops = [], onSelectStop = null, activeTrip = null }) {
  if (!stops || stops.length === 0) {
    return (
      <div class="p-6 text-center text-xs text-slate-400">
        No stops scheduled for this route.
      </div>
    );
  }

  return (
    <div class="flow-root py-2">
      <ul class="-mb-8">
        {stops.map((stop, idx) => {
          const isLast = idx === stops.length - 1;
          const status = stop.status || 'UPCOMING';
          const isPassed = status === 'PASSED';
          const isCurrent = status === 'CURRENT';
          const isNext = status === 'NEXT';

          return (
            <li key={stop.id || idx}>
              <div class="relative pb-6">
                {/* Timeline vertical connector */}
                {!isLast && (
                  <span
                    class={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                      isPassed ? 'bg-emerald-300' : isCurrent ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                    aria-hidden="true"
                  />
                )}

                <div
                  onClick={() => onSelectStop && onSelectStop(stop)}
                  class={`relative flex items-start space-x-3 p-2 rounded-xl transition cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-50/90 ring-1 ring-emerald-200 shadow-sm'
                      : isNext
                      ? 'bg-amber-50/80 ring-1 ring-amber-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Pin Node */}
                  <div>
                    <span
                      class={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm font-bold text-xs ${
                        isPassed
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : isNext
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 class="w-4 h-4" />
                      ) : (
                        <span>{stop.sequenceOrder || stop.sequence_order || idx + 1}</span>
                      )}
                    </span>
                  </div>

                  {/* Stop Information */}
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-2">
                      <p class="text-xs font-bold text-slate-900 truncate">
                        {stop.name}
                      </p>
                      
                      {/* Live ETA or Status Badge */}
                      {activeTrip ? (
                        <div>
                          {isCurrent ? (
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              At Stop / Boarding
                            </span>
                          ) : isPassed ? (
                            <span class="text-[11px] font-medium text-slate-400">
                              Departed
                            </span>
                          ) : stop.etaText ? (
                            <span class={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                              isNext ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800'
                            }`}>
                              <Clock class="w-3 h-3 text-slate-500" />
                              {stop.etaText}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span class="text-[11px] text-slate-400 font-mono">
                          {stop.scheduled_time || stop.scheduledTime || '--:--'}
                        </span>
                      )}
                    </div>

                    {stop.landmark && (
                      <p class="mt-0.5 text-[11px] text-slate-500 truncate">
                        {stop.landmark}
                      </p>
                    )}

                    {stop.distanceMeters !== undefined && stop.distanceMeters > 0 && !isPassed && (
                      <div class="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                        <span>~{(stop.distanceMeters / 1000).toFixed(1)} km away</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
