import React, { useState, useEffect, useRef } from 'react';
import { useTransport } from '../../context/TransportContext';
import { InteractiveMap } from '../common/InteractiveMap';
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  Mic,
  AlertOctagon,
  ShieldAlert,
  Navigation2,
  MapPin,
  Clock,
  Compass,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  RefreshCw,
  Sliders,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { SupportedLanguage, Route, Bus } from '../../types';
import {
  speakText,
  MULTILINGUAL_PHRASES,
  LANGUAGE_METADATA,
  buildTrafficVoiceAlert,
  buildBypassRouteAlert,
  buildTimeVoiceAlert,
  TrafficAlertParams,
  subscribeTeluguCloudStatus,
  isAutoVoiceAlertsEnabled,
  setAutoVoiceAlertsEnabled,
  subscribeAutoVoiceAlerts,
} from '../../services/voiceAssistant';
import { getRouteRecommendations, calculateDistanceKm } from '../../services/predictionEngine';
import { safeEta } from '../../utils/safeDisplay';
import { INITIAL_BUSES, INITIAL_ROUTES } from '../../data/mockDatabase';

function getAffectedTrafficSegment(route: Route, bus: Bus): {
  roadName: string;
  junctionName: string;
  description: string;
} {
  const nextStop = bus.nextStopName || '';
  if (route.code === 'ROUTE-A' || route.id === 'route-a') {
    if (nextStop.includes('Kukatpally') || nextStop.includes('KPHB')) {
      return {
        roadName: 'KPHB Colony Arterial Road',
        junctionName: 'KPHB Main Junction',
        description: 'Heavy corridor bottleneck before KPHB Main Junction',
      };
    }
    if (nextStop.includes('Main Road')) {
      return {
        roadName: 'North Corridor Arterial Road',
        junctionName: 'KPHB Main Junction',
        description: 'Construction and traffic congestion near KPHB Main Junction',
      };
    }
    if (nextStop.includes('Metro')) {
      return {
        roadName: 'Hitech City Corridor',
        junctionName: 'Hitech Metro Junction',
        description: 'Signal queue before Hitech Metro Junction',
      };
    }
    if (nextStop.includes('Cyber')) {
      return {
        roadName: 'Madhapur Express Arterial',
        junctionName: 'Cyber Gateway Junction',
        description: 'Peak congestion approaching Cyber Gateway',
      };
    }
    return {
      roadName: 'North Corridor Arterial Road',
      junctionName: 'KPHB Main Junction',
      description: 'Corridor congestion along active route',
    };
  } else if (route.code === 'ROUTE-B' || route.id === 'route-b') {
    if (nextStop.includes('Miyapur') || nextStop.includes('Hafeezpet')) {
      return {
        roadName: 'Hafeezpet Corridor',
        junctionName: 'Hafeezpet Flyover Junction',
        description: 'Flyover approach bottleneck',
      };
    }
    return {
      roadName: 'Kondapur Main Road',
      junctionName: 'Kondapur Signal Junction',
      description: 'Slow moving traffic near Kondapur Signal',
    };
  } else {
    return {
      roadName: 'Gachibowli Ring Road',
      junctionName: 'Financial District Circle',
      description: 'Heavy junction congestion near Financial District Circle',
    };
  }
}

