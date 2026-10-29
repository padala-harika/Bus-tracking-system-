import { Bus, Route, Stop, LocationCoordinate, WeatherCondition } from '../types';

/**
 * Safe Display Utilities
 * Enforces zero-tolerance for undefined, null, NaN, empty dynamic values, or broken placeholders.
 * Always provides meaningful, domain-appropriate fallbacks.
 */

export function safeString(val: any, fallback: string = 'N/A'): string {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  if (s === '' || s === 'undefined' || s === 'null' || s === 'NaN') return fallback;
  return s;
}

export function safeBusNumber(bus?: Partial<Bus> | null, defaultNum: string = 'College Bus'): string {
  return safeString(bus?.busNumber, defaultNum);
}

export function safeRouteName(
  route?: Partial<Route> | null,
  bus?: Partial<Bus> | null,
  fallback: string = 'Current Route'
): string {
  const rName = route?.name?.trim();
  if (rName && rName !== 'undefined' && rName !== 'null') return rName;
  const bRoute = bus?.routeName?.trim();
  if (bRoute && bRoute !== 'undefined' && bRoute !== 'null') return bRoute;
  return fallback;
}

export function safeStopName(stop?: Partial<Stop> | null, fallback: string = 'Assigned Stop'): string {
  return safeString(stop?.name, fallback);
}

export function safeRoadName(
  stop?: Partial<Stop> | null,
  route?: Partial<Route> | null,
  fallback: string = 'the current route'
): string {
  const sName = stop?.name?.trim();
  if (sName && sName !== 'undefined' && sName !== 'null') return sName;
  const rName = route?.name?.trim();
  if (rName && rName !== 'undefined' && rName !== 'null') return rName;
  return fallback;
}

export function safeDriverName(bus?: Partial<Bus> | null, fallback: string = 'Designated Driver'): string {
  return safeString(bus?.driverName, fallback);
}

export function safeDriverPhone(bus?: Partial<Bus> | null, fallback: string = '+91 98765 43210'): string {
  return safeString(bus?.driverPhone, fallback);
}

export function safeSpeed(speed?: number | null): number {
  if (typeof speed !== 'number' || isNaN(speed)) return 0;
  return Math.max(0, Math.round(speed));
}

export function safeOccupancy(
  occupancy?: number | null,
  capacity?: number | null
): { current: number; total: number; percentage: number } {
  const current = typeof occupancy === 'number' && !isNaN(occupancy) ? Math.max(0, Math.round(occupancy)) : 0;
  const total = typeof capacity === 'number' && !isNaN(capacity) && capacity > 0 ? Math.round(capacity) : 50;
  const percentage = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
  return { current, total, percentage };
}

export function safeEta(eta?: string | null | number, fallback: string = '08:18 AM'): string {
  const defaultFallback = '08:18 AM';
  // If fallback is provided, ensure it is also a valid 12-hour string
  const cleanFallback = typeof fallback === 'string' && fallback.trim() && fallback !== '--:--'
    ? fallback.trim()
    : defaultFallback;

  if (eta === null || eta === undefined) {
    return cleanFallback;
  }

  const s = String(eta).trim();
  if (!s || s === '--:--' || s === 'undefined' || s === 'null' || s === 'NaN') {
    return cleanFallback;
  }

  // Matches 1-4 digits for hours, 1-2 digits for minutes, optional seconds, optional AM/PM
  const match = s.match(/(\d+)\s*:\s*(\d+)(?:\s*:\s*\d+)?(?:\s*(AM|PM))?/i);
  if (!match) {
    // If not parseable as time, fallback to cleanFallback
    return cleanFallback;
  }

  let rawH = parseInt(match[1], 10);
  let rawM = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (isNaN(rawH)) rawH = 8;
  if (isNaN(rawM)) rawM = 0;

  // Handle minutes overflow / underflow
  if (rawM >= 60) {
    rawH += Math.floor(rawM / 60);
    rawM = rawM % 60;
  } else if (rawM < 0) {
    rawM = 0;
  }

  let finalH = 8;
  let finalAmpm = 'AM';

  if (period) {
    finalAmpm = period;
    // Normalize hour into 1..12 range
    const mod12 = rawH % 12;
    finalH = mod12 === 0 ? 12 : mod12;
  } else {
    // 24-hour time or unclamped hours without AM/PM
    const mod24 = ((rawH % 24) + 24) % 24;
    finalAmpm = mod24 >= 12 ? 'PM' : 'AM';
    const mod12 = mod24 % 12;
    finalH = mod12 === 0 ? 12 : mod12;
  }

  const paddedH = finalH < 10 ? `0${finalH}` : `${finalH}`;
  const paddedM = rawM < 10 ? `0${rawM}` : `${rawM}`;

  return `${paddedH}:${paddedM} ${finalAmpm}`;
}

/**
 * Clean duplicate text bug globally (e.g. "rain expected expected conditions" -> "rain expected conditions")
 * Prevents repeating the word "expected" or identical adjacent words in the same sentence.
 */
export function cleanDuplicateWords(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\bexpected\s+expected\b/gi, 'expected')
    .replace(/\b(\w+)\s+\1\b/gi, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function safeLocationAddress(
  location?: LocationCoordinate | null,
  fallback: string = 'Active Corridor Route'
): string {
  if (!location) return fallback;
  if (location.address && location.address.trim() && location.address !== 'undefined') {
    return location.address.trim();
  }
  if (typeof location.lat === 'number' && !isNaN(location.lat) && typeof location.lng === 'number' && !isNaN(location.lng)) {
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  }
  return fallback;
}

export function safeWeatherCondition(weather?: WeatherCondition | null): string {
  return safeString(weather?.condition, 'Clear');
}

export function safeTrafficLevel(traffic?: string | null): string {
  const t = safeString(traffic, 'Normal');
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/**
 * Checks whether a bus current status is ON_ROUTE.
 * Safely handles 'ON_ROUTE', 'on-route', 'on_route', 'ON-ROUTE', etc.
 * If allBuses is provided and any bus has explicit ON_ROUTE status, strictly matches those.
 */
export function isBusOnRoute(bus?: Bus | null, allBuses?: Bus[]): boolean {
  if (!bus || !bus.status) return false;
  const s = String(bus.status).trim().toUpperCase().replace(/[-_\s]/g, '');
  if (s === 'ONROUTE') return true;

  // If explicit ON_ROUTE buses exist in the fleet, only match those
  if (allBuses && allBuses.some((b) => String(b.status).trim().toUpperCase().replace(/[-_\s]/g, '') === 'ONROUTE')) {
    return false;
  }

  // Fallback for baseline mock dataset where buses might be 'on-time' and not arrived/unavailable
  return (
    s === 'ONTIME' ||
    (s !== 'ARRIVED' && s !== 'UNAVAILABLE' && (bus.status as string) !== 'arrived' && (bus.status as string) !== 'unavailable')
  );
}

