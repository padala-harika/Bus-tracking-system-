export type UserRole = 'student' | 'driver' | 'admin';

export type BusStatus = 'on-time' | 'delayed' | 'unavailable' | 'route-changed' | 'arrived' | 'on-route' | 'ON_ROUTE';
export type TripStatus = 'not-started' | 'active' | 'completed' | 'cancelled';
export type TrafficLevel = 'normal' | 'moderate' | 'heavy' | 'severe';
export type DelayLevel = 'on-time' | 'slight-delay' | 'significant-delay';

export interface LocationCoordinate {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

export interface Stop {
  id: string;
  name: string;
  order: number;
  lat: number;
  lng: number;
  scheduledTime: string; // e.g. "08:18 AM"
  geofenceRadiusMeters: number;
  isCompleted: boolean;
  reachedAt?: string;
  departedAt?: string;
  isTemporarilyUnavailable?: boolean;
  alternativeStopName?: string;
  alternativeStopLat?: number;
  alternativeStopLng?: number;
}

export interface DetourInfo {
  active: boolean;
  reason: string;
  affectedStopId: string;
  affectedStopName: string;
  alternativeStopId: string;
  alternativeStopName: string;
  alternativeStopLat: number;
  alternativeStopLng: number;
  detourPath: LocationCoordinate[];
  walkingAdjustmentMinutes?: number;
  busEtaAdjustmentMinutes?: number;
}

export interface Route {
  id: string;
  name: string;
  code: string; // e.g. "ROUTE-A"
  color: string;
  stops: Stop[];
  totalDistanceKm: number;
  baseDurationMins: number;
  isTemporarilyChanged?: boolean;
  temporaryChangeNotice?: string;
  activeCongestionSegments?: { fromStopId: string; toStopId: string; level: TrafficLevel }[];
  detourInfo?: DetourInfo;
}

export interface Bus {
  id: string;
  busNumber: string; // e.g. "BUS-07"
  registrationNumber: string;
  capacity: number;
  currentOccupancy: number;
  driverId: string;
  driverName: string;
  driverPhone: string;
  routeId: string;
  routeName: string;
  status: BusStatus;
  delayMinutes?: number; // e.g. 8
  currentSpeed: number; // km/h
  heading: number; // degrees
  currentLocation: LocationCoordinate;
  nextStopId: string;
  nextStopName: string;
  distanceToNextStopKm: number;
  routeProgress?: number; // 0 to 100 percentage of route traversed
  distanceToStudentStopKm?: number; // Distance to student's pickup stop in km
  etaToStudentStop?: string; // Synchronized ETA string
  isDwellingAtStop?: boolean; // True when bus is paused at a station boarding students
  dwellTicksRemaining?: number; // Remaining simulation ticks to pause at stop
  isReplacement?: boolean;
  originalBusId?: string;
  replacementBusId?: string;
  unavailableReason?: string;
  lastUpdated: string;
}

export interface User {
  id: string;
  identifier: string; // Roll number, Driver ID, or Admin Email
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  passwordHash: string; // Hashed credential
  assignedBusId?: string;
  assignedStopId?: string;
  preferredLanguage?: SupportedLanguage;
  walkingTimeMinutes?: number; // Configurable normal travel time to stop
  homeLocation?: LocationCoordinate;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  rollNumber?: string;
  driverId?: string;
  registeredAt?: string;
}

export interface StudentRegistrationData {
  name: string;
  rollNumber: string;
  email: string;
  password: string;
  stopId: string;
}

export interface DriverRegistrationData {
  name: string;
  driverId: string;
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  isPendingApproval?: boolean;
  isRejected?: boolean;
  message?: string;
  user?: User;
}

export type SupportedLanguage = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml';

export interface WeatherCondition {
  condition: string; // "Clear" | "Rain" | "Heavy Rain" | "Foggy"
  temperatureC: number;
  rainProbability: number; // 0 - 100
  windSpeedKmh: number;
  description: string;
}

export interface JourneyPrediction {
  busId: string;
  busNumber: string;
  studentStopId: string;
  studentStopName: string;
  scheduledBusArrivalTime: string;
  predictedBusArrivalTime: string;
  predictedCollegeArrivalTime: string;
  recommendedLeaveHomeTime: string;
  walkingDurationMinutes: number;
  safetyBufferMinutes: number;
  expectedDelayMinutes: number;
  delayStatus: DelayLevel;
  trafficCondition: TrafficLevel;
  weatherCondition: WeatherCondition;
  explanation: string;
  aiConfidenceScore: number;
  isDetourActive?: boolean;
  detourNotice?: string;
  temporaryStopName?: string;
}

export interface MissedBusAlternative {
  busId: string;
  busNumber: string;
  routeId: string;
  routeName: string;
  driverName: string;
  stopArrivalTime: string;
  collegeArrivalTime: string;
  delayMinutes: number;
  availableSeats: number;
  compatibilityScore: number; // 0 - 100
  isRecommended: boolean;
  recommendationReason: string;
}

export interface BusArrivalRecord {
  id: string;
  busNumber: string;
  routeCode: string;
  routeName: string;
  driverName: string;
  tripType: string; // "Morning" | "Evening"
  status: 'ARRIVED' | 'ON_ROUTE' | 'DELAYED';
  arrivalTime?: string;
  timestamp: string;
  onTime: boolean;
}

export interface NotificationItem {
  id: string;
  targetRole: UserRole | 'all';
  targetUserId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  timestamp: string;
  read: boolean;
  actionType?: 'BUS_CHANGE' | 'ROUTE_CHANGE' | 'EMERGENCY' | 'MISSED_STOP' | 'ARRIVAL';
  metadata?: any;
}

export interface AnomalyAlert {
  id: string;
  busId: string;
  busNumber: string;
  type: 'unexpected-stop' | 'route-deviation' | 'excessive-delay' | 'slow-speed' | 'missed-stop' | 'overcapacity';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
  location?: LocationCoordinate;
  resolved: boolean;
}

export interface EmergencyReport {
  id: string;
  busId: string;
  busNumber: string;
  driverId: string;
  driverName: string;
  type: 'SOS' | 'Breakdown' | 'Accident' | 'Mechanical' | 'Road Blocked';
  location: LocationCoordinate;
  timestamp: string;
  status: 'active' | 'dispatched' | 'resolved';
  notes?: string;
}

export interface RoadIssue {
  id: string;
  busId: string;
  driverId: string;
  driverName: string;
  issueType: 'road-blocked' | 'construction' | 'accident' | 'traffic-jam' | 'flooded' | 'temporary-closure';
  location: LocationCoordinate;
  reportedAt: string;
  active: boolean;
}

export interface RouteRecommendation {
  id: string;
  title: string;
  currentRouteDurationMins: number;
  alternativeRouteName: string;
  alternativeDurationMins: number;
  timeSavedMins: number;
  isAiRecommended: boolean;
  reason: string;
}

export interface PassengerDemand {
  routeId: string;
  routeName: string;
  busCapacity: number;
  expectedPassengers: number;
  utilizationRate: number; // percentage
  overcapacityRisk: boolean;
  recommendation: string;
  hourlyTrends: { hour: string; count: number }[];
}
