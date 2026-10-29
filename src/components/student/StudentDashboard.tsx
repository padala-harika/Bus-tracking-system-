import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTransport } from '../../context/TransportContext';
import { InteractiveMap } from '../common/InteractiveMap';
import { findMissedBusAlternatives } from '../../services/predictionEngine';
import { MissedBusAlternative } from '../../types';
import { INITIAL_BUSES, INITIAL_ROUTES } from '../../data/mockDatabase';
import {
  Clock,
  MapPin,
  Sparkles,
  Phone,
  AlertCircle,
  Navigation,
  CheckCircle2,
  Calendar,
  Compass,
  Bus as BusIcon,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Users,
  Gauge,
  HelpCircle,
  Sliders,
  ChevronRight,
  AlertTriangle,
  X,
  Check,
  Maximize2,
} from 'lucide-react';
import {
  safeBusNumber,
  safeRouteName,
  safeStopName,
  safeDriverName,
  safeDriverPhone,
  safeSpeed,
  safeOccupancy,
  safeEta,
  safeLocationAddress,
} from '../../utils/safeDisplay';

/**
 * Dynamic greeting based on user's local time:
 * - 5:00 AM–11:59 AM: Good Morning
 * - 12:00 PM–4:59 PM: Good Afternoon
 * - 5:00 PM–4:59 AM: Good Evening
 */
const getDynamicGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
};

