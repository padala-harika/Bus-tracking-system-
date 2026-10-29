import React, { useState } from 'react';
import { useTransport } from '../../context/TransportContext';
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  CloudRain,
  AlertTriangle,
  Flame,
  Wrench,
  RefreshCw,
  MapPin,
  Volume2,
  CheckCircle2,
  Navigation,
  HelpCircle,
  Play,
} from 'lucide-react';
import { speakText, MULTILINGUAL_PHRASES } from '../../services/voiceAssistant';

export const DemoScenarioBar: React.FC = () => {
  const {
    currentUser,
    buses,
    simulateHeavyTraffic,
    simulateRain,
    simulateBusDelay,
    simulateBreakdown,
    simulateBusReplacement,
    simulateRouteChange,
    simulateMissedStop,
    simulateBusArrival,
    markStudentMissedBus,
    resetSimulation,
    driverLanguage,
  } = useTransport();

  const [isExpanded, setIsExpanded] = useState(true);

  // Check if Bus Replacement has already occurred
  const isReplacementDone =
    buses.some((b) => b.id === 'bus-12' && b.isReplacement) ||
    currentUser?.assignedBusId === 'bus-12';

  // Check if Bus 07 is delayed
  const isBus07Delayed = buses.some((b) => b.id === 'bus-07' && b.status === 'delayed');

  const testScenarios = [
    {
      id: 's1',
      title: '1. Normal Commute',
      description: 'Reset to baseline on-time schedule (Leave: 8:08 AM, Stop: 8:18 AM)',
      action: resetSimulation,
      badge: '🟢 Reset',
      color: 'hover:bg-emerald-50 text-emerald-800 border-emerald-200',
      disabled: false,
    },
    {
      id: 's2',
      title: '2. Heavy Traffic (+8m)',
      description: 'Severe corridor gridlock, AI ETA adjusts departure to 8:16 AM',
      action: simulateHeavyTraffic,
      badge: '🚗 Congestion',
      color: 'hover:bg-amber-50 text-amber-800 border-amber-200',
      disabled: false,
    },
    {
      id: 's3',
      title: '3. Heavy Rain (92%)',
      description: 'High precipitation friction triggers speed buffer adjustment',
      action: simulateRain,
      badge: '🌧️ Rain',
      color: 'hover:bg-blue-50 text-blue-800 border-blue-200',
      disabled: false,
    },
    {
      id: 's4',
      title: '4. Bus Delay (+8m)',
      description: isBus07Delayed
        ? 'BUS-07 status is Delayed (+8m). ETA updated to 08:26 AM.'
        : 'BUS-07 status changes to delayed with explanation',
      action: () => simulateBusDelay('bus-07', 8),
      badge: isBus07Delayed ? '🟡 Delayed +8m' : '⏱️ Delay',
      color: isBus07Delayed
        ? 'bg-amber-50 text-amber-900 border-amber-400 ring-1 ring-amber-300'
        : 'hover:bg-amber-50 text-amber-800 border-amber-200',
      disabled: false,
    },
    {
      id: 's5',
      title: '5. Bus Breakdown',
      description: 'BUS-07 reports mechanical failure, stops, alerts admin & student',
      action: () => simulateBreakdown('bus-07'),
      badge: '🔧 Breakdown',
      color: 'hover:bg-rose-50 text-rose-800 border-rose-200',
      disabled: false,
    },
    {
      id: 's6',
      title: '6. Bus Replacement',
      description: isReplacementDone
        ? 'BUS-12 replaces BUS-07 on Route A. Replacement active.'
        : 'BUS-12 replaces BUS-07. Student gets replacement notification',
      action: () => {
        if (!isReplacementDone) {
          simulateBusReplacement('bus-07', 'bus-12');
        }
      },
      badge: isReplacementDone ? '✅ Replaced' : '🔄 Replace',
      color: isReplacementDone
        ? 'bg-purple-50 text-purple-900 border-purple-300 ring-1 ring-purple-300'
        : 'hover:bg-purple-50 text-purple-800 border-purple-200',
      disabled: isReplacementDone,
    },
    {
      id: 's7',
      title: '7. Missed Bus AI',
      description: 'Student triggers "I Missed My Bus" — AI ranks best alternatives',
      action: markStudentMissedBus,
      badge: '🏃 Missed Bus',
      color: 'hover:bg-amber-50 text-amber-800 border-amber-200',
      disabled: false,
    },
    {
      id: 's8',
      title: '8. Route Detour',
      description: 'Construction detour on Route A, assigns temporary stop',
      action: simulateRouteChange,
      badge: '🚧 Detour',
      color: 'hover:bg-orange-50 text-orange-800 border-orange-200',
      disabled: false,
    },
    {
      id: 's9',
      title: '9. Missed Stop Voice Alert',
      description: 'Driver passes Stop 4 without completion, triggers spoken alert',
      action: simulateMissedStop,
      badge: '🗣️ Voice Alert',
      color: 'hover:bg-rose-50 text-rose-800 border-rose-200',
      disabled: false,
    },
    {
      id: 's10',
      title: '10. Bus Arrival at Campus',
      description: 'BUS-07 enters campus geofence, auto-logged in Admin Arrival Board',
      action: () => simulateBusArrival('bus-07'),
      badge: '🎓 Arrival',
      color: 'hover:bg-emerald-50 text-emerald-800 border-emerald-200',
      disabled: false,
    },
  ];

  return (
    <aside aria-label="Evaluation Scenarios" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl transition-all">
      {/* Drawer Toggle Handle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="mx-auto flex h-9 max-w-7xl cursor-pointer items-center justify-between px-4 sm:px-6 lg:px-8 text-xs font-bold text-slate-700 hover:bg-slate-100/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span>Interactive Demo Scenarios & Test Suite</span>
          <span className="hidden sm:inline-block text-[11px] font-normal text-slate-500">
            (Evaluate all 13 core requirements dynamically)
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
          <span>{isExpanded ? 'Collapse' : 'Expand Scenarios'}</span>
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </div>
      </div>

      {/* Expanded Scenario Action Buttons Grid */}
      {isExpanded && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {testScenarios.map((scen) => (
              <button
                key={scen.id}
                id={`scenario-btn-${scen.id}`}
                disabled={scen.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  scen.action();
                }}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all active:scale-95 bg-white shadow-xs ${scen.color} ${
                  scen.disabled ? 'cursor-default opacity-90' : 'cursor-pointer'
                }`}
                title={scen.disabled ? 'Replacement already completed' : `Trigger ${scen.title}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-[11.5px] line-clamp-1">{scen.title}</span>
                  <span
                    id={scen.id === 's6' ? 'scenario-replace-badge' : undefined}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      scen.disabled ? 'bg-purple-200 text-purple-900' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {scen.badge}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-tight">
                  {scen.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
