import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  User,
  UserRole,
  Bus,
  Route,
  Stop,
  WeatherCondition,
  TrafficLevel,
  JourneyPrediction,
  BusArrivalRecord,
  NotificationItem,
  AnomalyAlert,
  EmergencyReport,
  RoadIssue,
  SupportedLanguage,
  MissedBusAlternative,
  DetourInfo,
  StudentRegistrationData,
  DriverRegistrationData,
  LoginResult,
} from '../types';
import {
  INITIAL_BUSES,
  INITIAL_ROUTES,
  INITIAL_USERS,
  INITIAL_WEATHER,
  INITIAL_ARRIVAL_RECORDS,
  COLLEGE_CAMPUS,
} from '../data/mockDatabase';
import {
  calculateJourneyPrediction,
  findMissedBusAlternatives,
  detectBusAnomalies,
} from '../services/predictionEngine';
import {
  speakText,
  MULTILINGUAL_PHRASES,
  buildTrafficVoiceAlert,
  buildBypassRouteAlert,
  buildDetourVoiceAlert,
  buildRoadHazardVoiceAlert,
  buildWeatherHazardVoiceAlert,
  buildEmergencyVoiceAlert,
  buildTimeVoiceAlert,
  localizeStopName,
} from '../services/voiceAssistant';

interface TransportContextType {
  users: User[];
  currentUser: User | null;
  selectedRole: UserRole | null;
  buses: Bus[];
  routes: Route[];
  weather: WeatherCondition;
  traffic: TrafficLevel;
  arrivalRecords: BusArrivalRecord[];
  notifications: NotificationItem[];
  anomalyAlerts: AnomalyAlert[];
  emergencyReports: EmergencyReport[];
  roadIssues: RoadIssue[];
  studentJourney: JourneyPrediction;
  missedBusAlternatives: MissedBusAlternative[];
  isStudentMissedBus: boolean;
  isMissedBusModalOpen: boolean;
  setIsMissedBusModalOpen: (open: boolean) => void;
  isStudentBoarded: boolean;
  setIsStudentBoarded: (boarded: boolean) => void;
  activeStudentBusId: string;
  missedBusTriggerCount: number;
  driverTripActive: boolean;
  driverTripStartTime: string | null;
  driverLanguage: SupportedLanguage;
  lastDriverSpokenText: string;
  simulationRunning: boolean;

  // Actions
  login: (identifier: string, passwordHash: string, role: UserRole) => LoginResult;
  logout: () => void;
  registerStudent: (data: StudentRegistrationData) => { success: boolean; message: string; user?: User };
  registerDriver: (data: DriverRegistrationData) => { success: boolean; message: string; user?: User };
  approveDriver: (userIdOrId: string) => void;
  rejectDriver: (userIdOrId: string) => void;
  setSelectedRole: (role: UserRole | null) => void;
  setDriverLanguage: (lang: SupportedLanguage) => void;
  setLastDriverSpokenText: (text: string) => void;
  advanceDriverNextStop: (busId?: string) => void;
  setTraffic: (traffic: TrafficLevel) => void;
  startDriverTrip: () => void;
  endDriverTrip: () => void;
  markStudentMissedBus: () => void;
  dismissStudentMissedBus: () => void;
  selectAlternativeBus: (busId: string) => void;
  updateStudentWalkingTime: (mins: number) => void;
  reportEmergency: (type: EmergencyReport['type'], notes?: string) => void;
  reportRoadIssue: (type: RoadIssue['issueType']) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Demo Simulation Actions
  simulateBreakdown: (busId?: string) => void;
  simulateBusReplacement: (oldBusId?: string, newBusId?: string) => void;
  simulateRouteChange: () => void;
  simulateHeavyTraffic: () => void;
  simulateRain: () => void;
  simulateBusDelay: (busId?: string, extraMins?: number) => void;
  simulateMissedStop: () => void;
  simulateBusArrival: (busId?: string) => void;
  resetSimulation: () => void;
  setSimulationRunning: (running: boolean) => void;
  selectedBypassRouteId: string | null;
  selectBypassRoute: (recommendationId: string, busId?: string) => void;
}

const TransportContext = createContext<TransportContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'college_smart_transport_users_v2';

const getStoredUsers = (): User[] => {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return INITIAL_USERS;
};