export const DriverDashboard: React.FC = () => {
  const {
    currentUser,
    buses,
    routes,
    traffic,
    driverTripActive,
    driverTripStartTime,
    driverLanguage,
    lastDriverSpokenText,
    setLastDriverSpokenText,
    advanceDriverNextStop,
    setDriverLanguage,
    startDriverTrip,
    endDriverTrip,
    reportEmergency,
    reportRoadIssue,
    selectedBypassRouteId,
    selectBypassRoute,
    logout,
    setSelectedRole,
  } = useTransport();

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [roadIssueModalOpen, setRoadIssueModalOpen] = useState(false);
  const [selectedSosType, setSelectedSosType] = useState<
    'breakdown' | 'medical' | 'accident' | 'security'
  >('breakdown');
  const [sosNotes, setSosNotes] = useState('');
  const [lastSpokenText, setLastSpokenText] = useState<string>(
    driverLanguage === 'te'
      ? 'ప్రయాణానికి సిద్ధంగా ఉంది. ఆటో-జీపీఎస్ తర్వాతి స్టాప్ గుర్తింపు సక్రియంగా ఉంది.'
      : 'Ready for dispatch. Auto-GPS next-stop detection active.'
  );
  const [activeRouteTab, setActiveRouteTab] = useState<'stops' | 'ai-routes'>('stops');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(selectedBypassRouteId || null);
  const [routeConfirmationMsg, setRouteConfirmationMsg] = useState<string | null>(null);

  const assignedBus =
    buses.find((b) => b.id === (currentUser?.assignedBusId || 'bus-07')) ||
    buses[6] ||
    buses[0] ||
    INITIAL_BUSES[0];
  const assignedRoute =
    (assignedBus && routes.find((r) => r.id === assignedBus.routeId)) ||
    routes[0] ||
    INITIAL_ROUTES[0];

  const [selectedStopId, setSelectedStopId] = useState<string | null>(assignedBus.nextStopId || null);
  const [focusedStopId, setFocusedStopId] = useState<string | null>(assignedBus.nextStopId || null);

  // Synchronize bypass route selection from global context
  useEffect(() => {
    if (selectedBypassRouteId) {
      setSelectedRouteId(selectedBypassRouteId);
    }
  }, [selectedBypassRouteId]);

  // When assigned route changes (e.g. switching between Route A and Route B bypass),
  // synchronize the active stop to the corresponding stop in the new route
  useEffect(() => {
    if (assignedRoute && !assignedRoute.stops.some((s) => s.id === selectedStopId)) {
      const nextTargetStop =
        assignedRoute.stops.find((s) => s.id === assignedBus.nextStopId) ||
        assignedRoute.stops.find((s) => !s.isCompleted) ||
        assignedRoute.stops[0];
      if (nextTargetStop) {
        setSelectedStopId(nextTargetStop.id);
        setFocusedStopId(nextTargetStop.id);
      }
    }
  }, [assignedRoute, assignedBus.nextStopId, selectedStopId]);

  // Automatically update selected & focused stop whenever assignedBus.nextStopId advances via GPS geofence
  useEffect(() => {
    if (assignedBus.nextStopId) {
      setSelectedStopId(assignedBus.nextStopId);
      setFocusedStopId(assignedBus.nextStopId);
    }
  }, [assignedBus.nextStopId]);

  // Synchronize spoken transmission text from live GPS simulation voice engine
  useEffect(() => {
    if (lastDriverSpokenText) {
      setLastSpokenText(lastDriverSpokenText);
    }
  }, [lastDriverSpokenText]);

  // Track Cloud Text-to-Speech status for Telugu
  const [teluguCloudError, setTeluguCloudError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeTeluguCloudStatus((err) => {
      setTeluguCloudError(err);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Track Auto-Announced Hands-Free Voice Alerts state (Default: ON)
  const [autoVoiceAlerts, setAutoVoiceAlertsState] = useState<boolean>(() => isAutoVoiceAlertsEnabled());

  useEffect(() => {
    const unsubscribe = subscribeAutoVoiceAlerts((enabled) => {
      setAutoVoiceAlertsState(enabled);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleAutoVoiceAlerts = () => {
    const nextVal = !autoVoiceAlerts;
    setAutoVoiceAlertsEnabled(nextVal);
  };

  const selectedStop =
    assignedRoute.stops.find((s) => s.id === (selectedStopId || assignedBus.nextStopId)) ||
    assignedRoute.stops[0];
  const selectedStopDistKm = selectedStop
    ? calculateDistanceKm(
        assignedBus.currentLocation.lat,
        assignedBus.currentLocation.lng,
        selectedStop.lat,
        selectedStop.lng
      )
    : null;

  const currentPhrases = MULTILINGUAL_PHRASES[driverLanguage] || MULTILINGUAL_PHRASES['en'];
  const recommendations = getRouteRecommendations(assignedRoute, 42);

  const isTrafficCritical = traffic === 'heavy' || traffic === 'severe';
  const affectedSegment = getAffectedTrafficSegment(assignedRoute, assignedBus);
  const expectedDelayMins = traffic === 'severe' ? 11 : 8;
  const recommendedAlt = recommendations.find((r) => r.isAiRecommended) || recommendations[0];

  const trafficAlertParams: TrafficAlertParams = {
    severity: traffic,
    affectedRoad: affectedSegment.junctionName,
    expectedDelayMins,
    alternativeRouteName: recommendedAlt?.alternativeRouteName,
    timeSavedMins: recommendedAlt?.timeSavedMins,
  };

  const lastAnnouncedTrafficRef = useRef<{
    severity: string;
    junction: string;
  } | null>(null);

  // Hands-Free Driver Traffic Alert:
  // Automatically detects when traffic becomes Heavy or Severe on the driver's active route,
  // gives a spoken voice warning before reaching the affected junction/segment,
  // and avoids continuous repetition by announcing each traffic event once unless severity meaningfully changes.
  useEffect(() => {
    if (!isTrafficCritical) {
      lastAnnouncedTrafficRef.current = null;
      return;
    }

    const currentJunction = affectedSegment.junctionName;
    const lastAlert = lastAnnouncedTrafficRef.current;

    const severityChanged = !lastAlert || lastAlert.severity !== traffic;
    const junctionChanged = !lastAlert || lastAlert.junction !== currentJunction;
    const languageChanged = !lastAlert || (lastAlert as any).language !== driverLanguage;

    if (severityChanged || junctionChanged || languageChanged) {
      const alertSpeech = buildTrafficVoiceAlert(trafficAlertParams, driverLanguage);

      if (lastDriverSpokenText !== alertSpeech) {
        const timer = setTimeout(() => {
          speakText(alertSpeech, driverLanguage);
          setLastSpokenText(alertSpeech);
          setLastDriverSpokenText(alertSpeech);
          lastAnnouncedTrafficRef.current = {
            severity: traffic,
            junction: currentJunction,
            language: driverLanguage,
          } as any;
        }, 600);

        return () => clearTimeout(timer);
      } else {
        lastAnnouncedTrafficRef.current = {
          severity: traffic,
          junction: currentJunction,
          language: driverLanguage,
        } as any;
      }
    }
  }, [
    traffic,
    affectedSegment.junctionName,
    expectedDelayMins,
    recommendedAlt?.alternativeRouteName,
    recommendedAlt?.timeSavedMins,
    driverLanguage,
    isTrafficCritical,
    lastDriverSpokenText,
    setLastDriverSpokenText,
  ]);

  const handleSelectStop = (stop: (typeof assignedRoute.stops)[0]) => {
    setSelectedStopId(stop.id);
    setFocusedStopId(stop.id);

    const isNext = stop.id === assignedBus.nextStopId;
    const distKm = calculateDistanceKm(
      assignedBus.currentLocation.lat,
      assignedBus.currentLocation.lng,
      stop.lat,
      stop.lng
    );
    const distMeters = Math.round(distKm * 1000);
    const speech = isNext
      ? currentPhrases.nextStop(stop.name, distMeters)
      : currentPhrases.stopApproaching(stop.name);
    setLastSpokenText(speech);
    setLastDriverSpokenText(speech);
    speakText(speech, driverLanguage);
  };

  const handleSelectBypassRoute = (rec: { id: string; title: string; timeSavedMins: number }) => {
    setSelectedRouteId(rec.id);
    selectBypassRoute(rec.id, assignedBus.id);
    const confirmation = buildBypassRouteAlert(rec.title, rec.timeSavedMins, driverLanguage);
    setRouteConfirmationMsg(confirmation);
    setLastSpokenText(confirmation);
  };

  // Trigger manual speech announcement (for manual/demo use)
  const handleVoiceCommand = (intent: string) => {
    let speech = '';
    if (intent === 'NEXT_STOP') {
      const nextName = assignedBus.nextStopName || 'Apex College Campus';
      speech = currentPhrases.nextStop(nextName, 200);
    } else if (intent === 'TIME_TO_COLLEGE') {
      const stopIdx = assignedRoute.stops.findIndex((s) => s.id === assignedBus.nextStopId);
      const stopsRemaining = Math.max(1, assignedRoute.stops.length - 1 - (stopIdx >= 0 ? stopIdx : 0));
      const estMins = Math.max(5, stopsRemaining * 5 + (traffic === 'severe' ? 11 : traffic === 'heavy' ? 7 : 0));
      speech = buildTimeVoiceAlert(estMins, driverLanguage);
    } else if (intent === 'TRAFFIC') {
      speech = buildTrafficVoiceAlert(trafficAlertParams, driverLanguage);
    } else if (intent === 'REPEAT') {
      const nextName = assignedBus.nextStopName || 'Apex College Campus';
      speech = currentPhrases.stopApproaching(nextName);
    }
    setLastSpokenText(speech);
    setLastDriverSpokenText(speech);
    // Explicit driver trigger: pass isManual=true so voice command functions regardless of auto-announcements toggle
    speakText(speech, driverLanguage, true);
  };

  const handleReplayVoiceAlert = (forceTraffic = false) => {
    let speechToReplay = lastSpokenText;
    if (forceTraffic || (isTrafficCritical && (!speechToReplay || !speechToReplay.trim()))) {
      speechToReplay = buildTrafficVoiceAlert(trafficAlertParams, driverLanguage);
    } else if (!speechToReplay || !speechToReplay.trim()) {
      speechToReplay =
        driverLanguage === 'te'
          ? 'ప్రయాణానికి సిద్ధంగా ఉంది. ఆటో-జీపీఎస్ తర్వాతి స్టాప్ గుర్తింపు సక్రియంగా ఉంది.'
          : driverLanguage === 'hi'
          ? 'यात्रा के लिए तैयार। ऑटो-जीपीएस अगला स्टॉप ट्रैकिंग सक्रिय है।'
          : 'Ready for dispatch. Auto-GPS next-stop detection active.';
    }

    setLastSpokenText(speechToReplay);
    setLastDriverSpokenText(speechToReplay);
    // Explicit driver trigger: manual replay must always play when driver taps it
    speakText(speechToReplay, driverLanguage, true);
  };

  const handleSosSubmit = () => {
    reportEmergency(selectedSosType, sosNotes);
    setSosModalOpen(false);
    setSosNotes('');
  };

  const handleRoadIssueSubmit = (issue: any) => {
    reportRoadIssue(issue);
    setRoadIssueModalOpen(false);
  };

  // Guard: New driver accounts must require Admin approval before accessing the Driver Dashboard
  if (currentUser?.role === 'driver' && currentUser.approvalStatus === 'pending') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-3xl border-2 border-amber-300 bg-amber-50/80 p-8 sm:p-10 shadow-xl text-slate-800 space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 ring-8 ring-amber-200/50">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>
          <div>
            <span className="inline-block rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-900 mb-2">
              Verification Required
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Driver Cockpit Access Locked
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
              Welcome, <strong className="text-slate-900">{currentUser.name}</strong>. Your driver account (<span className="font-mono font-bold text-amber-800">{currentUser.identifier}</span>) was registered successfully but requires Administrative Approval before you can operate the Driver Cockpit and GPS dispatch system.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-amber-200 text-left text-xs space-y-3 text-slate-600">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Campus Fleet Safety Verification Protocol:
            </div>
            <div className="flex items-center gap-2.5 text-emerald-700 font-medium">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>1. Driver Registration Profile Submitted</span>
            </div>
            <div className="flex items-center gap-2.5 text-amber-700 font-semibold bg-amber-50/70 p-2 rounded-lg border border-amber-200">
              <Clock className="h-4 w-4 shrink-0 animate-spin" />
              <span>2. Administrator Authorization & Background Check (Pending Review)</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400">
              <span className="h-4 w-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
              <span>3. Vehicle Route Assignment & GPS Cockpit Clearance (Awaiting Step 2)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => logout()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
            >
              Sign Out / Switch Account
            </button>
            <button
              onClick={() => setSelectedRole('admin')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Demo Reviewer: Approve in Admin Console</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Driver Cockpit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              👨‍✈️ Driver Cockpit
            </span>
            <span className="text-xs text-slate-400">ID: {currentUser?.identifier || 'DRV-07'}</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1 text-white">
            Captain {assignedBus.driverName} — {assignedBus.busNumber}
          </h2>
          <p className="text-xs text-slate-400">
            {assignedRoute.name} • Registered: {assignedBus.registrationNumber}
          </p>
        </div>

        {/* Primary Large Trip Control Buttons */}
        <div className="flex items-center gap-3">
          {!driverTripActive ? (
            <button
              onClick={startDriverTrip}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>START TRIP</span>
            </button>
          ) : (
            <button
              onClick={endDriverTrip}
              className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
            >
              <Square className="h-5 w-5 fill-current" />
              <span>END TRIP (AT CAMPUS)</span>
            </button>
          )}

          {/* SOS Big Button */}
          <button
            onClick={() => setSosModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-red-700 hover:bg-red-800 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-700/30 active:scale-95 transition-all"
            title="Emergency SOS Dispatch"
          >
            <AlertOctagon className="h-5 w-5" />
            <span className="hidden sm:inline">SOS</span>
          </button>
        </div>
      </div>

      {/* Multilingual Voice Guidance Console */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-900 to-indigo-950 p-5 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-800/60 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide flex items-center gap-2">
                Multilingual AI Voice Assistant
                <span className="text-[10px] bg-blue-400/20 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
                  {LANGUAGE_METADATA[driverLanguage].label} ({LANGUAGE_METADATA[driverLanguage].nativeName})
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                Spoken navigation updates and instant voice command triggers for driver safety
              </p>
            </div>
          </div>

          {/* Language selector buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {Object.entries(LANGUAGE_METADATA).map(([code, meta]) => (
              <button
                key={code}
                id={`driver-lang-btn-${code}`}
                onClick={() => {
                  const lang = code as SupportedLanguage;
                  setDriverLanguage(lang);

                  // Determine complete message in the selected language
                  const message = isTrafficCritical
                    ? buildTrafficVoiceAlert(trafficAlertParams, lang)
                    : lang === 'te'
                    ? 'ప్రయాణానికి సిద్ధంగా ఉంది. ఆటో-జీపీఎస్ తర్వాతి స్టాప్ గుర్తింపు సక్రియంగా ఉంది.'
                    : lang === 'hi'
                    ? 'यात्रा के लिए तैयार। ऑटो-जीपीएस अगला स्टॉप ट्रैकिंग सक्रिय है।'
                    : 'Ready for dispatch. Auto-GPS next-stop detection active.';

                  setLastSpokenText(message);
                  setLastDriverSpokenText(message);
                  // Speak the entire message from beginning to end in the selected language
                  speakText(message, lang);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  driverLanguage === code
                    ? 'bg-blue-500 text-white font-bold shadow-xs'
                    : 'bg-blue-950/60 text-blue-300 hover:bg-blue-800/60'
                }`}
              >
                {meta.flag} {meta.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spoken Speech Display Card */}
        <div className="p-3.5 rounded-xl bg-black/30 border border-blue-500/30 backdrop-blur-sm mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2">
            <div className="flex items-center gap-2 text-xs text-blue-300">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  autoVoiceAlerts ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                }`}
              />
              <span className="font-bold">Last Spoken Voice Transmission:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Clear ON/OFF Toggle for Auto-Announced Hands-Free */}
              <button
                type="button"
                id="auto-announced-hands-free-toggle"
                onClick={handleToggleAutoVoiceAlerts}
                aria-pressed={autoVoiceAlerts}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm ${
                  autoVoiceAlerts
                    ? 'bg-emerald-600/30 border-emerald-400/60 text-emerald-100 hover:bg-emerald-600/50'
                    : 'bg-slate-800/90 border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
                title={`Click to turn Auto-Announced Hands-Free ${autoVoiceAlerts ? 'OFF' : 'ON'}`}
              >
                <div className="flex items-center gap-1.5">
                  {autoVoiceAlerts ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Auto-Announced Hands-Free:</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    autoVoiceAlerts
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
                  }`}
                >
                  {autoVoiceAlerts ? 'Voice Alerts: ON' : 'Voice Alerts: OFF'}
                </span>
              </button>

              {/* Manual Replay Voice Alert button */}
              <button
                type="button"
                id="replay-last-transmission-btn"
                onClick={() => handleReplayVoiceAlert(false)}
                title="Replay Voice Alert in active driver language"
                className="text-xs font-bold text-white bg-blue-600/50 hover:bg-blue-600 border border-blue-400/40 px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Replay Voice Alert</span>
              </button>
            </div>
          </div>
          <p className="text-base sm:text-lg font-bold text-white font-sans tracking-wide">
            “{lastSpokenText}”
          </p>
          {driverLanguage === 'te' && teluguCloudError && (
            <div
              id="telugu-cloud-tts-error-alert"
              className="mt-2.5 px-3 py-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 font-medium"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{teluguCloudError}</span>
            </div>
          )}
        </div>

        {/* Hands-Free Traffic Advisory Card (Auto-detected when traffic is Heavy or Severe) */}
        {isTrafficCritical && (
          <div
            id="hands-free-traffic-alert-card"
            className={`p-4 rounded-xl border backdrop-blur-sm mb-4 transition-all animate-in fade-in duration-300 ${
              traffic === 'severe'
                ? 'bg-rose-950/50 border-rose-500/50 text-rose-100 shadow-lg'
                : 'bg-amber-950/50 border-amber-500/50 text-amber-100 shadow-lg'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      traffic === 'severe' ? 'bg-rose-400' : 'bg-amber-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      traffic === 'severe' ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                  />
                </span>
                <span
                  className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                    traffic === 'severe'
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {traffic === 'severe' ? '🚨 Severe Traffic Congestion' : '🚗 Heavy Traffic Alert'}
                </span>
                <button
                  type="button"
                  id="traffic-auto-announced-toggle-btn"
                  onClick={handleToggleAutoVoiceAlerts}
                  aria-pressed={autoVoiceAlerts}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    autoVoiceAlerts
                      ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/40 hover:bg-emerald-900/60'
                      : 'text-slate-300 bg-slate-900/80 border-slate-600 hover:bg-slate-800'
                  }`}
                  title={`Click to turn Auto-Announced Hands-Free ${autoVoiceAlerts ? 'OFF' : 'ON'}`}
                >
                  {autoVoiceAlerts ? (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Auto-Announced Hands-Free:</span>
                  <span className="font-bold tracking-wide">
                    {autoVoiceAlerts ? 'Voice Alerts: ON' : 'Voice Alerts: OFF'}
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                  Delay: +{expectedDelayMins} mins
                </span>
                <button
                  type="button"
                  id="replay-traffic-advisory-btn"
                  onClick={() => handleReplayVoiceAlert(true)}
                  title="Manual replay of traffic advisory"
                  className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Replay Voice Alert</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-white/10">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">
                  AFFECTED JUNCTION / CORRIDOR:
                </span>
                <span className="font-bold text-white text-sm">
                  {affectedSegment.junctionName}
                </span>
                <span className="text-slate-300 block text-[11px] mt-0.5">
                  {affectedSegment.description} ({affectedSegment.roadName})
                </span>
              </div>

              {recommendedAlt && (
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-emerald-400 font-bold block text-[10px] uppercase tracking-wider">
                      ⭐ Recommended Alternative Route
                    </span>
                    <span className="font-bold text-white text-xs block">
                      {recommendedAlt.alternativeRouteName}
                    </span>
                    <span className="text-emerald-300 text-[11px]">
                      Saves ~{recommendedAlt.timeSavedMins} mins vs corridor gridlock
                    </span>
                  </div>
                  <button
                    type="button"
                    id="hands-free-apply-detour-btn"
                    onClick={() => {
                      setActiveRouteTab('ai-routes');
                      handleSelectBypassRoute(recommendedAlt);
                    }}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    Apply Bypass
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Driver Voice Triggers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <button
            onClick={() => handleVoiceCommand('NEXT_STOP')}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 p-3 font-bold text-white border border-white/10 active:scale-95 transition-all"
          >
            <Mic className="h-4 w-4 text-blue-400" />
            <span>Next Stop?</span>
          </button>
          <button
            onClick={() => handleVoiceCommand('TIME_TO_COLLEGE')}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 p-3 font-bold text-white border border-white/10 active:scale-95 transition-all"
          >
            <Clock className="h-4 w-4 text-amber-400" />
            <span>Time to Campus?</span>
          </button>
          <button
            id="driver-traffic-advisory-btn"
            onClick={() => handleVoiceCommand('TRAFFIC')}
            title="Manual / demo replay of traffic advisory"
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 p-3 font-bold text-white border border-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <div className="flex flex-col items-start leading-tight">
              <span>Traffic Advisory</span>
              <span className="text-[10px] text-orange-300/80 font-normal">Manual / Demo</span>
            </div>
          </button>
          <button
            onClick={() => setRoadIssueModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 p-3 font-bold text-white border border-white/10 active:scale-95 transition-all"
          >
            <MapPin className="h-4 w-4 text-rose-400" />
            <span>Report Road Hazard</span>
          </button>
        </div>
      </div>

      {/* Main Driver Layout: Map & Turn-by-Turn Route Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Navigation Map (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Navigation2 className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Driver Route Navigation</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-Geofence Active (Hands-Free)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Speed: {Math.round(assignedBus.currentSpeed)} km/h
                </span>
                <button
                  id="driver-manual-next-fallback-btn"
                  onClick={() => advanceDriverNextStop(assignedBus.id)}
                  title="Optional demo/testing fallback to advance to next stop manually"
                  className="flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:border-amber-400 border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-amber-900 active:scale-95 transition-all shadow-2xs cursor-pointer"
                >
                  <span>NEXT</span>
                  <span className="text-[10px] text-slate-500 font-normal hidden sm:inline">(Demo Fallback)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>

            <InteractiveMap
              buses={buses}
              routes={routes}
              selectedBusId={assignedBus.id}
              selectedRouteId={assignedRoute.id}
              highlightedStopId={selectedStopId || assignedBus.nextStopId}
              focusedStopId={focusedStopId || undefined}
              height="380px"
              showTrafficOverlay={true}
            />
          </div>
        </div>

        {/* Right Column: Turn-by-Turn Stop Sequence & Smart Route Recommendations (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveRouteTab('stops')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeRouteTab === 'stops'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Stops & Geofences
                </button>
                <button
                  onClick={() => setActiveRouteTab('ai-routes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeRouteTab === 'ai-routes'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  AI Bypass Routes
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-medium">
                {assignedRoute.stops.length} checkpoints
              </span>
            </div>

            {/* Tab 1: Stops Sequence */}
            {activeRouteTab === 'stops' && (
              <div className="space-y-3">
                {/* Auto-advance notification banner with fallback */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <div>
                      <span className="font-bold">Hands-Free GPS Mode:</span>{' '}
                      <span className="text-emerald-800 text-[11px] hidden sm:inline">
                        Stops advance automatically upon GPS geofence arrival with voice alerts.
                      </span>
                    </div>
                  </div>
                  <button
                    id="stops-list-manual-next-fallback-btn"
                    onClick={() => advanceDriverNextStop(assignedBus.id)}
                    title="Optional demo/testing fallback - GPS advances automatically"
                    className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs shrink-0 cursor-pointer"
                  >
                    <span>NEXT</span>
                    <span className="text-[9px] text-slate-500 font-normal">(Demo Fallback)</span>
                  </button>
                </div>

                {/* Active Selected Stop Detail Banner */}
                {selectedStop && (
                  <div
                    id="selected-stop-info-panel"
                    className="p-3.5 rounded-xl bg-blue-50/90 border-2 border-blue-400 text-slate-900 shadow-xs mb-3 space-y-2.5 animate-in fade-in duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-xs shadow-xs mt-0.5">
                          {assignedRoute.stops.findIndex((s) => s.id === selectedStop.id) + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-sm text-slate-900">{selectedStop.name}</h4>
                            <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Focused Checkpoint
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Scheduled Arrival: <span className="font-semibold text-slate-800">{safeEta(selectedStop.scheduledTime, '08:18 AM')}</span>
                          </p>
                        </div>
                      </div>

                      {selectedStop.id === assignedBus.nextStopId ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="rounded-full bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-1 flex items-center gap-1 shadow-xs animate-pulse">
                            🎯 Next Stop
                          </span>
                          <button
                            id="selected-stop-manual-next-fallback-btn"
                            onClick={() => advanceDriverNextStop(assignedBus.id)}
                            title="Optional demo/testing fallback to advance immediately"
                            className="rounded-lg bg-white hover:bg-amber-100 border border-slate-300 text-slate-700 hover:text-amber-900 text-[11px] font-bold px-2 py-1 flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                          >
                            <span>NEXT</span>
                            <span className="text-[9px] text-slate-500 font-normal hidden sm:inline">(Demo)</span>
                          </button>
                        </div>
                      ) : selectedStop.isCompleted ? (
                        <span className="rounded-full bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 flex items-center gap-1 shrink-0">
                          ✓ Completed
                        </span>
                      ) : selectedStop.isTemporarilyUnavailable ? (
                        <span className="rounded-full bg-rose-600 text-white text-[11px] font-bold px-2.5 py-0.5 flex items-center gap-1 shrink-0">
                          ⛔ Detour
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-0.5 shrink-0">
                          Upcoming
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/80 text-xs">
                      <div className="bg-white/95 p-2 rounded-lg border border-blue-200 shadow-2xs">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                          Geofence Distance
                        </span>
                        <span className="font-extrabold text-blue-950 text-xs block">
                          {selectedStopDistKm !== null
                            ? selectedStopDistKm < 1
                              ? `${Math.round(selectedStopDistKm * 1000)}m away`
                              : `${selectedStopDistKm.toFixed(2)} km away`
                            : 'Calculating...'}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Radius: {selectedStop.geofenceRadiusMeters}m
                        </span>
                      </div>

                      <div className="bg-white/95 p-2 rounded-lg border border-blue-200 shadow-2xs">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                          Current Status
                        </span>
                        <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                          {selectedStop.id === assignedBus.nextStopId ? (
                            <span className="text-amber-700 font-black flex items-center gap-1">
                              <span>🎯</span> Next Stop (Approaching)
                            </span>
                          ) : selectedStop.isCompleted ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <span>✓</span> Departed & Logged
                            </span>
                          ) : selectedStop.isTemporarilyUnavailable ? (
                            <span className="text-rose-700 font-bold flex items-center gap-1">
                              <span>⛔</span> Detour Active
                            </span>
                          ) : (
                            <span className="text-blue-700 font-bold flex items-center gap-1">
                              <span>⏳</span> Upcoming Checkpoint
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {selectedStopDistKm !== null && selectedStopDistKm * 1000 <= selectedStop.geofenceRadiusMeters
                            ? '✓ Inside Geofence Trigger'
                            : 'Approaching Route Path'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {assignedRoute.stops.map((stop, idx) => {
                  const isCurrentTarget = stop.id === assignedBus.nextStopId;
                  const isCompleted = stop.isCompleted;
                  const isSelected = stop.id === selectedStopId;
                  const stopDistKm = calculateDistanceKm(
                    assignedBus.currentLocation.lat,
                    assignedBus.currentLocation.lng,
                    stop.lat,
                    stop.lng
                  );
                  const stopDistMeters = Math.round(stopDistKm * 1000);

                  return (
                    <div
                      key={stop.id}
                      id={`stop-item-${stop.id}`}
                      onClick={() => handleSelectStop(stop)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/50 shadow-sm'
                          : isCurrentTarget
                          ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30 hover:bg-amber-100/50'
                          : isCompleted
                          ? 'bg-slate-50/80 border-slate-200 opacity-80 hover:opacity-100 hover:bg-slate-100/60'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold text-[11px] ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrentTarget
                            ? 'bg-amber-500 text-slate-950 font-extrabold animate-pulse'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className={`font-bold ${isSelected ? 'text-blue-950 font-extrabold' : 'text-slate-900'}`}>
                              {stop.name}
                            </h5>
                            {isSelected && (
                              <span className="rounded-full bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2">
                                FOCUSED
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-500 font-medium">
                            {safeEta(stop.scheduledTime, '08:18 AM')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-600 flex-wrap gap-1">
                          <span className="flex items-center gap-1">
                            <span className="font-semibold text-slate-700">Geofence:</span> {stop.geofenceRadiusMeters}m
                            <span className="text-slate-400">
                              ({stopDistKm < 1 ? `${stopDistMeters}m` : `${stopDistKm.toFixed(1)}km`} away)
                            </span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isCurrentTarget ? (
                              <span className="font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1 shadow-xs">
                                🎯 Next Stop
                              </span>
                            ) : isCompleted ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                Completed
                              </span>
                            ) : (
                              <span className="font-medium text-slate-500 text-[10px]">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: AI Route Recommendations */}
            {activeRouteTab === 'ai-routes' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    AI analyzes real-time corridor congestion to suggest fastest alternative paths to College Campus.
                  </div>
                </div>

                {/* Confirmation Message when an Alternative Route is selected/saved */}
                {routeConfirmationMsg && (
                  <div
                    id="bypass-route-confirmation-banner"
                    className="p-3 rounded-xl bg-emerald-100 border-2 border-emerald-400 text-emerald-950 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-700 shrink-0" />
                      <span>{routeConfirmationMsg}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Saved
                    </span>
                  </div>
                )}

                {recommendations.map((rec) => {
                  const isSelected =
                    selectedRouteId === rec.id ||
                    selectedBypassRouteId === rec.id ||
                    (assignedRoute.id === 'route-b' && (rec.id === 'rec-2' || rec.title.includes('Route B')));
                  return (
                    <div
                      key={rec.id}
                      onClick={() => handleSelectBypassRoute(rec)}
                      className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500 shadow-sm'
                          : rec.isAiRecommended
                          ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/30 hover:border-emerald-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{rec.title}</span>
                        {isSelected ? (
                          <span className="rounded-full bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 shadow-xs">
                            <CheckCircle className="w-3 h-3" /> SELECTED & SAVED
                          </span>
                        ) : rec.isAiRecommended ? (
                          <span className="rounded-full bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5">
                            ⭐ AI RECOMMENDED
                          </span>
                        ) : null}
                      </div>
                      <p className="text-slate-600 text-[11px] mb-2">{rec.reason}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-700">
                        <span>Est. Travel Time: {rec.alternativeDurationMins} mins</span>
                        <button
                          type="button"
                          id={`save-bypass-action-${rec.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectBypassRoute(rec);
                          }}
                          className={`font-bold transition-all px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 active:scale-95'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-white" />
                              <span>Saved {rec.timeSavedMins} mins</span>
                            </>
                          ) : (
                            <span>Save {rec.timeSavedMins} mins</span>
                          )}
                        </button>
                      </div>

                      {isSelected && (
                        <div className="mt-2.5 p-2 rounded-lg bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          <span>{rec.title} is marked as selected & saved. Bypassing flyover to save {rec.timeSavedMins} mins.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Emergency SOS Modal */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-2 border-rose-500 animate-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-white font-bold">
                <AlertOctagon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  TRIGGER EMERGENCY SOS DISPATCH
                </h3>
                <p className="text-xs text-slate-500">
                  Transmits high-priority coordinates to College Police, Dispatch & Admin
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-2">Select Emergency Type:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'breakdown', label: 'Mechanical Breakdown', icon: '🔧' },
                    { id: 'medical', label: 'Medical Emergency', icon: '🚑' },
                    { id: 'accident', label: 'Vehicle Collision', icon: '💥' },
                    { id: 'security', label: 'Security Concern', icon: '🛡️' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedSosType(item.id as any)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left font-bold transition-all ${
                        selectedSosType === item.id
                          ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/30'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Additional Notes (Optional):</label>
                <textarea
                  value={sosNotes}
                  onChange={(e) => setSosNotes(e.target.value)}
                  placeholder="e.g. Engine smoking near KPHB arterial junction. All passengers safe inside vehicle."
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-[11px] font-medium border border-rose-200">
                ⚠️ Coordinates (lat: {assignedBus.currentLocation.lat}, lng: {assignedBus.currentLocation.lng}) will be dispatched immediately.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSosModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSosSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md shadow-rose-600/30"
                >
                  BROADCAST SOS NOW
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Road Issue Reporter Modal */}
      {roadIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 text-left">
            <h4 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" /> Report Road Hazard
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Alerts fellow drivers and feeds AI detour routing models.
            </p>

            <div className="space-y-2 text-xs">
              {[
                { id: 'waterlogging', label: 'Severe Waterlogging', icon: '🌊' },
                { id: 'construction', label: 'Road Construction Block', icon: '🚧' },
                { id: 'accident-jam', label: 'Accident Jam / Deadlock', icon: '🚗' },
                { id: 'police-diversion', label: 'Police Diversion', icon: '👮' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleRoadIssueSubmit(item.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setRoadIssueModalOpen(false)}
              className="mt-4 w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
