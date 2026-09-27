import React from 'react';
import { Bus, Navigation, AlertTriangle, CheckCircle2, Users, Radio } from 'lucide-react';

export default function FleetOverview({ stats }) {
  const cards = [
    {
      title: 'FLEET ON ROAD NOW',
      value: stats?.tripsOnRoad || 0,
      sub: `${stats?.totalBuses || 0} total buses registered`,
      icon: Radio,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
      activeBadge: (stats?.tripsOnRoad || 0) > 0,
    },
    {
      title: 'ACTIVE ROUTES',
      value: stats?.totalRoutes || 0,
      sub: 'Campus routes in service',
      icon: Navigation,
      color: 'bg-campus-500/10 text-campus-600 border-campus-200',
    },
    {
      title: 'TOTAL DRIVERS',
      value: stats?.totalDrivers || 0,
      sub: 'Verified driver accounts',
      icon: Users,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    },
    {
      title: 'ACTIVE ALERTS',
      value: stats?.activeAlerts || 0,
      sub: 'Live incident advisories',
      icon: AlertTriangle,
      color: (stats?.activeAlerts || 0) > 0 ? 'bg-amber-500/10 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200',
    },
    {
      title: 'TRIPS COMPLETED',
      value: stats?.completedTrips || 0,
      sub: 'Recorded trip cycles',
      icon: CheckCircle2,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
    },
  ];

  return (
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                {card.title}
              </span>
              <div class={`p-2 rounded-xl border ${card.color}`}>
                <Icon class="w-4 h-4" />
              </div>
            </div>

            <div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-black tracking-tight text-slate-900 font-mono">
                  {card.value}
                </span>
                {card.activeBadge && (
                  <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    LIVE
                  </span>
                )}
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5 truncate">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