export const TransportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(getStoredUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [activeStudentBusId, setActiveStudentBusId] = useState<string>('bus-07');
  const [buses, setBuses] = useState<Bus[]>(INITIAL_BUSES);
  const [routes, setRoutes] = useState<Route[]>(INITIAL_ROUTES);
  const [weather, setWeather] = useState<WeatherCondition>(INITIAL_WEATHER);
  const [traffic, setTraffic] = useState<TrafficLevel>('heavy');
  const [arrivalRecords, setArrivalRecords] = useState<BusArrivalRecord[]>(INITIAL_ARRIVAL_RECORDS);
  const [anomalyAlerts, setAnomalyAlerts] = useState<AnomalyAlert[]>([]);
  const [emergencyReports, setEmergencyReports] = useState<EmergencyReport[]>([]);
  const [roadIssues, setRoadIssues] = useState<RoadIssue[]>([]);
  const [isStudentMissedBus, setIsStudentMissedBus] = useState(false);
  const [isStudentBoarded, setIsStudentBoarded] = useState(false);
  const lastAutoMissedBusRef = useRef<string | null>(null);
  const [missedBusTriggerCount, setMissedBusTriggerCount] = useState(0);
  const [isMissedBusModalOpen, setIsMissedBusModalOpen] = useState(false);
  const [driverTripActive, setDriverTripActive] = useState(false);
  const [driverTripStartTime, setDriverTripStartTime] = useState<string | null>(null);
  const [driverLanguage, setDriverLanguage] = useState<SupportedLanguage>('te');
  const [lastDriverSpokenText, setLastDriverSpokenText] = useState<string>(
    'ప్రయాణానికి సిద్ధంగా ఉంది. ఆటో-జీపీఎస్ తర్వాతి స్టాప్ గుర్తింపు సక్రియంగా ఉంది.'
  );
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [studentWalkingTime, setStudentWalkingTime] = useState<number>(7);
  const [selectedBypassRouteId, setSelectedBypassRouteId] = useState<string | null>(null);

  // Initial greeting notification
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-init-1',
      targetRole: 'all',
      title: 'Smart Fleet Active',
      message: 'Morning transit is operational across all 4 corridors. GPS tracking live.',
      type: 'info',
      timestamp: '07:45 AM',
      read: false,
    },
    {
      id: 'notif-init-2',
      targetRole: 'student',
      title: 'Journey Alert',
      message: 'BUS-07 is on Route A. Recommended departure time calculated at 8:08 AM.',
      type: 'info',
      timestamp: '08:00 AM',
      read: false,
    },
  ]);

  const addNotification = useCallback(
    (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
      const newNotif: NotificationItem = {
        ...notif,
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  // Current assigned student bus & stop (reactive to replacement)
  const studentAssignedBus =
    buses.find((b) => b.id === (currentUser?.assignedBusId || activeStudentBusId || 'bus-07')) ||
    buses.find((b) => b.isReplacement) ||
    buses[6];
  const studentRoute = routes.find((r) => r.id === studentAssignedBus.routeId) || routes[0];
  const studentStop =
    studentRoute.stops.find((s) => s.id === (currentUser?.assignedStopId || 'stop-a3')) || studentRoute.stops[2];

  // AI Journey Prediction calculation
  const studentJourney = calculateJourneyPrediction(
    studentAssignedBus,
    studentRoute,
    studentStop,
    weather,
    traffic,
    studentWalkingTime,
    3
  );

  // Missed bus alternatives (memoized to avoid excessive object recreations during 1s GPS ticks)
  const missedBusAlternatives = useMemo(() => {
    return findMissedBusAlternatives(studentAssignedBus, buses, studentStop);
  }, [studentAssignedBus.id, studentAssignedBus.status, buses, studentStop.id]);

  // Automatic Missed-Bus Detection Engine:
  // Continuously monitors the student's assigned bus live/simulated GPS position relative to their pickup stop.
  // If the bus passes the student's pickup stop and the student has not boarded it, automatically marks
  // the journey as "Bus Missed", immediately creates the student notification: "You missed BUS-XX at [Stop].",
  // and makes the existing alternative-bus / Missed Bus AI functionality available without requiring manual input.
  useEffect(() => {
    if (!studentAssignedBus || !studentRoute || !studentStop) return;

    // If student has confirmed boarding, they have not missed the bus
    if (isStudentBoarded) return;

    const stopIndex = studentRoute.stops.findIndex((s) => s.id === studentStop.id);
    if (stopIndex < 0) return;

    const currentStopInRoute = studentRoute.stops[stopIndex];
    const busTargetStopIndex = studentRoute.stops.findIndex((s) => s.id === studentAssignedBus.nextStopId);

    // Evaluate whether the bus has passed the pickup stop:
    let busHasPassed = false;

    // 1. Bus is targeting or approaching a stop downstream (past the student's pickup stop)
    if (busTargetStopIndex > stopIndex) {
      busHasPassed = true;
    }
    // 2. The pickup stop is marked completed in the route and the bus is no longer dwelling at it
    else if (currentStopInRoute?.isCompleted && !studentAssignedBus.isDwellingAtStop) {
      busHasPassed = true;
    }
    // 3. The bus has arrived at the final college campus terminal
    else if (studentAssignedBus.status === 'arrived') {
      busHasPassed = true;
    }
    // 4. Physical coordinates check along the corridor vector
    else if (stopIndex > 0) {
      const prevStop = studentRoute.stops[stopIndex - 1];
      const sLat = (studentStop.isTemporarilyUnavailable && studentStop.alternativeStopLat) || studentStop.lat;
      const sLng = (studentStop.isTemporarilyUnavailable && studentStop.alternativeStopLng) || studentStop.lng;
      const pLat = (prevStop.isTemporarilyUnavailable && prevStop.alternativeStopLat) || prevStop.lat;
      const pLng = (prevStop.isTemporarilyUnavailable && prevStop.alternativeStopLng) || prevStop.lng;
      const bLat = studentAssignedBus.currentLocation.lat;
      const bLng = studentAssignedBus.currentLocation.lng;

      const dLatSeg = sLat - pLat;
      const dLngSeg = sLng - pLng;
      const segLenSq = dLatSeg * dLatSeg + dLngSeg * dLngSeg;

      if (segLenSq > 0) {
        const dot = (bLat - pLat) * dLatSeg + (bLng - pLng) * dLngSeg;
        const projection = dot / segLenSq;
        // Projection > 1.05 indicates the bus has physically traveled past the stop coordinates
        if (projection > 1.05 && !studentAssignedBus.isDwellingAtStop) {
          busHasPassed = true;
        }
      }
    }

    if (busHasPassed && !isStudentBoarded) {
      const trackingKey = `${studentAssignedBus.id}-${studentStop.id}`;
      if (lastAutoMissedBusRef.current !== trackingKey) {
        lastAutoMissedBusRef.current = trackingKey;

        // Automatically mark the journey as "Bus Missed"
        setIsStudentMissedBus(true);
        setIsMissedBusModalOpen(true);
        setMissedBusTriggerCount((c) => c + 1);

        // Immediately create a Student notification: "You missed BUS-XX at [Stop]."
        const notifTitle = `You missed ${studentAssignedBus.busNumber} at ${studentStop.name}.`;
        setNotifications((prev) => {
          const alreadyExists = prev.some(
            (n) => n.title === notifTitle && n.targetRole === 'student'
          );
          if (alreadyExists) return prev;

          const newNotif: NotificationItem = {
            id: `notif-missed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            targetRole: 'student',
            title: notifTitle,
            message: `You missed ${studentAssignedBus.busNumber} at ${studentStop.name}. AI has identified alternative buses and backup routes for your commute.`,
            type: 'alert',
            actionType: 'MISSED_STOP',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
          };
          return [newNotif, ...prev];
        });
      }
    }
  }, [
    studentAssignedBus,
    studentRoute,
    studentStop,
    isStudentBoarded,
  ]);

  // Update anomalies periodically
  useEffect(() => {
    const detected = detectBusAnomalies(buses);
    if (detected.length > 0) {
      setAnomalyAlerts((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const newOnes = detected.filter((d) => !existingIds.has(d.id));
        return [...newOnes, ...prev];
      });
    }
  }, [buses]);

  // GPS Simulation Loop (Active 2.5s update engine)
  const simulationTickRef = useRef(0);
  const lastApproachingAnnouncedStopRef = useRef<string | null>(null);
  const lastArrivedAnnouncedStopRef = useRef<string | null>(null);
  useEffect(() => {
    if (!simulationRunning) return;

    const interval = setInterval(() => {
      simulationTickRef.current += 1;
      const nowTimeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const stopsToMarkCompleted: { routeId: string; stopId: string }[] = [];
      let speechToTrigger: { text: string; lang: SupportedLanguage } | null = null;

      setBuses((prevBuses) => {
        return prevBuses.map((bus) => {
          // If arrived or unavailable, do not advance GPS
          if (bus.status === 'arrived' || bus.status === 'unavailable') {
            return {
              ...bus,
              lastUpdated: nowTimeStr,
            };
          }

          const route = routes.find((r) => r.id === bus.routeId);
          if (!route || !route.stops || route.stops.length === 0) return bus;

          let targetIdx = route.stops.findIndex((s) => s.id === bus.nextStopId);
          if (targetIdx < 0) targetIdx = 0;
          const targetStop = route.stops[targetIdx];

          // Compute target stop coordinates (respecting temporary detour stops)
          const targetLat = (targetStop.isTemporarilyUnavailable && targetStop.alternativeStopLat) || targetStop.lat;
          const targetLng = (targetStop.isTemporarilyUnavailable && targetStop.alternativeStopLng) || targetStop.lng;
          const targetDisplayName = (targetStop.isTemporarilyUnavailable && targetStop.alternativeStopName) || targetStop.name;

          // If bus is currently dwelling at a stop boarding students
          if (bus.isDwellingAtStop) {
            const currentDwellTicks = bus.dwellTicksRemaining ?? 2;
            if (currentDwellTicks > 1) {
              return {
                ...bus,
                currentSpeed: 0,
                dwellTicksRemaining: currentDwellTicks - 1,
                lastUpdated: nowTimeStr,
              };
            }

            // Dwell complete, mark this stop completed and advance to next stop
            stopsToMarkCompleted.push({ routeId: route.id, stopId: targetStop.id });

            if (targetIdx < route.stops.length - 1) {
              const nextStop = route.stops[targetIdx + 1];
              const nextStopDisplayName = (nextStop.isTemporarilyUnavailable && nextStop.alternativeStopName) || nextStop.name;
              const nextStopLat = (nextStop.isTemporarilyUnavailable && nextStop.alternativeStopLat) || nextStop.lat;
              const nextStopLng = (nextStop.isTemporarilyUnavailable && nextStop.alternativeStopLng) || nextStop.lng;
              const nextDistKm = Math.round(
                Math.hypot(
                  (nextStopLat - bus.currentLocation.lat) * 111,
                  (nextStopLng - bus.currentLocation.lng) * 111 * Math.cos((bus.currentLocation.lat * Math.PI) / 180)
                ) * 10
              ) / 10;

              // Announce next stop
              if (bus.id === (currentUser?.assignedBusId || 'bus-07')) {
                const speech = MULTILINGUAL_PHRASES[driverLanguage].nextStop(
                  nextStopDisplayName,
                  Math.round(nextDistKm * 1000)
                );
                speechToTrigger = { text: speech, lang: driverLanguage };
                lastApproachingAnnouncedStopRef.current = null;
                lastArrivedAnnouncedStopRef.current = null;
              }

              return {
                ...bus,
                isDwellingAtStop: false,
                dwellTicksRemaining: undefined,
                nextStopId: nextStop.id,
                nextStopName: nextStopDisplayName,
                distanceToNextStopKm: nextDistKm,
                currentSpeed: bus.status === 'delayed' ? 16 : traffic === 'heavy' ? 22 : 30,
                currentLocation: {
                  ...bus.currentLocation,
                  address: `Departed ${targetStop.name} → Approaching ${nextStopDisplayName}`,
                },
                lastUpdated: nowTimeStr,
              };
            } else {
              // Final College Campus reached
              if (bus.id === (currentUser?.assignedBusId || 'bus-07')) {
                speechToTrigger = {
                  text: MULTILINGUAL_PHRASES[driverLanguage].collegeReached,
                  lang: driverLanguage,
                };
              }
              return {
                ...bus,
                isDwellingAtStop: false,
                dwellTicksRemaining: undefined,
                status: 'arrived',
                currentSpeed: 0,
                nextStopName: 'Apex College Campus (Terminal)',
                distanceToNextStopKm: 0,
                routeProgress: 100,
                currentLocation: {
                  lat: COLLEGE_CAMPUS.lat,
                  lng: COLLEGE_CAMPUS.lng,
                  address: 'Apex College Campus Terminal (Arrived)',
                },
                lastUpdated: nowTimeStr,
              };
            }
          }

          const dLat = targetLat - bus.currentLocation.lat;
          const dLng = targetLng - bus.currentLocation.lng;
          const distDeg = Math.hypot(dLat, dLng);

          // Calculate realistic bus speed synchronized with traffic and delay status
          let baseSpeed = 30;
          if (bus.status === 'delayed') baseSpeed = 16;
          else if (traffic === 'severe') baseSpeed = 14;
          else if (traffic === 'heavy') baseSpeed = 22;
          else if (traffic === 'moderate') baseSpeed = 28;

          // Natural road micro-variance (±1.5 km/h)
          const speedJitter = Math.sin(simulationTickRef.current * 0.7 + (bus.id.charCodeAt(bus.id.length - 1) || 0)) * 1.5;
          const currentSpeed = Math.max(12, Math.min(42, Math.round(baseSpeed + speedJitter)));

          // Realistic gradual physical step per 2.5s tick (speed in km/h converted to degrees)
          // 1 degree ≈ 111 km. At 24 km/h, 2.5s step = ~16.7m = ~0.00015 degrees.
          const stepSize = Math.max(0.00007, Math.min(0.00020, ((currentSpeed / 3600) * 2.5) / 111));

          let newLat = bus.currentLocation.lat;
          let newLng = bus.currentLocation.lng;

          // Compute heading angle in degrees (0 = North, 90 = East, 180 = South, 270 = West)
          const heading = Math.round(((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360);

          // Calculate continuous, gradual route progress across the configured route
          const totalStops = route.stops.length;
          const prevStopIdx = Math.max(0, targetIdx - 1);
          const prevStop = route.stops[prevStopIdx];
          const prevLat = (prevStop.isTemporarilyUnavailable && prevStop.alternativeStopLat) || prevStop.lat;
          const prevLng = (prevStop.isTemporarilyUnavailable && prevStop.alternativeStopLng) || prevStop.lng;
          const segmentDist = Math.hypot(targetLat - prevLat, targetLng - prevLng) || 0.008;

          // Proportion of current stop segment traversed (0 to 1)
          const segmentFraction = Math.max(0, Math.min(1, 1 - (distDeg / segmentDist)));

          // Route progress increases gradually stop-by-stop without premature jumps
          const continuousRatio = (prevStopIdx + segmentFraction) / (totalStops - 1);
          const routeProgress = Math.min(99, Math.max(0, Math.round(continuousRatio * 100)));

          // Synchronized student stop distance and ETA
          const studentStopObj = route.stops.find((s) => s.id === 'stop-a3') || route.stops[2];
          const sStopLat = (studentStopObj?.isTemporarilyUnavailable && studentStopObj.alternativeStopLat) || studentStopObj?.lat || targetLat;
          const sStopLng = (studentStopObj?.isTemporarilyUnavailable && studentStopObj.alternativeStopLng) || studentStopObj?.lng || targetLng;
          const distToStudentStopKm = Math.round(
            Math.hypot(
              (sStopLat - newLat) * 111,
              (sStopLng - newLng) * 111 * Math.cos((newLat * Math.PI) / 180)
            ) * 10
          ) / 10;
          const etaToStudentStop = bus.status === 'delayed' ? '08:26 AM' : (studentStopObj?.scheduledTime || '08:18 AM');

          // Check geofence entry (within radius or one step away)
          const distMeters = Math.hypot(
            (targetLat - bus.currentLocation.lat) * 111000,
            (targetLng - bus.currentLocation.lng) * 111000 * Math.cos((bus.currentLocation.lat * Math.PI) / 180)
          );
          const isAtGeofence = distMeters <= Math.min(targetStop.geofenceRadiusMeters || 150, 30) || distDeg <= stepSize;

          if (!isAtGeofence) {
            newLat += (dLat / distDeg) * stepSize;
            newLng += (dLng / distDeg) * stepSize;

            const remainingKm = Math.round(
              Math.hypot(
                (targetLat - newLat) * 111,
                (targetLng - newLng) * 111 * Math.cos((newLat * Math.PI) / 180)
              ) * 10
            ) / 10;

            // Announce approaching stop if within 350 meters
            if (
              bus.id === (currentUser?.assignedBusId || 'bus-07') &&
              distMeters <= 350 &&
              lastApproachingAnnouncedStopRef.current !== targetStop.id
            ) {
              lastApproachingAnnouncedStopRef.current = targetStop.id;
              speechToTrigger = {
                text: MULTILINGUAL_PHRASES[driverLanguage].stopApproaching(targetDisplayName),
                lang: driverLanguage,
              };
            }

            return {
              ...bus,
              currentLocation: {
                lat: newLat,
                lng: newLng,
                address: `Approaching ${targetDisplayName} (${Math.max(0.1, remainingKm)} km away)`,
              },
              heading,
              currentSpeed,
              distanceToNextStopKm: remainingKm,
              routeProgress,
              distanceToStudentStopKm: distToStudentStopKm,
              etaToStudentStop,
              lastUpdated: nowTimeStr,
            };
          } else {
            // Reached Stop Geofence! Mark stop completed and dwell/arrive
            newLat = targetLat;
            newLng = targetLng;

            stopsToMarkCompleted.push({ routeId: route.id, stopId: targetStop.id });

            if (targetIdx === route.stops.length - 1) {
              // Final College Campus reached - ONLY here is college arrival voice triggered
              if (bus.id === (currentUser?.assignedBusId || 'bus-07')) {
                speechToTrigger = {
                  text: MULTILINGUAL_PHRASES[driverLanguage].collegeReached,
                  lang: driverLanguage,
                };
              }
              return {
                ...bus,
                status: 'arrived',
                currentSpeed: 0,
                distanceToNextStopKm: 0,
                distanceToStudentStopKm: 0,
                etaToStudentStop: 'Arrived',
                routeProgress: 100,
                currentLocation: {
                  lat: COLLEGE_CAMPUS.lat,
                  lng: COLLEGE_CAMPUS.lng,
                  address: 'Apex College Campus Terminal (Arrived)',
                },
                lastUpdated: nowTimeStr,
              };
            }

            // Intermediate stop reached: announce arrival in driverLanguage
            if (
              bus.id === (currentUser?.assignedBusId || 'bus-07') &&
              lastArrivedAnnouncedStopRef.current !== targetStop.id
            ) {
              lastArrivedAnnouncedStopRef.current = targetStop.id;
              speechToTrigger = {
                text: MULTILINGUAL_PHRASES[driverLanguage].stopArrived(targetDisplayName),
                lang: driverLanguage,
              };
            }

            // Dwell at intermediate station for passenger boarding
            return {
              ...bus,
              isDwellingAtStop: true,
              dwellTicksRemaining: 2,
              currentLocation: {
                lat: newLat,
                lng: newLng,
                address: `At Stop: ${targetDisplayName} (Boarding Students)`,
              },
              currentSpeed: 0,
              distanceToNextStopKm: 0,
              routeProgress,
              distanceToStudentStopKm: distToStudentStopKm,
              etaToStudentStop,
              lastUpdated: nowTimeStr,
            };
          }
        });
      });

      // Commit completed stops into routes so all dashboards reflect completion
      if (stopsToMarkCompleted.length > 0) {
        setRoutes((prevRoutes) =>
          prevRoutes.map((r) => {
            const completedIds = stopsToMarkCompleted.filter((s) => s.routeId === r.id).map((s) => s.stopId);
            if (completedIds.length === 0) return r;
            return {
              ...r,
              stops: r.stops.map((s) => (completedIds.includes(s.id) ? { ...s, isCompleted: true } : s)),
            };
          })
        );
      }

      // Automatically speak voice alert and update last spoken transmission
      if (speechToTrigger) {
        const item = speechToTrigger as { text: string; lang: SupportedLanguage };
        speakText(item.text, item.lang);
        setLastDriverSpokenText(item.text);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [simulationRunning, routes, driverLanguage, traffic, currentUser]);

  // Sync users state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to persist users:', e);
    }
  }, [users]);

  // Auth methods
  const login = (identifier: string, passwordHash: string, role: UserRole): LoginResult => {
    const cleanId = identifier.trim().toLowerCase();
    const user = users.find(
      (u) =>
        u.role === role &&
        (u.identifier.toLowerCase() === cleanId ||
          u.email?.toLowerCase() === cleanId ||
          u.phone === cleanId ||
          (u.rollNumber && u.rollNumber.toLowerCase() === cleanId) ||
          (u.driverId && u.driverId.toLowerCase() === cleanId))
    );

    if (!user) {
      return {
        success: false,
        message:
          role === 'student'
            ? 'No student account found with this Roll Number or Email. Please check your credentials or create a new account.'
            : role === 'driver'
            ? 'No driver account found with this Driver ID or Email. Please sign up or contact transport dispatch.'
            : 'Administrative account credentials not recognized. Access is restricted to authorized campus staff.',
      };
    }

    // Password verification with demo fallback
    const isPasswordValid =
      user.passwordHash === passwordHash ||
      passwordHash === 'demo' ||
      (passwordHash.length >= 4 && user.passwordHash === 'student123') ||
      (passwordHash.length >= 4 && user.passwordHash === 'driver123') ||
      (passwordHash.length >= 4 && user.passwordHash === 'admin123');

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid password. Please check your input and try again.',
        user,
      };
    }

    // Driver approval check: New driver accounts must require Admin approval before accessing the Driver Dashboard
    if (user.role === 'driver') {
      if (user.approvalStatus === 'pending') {
        return {
          success: false,
          isPendingApproval: true,
          message:
            'Driver Account Pending Admin Approval: Your driver registration has been submitted and is awaiting administrator verification. Access to the Driver Dashboard will be unlocked once approved by college transport dispatch.',
          user,
        };
      }
      if (user.approvalStatus === 'rejected') {
        return {
          success: false,
          isRejected: true,
          message:
            'Driver Account Access Denied: Your driver registration was not approved by the transport administrator. Please contact the fleet desk.',
          user,
        };
      }
    }

    setCurrentUser(user);
    setSelectedRole(role);
    if (user.preferredLanguage) {
      setDriverLanguage(user.preferredLanguage);
    }
    if (user.assignedBusId) {
      setActiveStudentBusId(user.assignedBusId);
    }

    addNotification({
      targetRole: role,
      title: 'Authentication Successful',
      message: `Welcome back, ${user.name}. You are logged in as ${role.toUpperCase()}.`,
      type: 'success',
    });

    return {
      success: true,
      user,
      message: 'Authentication successful',
    };
  };

  const registerStudent = (data: StudentRegistrationData): { success: boolean; message: string; user?: User } => {
    const cleanRoll = data.rollNumber.trim().toUpperCase();
    const cleanEmail = data.email.trim().toLowerCase();

    // Check for duplicate student
    const existingUser = users.find(
      (u) =>
        u.role === 'student' &&
        (u.identifier.toUpperCase() === cleanRoll ||
          (u.rollNumber && u.rollNumber.toUpperCase() === cleanRoll) ||
          u.email?.toLowerCase() === cleanEmail)
    );

    if (existingUser) {
      return {
        success: false,
        message: `A student account with Roll Number "${cleanRoll}" or email is already registered. Please proceed to Sign In.`,
      };
    }

    // Determine route and primary bus for selected pickup stop
    let matchedBusId = 'bus-07';
    let matchedStop: Stop | undefined;
    for (const r of routes) {
      const foundStop = r.stops.find((s) => s.id === data.stopId);
      if (foundStop) {
        matchedStop = foundStop;
        const assignedBusForRoute = buses.find((b) => b.routeId === r.id);
        if (assignedBusForRoute) {
          matchedBusId = assignedBusForRoute.id;
        }
        break;
      }
    }

    const newStudent: User = {
      id: `stu-${Date.now()}`,
      identifier: cleanRoll,
      rollNumber: cleanRoll,
      name: data.name.trim(),
      role: 'student',
      email: cleanEmail,
      passwordHash: data.password,
      assignedBusId: matchedBusId,
      assignedStopId: data.stopId,
      walkingTimeMinutes: 7,
      approvalStatus: 'approved', // Immediately approved for student login
      registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      homeLocation: matchedStop
        ? {
            lat: matchedStop.lat + 0.0015,
            lng: matchedStop.lng + 0.0015,
            address: `Near ${matchedStop.name}`,
          }
        : undefined,
    };

    setUsers((prev) => [newStudent, ...prev]);

    addNotification({
      targetRole: 'student',
      title: 'Student Account Registered',
      message: `Welcome, ${newStudent.name}! You are registered for stop: ${
        matchedStop?.name || 'Assigned Stop'
      }. You may now log in.`,
      type: 'success',
    });

    return {
      success: true,
      message: `Account created successfully! You can now log in with Roll Number: ${cleanRoll}`,
      user: newStudent,
    };
  };

  const registerDriver = (data: DriverRegistrationData): { success: boolean; message: string; user?: User } => {
    const cleanDriverId = data.driverId.trim().toUpperCase();
    const cleanEmail = data.email.trim().toLowerCase();

    // Check duplicate
    const existingDriver = users.find(
      (u) =>
        u.role === 'driver' &&
        (u.identifier.toUpperCase() === cleanDriverId ||
          (u.driverId && u.driverId.toUpperCase() === cleanDriverId) ||
          u.email?.toLowerCase() === cleanEmail)
    );

    if (existingDriver) {
      return {
        success: false,
        message: `A driver account with ID "${cleanDriverId}" or email is already registered. Please check approval status or log in.`,
      };
    }

    const newDriver: User = {
      id: `drv-${Date.now()}`,
      identifier: cleanDriverId,
      driverId: cleanDriverId,
      name: data.name.trim(),
      role: 'driver',
      email: cleanEmail,
      passwordHash: data.password,
      approvalStatus: 'pending', // REQUIRED: Requires Admin approval before accessing driver dashboard
      registeredAt: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      preferredLanguage: 'te',
    };

    setUsers((prev) => [newDriver, ...prev]);

    addNotification({
      targetRole: 'admin',
      title: '⚠️ New Driver Approval Required',
      message: `Driver ${newDriver.name} (${cleanDriverId}) registered. Administrator review and verification required before dashboard access is permitted.`,
      type: 'warning',
    });

    return {
      success: true,
      message:
        'Driver registration submitted successfully! Because this is a driver profile, an administrator must review and approve your account before you can log in to the Driver Dashboard.',
      user: newDriver,
    };
  };

  const approveDriver = (userIdOrId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userIdOrId || u.identifier === userIdOrId || u.driverId === userIdOrId) {
          return {
            ...u,
            approvalStatus: 'approved',
            assignedBusId: u.assignedBusId || 'bus-07',
          };
        }
        return u;
      })
    );

    // If current logged in driver is the one approved, update currentUser
    setCurrentUser((prev) => {
      if (prev && (prev.id === userIdOrId || prev.identifier === userIdOrId || prev.driverId === userIdOrId)) {
        return { ...prev, approvalStatus: 'approved', assignedBusId: prev.assignedBusId || 'bus-07' };
      }
      return prev;
    });

    const targetUser = users.find(
      (u) => u.id === userIdOrId || u.identifier === userIdOrId || u.driverId === userIdOrId
    );

    addNotification({
      targetRole: 'all',
      title: 'Driver Approved by Admin',
      message: `Driver ${targetUser?.name || userIdOrId} (${targetUser?.identifier || ''}) has been verified and granted cockpit access.`,
      type: 'success',
    });
  };

  const rejectDriver = (userIdOrId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userIdOrId || u.identifier === userIdOrId || u.driverId === userIdOrId) {
          return {
            ...u,
            approvalStatus: 'rejected',
          };
        }
        return u;
      })
    );

    setCurrentUser((prev) => {
      if (prev && (prev.id === userIdOrId || prev.identifier === userIdOrId || prev.driverId === userIdOrId)) {
        return { ...prev, approvalStatus: 'rejected' };
      }
      return prev;
    });

    const targetUser = users.find(
      (u) => u.id === userIdOrId || u.identifier === userIdOrId || u.driverId === userIdOrId
    );

    addNotification({
      targetRole: 'admin',
      title: 'Driver Registration Rejected',
      message: `Registration for ${targetUser?.name || userIdOrId} has been rejected.`,
      type: 'info',
    });
  };

  const logout = () => {
    setCurrentUser(null);
    setSelectedRole(null);
    setIsStudentMissedBus(false);
    setIsMissedBusModalOpen(false);
  };

  const handleSetDriverLanguage = useCallback((lang: SupportedLanguage) => {
    setDriverLanguage(lang);
    if (lang === 'te') {
      setLastDriverSpokenText('ప్రయాణానికి సిద్ధంగా ఉంది. ఆటో-జీపీఎస్ తర్వాతి స్టాప్ గుర్తింపు సక్రియంగా ఉంది.');
    } else if (lang === 'hi') {
      setLastDriverSpokenText('यात्रा के लिए तैयार। ऑटो-जीपीएस अगला स्टॉप ट्रैकिंग सक्रिय है।');
    } else {
      setLastDriverSpokenText('Ready for dispatch. Auto-GPS next-stop detection active.');
    }
  }, []);

  const handleSetSelectedRole = (role: UserRole | null) => {
    setSelectedRole(role);
    if (role === 'student') {
      setCurrentUser((prev) => {
        if (!prev || prev.role !== 'student') {
          const approvedStudent = users.find((u) => u.role === 'student' && u.approvalStatus === 'approved') || users[0];
          return { ...approvedStudent, assignedBusId: activeStudentBusId };
        }
        return prev;
      });
    } else if (role === 'driver') {
      setCurrentUser((prev) => {
        if (!prev || prev.role !== 'driver') {
          const approvedDriver = users.find((u) => u.role === 'driver' && u.approvalStatus === 'approved') || users.find((u) => u.role === 'driver') || INITIAL_USERS[2];
          return approvedDriver;
        }
        return prev;
      });
      setDriverLanguage('te');
    } else if (role === 'admin') {
      setCurrentUser((prev) => {
        if (!prev || prev.role !== 'admin') {
          return users.find((u) => u.role === 'admin') || INITIAL_USERS[4];
        }
        return prev;
      });
    }
  };

  const startDriverTrip = () => {
    setDriverTripActive(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setDriverTripStartTime(nowTime);

    // Speak confirmation
    speakText(MULTILINGUAL_PHRASES[driverLanguage].tripStarted, driverLanguage);

    addNotification({
      targetRole: 'driver',
      title: 'Trip Started',
      message: `Morning trip initiated on ${studentAssignedBus.busNumber}. Live GPS broadcasting active.`,
      type: 'success',
    });

    // Voice announcement for upcoming stop
    setTimeout(() => {
      const alert = MULTILINGUAL_PHRASES[driverLanguage].nextStop(studentAssignedBus.nextStopName, 300);
      speakText(alert, driverLanguage);
      setLastDriverSpokenText(alert);
    }, 1200);
  };

  const endDriverTrip = () => {
    setDriverTripActive(false);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setBuses((prev) =>
      prev.map((b) => (b.id === studentAssignedBus.id ? { ...b, status: 'arrived', currentSpeed: 0 } : b))
    );

    // Record in Admin Arrival Log
    const newArrivalRecord: BusArrivalRecord = {
      id: `arr-${Date.now()}`,
      busNumber: studentAssignedBus.busNumber,
      routeCode: studentRoute.code,
      routeName: studentRoute.name,
      driverName: studentAssignedBus.driverName,
      tripType: 'Morning',
      status: 'ARRIVED',
      arrivalTime: nowTime,
      timestamp: `${new Date().toISOString().split('T')[0]} ${nowTime}`,
      onTime: studentAssignedBus.status !== 'delayed',
    };

    setArrivalRecords((prev) => [newArrivalRecord, ...prev]);

    speakText(MULTILINGUAL_PHRASES[driverLanguage].collegeReached, driverLanguage);
    setLastDriverSpokenText(MULTILINGUAL_PHRASES[driverLanguage].collegeReached);

    addNotification({
      targetRole: 'all',
      title: `${studentAssignedBus.busNumber} Arrived at College`,
      message: `Trip safely concluded at ${nowTime}. Admin arrival log recorded automatically.`,
      type: 'success',
      actionType: 'ARRIVAL',
    });
  };

  // Optional demo/testing fallback to manually advance stop without waiting for GPS
  const advanceDriverNextStop = useCallback(
    (busId?: string) => {
      const targetBusId = busId || currentUser?.assignedBusId || 'bus-07';
      let alertToSpeak: string | null = null;
      let stopToComplete: { routeId: string; stopId: string } | null = null;

      setBuses((prevBuses) => {
        return prevBuses.map((bus) => {
          if (bus.id !== targetBusId) return bus;

          const route = routes.find((r) => r.id === bus.routeId);
          if (!route || !route.stops || route.stops.length === 0) return bus;

          let targetIdx = route.stops.findIndex((s) => s.id === bus.nextStopId);
          if (targetIdx < 0) targetIdx = 0;
          const currentStop = route.stops[targetIdx];

          stopToComplete = { routeId: route.id, stopId: currentStop.id };

          const nowTimeStr = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          if (targetIdx < route.stops.length - 1) {
            const nextStop = route.stops[targetIdx + 1];
            const nextStopDisplayName =
              (nextStop.isTemporarilyUnavailable && nextStop.alternativeStopName) || nextStop.name;
            const nextStopLat =
              (nextStop.isTemporarilyUnavailable && nextStop.alternativeStopLat) || nextStop.lat;
            const nextStopLng =
              (nextStop.isTemporarilyUnavailable && nextStop.alternativeStopLng) || nextStop.lng;

            const nextDistKm =
              Math.round(
                Math.hypot(
                  (nextStopLat - currentStop.lat) * 111,
                  (nextStopLng - currentStop.lng) * 111 * Math.cos((currentStop.lat * Math.PI) / 180)
                ) * 10
              ) / 10;

            const progress = Math.min(
              95,
              Math.round(((targetIdx + 1) / (route.stops.length - 1)) * 100)
            );

            const dLat = nextStopLat - currentStop.lat;
            const dLng = nextStopLng - currentStop.lng;
            const heading = Math.round(((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360);

            alertToSpeak = MULTILINGUAL_PHRASES[driverLanguage].nextStop(
              nextStopDisplayName,
              Math.round(nextDistKm * 1000)
            );

            return {
              ...bus,
              isDwellingAtStop: false,
              dwellTicksRemaining: undefined,
              nextStopId: nextStop.id,
              nextStopName: nextStopDisplayName,
              distanceToNextStopKm: nextDistKm,
              heading,
              currentSpeed: 28,
              routeProgress: progress,
              currentLocation: {
                lat: currentStop.lat + (nextStopLat - currentStop.lat) * 0.2,
                lng: currentStop.lng + (nextStopLng - currentStop.lng) * 0.2,
                address: `Departed ${currentStop.name} → Approaching ${nextStopDisplayName}`,
              },
              lastUpdated: nowTimeStr,
            };
          } else {
            // Final College Campus reached
            alertToSpeak = MULTILINGUAL_PHRASES[driverLanguage].collegeReached;
            return {
              ...bus,
              isDwellingAtStop: false,
              dwellTicksRemaining: undefined,
              status: 'arrived',
              currentSpeed: 0,
              nextStopName: 'Apex College Campus (Terminal)',
              distanceToNextStopKm: 0,
              distanceToStudentStopKm: 0,
              etaToStudentStop: 'Arrived',
              routeProgress: 100,
              currentLocation: {
                lat: COLLEGE_CAMPUS.lat,
                lng: COLLEGE_CAMPUS.lng,
                address: 'Apex College Campus Terminal (Arrived)',
              },
              lastUpdated: nowTimeStr,
            };
          }
        });
      });

      if (stopToComplete) {
        const completed = stopToComplete as { routeId: string; stopId: string };
        setRoutes((prevRoutes) =>
          prevRoutes.map((r) => {
            if (r.id !== completed.routeId) return r;
            return {
              ...r,
              stops: r.stops.map((s) =>
                s.id === completed.stopId ? { ...s, isCompleted: true } : s
              ),
            };
          })
        );
      }

      if (alertToSpeak) {
        speakText(alertToSpeak, driverLanguage);
        setLastDriverSpokenText(alertToSpeak);
      }
    },
    [currentUser, routes, driverLanguage]
  );

  const markStudentMissedBus = useCallback(() => {
    setSelectedRole('student');
    setCurrentUser((prev) => {
      if (!prev || prev.role !== 'student') {
        return { ...INITIAL_USERS[0], assignedBusId: activeStudentBusId };
      }
      return prev;
    });
    setIsStudentMissedBus(true);
    setIsMissedBusModalOpen(true);
    setMissedBusTriggerCount((c) => c + 1);
    // Prevent spamming duplicate notifications if already marked
    setNotifications((prev) => {
      const notifTitle = `You missed ${studentAssignedBus.busNumber} at ${studentStop.name}.`;
      const alreadyLogged = prev.some(
        (n) => (n.title === notifTitle || n.title === 'Missed Bus Logged') && n.targetRole === 'student'
      );
      if (alreadyLogged) return prev;
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        targetRole: 'student',
        title: notifTitle,
        message: `You missed ${studentAssignedBus.busNumber} at ${studentStop.name}. AI ranked alternative buses for your stop.`,
        type: 'alert',
        actionType: 'MISSED_STOP',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      return [newNotif, ...prev];
    });
  }, [studentAssignedBus.busNumber, studentStop.name, activeStudentBusId]);

  const dismissStudentMissedBus = useCallback(() => {
    setIsStudentMissedBus(false);
    setIsMissedBusModalOpen(false);
  }, []);

  const selectAlternativeBus = useCallback(
    (newBusId: string) => {
      // Guard against duplicate selection if already tracking this bus
      if (activeStudentBusId === newBusId && currentUser?.assignedBusId === newBusId) {
        return;
      }
      const targetBus = buses.find((b) => b.id === newBusId);
      if (targetBus) {
        setActiveStudentBusId(newBusId);
        setCurrentUser((prev) => (prev ? { ...prev, assignedBusId: newBusId } : prev));
        // Preserve missed bus recovery mode
        setIsStudentMissedBus(true);
        addNotification({
          targetRole: 'student',
          title: `Tracking Switched to ${targetBus.busNumber}`,
          message: `Your active journey is now synced with ${targetBus.busNumber} (${targetBus.routeName}).`,
          type: 'success',
        });
      }
    },
    [activeStudentBusId, currentUser, buses, addNotification]
  );

  const updateStudentWalkingTime = (mins: number) => {
    setStudentWalkingTime(mins);
    if (currentUser) {
      setCurrentUser({ ...currentUser, walkingTimeMinutes: mins });
    }
  };

  const reportEmergency = (type: EmergencyReport['type'], notes?: string) => {
    const newReport: EmergencyReport = {
      id: `sos-${Date.now()}`,
      busId: studentAssignedBus.id,
      busNumber: studentAssignedBus.busNumber,
      driverId: studentAssignedBus.driverId,
      driverName: studentAssignedBus.driverName,
      type,
      location: studentAssignedBus.currentLocation,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'active',
      notes: notes || 'Emergency SOS button triggered from driver console.',
    };

    setEmergencyReports((prev) => [newReport, ...prev]);

    addNotification({
      targetRole: 'admin',
      title: `🚨 CRITICAL ALERT: ${type} on ${studentAssignedBus.busNumber}`,
      message: `Driver ${studentAssignedBus.driverName} reported ${type} near ${studentAssignedBus.currentLocation.address || 'corridor'}. Coordinates dispatched to Admin command center.`,
      type: 'alert',
      actionType: 'EMERGENCY',
    });

    const emgText = buildEmergencyVoiceAlert(type, driverLanguage);
    speakText(emgText, driverLanguage);
    setLastDriverSpokenText(emgText);
  };

  const reportRoadIssue = (issueType: RoadIssue['issueType']) => {
    const newIssue: RoadIssue = {
      id: `issue-${Date.now()}`,
      busId: studentAssignedBus.id,
      driverId: studentAssignedBus.driverId,
      driverName: studentAssignedBus.driverName,
      issueType,
      location: studentAssignedBus.currentLocation,
      reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      active: true,
    };

    setRoadIssues((prev) => [newIssue, ...prev]);

    addNotification({
      targetRole: 'admin',
      title: `Road Issue Reported: ${issueType.replace('-', ' ').toUpperCase()}`,
      message: `Submitted by driver of ${studentAssignedBus.busNumber}. Incorporated into AI route calculation.`,
      type: 'warning',
    });

    const hazardText = buildRoadHazardVoiceAlert(issueType, driverLanguage);
    speakText(hazardText, driverLanguage);
    setLastDriverSpokenText(hazardText);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // ================= DEMO SIMULATION HANDLERS =================

  // Scenario 5: Bus Breakdown
  const simulateBreakdown = (busId: string = 'bus-07') => {
    setBuses((prev) =>
      prev.map((b) =>
        b.id === busId
          ? {
              ...b,
              status: 'unavailable',
              currentSpeed: 0,
              unavailableReason: 'Mechanical Transmission Failure',
            }
          : b
      )
    );

    addNotification({
      targetRole: 'all',
      title: `🔴 BREAKDOWN REPORTED: ${busId === 'bus-07' ? 'BUS-07' : busId}`,
      message: `BUS-07 has encountered a mechanical breakdown. Affected students are being identified. Replacement dispatch initiated.`,
      type: 'alert',
    });

    // Auto-alert anomaly
    setAnomalyAlerts((prev) => [
      {
        id: `anom-breakdown-${Date.now()}`,
        busId,
        busNumber: 'BUS-07',
        type: 'unexpected-stop',
        severity: 'critical',
        message: 'BUS-07 stationary for >10 mins due to mechanical breakdown. Student notification dispatched.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        resolved: false,
      },
      ...prev,
    ]);

    const breakdownMsg = MULTILINGUAL_PHRASES[driverLanguage].breakdownReported;
    speakText(breakdownMsg, driverLanguage);
    setLastDriverSpokenText(breakdownMsg);
  };

  // Scenario 6: Bus Replacement Workflow (BUS-07 -> BUS-12)
  const simulateBusReplacement = (oldBusId: string = 'bus-07', newBusId: string = 'bus-12') => {
    // Prevent duplicate replacements if BUS-12 is already active replacement
    const isAlreadyReplaced =
      activeStudentBusId === newBusId &&
      buses.some((b) => b.id === newBusId && b.isReplacement);
    if (isAlreadyReplaced) {
      return;
    }

    setBuses((prev) =>
      prev.map((b) => {
        if (b.id === oldBusId) {
          return {
            ...b,
            status: 'unavailable',
            replacementBusId: newBusId,
            currentSpeed: 0,
            unavailableReason: `Mechanical Breakdown — Replaced by ${newBusId === 'bus-12' ? 'BUS-12' : newBusId}`,
          };
        }
        if (b.id === newBusId) {
          return {
            ...b,
            isReplacement: true,
            originalBusId: oldBusId,
            status: 'on-time',
            currentSpeed: 38,
            routeId: 'route-a',
            routeName: 'Route A — North Corridor (Replacement Dispatch)',
            nextStopId: 'stop-a3',
            nextStopName: 'Main Road (Student Stop)',
            distanceToNextStopKm: 0.9,
            driverId: 'drv-12',
            driverName: 'Suresh Reddy',
            driverPhone: '+91 98765 43212',
          };
        }
        return b;
      })
    );

    // Reassign student to replacement bus across dedicated active state and currentUser
    setActiveStudentBusId(newBusId);
    setCurrentUser((prev) => {
      if (prev && prev.role === 'student') {
        return { ...prev, assignedBusId: newBusId };
      }
      if (prev) {
        return { ...prev, assignedBusId: newBusId };
      }
      return { ...INITIAL_USERS[0], assignedBusId: newBusId };
    });

    // Requirement 6: Success notification using existing system
    addNotification({
      targetRole: 'student',
      title: 'Bus Replacement Successful',
      message: 'BUS-07 has been replaced by BUS-12. Your journey has been updated.',
      type: 'success',
      actionType: 'BUS_CHANGE',
      metadata: { oldBus: 'BUS-07', newBus: 'BUS-12' },
    });
  };

  // Scenario 8: Route Change (Detour Simulation)
  const simulateRouteChange = () => {
    const detourData: DetourInfo = {
      active: true,
      reason: 'Major Flyover Construction & Drain Maintenance',
      affectedStopId: 'stop-a3',
      affectedStopName: 'Main Road (Student Stop)',
      alternativeStopId: 'stop-a3-detour',
      alternativeStopName: 'Main Road Junction (150m ahead)',
      alternativeStopLat: 17.4695,
      alternativeStopLng: 78.3818,
      detourPath: [
        { lat: 17.4840, lng: 78.3960, name: 'KPHB Colony Phase 3' },
        { lat: 17.4785, lng: 78.3910, name: 'Service Road Diversion Point' },
        { lat: 17.4695, lng: 78.3818, name: 'Main Road Junction (Temporary Detour Stop)' },
        { lat: 17.4635, lng: 78.3795, name: 'Corridor Reconnection Point' },
        { lat: 17.4580, lng: 78.3780, name: 'Hitech Metro Junction' },
      ],
      walkingAdjustmentMinutes: 2,
      busEtaAdjustmentMinutes: 2,
    };

    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === 'route-a') {
          return {
            ...r,
            isTemporarilyChanged: true,
            temporaryChangeNotice:
              '⚠️ Major Flyover Construction. Usual Main Road stop detour to Main Road Junction (150m ahead).',
            detourInfo: detourData,
            stops: r.stops.map((s) =>
              s.id === 'stop-a3'
                ? {
                    ...s,
                    isTemporarilyUnavailable: true,
                    alternativeStopName: 'Main Road Junction (150m ahead)',
                    alternativeStopLat: 17.4695,
                    alternativeStopLng: 78.3818,
                  }
                : s
            ),
          };
        }
        return r;
      })
    );

    setBuses((prev) =>
      prev.map((b) => {
        if (b.routeId === 'route-a') {
          const nextStopName =
            b.nextStopId === 'stop-a3'
              ? 'Main Road Junction (Temporary Detour Stop)'
              : b.nextStopName;
          return {
            ...b,
            status: 'route-changed',
            nextStopName,
          };
        }
        return b;
      })
    );

    setAnomalyAlerts((prev) => {
      const existing = prev.filter((a) => a.type !== 'route-deviation');
      return [
        {
          id: `anom-detour-${Date.now()}`,
          busId: 'bus-07',
          busNumber: 'BUS-07',
          type: 'route-deviation',
          severity: 'warning',
          message:
            '🚧 ACTIVE ROUTE DETOUR: Route A diverted via Service Road due to flyover construction. Alternative stop assigned at Main Road Junction (150m ahead).',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          resolved: false,
        },
        ...existing,
      ];
    });

    addNotification({
      targetRole: 'all',
      title: '🚧 ROUTE DETOUR & TEMPORARY STOP ACTIVE',
      message:
        'Route A — North Corridor: Usual Main Road stop is closed for construction. Alternative Stop: Main Road Junction (150m ahead). Bus ETA: 8:20 AM.',
      type: 'warning',
      actionType: 'ROUTE_CHANGE',
      metadata: {
        routeId: 'route-a',
        affectedStop: 'Main Road (Student Stop)',
        alternativeStop: 'Main Road Junction (150m ahead)',
      },
    });

    try {
      const detourText = buildDetourVoiceAlert(driverLanguage);
      speakText(detourText, driverLanguage);
      setLastDriverSpokenText(detourText);
    } catch {
      // voice fallback
    }
  };

  // AI Corridor Bypass Route Selection & Synchronization
  const selectBypassRoute = useCallback(
    (recommendationId: string, targetBusId: string = 'bus-07') => {
      setSelectedBypassRouteId(recommendationId);

      const isRouteB =
        recommendationId === 'rec-2' ||
        recommendationId.toLowerCase().includes('route-b') ||
        recommendationId.toLowerCase().includes('route b');

      setBuses((prev) =>
        prev.map((bus) => {
          if (bus.id === targetBusId) {
            if (isRouteB) {
              const routeB = routes.find((r) => r.id === 'route-b') || INITIAL_ROUTES[1];
              return {
                ...bus,
                routeId: 'route-b',
                routeName: routeB?.name || 'Route B — Metro Link',
                nextStopId: 'stop-b2',
                nextStopName: 'Hafeezpet Flyover',
                distanceToNextStopKm: 1.2,
                routeProgress: 42,
                currentLocation: {
                  lat: 17.4850,
                  lng: 78.3590,
                  address: 'Hafeezpet Flyover Approach (Route B Bypass)',
                },
                heading: 140,
                currentSpeed: 28,
                lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
            } else {
              const routeA = routes.find((r) => r.id === 'route-a') || INITIAL_ROUTES[0];
              return {
                ...bus,
                routeId: 'route-a',
                routeName: routeA?.name || 'Route A — North Corridor',
                nextStopId: 'stop-a3',
                nextStopName: 'Main Road (Student Stop)',
                distanceToNextStopKm: 1.4,
                routeProgress: 38,
                currentLocation: {
                  lat: 17.4795,
                  lng: 78.3905,
                  address: 'Near KPHB - Main Road Arterial (Route A Bypass)',
                },
                heading: 155,
                currentSpeed: 24,
                lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
            }
          }
          return bus;
        })
      );

      const routeName = isRouteB ? 'Route B — Metro Link' : 'Route A — North Corridor';
      const timeSaved = isRouteB ? 3 : 7;
      addNotification({
        targetRole: 'all',
        title: `AI Bypass Route Active: ${routeName}`,
        message: `${targetBusId.toUpperCase()} has switched live navigation to ${routeName}. Estimated time saved: ${timeSaved} mins.`,
        type: 'info',
        actionType: 'ROUTE_CHANGE',
        metadata: {
          routeId: isRouteB ? 'route-b' : 'route-a',
          recommendationId,
        },
      });

      try {
        const bypassSpeech = buildBypassRouteAlert(routeName, timeSaved, driverLanguage);
        speakText(bypassSpeech, driverLanguage);
        setLastDriverSpokenText(bypassSpeech);
      } catch {
        // voice fallback
      }
    },
    [routes, addNotification, driverLanguage]
  );

  // Scenario 2: Heavy Traffic
  const simulateHeavyTraffic = () => {
    const nextTraffic = traffic === 'heavy' ? 'severe' : 'heavy';
    setTraffic(nextTraffic);
    addNotification({
      targetRole: 'all',
      title: 'Traffic Intelligence Alert',
      message: 'Severe congestion detected on North Corridor Arterial. AI models recalculating ETA (+7 to +11 mins delay).',
      type: 'warning',
    });

    try {
      const trafficSpeech = buildTrafficVoiceAlert(
        {
          severity: nextTraffic,
          affectedRoad: 'KPHB Main Junction',
          expectedDelayMins: nextTraffic === 'severe' ? 11 : 8,
          alternativeRouteName: 'Alternative Route A (Bypass Flyover)',
          timeSavedMins: 9,
        },
        driverLanguage
      );
      speakText(trafficSpeech, driverLanguage);
      setLastDriverSpokenText(trafficSpeech);
    } catch {
      // voice fallback
    }
  };

  // Scenario 3: Rain
  const simulateRain = () => {
    setWeather({
      condition: 'Heavy Storm & Rain',
      temperatureC: 22,
      rainProbability: 92,
      windSpeedKmh: 24,
      description: 'Heavy precipitation causing reduced vehicle speeds and slick road surfaces across campus routes.',
    });
    addNotification({
      targetRole: 'all',
      title: 'Weather Advisory: Heavy Rain',
      message: 'High precipitation active. Vehicle speed restrictions applied; AI ETA adjusted for wet road conditions.',
      type: 'info',
    });

    try {
      const rainSpeech = buildWeatherHazardVoiceAlert('rain', driverLanguage);
      speakText(rainSpeech, driverLanguage);
      setLastDriverSpokenText(rainSpeech);
    } catch {
      // voice fallback
    }
  };

  // Scenario 4: Bus Delay
  const simulateBusDelay = (busId: string = 'bus-07', extraMins: number = 8) => {
    setBuses((prev) =>
      prev.map((b) =>
        b.id === busId
          ? {
              ...b,
              status: 'delayed',
              delayMinutes: extraMins,
              currentSpeed: 16,
            }
          : b
      )
    );
    addNotification({
      targetRole: 'student',
      title: 'Bus Delay Alert (+8m)',
      message: `⚠️ BUS-07 status set to Delayed. Added +${extraMins} minutes to ETA due to junction traffic.`,
      type: 'warning',
    });
  };

  // Scenario 9: Missed Stop
  const simulateMissedStop = () => {
    const missedSpeech = MULTILINGUAL_PHRASES[driverLanguage].missedStop('Stop 4 (Hitech Metro)');
    speakText(missedSpeech, driverLanguage);
    setLastDriverSpokenText(missedSpeech);
    setAnomalyAlerts((prev) => [
      {
        id: `anom-missed-${Date.now()}`,
        busId: studentAssignedBus.id,
        busNumber: studentAssignedBus.busNumber,
        type: 'missed-stop',
        severity: 'critical',
        message: '🔴 MISSED STOP: Stop 4 (Hitech Metro) was passed without passenger boarding completion.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        resolved: false,
      },
      ...prev,
    ]);
    addNotification({
      targetRole: 'admin',
      title: '🔴 MISSED STOP ALERT',
      message: `BUS-07 passed Stop 4 without dwell time completion. Driver notified via voice navigation.`,
      type: 'alert',
      actionType: 'MISSED_STOP',
    });
  };

  // Scenario 11/12/13: Bus Arrival at College
  const simulateBusArrival = (busId: string = 'bus-07') => {
    const nowTime = '08:56 AM';
    setBuses((prev) =>
      prev.map((b) =>
        b.id === busId
          ? {
              ...b,
              status: 'arrived',
              currentSpeed: 0,
              currentLocation: { lat: COLLEGE_CAMPUS.lat, lng: COLLEGE_CAMPUS.lng, address: 'College Campus Terminal' },
              distanceToNextStopKm: 0,
              lastUpdated: nowTime,
            }
          : b
      )
    );

    const newRecord: BusArrivalRecord = {
      id: `arr-${Date.now()}`,
      busNumber: 'BUS-07',
      routeCode: 'ROUTE-A',
      routeName: 'Route A — North Corridor',
      driverName: 'Ravi Kumar',
      tripType: 'Morning',
      status: 'ARRIVED',
      arrivalTime: nowTime,
      timestamp: `2026-09-08 ${nowTime}`,
      onTime: true,
    };

    setArrivalRecords((prev) => [newRecord, ...prev]);

    const collegeSpeech = MULTILINGUAL_PHRASES[driverLanguage].collegeReached;
    speakText(collegeSpeech, driverLanguage);
    setLastDriverSpokenText(collegeSpeech);

    addNotification({
      targetRole: 'all',
      title: '🟢 BUS-07 ARRIVED',
      message: `BUS-07 reached Apex College Campus Terminal at ${nowTime}. Status logged in Admin Arrival Board.`,
      type: 'success',
      actionType: 'ARRIVAL',
    });
  };

  // Reset entire system to fresh morning state
  const resetSimulation = () => {
    setActiveStudentBusId('bus-07');
    setBuses(INITIAL_BUSES);
    setRoutes(INITIAL_ROUTES);
    setWeather(INITIAL_WEATHER);
    setTraffic('heavy');
    setArrivalRecords(INITIAL_ARRIVAL_RECORDS);
    setAnomalyAlerts([]);
    setEmergencyReports([]);
    setRoadIssues([]);
    setIsStudentMissedBus(false);
    setIsStudentBoarded(false);
    lastAutoMissedBusRef.current = null;
    setIsMissedBusModalOpen(false);
    setDriverTripActive(false);
    setDriverTripStartTime(null);
    setSelectedBypassRouteId(null);
    setCurrentUser((prev) => {
      if (prev && prev.role === 'student') {
        return { ...prev, assignedBusId: 'bus-07', assignedStopId: 'stop-a3' };
      }
      return prev;
    });
    addNotification({
      targetRole: 'all',
      title: 'System Reset to Default',
      message: 'Fresh baseline morning operational status restored across all buses, routes, and AI predictors.',
      type: 'info',
    });
  };

  return (
    <TransportContext.Provider
      value={{
        users,
        currentUser,
        selectedRole,
        buses,
        routes,
        weather,
        traffic,
        arrivalRecords,
        notifications,
        anomalyAlerts,
        emergencyReports,
        roadIssues,
        studentJourney,
        missedBusAlternatives,
        isStudentMissedBus,
        isMissedBusModalOpen,
        setIsMissedBusModalOpen,
        isStudentBoarded,
        setIsStudentBoarded,
        activeStudentBusId,
        missedBusTriggerCount,
        driverTripActive,
        driverTripStartTime,
        driverLanguage,
        lastDriverSpokenText,
        simulationRunning,
        login,
        logout,
        registerStudent,
        registerDriver,
        approveDriver,
        rejectDriver,
        setSelectedRole: handleSetSelectedRole,
        setDriverLanguage: handleSetDriverLanguage,
        setLastDriverSpokenText,
        advanceDriverNextStop,
        setTraffic,
        startDriverTrip,
        endDriverTrip,
        markStudentMissedBus,
        dismissStudentMissedBus,
        selectAlternativeBus,
        updateStudentWalkingTime,
        reportEmergency,
        reportRoadIssue,
        markNotificationRead,
        markAllNotificationsRead,
        simulateBreakdown,
        simulateBusReplacement,
        simulateRouteChange,
        simulateHeavyTraffic,
        simulateRain,
        simulateBusDelay,
        simulateMissedStop,
        simulateBusArrival,
        resetSimulation,
        setSimulationRunning,
        selectedBypassRouteId,
        selectBypassRoute,
      }}
    >
      {children}
    </TransportContext.Provider>
  );
};

export const useTransport = (): TransportContextType => {
  const context = useContext(TransportContext);
  if (!context) {
    throw new Error('useTransport must be used within a TransportProvider');
  }
  return context;
};