export const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    buses,
    routes,
    studentJourney,
    missedBusAlternatives,
    isStudentMissedBus,
    isMissedBusModalOpen,
    setIsMissedBusModalOpen,
    isStudentBoarded,
    setIsStudentBoarded,
    missedBusTriggerCount,
    markStudentMissedBus,
    dismissStudentMissedBus,
    selectAlternativeBus,
    updateStudentWalkingTime,
    simulateBusReplacement,
    weather,
    traffic,
  } = useTransport();

  const [greeting, setGreeting] = useState<string>(getDynamicGreeting);

  useEffect(() => {
    const updateGreeting = () => setGreeting(getDynamicGreeting());
    updateGreeting();
    const interval = setInterval(updateGreeting, 30000);
    return () => clearInterval(interval);
  }, []);

  const [aiExplanationLoading, setAiExplanationLoading] = useState(false);
  const [customAiExplanation, setCustomAiExplanation] = useState<string | null>(null);
  const [walkingInput, setWalkingInput] = useState<number>(currentUser?.walkingTimeMinutes || 7);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [driverCallNotice, setDriverCallNotice] = useState<string | null>(null);

  // Assigned bus and route details (robustly derives replacement bus if assigned)
  const assignedBus =
    buses.find((b) => b.id === (currentUser?.assignedBusId || studentJourney?.busId || 'bus-07')) ||
    buses.find((b) => b.isReplacement) ||
    buses[6] ||
    buses[0] ||
    INITIAL_BUSES[0];
  const assignedRoute =
    (assignedBus && routes.find((r) => r.id === assignedBus.routeId)) ||
    routes[0] ||
    INITIAL_ROUTES[0];
  const studentStop =
    assignedRoute?.stops?.find(
      (s) => s.id === (currentUser?.assignedStopId || studentJourney?.studentStopId || 'stop-a3')
    ) ||
    assignedRoute?.stops?.[2] ||
    assignedRoute?.stops?.[0] ||
    INITIAL_ROUTES[0].stops[2];

  // Auto-reset custom AI explanation when assigned bus changes or status changes (ensures clean sync)
  useEffect(() => {
    setCustomAiExplanation(null);
  }, [assignedBus.id, assignedBus.status, assignedBus.delayMinutes]);

  // Missed Bus Intelligence State & Non-blocking Management
  const [isCalculatingAlternatives, setIsCalculatingAlternatives] = useState(false);
  const [isClickDisabled, setIsClickDisabled] = useState(false);
  const [alternativesList, setAlternativesList] = useState<MissedBusAlternative[]>(() =>
    findMissedBusAlternatives(assignedBus, buses, studentStop)
  );
  const [aiRecommendationText, setAiRecommendationText] = useState<string | null>(
    () => findMissedBusAlternatives(assignedBus, buses, studentStop)[0]?.recommendationReason || 'Optimal corridor connection on Route B (Metro Link).'
  );
  const [aiEngineSource, setAiEngineSource] = useState<'gemini' | 'rule-engine' | 'cached'>('rule-engine');
  const [aiServiceNotice, setAiServiceNotice] = useState<string | null>(null);
  const [selectedAltBusId, setSelectedAltBusId] = useState<string | null>(null);

  // Cache previously calculated alternatives per busId + stopId
  const cachedAlternativesRef = useRef<Record<string, { alternatives: MissedBusAlternative[]; text: string; source: any }>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close modal cleanly: abort in-flight requests and dismiss global state
  const handleCloseMissedBusModal = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsCalculatingAlternatives(false);
    dismissStudentMissedBus();
  }, [dismissStudentMissedBus]);

  // Non-blocking Missed Bus calculation with caching, AbortController & fallback
  const fetchOrComputeAlternatives = useCallback(
    async (forceFresh: boolean = false) => {
      setAiServiceNotice(null);

      const cacheKey = `${assignedBus.id}-${studentJourney.studentStopId}`;

      // If already cached and not forced fresh, display immediately
      if (!forceFresh && cachedAlternativesRef.current[cacheKey]) {
        const cached = cachedAlternativesRef.current[cacheKey];
        setAlternativesList(cached.alternatives);
        setAiRecommendationText(cached.text);
        setAiEngineSource('cached');
        setIsCalculatingAlternatives(false);
        return;
      }

      // Compute immediate algorithmic alternatives (safe, synchronous with fallback)
      const baseAlts = findMissedBusAlternatives(assignedBus, buses, studentStop);
      setAlternativesList(baseAlts);
      setAiRecommendationText(baseAlts[0]?.recommendationReason || 'Optimal corridor connection on Route B (Metro Link).');
      setAiEngineSource('rule-engine');

      // Abort any previous in-flight calculation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsCalculatingAlternatives(true);

      try {
        // Enforce 8000ms client timeout so the UI will never stall while allowing Gemini to complete
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 8000);

        const res = await fetch('/api/ai/missed-bus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            missedBusNumber: assignedBus.busNumber,
            stopName: studentJourney.studentStopName,
            alternatives: baseAlts,
            trafficCondition: traffic,
            weatherCondition: weather.condition,
          }),
        });

        clearTimeout(timeoutId);

        if (controller.signal.aborted) return;

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data = await res.json();
        if (controller.signal.aborted) return;

        if (data && data.recommendationReason) {
          const updatedAlts = baseAlts.map((alt) => {
            const isMatch = alt.busId === (data.recommendedBusId || baseAlts[0]?.busId);
            return {
              ...alt,
              isRecommended: isMatch,
              recommendationReason: isMatch ? data.recommendationReason : alt.recommendationReason,
            };
          });

          setAlternativesList(updatedAlts);
          setAiRecommendationText(data.recommendationReason);
          setAiEngineSource(data.source === 'gemini' ? 'gemini' : 'rule-engine');

          // Store in cache for instant display on future opens
          cachedAlternativesRef.current[cacheKey] = {
            alternatives: updatedAlts,
            text: data.recommendationReason,
            source: data.source || 'rule-engine',
          };
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setAiServiceNotice('Live AI server response timed out. Displaying verified algorithmic alternatives.');
        } else {
          console.warn('Missed Bus AI request error, using algorithmic fallback:', err);
          setAiServiceNotice('AI cloud service temporarily unavailable. Optimal alternative calculated locally.');
        }

        // Cache baseline so subsequent clicks don't re-trigger network failures
        cachedAlternativesRef.current[cacheKey] = {
          alternatives: baseAlts,
          text: baseAlts[0]?.recommendationReason || 'Optimal corridor connection on Route B (Metro Link).',
          source: 'rule-engine',
        };
      } finally {
        if (!controller.signal.aborted) {
          setIsCalculatingAlternatives(false);
        }
      }
    },
    [
      assignedBus,
      buses,
      studentStop,
      studentJourney.studentStopId,
      studentJourney.studentStopName,
      traffic,
      weather.condition,
    ]
  );

  // Trigger from in-page button
  const handleTriggerMissedBus = useCallback(
    (forceFresh: boolean = false) => {
      if (isClickDisabled) return;
      setIsClickDisabled(true);
      setTimeout(() => setIsClickDisabled(false), 600);

      markStudentMissedBus();
      fetchOrComputeAlternatives(forceFresh);
    },
    [isClickDisabled, markStudentMissedBus, fetchOrComputeAlternatives]
  );

  // Sync when context opens modal, when missedBusTriggerCount changes, or when isStudentMissedBus is active
  const lastHandledCountRef = useRef(missedBusTriggerCount);
  useEffect(() => {
    if (isMissedBusModalOpen || isStudentMissedBus) {
      const isNewTrigger = missedBusTriggerCount > lastHandledCountRef.current;
      lastHandledCountRef.current = missedBusTriggerCount;
      fetchOrComputeAlternatives(isNewTrigger);
    }
  }, [isMissedBusModalOpen, isStudentMissedBus, missedBusTriggerCount, fetchOrComputeAlternatives]);

  // Keyboard accessibility: Esc key closes modal cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMissedBusModalOpen) {
        handleCloseMissedBusModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMissedBusModalOpen, handleCloseMissedBusModal]);

  // Clean up any pending abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Switch tracking to an alternative bus
  const handleSelectAlternativeBus = (busId: string) => {
    setSelectedAltBusId(busId);
    selectAlternativeBus(busId);
    setTimeout(() => {
      handleCloseMissedBusModal();
    }, 450);
  };

  // Request fresh server-side Gemini explanation with complete route context
  const fetchGeminiExplanation = async () => {
    setAiExplanationLoading(true);
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busNumber: safeBusNumber(assignedBus),
          routeName: safeRouteName(assignedRoute, assignedBus, 'Route B — Metro Link'),
          roadName: safeStopName(studentStop, 'Main Road Arterial'),
          stopName: safeStopName(studentStop, studentJourney.studentStopName),
          delayMinutes: studentJourney.expectedDelayMinutes ?? 0,
          trafficCondition: traffic || 'normal',
          weatherCondition: weather?.condition || 'clear',
          rainProbability: weather?.rainProbability ?? 0,
        }),
      });
      const data = await res.json();
      if (data.explanation) {
        setCustomAiExplanation(data.explanation);
      }
    } catch (err) {
      console.error('Failed to fetch Gemini AI explanation:', err);
    } finally {
      setAiExplanationLoading(false);
    }
  };

  const handleWalkingChange = (newVal: number) => {
    setWalkingInput(newVal);
    updateStudentWalkingTime(newVal);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Bus Breakdown Notice with direct in-portal Replace action */}
      {assignedBus.status === 'unavailable' && !assignedBus.isReplacement && (
        <div className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-4 sm:p-5 shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white font-bold">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-amber-900 uppercase tracking-wide">
                  ⚠️ BUS-07 BREAKDOWN REPORTED
                </h3>
                <button
                  type="button"
                  id="portal-replace-bus-btn"
                  onClick={() => simulateBusReplacement('bus-07', 'bus-12')}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Replace with BUS-12</span>
                </button>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-amber-800 font-medium">
                BUS-07 has reported mechanical failure. Standby replacement BUS-12 is stationed and ready to take over Route A.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bus Delay Notice Banner */}
      {assignedBus.status === 'delayed' && (
        <div
          id="bus-delay-banner"
          className="rounded-2xl border-2 border-amber-400 bg-amber-50/95 p-4 sm:p-5 shadow-xs animate-in slide-in-from-top duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black text-lg shadow-xs">
              ⏱️
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold text-amber-950">
                    {safeBusNumber(assignedBus)} Status: Delayed (+8m)
                  </h4>
                  <span className="rounded-full bg-amber-200 text-amber-900 border border-amber-400 px-2.5 py-0.5 text-xs font-black">
                    Delayed +8 min
                  </span>
                </div>
              </div>
              <p className="text-xs text-amber-900/90 mt-1">
                Heavy traffic on approaching junction. AI ETA for your stop ({safeStopName(studentStop, studentJourney.studentStopName)}) is adjusted by +8 minutes to <strong>{safeEta(studentJourney.predictedBusArrivalTime, '08:26 AM')}</strong>. Recommended leave-home time updated to <strong>{safeEta(studentJourney.recommendedLeaveHomeTime, '08:16 AM')}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Replacement / Emergency Notice Banner if Bus was changed */}
      {assignedBus.isReplacement && (
        <div className="rounded-2xl border-2 border-rose-500 bg-rose-50 p-4 sm:p-5 shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white font-bold">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-rose-900 uppercase tracking-wide">
                  🔴 URGENT DISPATCH: YOUR BUS HAS BEEN CHANGED
                </h3>
                <span className="rounded-full bg-rose-200 px-3 py-0.5 text-xs font-bold text-rose-900">
                  Replacement Active
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-rose-800 font-medium">
                Previous Bus <span className="line-through font-bold">BUS-07</span> is unavailable due to mechanical
                issue. Your journey has been automatically transferred to <strong>BUS-12</strong>.
              </p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white/80 p-2 rounded-lg border border-rose-200">
                  <span className="text-slate-500 block text-[10px]">Assigned Stop</span>
                  <span className="font-bold text-slate-900">{studentJourney.studentStopName}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-rose-200">
                  <span className="text-slate-500 block text-[10px]">BUS-12 Expected</span>
                  <span className="font-bold text-emerald-700">{safeEta(studentJourney.predictedBusArrivalTime, '08:18 AM')}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-rose-200">
                  <span className="text-slate-500 block text-[10px]">College Arrival</span>
                  <span className="font-bold text-blue-700">{safeEta(studentJourney.predictedCollegeArrivalTime, '08:56 AM')}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-rose-200 flex items-center justify-center font-bold text-rose-700">
                  Do not wait for BUS-07
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
              👨‍🎓 Student Portal
            </span>
            <span className="text-xs text-slate-500">Roll No: {currentUser?.identifier || '24CS070'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {greeting}, {currentUser?.name || 'Priya Sharma'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Intelligent journey prediction for your commute to Apex College Campus
          </p>
        </div>

        {/* Missed Bus Action Button */}
        <div className="flex items-center gap-2">
          <button
            id="missed-bus-trigger-btn"
            onClick={() => handleTriggerMissedBus(false)}
            disabled={isClickDisabled}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer ${
              isStudentMissedBus
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25 ring-2 ring-rose-300 active:scale-95'
                : isClickDisabled
                ? 'bg-amber-400 opacity-80 cursor-not-allowed text-slate-950'
                : 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950'
            }`}
            title={isStudentMissedBus ? 'View AI Alternative Buses' : 'Mark bus missed and calculate AI alternatives'}
          >
            {isCalculatingAlternatives ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : isStudentMissedBus ? (
              <AlertTriangle className="h-4 w-4 text-white" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>
              {isCalculatingAlternatives
                ? 'CALCULATING...'
                : isStudentMissedBus
                ? 'BUS MISSED • VIEW ALTERNATIVES'
                : 'I MISSED MY BUS'}
            </span>
          </button>
        </div>
      </div>

      {/* Automatic Missed Bus Status Banner */}
      {isStudentMissedBus && (
        <div
          id="student-missed-bus-banner"
          className="rounded-2xl border-2 border-rose-300 bg-rose-50/95 p-4 sm:p-5 shadow-sm text-slate-900 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-500/30">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white tracking-wide uppercase">
                    JOURNEY STATUS: BUS MISSED
                  </span>
                  <span className="text-xs font-bold text-rose-900">
                    {safeBusNumber(assignedBus)} passed {safeStopName(studentStop, studentJourney.studentStopName)}
                  </span>
                </div>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  Automatic GPS detection confirmed that {safeBusNumber(assignedBus)} has passed your pickup stop without boarding. AI has analyzed alternative transit options to ensure you reach campus on time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="view-missed-bus-modal-btn"
                onClick={() => {
                  setIsMissedBusModalOpen(true);
                  fetchOrComputeAlternatives(false);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Open Missed Bus AI Engine</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Journey Card & Leave Home Intelligence (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Today's Journey Status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                  <BusIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{safeBusNumber(assignedBus)}</h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isStudentMissedBus
                          ? 'bg-rose-100 text-rose-900 border border-rose-400 font-black'
                          : assignedBus.status === 'on-time'
                          ? 'bg-emerald-100 text-emerald-800'
                          : assignedBus.status === 'delayed'
                          ? 'bg-amber-100 text-amber-900 border border-amber-400 font-black'
                          : assignedBus.status === 'unavailable'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isStudentMissedBus && '🔴 Bus Missed'}
                      {!isStudentMissedBus && assignedBus.status === 'on-time' && '🟢 On Time'}
                      {!isStudentMissedBus && assignedBus.status === 'delayed' && '🟡 Delayed +8 min'}
                      {!isStudentMissedBus && assignedBus.status === 'unavailable' && '🔴 Unavailable'}
                      {!isStudentMissedBus && assignedBus.status === 'route-changed' && '🔵 Route Changed'}
                      {!isStudentMissedBus && assignedBus.status === 'arrived' && '🟢 Arrived'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{safeRouteName(assignedRoute, assignedBus)}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-medium text-slate-400 block">Registration</span>
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {assignedBus.registrationNumber || 'TS-09-UB-Fleet'}
                </span>
              </div>
            </div>

            {/* Stop and Arrival Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-5">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <span className="text-slate-500 text-[11px] block mb-1">Your Stop</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  {safeStopName(studentStop, studentJourney.studentStopName)}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <span className="text-slate-500 text-[11px] block mb-1">Scheduled Arrival</span>
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  {safeEta(studentJourney.scheduledBusArrivalTime, '08:18 AM')}
                </span>
              </div>

              <div className="rounded-xl bg-blue-50/70 p-3 border border-blue-100 col-span-2 sm:col-span-1">
                <span className="text-blue-600 text-[11px] font-bold block mb-1">AI Predicted Arrival</span>
                <span className="font-extrabold text-blue-800 text-sm flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  {safeEta(studentJourney.predictedBusArrivalTime, '08:26 AM')}
                </span>
                {assignedBus.status === 'delayed' ? (
                  <span className="text-[10px] text-amber-800 font-bold block mt-0.5 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300">
                    ⚠️ Delayed +8 min
                  </span>
                ) : studentJourney.expectedDelayMinutes > 0 ? (
                  <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                    +{studentJourney.expectedDelayMinutes} min delay expected
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                    On Time
                  </span>
                )}
              </div>
            </div>

            {/* AI Explanation Natural Language Section */}
            <div className="rounded-xl bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-slate-50 p-3.5 border border-blue-100 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span>AI Journey Explanation & Grounding</span>
                </div>
                <button
                  onClick={fetchGeminiExplanation}
                  disabled={aiExplanationLoading}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-50"
                  title="Refresh AI prediction via Gemini API"
                >
                  <RefreshCw className={`h-3 w-3 ${aiExplanationLoading ? 'animate-spin' : ''}`} />
                  <span>{aiExplanationLoading ? 'Thinking...' : 'AI Re-eval'}</span>
                </button>
              </div>
              <p className="text-slate-700 leading-relaxed text-[11.5px]">
                {customAiExplanation || studentJourney.explanation}
              </p>
            </div>

            {/* Passenger Boarding Status & Verification */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Passenger Status:</span>
                {isStudentBoarded ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Boarded on {safeBusNumber(assignedBus)}
                  </span>
                ) : isStudentMissedBus ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Did Not Board (Bus Passed)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    Waiting at Pickup Stop
                  </span>
                )}
              </div>
              {!isStudentMissedBus && (
                <button
                  type="button"
                  id="student-boarded-toggle-btn"
                  onClick={() => setIsStudentBoarded(!isStudentBoarded)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isStudentBoarded
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                  }`}
                >
                  {isStudentBoarded ? 'Cancel Boarded Status' : 'I Have Boarded'}
                </button>
              )}
            </div>
          </div>

          {/* Inline AI Alternative Buses Card (Immediately available when bus is missed) */}
          {isStudentMissedBus && (
            <div id="inline-alternatives-card" className="rounded-2xl border-2 border-rose-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">AI Alternative Buses</h3>
                    <p className="text-xs text-slate-500">Ranked by fastest college campus arrival time</p>
                  </div>
                </div>
                <button
                  type="button"
                  id="view-full-missed-modal-link"
                  onClick={() => {
                    setIsMissedBusModalOpen(true);
                    fetchOrComputeAlternatives(false);
                  }}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>Full AI Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* AI Recommendation Advice */}
              <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3 mb-4 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span>AI Route Recommendation</span>
                </div>
                <p className="text-amber-950 font-medium leading-relaxed text-[11.5px]">
                  {aiRecommendationText || alternativesList[0]?.recommendationReason || 'Optimal alternative connections identified.'}
                </p>
              </div>

              {/* List of Alternative Options */}
              <div className="space-y-3">
                {alternativesList.map((alt) => (
                  <div
                    key={alt.busId}
                    className={`p-3.5 rounded-xl border transition-all ${
                      alt.isRecommended
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900">{alt.busNumber}</span>
                          <span className="text-xs text-slate-600 font-medium">({alt.routeName})</span>
                          {alt.isRecommended && (
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                              ⭐ BEST ALTERNATIVE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                          <span>Stop ETA: <strong className="text-slate-900">{alt.predictedArrivalAtStudentStop}</strong></span>
                          <span>•</span>
                          <span>Campus ETA: <strong className="text-slate-900">{alt.predictedArrivalAtCollege}</strong></span>
                          <span>•</span>
                          <span>Seats: <strong className="text-emerald-700 font-bold">{alt.availableSeats} open</strong></span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic">
                          {alt.recommendationReason}
                        </p>
                      </div>

                      <button
                        type="button"
                        id={`switch-to-bus-${alt.busNumber.toLowerCase()}`}
                        onClick={() => selectAlternativeBus(alt.busId)}
                        className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          assignedBus.id === alt.busId
                            ? 'bg-emerald-600 text-white cursor-default'
                            : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs'
                        }`}
                      >
                        {assignedBus.id === alt.busId ? 'Currently Tracking' : `Switch to ${alt.busNumber}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 2: "When Should I Leave Home?" Feature */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">When Should I Leave Home?</h3>
                  <p className="text-xs text-slate-500">Calculated with live walking speed & buffer</p>
                </div>
              </div>

              {/* Walking time slider control */}
              <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Sliders className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-slate-600 font-medium">Walk:</span>
                <input
                  type="number"
                  min="2"
                  max="25"
                  value={walkingInput}
                  onChange={(e) => handleWalkingChange(parseInt(e.target.value) || 5)}
                  className="w-10 rounded border border-slate-300 px-1 py-0.5 text-center font-bold text-slate-800"
                />
                <span className="text-slate-400">mins</span>
              </div>
            </div>

            {/* Smart Journey Timeline */}
            <div className="relative mt-6 space-y-4 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Step 1: Leave Home */}
              <div className="relative flex items-start gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs ring-4 ring-emerald-100 z-10">
                  🏠
                </div>
                <div className="flex-1 rounded-xl bg-emerald-50/70 border border-emerald-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-900">LEAVE HOME BY</span>
                    <span className="text-sm font-extrabold text-emerald-800 font-mono">
                      {safeEta(studentJourney.recommendedLeaveHomeTime, '08:14 AM')}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Start walking now to reach stop comfortably without rushing.
                  </p>
                </div>
              </div>

              {/* Step 2: Walk to Stop */}
              <div className="relative flex items-start gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs ring-4 ring-white z-10">
                  🚶
                </div>
                <div className="flex-1 py-1">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span className="font-semibold">Walk to Stop & Buffer</span>
                    <span className="font-medium text-slate-500">
                      {studentJourney.walkingDurationMinutes}m walk + {studentJourney.safetyBufferMinutes}m safety
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3: Reach Stop */}
              <div className="relative flex items-start gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs ring-4 ring-blue-100 z-10">
                  🚏
                </div>
                <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">REACH STOP</span>
                    <span className="text-xs font-bold text-blue-700 font-mono">
                      {safeEta(studentJourney.predictedBusArrivalTime, '08:26 AM')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {safeStopName(studentStop, studentJourney.studentStopName)} — Bus approaching in ~{studentJourney.walkingDurationMinutes + 3}m
                  </p>
                </div>
              </div>

              {/* Step 4: Reach College Campus */}
              <div className="relative flex items-start gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs ring-4 ring-indigo-100 z-10">
                  🎓
                </div>
                <div className="flex-1 rounded-xl bg-indigo-50/70 border border-indigo-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-900">COLLEGE ARRIVAL</span>
                    <span className="text-sm font-extrabold text-indigo-800 font-mono">
                      {safeEta(studentJourney.predictedCollegeArrivalTime, '09:04 AM')}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Apex College Campus Main Gate — On track for morning lecture (09:10 AM).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live GPS Tracking Map & Driver Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Interactive Map */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-sm font-bold text-slate-900">Live GPS Tracking</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline truncate max-w-[140px]">
                  {safeLocationAddress(assignedBus.currentLocation)}
                </span>
                <button
                  id="student-expand-map-btn"
                  onClick={() => setIsMapExpanded(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold transition-colors"
                  title="Expand to Full Interactive Live Map"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Large View</span>
                </button>
              </div>
            </div>

            <InteractiveMap
              buses={buses}
              routes={routes}
              selectedBusId={assignedBus.id}
              highlightedStopId={studentJourney.studentStopId}
              studentHomeLocation={currentUser?.homeLocation}
              height="360px"
              showTrafficOverlay={true}
              studentJourney={studentJourney}
              isExpanded={isMapExpanded}
              onToggleExpand={() => setIsMapExpanded((prev) => !prev)}
            />
          </div>

          {/* Driver & Bus Telemetry Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Driver & Vehicle Telemetry
              </h4>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> GPS Verified
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-700">
                  👨‍✈️
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">{safeDriverName(assignedBus)}</h5>
                  <p className="text-[11px] text-slate-500 font-mono">{safeDriverPhone(assignedBus)}</p>
                </div>
              </div>
              <button
                type="button"
                id="student-call-driver-btn"
                onClick={() => {
                  setDriverCallNotice(`Connecting in-app transit dispatch to Driver ${safeDriverName(assignedBus)} (${safeDriverPhone(assignedBus)})...`);
                  setTimeout(() => setDriverCallNotice(null), 4000);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Phone className="h-3.5 w-3.5" /> Call Driver
              </button>
            </div>

            {driverCallNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{driverCallNotice}</span>
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-0.5">
                  <Gauge className="h-3.5 w-3.5 text-blue-600" /> Current Speed
                </div>
                <span className="font-extrabold text-slate-900 text-sm">
                  {safeSpeed(assignedBus.currentSpeed)} km/h
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-0.5">
                  <Users className="h-3.5 w-3.5 text-blue-600" /> Occupancy
                </div>
                <span className="font-extrabold text-slate-900 text-sm">
                  {safeOccupancy(assignedBus.currentOccupancy, assignedBus.capacity).current} / {safeOccupancy(assignedBus.currentOccupancy, assignedBus.capacity).total}
                  <span className="text-[11px] font-normal text-slate-500 ml-1">
                    ({safeOccupancy(assignedBus.currentOccupancy, assignedBus.capacity).percentage}%)
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Missed Bus Intelligence Engine Modal */}
      {isMissedBusModalOpen && (
        <div
          id="missed-bus-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseMissedBusModal();
            }
          }}
        >
          <div
            id="missed-bus-modal-card"
            className="relative w-full max-w-2xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 text-left max-h-[88vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900 font-extrabold text-xl shadow-xs">
                  ⚠️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      Missed Bus Intelligence Engine
                    </h3>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                      AI Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time alternate route dispatch & seat telemetry recommendations
                  </p>
                </div>
              </div>

              {/* Close Icon Button */}
              <button
                id="missed-bus-modal-close-icon"
                onClick={handleCloseMissedBusModal}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
              {/* Logged Missed Vehicle Details */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2 font-medium">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-slate-400">
                    Logged Missed Vehicle
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                    ● Missed Departure
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bus Number</span>
                    <span className="font-extrabold text-slate-900 text-sm">{assignedBus.busNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Your Stop</span>
                    <span className="font-bold text-slate-800 truncate block">{studentJourney.studentStopName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Assigned Route</span>
                    <span className="font-bold text-slate-800 truncate block">{assignedRoute.code}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Original ETA</span>
                    <span className="font-bold text-slate-800 font-mono">{studentJourney.scheduledBusArrivalTime}</span>
                  </div>
                </div>
              </div>

              {/* AI Recommendation State / Shimmer */}
              {isCalculatingAlternatives ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex items-center gap-3 animate-pulse">
                  <RefreshCw className="h-5 w-5 text-amber-600 animate-spin shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-amber-900">
                      AI Engine Evaluating Live Intersecting Buses...
                    </div>
                    <div className="text-[11px] text-amber-700 mt-0.5">
                      Analyzing real-time road conditions, passenger load, and college arrival times
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      <span>AI Smart Route Recommendation</span>
                    </div>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                      {aiEngineSource === 'gemini' ? 'Gemini 3.8 Flash' : aiEngineSource === 'cached' ? 'Cached Fast Result' : 'Rule Engine'}
                    </span>
                  </div>
                  <p className="text-emerald-950 font-medium leading-relaxed">
                    {aiRecommendationText || 'Board the recommended backup bus to ensure arrival before first period.'}
                  </p>
                </div>
              )}

              {/* Notice / Warning if any */}
              {aiServiceNotice && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{aiServiceNotice}</span>
                </div>
              )}

              {/* Alternative Buses Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Recommended Alternative Buses ({alternativesList.length})
                  </h4>
                  <button
                    onClick={() => handleTriggerMissedBus(true)}
                    disabled={isCalculatingAlternatives}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${isCalculatingAlternatives ? 'animate-spin' : ''}`} />
                    <span>Re-evaluate</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {alternativesList.map((alt) => {
                    const isSelected = selectedAltBusId === alt.busId || currentUser?.assignedBusId === alt.busId;
                    return (
                      <div
                        key={alt.busId}
                        className={`rounded-xl p-4 border transition-all ${
                          alt.isRecommended
                            ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-extrabold text-slate-900">{alt.busNumber}</span>
                            <span className="text-xs text-slate-500 font-medium">{alt.routeName}</span>
                            <span className="text-[11px] text-slate-400">· Driver: {alt.driverName}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {alt.isRecommended && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-0.5 text-[11px] font-extrabold text-slate-950 shadow-xs">
                                ⭐ AI RECOMMENDED
                              </span>
                            )}
                            <button
                              id={`select-bus-${alt.busId}`}
                              onClick={() => handleSelectAlternativeBus(alt.busId)}
                              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-900 text-white hover:bg-slate-800'
                              }`}
                            >
                              {isSelected ? '✓ Selected & Tracked' : 'Track This Bus'}
                            </button>
                          </div>
                        </div>

                        {alt.isRecommended && alt.recommendationReason && (
                          <p className="text-xs font-medium text-amber-900 mb-3 bg-amber-100/70 p-2.5 rounded-lg border border-amber-200/60">
                            💡 {alt.recommendationReason}
                          </p>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="bg-white/90 p-2 rounded-lg border border-slate-200/80">
                            <span className="text-slate-400 block text-[10px]">Arrives at Your Stop</span>
                            <span className="font-bold text-slate-900 font-mono">{alt.stopArrivalTime}</span>
                          </div>
                          <div className="bg-white/90 p-2 rounded-lg border border-slate-200/80">
                            <span className="text-slate-400 block text-[10px]">College Arrival</span>
                            <span className="font-bold text-blue-700 font-mono">{alt.collegeArrivalTime}</span>
                          </div>
                          <div className="bg-white/90 p-2 rounded-lg border border-slate-200/80">
                            <span className="text-slate-400 block text-[10px]">Available Seats</span>
                            <span className="font-bold text-emerald-700">{alt.availableSeats} seats open</span>
                          </div>
                          <div className="bg-white/90 p-2 rounded-lg border border-slate-200/80">
                            <span className="text-slate-400 block text-[10px]">Compatibility</span>
                            <span className="font-bold text-indigo-700">{alt.compatibilityScore}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-2 flex items-center justify-between pt-4 border-t border-slate-100 shrink-0">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">Esc</kbd> or click outside to dismiss
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  id="missed-bus-modal-cancel-btn"
                  onClick={handleCloseMissedBusModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
                <button
                  id="missed-bus-modal-done-btn"
                  onClick={handleCloseMissedBusModal}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
                >
                  Done & Return to Map
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
