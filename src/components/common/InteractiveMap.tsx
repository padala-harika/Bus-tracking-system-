import React, { useState, useMemo, useEffect } from 'react';
import { Bus, Route, Stop, LocationCoordinate, JourneyPrediction } from '../../types';
import { COLLEGE_CAMPUS } from '../../data/mockDatabase';
import {
  Navigation,
  School,
  MapPin,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  User as UserIcon,
  ShieldAlert,
  Clock,
  Gauge,
  Info,
  Phone,
  Crosshair,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  Sparkles,
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
  isBusOnRoute,
} from '../../utils/safeDisplay';

interface InteractiveMapProps {
  buses: Bus[];
  routes: Route[];
  selectedBusId?: string;
  selectedRouteId?: string;
  onSelectBus?: (busId: string) => void;
  highlightedStopId?: string;
  focusedStopId?: string;
  studentHomeLocation?: LocationCoordinate;
  height?: string;
  showTrafficOverlay?: boolean;
  studentJourney?: JourneyPrediction | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  filterMode?: 'all' | 'active' | 'my-bus';
  onFilterModeChange?: (mode: 'all' | 'active' | 'my-bus') => void;
}

// Bounding box for the college transit area
const BOUNDS = {
  minLat: 17.385,
  maxLat: 17.515,
  minLng: 78.335,
  maxLng: 78.455,
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  buses,
  routes,
  selectedBusId,
  selectedRouteId,
  onSelectBus,
  highlightedStopId,
  focusedStopId,
  studentHomeLocation,
  height = '420px',
  showTrafficOverlay = true,
  studentJourney,
  isExpanded: externalIsExpanded,
  onToggleExpand,
  filterMode: externalFilterMode,
  onFilterModeChange,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [activePopup, setActivePopup] = useState<{
    type: 'bus' | 'stop' | 'college' | 'home';
    data: any;
    x: number;
    y: number;
  } | null>(null);
  const [internalFilterMode, setInternalFilterMode] = useState<'all' | 'active' | 'my-bus'>('all');
  const [showHudOnMobile, setShowHudOnMobile] = useState(true);

  const activeFilterMode = externalFilterMode !== undefined ? externalFilterMode : internalFilterMode;

  const handleFilterModeChange = (mode: 'all' | 'active' | 'my-bus') => {
    if (externalFilterMode === undefined) {
      setInternalFilterMode(mode);
    }
    if (onFilterModeChange) {
      onFilterModeChange(mode);
    }
  };

  const isFullScreen = externalIsExpanded !== undefined ? externalIsExpanded : internalExpanded;

  const handleToggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  // Keyboard shortcut Esc to exit full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        handleToggleExpand();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Convert GPS (lat, lng) to SVG pixel coordinate (width: 1000, height: 750)
  const project = useMemo(() => {
    return (lat: number, lng: number) => {
      const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 1000;
      // Invert lat because SVG y goes downwards
      const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 750;
      return { x, y };
    };
  }, []);

  // Filtered buses
  const filteredBuses = useMemo(() => {
    if (activeFilterMode === 'my-bus' && selectedBusId) {
      return buses.filter((b) => b.id === selectedBusId);
    }
    if (activeFilterMode === 'active') {
      return buses.filter((b) => isBusOnRoute(b, buses));
    }
    return buses;
  }, [buses, activeFilterMode, selectedBusId]);

  // Selected bus details
  const selectedBus = useMemo(() => {
    return buses.find((b) => b.id === selectedBusId) || buses[0];
  }, [buses, selectedBusId]);

  // Selected bus route
  const selectedRoute = useMemo(() => {
    if (selectedRouteId) {
      const matched = routes.find((r) => r.id === selectedRouteId || r.code === selectedRouteId);
      if (matched) return matched;
    }
    return routes.find((r) => r.id === selectedBus?.routeId) || routes[0];
  }, [routes, selectedBus, selectedRouteId]);

  // College coordinates in SVG
  const collegePos = useMemo(() => project(COLLEGE_CAMPUS.lat, COLLEGE_CAMPUS.lng), [project]);

  // Student home coordinates in SVG
  const studentHomePos = useMemo(() => {
    return studentHomeLocation ? project(studentHomeLocation.lat, studentHomeLocation.lng) : null;
  }, [studentHomeLocation, project]);

  // Center view on the selected bus
  const centerOnBus = (busToCenter = selectedBus) => {
    if (!busToCenter || !busToCenter.currentLocation) return;
    const pos = project(busToCenter.currentLocation.lat, busToCenter.currentLocation.lng);
    setPan({
      x: (500 - pos.x) * zoom,
      y: (375 - pos.y) * zoom,
    });
  };

  // Automatically focus on selected bus whenever selectedBusId or route changes
  useEffect(() => {
    if (selectedBusId) {
      const targetBus = buses.find((b) => b.id === selectedBusId);
      if (targetBus) {
        centerOnBus(targetBus);
      }
    }
  }, [selectedBusId, selectedBus?.routeId, selectedRoute?.id]);

  // Automatically focus/center on a stop when focusedStopId changes
  useEffect(() => {
    if (focusedStopId) {
      let targetStop: Stop | undefined;
      let targetRoute: Route | undefined;
      for (const route of routes) {
        targetStop = route.stops.find((s) => s.id === focusedStopId);
        if (targetStop) {
          targetRoute = route;
          break;
        }
      }
      if (targetStop) {
        const stopLat = targetStop.isTemporarilyUnavailable && targetStop.alternativeStopLat ? targetStop.alternativeStopLat : targetStop.lat;
        const stopLng = targetStop.isTemporarilyUnavailable && targetStop.alternativeStopLng ? targetStop.alternativeStopLng : targetStop.lng;
        const pos = project(stopLat, stopLng);
        setPan({
          x: (500 - pos.x) * zoom,
          y: (375 - pos.y) * zoom,
        });

        const stopIdx = targetRoute ? targetRoute.stops.findIndex((s) => s.id === targetStop!.id) : 0;
        const isNextStop = selectedBus ? targetStop.id === selectedBus.nextStopId : false;
        setActivePopup({
          type: 'stop',
          data: {
            stop: targetStop,
            routeName: targetRoute?.name || 'Assigned Route',
            stopOrder: stopIdx + 1,
            isClosed: targetStop.isTemporarilyUnavailable,
            alternativeStopName: targetStop.alternativeStopName,
            isNextStop,
          },
          x: pos.x,
          y: pos.y,
        });
      }
    }
  }, [focusedStopId, zoom, project, routes, selectedBus]);

  // Safe occupancy values
  const occupancyStats = safeOccupancy(selectedBus?.currentOccupancy, selectedBus?.capacity);

  // Student stop object
  const studentStop = useMemo(() => {
    if (!highlightedStopId || !selectedRoute) return null;
    return selectedRoute.stops.find((s) => s.id === highlightedStopId) || null;
  }, [selectedRoute, highlightedStopId]);

  // Calculate distance to student stop if available
  const distanceToStudentStop = useMemo(() => {
    if (selectedBus?.distanceToStudentStopKm !== undefined) {
      return `${selectedBus.distanceToStudentStopKm} km`;
    }
    if (studentStop && selectedBus && selectedBus.currentLocation) {
      const dist =
        Math.round(
          Math.hypot(
            (studentStop.lat - selectedBus.currentLocation.lat) * 111,
            (studentStop.lng - selectedBus.currentLocation.lng) * 111
          ) * 10
        ) / 10;
      return `${Math.max(0.1, dist)} km`;
    }
    return `${selectedBus?.distanceToNextStopKm || 1.2} km`;
  }, [selectedBus, studentStop]);

  return (
    <div
      id="live-gps-tracking-container"
      className={`relative overflow-hidden bg-slate-950 shadow-md transition-all ${
        isFullScreen
          ? 'fixed inset-0 z-50 h-screen w-screen flex flex-col md:flex-row'
          : 'w-full rounded-2xl border border-slate-200'
      }`}
      style={{ height: isFullScreen ? '100vh' : height }}
    >
      {/* Main Map View Area */}
      <div className="relative flex-1 h-full overflow-hidden flex flex-col">
        {/* Top Floating Control Bar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Left: Filter Pills & Status */}
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-slate-900/90 p-1 backdrop-blur-md border border-slate-700/70 shadow-lg text-xs">
            <button
              id="map-filter-all"
              onClick={() => handleFilterModeChange('all')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                activeFilterMode === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              All Buses ({buses.length})
            </button>
            <button
              id="map-filter-active"
              onClick={() => handleFilterModeChange('active')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                activeFilterMode === 'active' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              On Route ({buses.filter((b) => isBusOnRoute(b, buses)).length})
            </button>
            {selectedBusId && (
              <button
                id="map-filter-mybus"
                onClick={() => {
                  handleFilterModeChange('my-bus');
                  centerOnBus();
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeFilterMode === 'my-bus'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-amber-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>⭐</span> Focus {safeBusNumber(selectedBus)}
              </button>
            )}
          </div>

          {/* Right: Map Navigation Controls */}
          <div className="pointer-events-auto flex items-center gap-1 rounded-xl bg-slate-900/90 p-1 backdrop-blur-md border border-slate-700/70 shadow-lg">
            <button
              id="map-zoom-in"
              onClick={() => setZoom((z) => Math.min(2.8, z + 0.25))}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              id="map-zoom-out"
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.25))}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              id="map-center-bus"
              onClick={() => centerOnBus()}
              className="p-1.5 text-amber-400 hover:text-amber-300 rounded-lg hover:bg-slate-800 transition-colors"
              title="Center On My Bus"
            >
              <Crosshair className="w-4 h-4" />
            </button>
            <button
              id="map-reset-view"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Reset Map Orientation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-0.5" />
            <button
              id="map-toggle-fullscreen"
              onClick={handleToggleExpand}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isFullScreen
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
              title={isFullScreen ? 'Exit Large Map (Esc)' : 'Expand Large Live Tracking View'}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit Large View</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Expand Live Map</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time GPS Pulse Indicator */}
        <div className="absolute top-16 left-3 z-10 pointer-events-none">
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 px-2.5 py-1 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-emerald-400 font-semibold">GPS Active</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">2.5s update</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono">{safeEta(selectedBus?.lastUpdated, '08:15 AM')}</span>
          </div>
        </div>

        {/* SVG Live Canvas */}
        <svg
          id="live-gps-svg-canvas"
          viewBox="0 0 1000 750"
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          onClick={() => setActivePopup(null)}
        >
          <defs>
            {/* Subtle grid pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>

            {/* Glowing radial gradients */}
            <radialGradient id="campusGlow">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="myStopGlow">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="busSelectionGlow">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Map Background with dark cartographic styling */}
          <rect width="1000" height="750" fill="#0B132B" />
          <rect width="1000" height="750" fill="url(#grid)" />

          {/* City Arterial Road Networks */}
          <g opacity="0.16" stroke="#64748B" strokeWidth="2.5" fill="none">
            <path d="M 100 160 L 360 320 L 700 520 L 920 600" />
            <path d="M 70 460 L 300 400 L 620 410 L 870 300" />
            <path d="M 260 60 L 330 260 L 390 470 L 500 660" />
            <path d="M 660 70 L 610 290 L 560 500 L 540 680" />
          </g>

          {/* Dynamic Transform Group for Pan and Zoom */}
          <g
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '500px 375px',
              transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            {/* Configured Bus Routes Polylines */}
            {routes.map((route) => {
              const points = route.stops.map((s) => {
                const p = project(s.lat, s.lng);
                return `${p.x},${p.y}`;
              });
              const pathData = `M ${points.join(' L ')}`;
              const isAssignedRoute = route.id === selectedRoute?.id;

              return (
                <g key={route.id} id={`route-poly-${route.id}`}>
                  {/* Soft ambient glow underlying route */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={route.color}
                    strokeWidth={isAssignedRoute ? '12' : '6'}
                    strokeOpacity={isAssignedRoute ? '0.22' : '0.1'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Solid colored route polyline */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={route.color}
                    strokeWidth={isAssignedRoute ? '4' : '2.5'}
                    strokeDasharray={route.isTemporarilyChanged ? '6 4' : 'none'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Route Starting Point Flag / Badge */}
                  {route.stops.length > 0 && (
                    <g key={`route-start-${route.id}`}>
                      {(() => {
                        const startPt = project(route.stops[0].lat, route.stops[0].lng);
                        return (
                          <g>
                            <circle
                              cx={startPt.x}
                              cy={startPt.y}
                              r={isAssignedRoute ? '7' : '5'}
                              fill="#10B981"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                            />
                            {isAssignedRoute && (
                              <text
                                x={startPt.x}
                                y={startPt.y - 12}
                                textAnchor="middle"
                                fill="#34D399"
                                fontSize="10"
                                fontWeight="800"
                                className="drop-shadow"
                              >
                                ● Start: {safeStopName(route.stops[0])}
                              </text>
                            )}
                          </g>
                        );
                      })()}
                    </g>
                  )}

                  {/* Traffic Congestion Highlight on Corridor */}
                  {showTrafficOverlay && route.id === 'route-a' && route.stops.length >= 3 && !route.isTemporarilyChanged && (
                    <path
                      d={`M ${project(route.stops[1].lat, route.stops[1].lng).x},${
                        project(route.stops[1].lat, route.stops[1].lng).y
                      } L ${project(route.stops[2].lat, route.stops[2].lng).x},${
                        project(route.stops[2].lat, route.stops[2].lng).y
                      }`}
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="5"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                  )}

                  {/* Active Detour Bypass Polyline & Road Closed Blockade */}
                  {route.isTemporarilyChanged && (
                    <g key={`detour-layer-${route.id}`} id={`detour-layer-${route.id}`}>
                      {/* Closed Corridor Hazard Segment */}
                      {route.stops.length >= 4 && (() => {
                        const s1 = route.stops[1]; // KPHB Colony
                        const s2 = route.stops[2]; // Main Road (Closed)
                        const s3 = route.stops[3]; // Hitech Metro
                        const p1 = project(s1.lat, s1.lng);
                        const p2 = project(s2.lat, s2.lng);
                        const p3 = project(s3.lat, s3.lng);

                        return (
                          <g id="closed-road-hazard">
                            {/* Red glow behind closed segment */}
                            <path
                              d={`M ${p1.x},${p1.y} L ${p2.x},${p2.y} L ${p3.x},${p3.y}`}
                              fill="none"
                              stroke="#EF4444"
                              strokeWidth="8"
                              strokeOpacity="0.4"
                              strokeLinecap="round"
                            />
                            {/* Red dashed line */}
                            <path
                              d={`M ${p1.x},${p1.y} L ${p2.x},${p2.y} L ${p3.x},${p3.y}`}
                              fill="none"
                              stroke="#EF4444"
                              strokeWidth="4"
                              strokeDasharray="5 5"
                              strokeLinecap="round"
                            />
                            {/* Road Closed Hazard Badge */}
                            <rect
                              x={p2.x - 76}
                              y={p2.y - 30}
                              width="152"
                              height="20"
                              rx="5"
                              fill="#7F1D1D"
                              stroke="#EF4444"
                              strokeWidth="1.5"
                            />
                            <text
                              x={p2.x}
                              y={p2.y - 16}
                              textAnchor="middle"
                              fill="#FEE2E2"
                              fontSize="9"
                              fontWeight="900"
                              className="pointer-events-none"
                            >
                              ⛔ ROAD CLOSED (FLYOVER WORK)
                            </text>
                          </g>
                        );
                      })()}

                      {/* Detour Polyline (Service Road Bypass) */}
                      {(() => {
                        const detourPathCoords = route.detourInfo?.detourPath || [
                          { lat: 17.4840, lng: 78.3960 },
                          { lat: 17.4785, lng: 78.3910 },
                          { lat: 17.4695, lng: 78.3818 },
                          { lat: 17.4635, lng: 78.3795 },
                          { lat: 17.4580, lng: 78.3780 },
                        ];
                        const pts = detourPathCoords.map((c) => {
                          const p = project(c.lat, c.lng);
                          return `${p.x},${p.y}`;
                        });
                        const detourD = `M ${pts.join(' L ')}`;
                        const midP = project(17.4740, 78.3860);

                        return (
                          <g id="detour-bypass-polyline">
                            {/* Ambient amber glow */}
                            <path
                              d={detourD}
                              fill="none"
                              stroke="#F59E0B"
                              strokeWidth="12"
                              strokeOpacity="0.25"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {/* High-visibility dashed bypass line */}
                            <path
                              d={detourD}
                              fill="none"
                              stroke="#F59E0B"
                              strokeWidth="4.5"
                              strokeDasharray="8 5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {/* Detour Highway Marker Badge */}
                            <rect
                              x={midP.x - 72}
                              y={midP.y - 11}
                              width="144"
                              height="22"
                              rx="6"
                              fill="#78350F"
                              stroke="#F59E0B"
                              strokeWidth="1.5"
                            />
                            <text
                              x={midP.x}
                              y={midP.y + 4}
                              textAnchor="middle"
                              fill="#FEF3C7"
                              fontSize="9.5"
                              fontWeight="900"
                              letterSpacing="0.5"
                              className="pointer-events-none"
                            >
                              🚧 DETOUR: SERVICE ROAD
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Walking Path from Student Home to Assigned Stop */}
            {studentHomePos && highlightedStopId && (
              <g id="student-walking-corridor">
                {routes.map((r) =>
                  r.stops
                    .filter((s) => s.id === highlightedStopId)
                    .map((stop) => {
                      const isClosed = stop.isTemporarilyUnavailable;
                      const targetLat = (isClosed && stop.alternativeStopLat) || stop.lat;
                      const targetLng = (isClosed && stop.alternativeStopLng) || stop.lng;
                      const stopPos = project(targetLat, targetLng);
                      return (
                        <g key="home-to-stop">
                          <line
                            x1={studentHomePos.x}
                            y1={studentHomePos.y}
                            x2={stopPos.x}
                            y2={stopPos.y}
                            stroke="#F59E0B"
                            strokeWidth="2.5"
                            strokeDasharray="5 4"
                          />
                          {/* Home Landmark Marker */}
                          <circle cx={studentHomePos.x} cy={studentHomePos.y} r="12" fill="#F59E0B" opacity="0.3" />
                          <circle cx={studentHomePos.x} cy={studentHomePos.y} r="6" fill="#F59E0B" />
                          <text
                            x={studentHomePos.x}
                            y={studentHomePos.y - 14}
                            textAnchor="middle"
                            fill="#FCD34D"
                            fontSize="11"
                            fontWeight="800"
                            className="drop-shadow"
                          >
                            🏠 Student Home
                          </text>
                          {isClosed && (
                            <text
                              x={(studentHomePos.x + stopPos.x) / 2}
                              y={(studentHomePos.y + stopPos.y) / 2 - 8}
                              textAnchor="middle"
                              fill="#F59E0B"
                              fontSize="9.5"
                              fontWeight="800"
                              className="drop-shadow"
                            >
                              🚶 Walk to Temporary Stop (~9m)
                            </text>
                          )}
                        </g>
                      );
                    })
                )}
              </g>
            )}

            {/* Configured Bus Stops Markers */}
            {routes.map((route) =>
              route.stops.map((stop, idx) => {
                const pos = project(stop.lat, stop.lng);
                const isHighlighted = stop.id === highlightedStopId;
                const isCollege = stop.id.includes('college');

                if (isCollege) return null; // Rendered as dedicated landmark below

                // Special rendering for temporarily closed stops & alternative detour stops
                if (stop.isTemporarilyUnavailable) {
                  const altLat = stop.alternativeStopLat || 17.4695;
                  const altLng = stop.alternativeStopLng || 78.3818;
                  const altPos = project(altLat, altLng);

                  return (
                    <g key={stop.id} id={`stop-marker-closed-group-${stop.id}`}>
                      {/* Closed Stop Marker */}
                      <g
                        id={`stop-marker-closed-${stop.id}`}
                        className="cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePopup({
                            type: 'stop',
                            data: {
                              stop,
                              routeName: route.name,
                              stopOrder: idx + 1,
                              isClosed: true,
                              closedReason: 'Major Flyover Construction & Drain Maintenance',
                              alternativeStopName: stop.alternativeStopName,
                            },
                            x: pos.x,
                            y: pos.y,
                          });
                        }}
                      >
                        {/* Red hazard zone */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="22"
                          fill="#EF4444"
                          fillOpacity="0.15"
                          stroke="#EF4444"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="7"
                          fill="#EF4444"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                        <text
                          x={pos.x}
                          y={pos.y + 3}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="9"
                          fontWeight="900"
                          className="pointer-events-none"
                        >
                          ✕
                        </text>
                        <text
                          x={pos.x}
                          y={pos.y + 18}
                          textAnchor="middle"
                          fill="#F87171"
                          fontSize="10"
                          fontWeight="800"
                          textDecoration="line-through"
                          className="pointer-events-none drop-shadow"
                        >
                          {safeStopName(stop)}
                        </text>
                        <text
                          x={pos.x}
                          y={pos.y + 30}
                          textAnchor="middle"
                          fill="#EF4444"
                          fontSize="8.5"
                          fontWeight="900"
                          className="pointer-events-none"
                        >
                          ⛔ STOP CLOSED
                        </text>
                      </g>

                      {/* Dedicated Temporary Detour Stop Marker */}
                      <g
                        id="temporary-detour-stop-marker"
                        className="cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePopup({
                            type: 'stop',
                            data: {
                              stop: {
                                id: 'temp-stop-detour',
                                name: stop.alternativeStopName || 'Main Road Junction (Temporary Detour Stop)',
                                scheduledTime: '08:20 AM',
                                geofenceRadiusMeters: 150,
                                isCompleted: false,
                              },
                              routeName: route.name,
                              isTemporaryAlternative: true,
                              originalStopName: stop.name,
                              closedReason: 'Flyover Construction Detour',
                            },
                            x: altPos.x,
                            y: altPos.y,
                          });
                        }}
                      >
                        {/* Glowing beacon */}
                        <circle cx={altPos.x} cy={altPos.y} r="30" fill="url(#myStopGlow)" />
                        <circle
                          cx={altPos.x}
                          cy={altPos.y}
                          r="30"
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="2.5"
                          strokeDasharray="4 4"
                          className="animate-pulse"
                        />
                        {/* Center Pin */}
                        <circle cx={altPos.x} cy={altPos.y} r="8" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2.5" />
                        <text
                          x={altPos.x}
                          y={altPos.y + 3.5}
                          textAnchor="middle"
                          fill="#0F172A"
                          fontSize="8.5"
                          fontWeight="900"
                          className="pointer-events-none"
                        >
                          🚏
                        </text>
                        {/* Text Label */}
                        <text
                          x={altPos.x}
                          y={altPos.y + 19}
                          textAnchor="middle"
                          fill="#FCD34D"
                          fontSize="11"
                          fontWeight="900"
                          className="pointer-events-none drop-shadow"
                        >
                          🚏 {stop.alternativeStopName || 'Main Road Junction (150m ahead)'}
                        </text>
                        <text
                          x={altPos.x}
                          y={altPos.y + 31}
                          textAnchor="middle"
                          fill="#F59E0B"
                          fontSize="8.5"
                          fontWeight="800"
                          className="pointer-events-none"
                        >
                          ★ TEMPORARY BOARDING STOP
                        </text>
                      </g>
                    </g>
                  );
                }

                return (
                  <g
                    key={stop.id}
                    id={`stop-marker-${stop.id}`}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePopup({
                        type: 'stop',
                        data: { stop, routeName: route.name, stopOrder: idx + 1 },
                        x: pos.x,
                        y: pos.y,
                      });
                    }}
                  >
                    {/* Geofence circular zone (150m representation) */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isHighlighted ? '28' : '20'}
                      fill={isHighlighted ? 'url(#myStopGlow)' : 'none'}
                      stroke={isHighlighted ? '#F59E0B' : route.color}
                      strokeWidth={isHighlighted ? '2' : '1.2'}
                      strokeOpacity={isHighlighted ? 0.9 : 0.3}
                      strokeDasharray={isHighlighted ? '3 3' : 'none'}
                    />

                    {/* Stop Center Dot */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isHighlighted ? '7' : '5'}
                      fill={isHighlighted ? '#F59E0B' : '#0B132B'}
                      stroke={isHighlighted ? '#FFFFFF' : route.color}
                      strokeWidth={isHighlighted ? '3' : '2'}
                    />

                    {/* Stop Order / Number */}
                    <text
                      x={pos.x}
                      y={pos.y + 3}
                      textAnchor="middle"
                      fill={isHighlighted ? '#0F172A' : '#94A3B8'}
                      fontSize="8"
                      fontWeight="900"
                      className="pointer-events-none"
                    >
                      {idx + 1}
                    </text>

                    {/* Stop Label */}
                    <text
                      x={pos.x}
                      y={pos.y + 18}
                      textAnchor="middle"
                      fill={isHighlighted ? '#FCD34D' : '#94A3B8'}
                      fontSize={isHighlighted ? '11' : '9.5'}
                      fontWeight={isHighlighted ? '800' : '500'}
                      className="pointer-events-none drop-shadow-md"
                    >
                      {isHighlighted ? '🚏 ' : ''}
                      {safeStopName(stop).replace(' (Student Stop)', '')}
                    </text>
                  </g>
                );
              })
            )}

            {/* Apex College Campus Terminal Landmark */}
            <g
              id="college-campus-landmark"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setActivePopup({
                  type: 'college',
                  data: COLLEGE_CAMPUS,
                  x: collegePos.x,
                  y: collegePos.y,
                });
              }}
            >
              {/* College Geofence Zone (250m) */}
              <circle cx={collegePos.x} cy={collegePos.y} r="50" fill="url(#campusGlow)" />
              <circle
                cx={collegePos.x}
                cy={collegePos.y}
                r="50"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                opacity="0.8"
              />

              {/* Central College Emblem */}
              <circle cx={collegePos.x} cy={collegePos.y} r="18" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="3" />
              <text
                x={collegePos.x}
                y={collegePos.y + 6}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="14"
                className="pointer-events-none font-bold"
              >
                🎓
              </text>
              <text
                x={collegePos.x}
                y={collegePos.y + 34}
                textAnchor="middle"
                fill="#93C5FD"
                fontSize="11.5"
                fontWeight="900"
                className="pointer-events-none drop-shadow"
              >
                APEX COLLEGE CAMPUS TERMINAL
              </text>
            </g>

            {/* Live Traveling Bus Markers */}
            {filteredBuses.map((bus) => {
              const pos = project(bus.currentLocation.lat, bus.currentLocation.lng);
              const isSelected = bus.id === selectedBusId;

              // Distinct status colors
              let statusColor = '#10B981'; // 🟢 On Time (emerald)
              let statusLabel = 'On Time';
              if (bus.status === 'delayed') {
                statusColor = '#F59E0B'; // 🟡 Delayed (amber)
                statusLabel = 'Delayed';
              } else if (bus.status === 'unavailable') {
                statusColor = '#EF4444'; // 🔴 Unavailable (red)
                statusLabel = 'Unavailable';
              } else if (bus.status === 'route-changed') {
                statusColor = '#3B82F6'; // 🔵 Route Changed (blue)
                statusLabel = 'Route Changed';
              } else if (bus.status === 'arrived') {
                statusColor = '#10B981';
                statusLabel = 'Arrived';
              }

              return (
                <g
                  key={bus.id}
                  id={`bus-live-marker-${bus.id}`}
                  style={{
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                    transition: 'transform 2.4s linear',
                  }}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectBus) onSelectBus(bus.id);
                    setActivePopup({
                      type: 'bus',
                      data: bus,
                      x: pos.x,
                      y: pos.y,
                    });
                  }}
                >
                  {/* Selected Bus High-Visibility Halo / Pulse */}
                  {isSelected && (
                    <>
                      <circle cx="0" cy="0" r="28" fill="url(#busSelectionGlow)" />
                      <circle cx="0" cy="0" r="22" fill="none" stroke="#F59E0B" strokeWidth="2.5" opacity="0.7">
                        <animate attributeName="r" values="16;28;16" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.9;0;0.9" dur="2s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}

                  {/* Heading Arrow Indicator */}
                  {bus.heading !== undefined && bus.status !== 'arrived' && (
                    <g transform={`rotate(${bus.heading})`}>
                      <polygon points="0,-20 -5,-14 5,-14" fill={isSelected ? '#F59E0B' : statusColor} />
                    </g>
                  )}

                  {/* Main Bus Shield */}
                  <circle
                    cx="0"
                    cy="0"
                    r={isSelected ? '15' : '13'}
                    fill="#0F172A"
                    stroke={isSelected ? '#F59E0B' : statusColor}
                    strokeWidth={isSelected ? '3.5' : '2.5'}
                    className="drop-shadow-lg"
                  />

                  {/* Status Indicator Pip */}
                  <circle
                    cx="9"
                    cy="-9"
                    r="4.5"
                    fill={statusColor}
                    stroke="#0F172A"
                    strokeWidth="1.5"
                    className="drop-shadow-sm"
                  />

                  {/* Bus Icon */}
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize={isSelected ? '12' : '10'}
                    fontWeight="800"
                    className="pointer-events-none"
                  >
                    🚌
                  </text>

                  {/* Bus Number Pill */}
                  <rect
                    x="-26"
                    y="-32"
                    width="52"
                    height="16"
                    rx="4"
                    fill={isSelected ? '#F59E0B' : '#1E293B'}
                    stroke={statusColor}
                    strokeWidth="1"
                    className="drop-shadow-sm"
                  />
                  <text
                    x="0"
                    y="-20"
                    textAnchor="middle"
                    fill={isSelected ? '#0F172A' : '#F8FAFC'}
                    fontSize="9.5"
                    fontWeight="900"
                    className="pointer-events-none font-mono"
                  >
                    {safeBusNumber(bus)}
                  </text>

                  {/* Status / "MY BUS" Tag */}
                  {bus.status === 'delayed' ? (
                    <g>
                      <rect
                        x="-38"
                        y="18"
                        width="76"
                        height="15"
                        rx="4"
                        fill="#F59E0B"
                        stroke="#B45309"
                        strokeWidth="1"
                        className="drop-shadow-md"
                      />
                      <text
                        x="0"
                        y="29"
                        textAnchor="middle"
                        fill="#0F172A"
                        fontSize="8"
                        fontWeight="900"
                        className="pointer-events-none"
                      >
                        ⚠️ Delayed +8 min
                      </text>
                    </g>
                  ) : isSelected ? (
                    <g>
                      <rect x="-24" y="18" width="48" height="14" rx="4" fill="#F59E0B" />
                      <text
                        x="0"
                        y="28"
                        textAnchor="middle"
                        fill="#0F172A"
                        fontSize="8.5"
                        fontWeight="900"
                        className="pointer-events-none"
                      >
                        ⭐ MY BUS
                      </text>
                    </g>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Bus Delay Alert on Map */}
        {selectedBus?.status === 'delayed' && (
          <div
            id="bus-delay-map-alert"
            className="absolute top-14 right-3 z-20 max-w-sm animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-2.5 rounded-xl bg-amber-950/95 text-amber-200 px-3.5 py-2.5 border-2 border-amber-500/80 backdrop-blur-md shadow-2xl text-xs">
              <span className="text-xl shrink-0">⏱️</span>
              <div className="flex-1 min-w-0">
                <div className="font-black text-amber-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
                  <span>{safeBusNumber(selectedBus)} Delayed +8 min</span>
                  <span className="bg-amber-500 text-slate-950 text-[9px] px-1.5 py-0.2 rounded font-black">
                    +8m ETA
                  </span>
                </div>
                <p className="text-[11px] text-amber-100 font-medium mt-0.5">
                  Approaching junction congestion. Pickup arrival updated to {safeEta(studentJourney?.predictedBusArrivalTime, '08:26 AM')}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Active Route Detour Alert on Map */}
        {routes.some((r) => r.isTemporarilyChanged) && (
          <div className="absolute top-14 right-3 z-20 max-w-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5 rounded-xl bg-amber-950/95 text-amber-200 px-3.5 py-2.5 border-2 border-amber-500/80 backdrop-blur-md shadow-2xl text-xs">
              <span className="text-xl shrink-0">🚧</span>
              <div className="flex-1 min-w-0">
                <div className="font-black text-amber-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
                  <span>Route Detour Active</span>
                  <span className="bg-amber-500 text-slate-950 text-[9px] px-1.5 py-0.2 rounded font-black">
                    Bypass
                  </span>
                </div>
                <p className="text-[11px] text-amber-100 font-medium truncate mt-0.5">
                  Main Road Stop Closed → Main Road Junction (150m ahead)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const detourPos = project(17.4705, 78.3830);
                  setZoom(1.6);
                  setPan({
                    x: (500 - detourPos.x) * 1.6,
                    y: (375 - detourPos.y) * 1.6,
                  });
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold text-[11px] shrink-0 transition-all shadow-md cursor-pointer"
              >
                Focus Detour
              </button>
            </div>
          </div>
        )}

        {/* Interactive Floating Bus Info Popup on Marker Click */}
        {activePopup && (
          <div
            id="map-active-popup"
            className="absolute z-40 w-80 max-w-[92vw] rounded-2xl bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-md border border-slate-700/80 animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: `${Math.min(85, Math.max(15, (activePopup.x / 1000) * 100))}%`,
              top: `${Math.min(80, Math.max(20, (activePopup.y / 750) * 100))}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">
                  {activePopup.type === 'bus' ? '🚌' : activePopup.type === 'college' ? '🎓' : '🚏'}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    {activePopup.type === 'bus'
                      ? `${safeBusNumber(activePopup.data)} · ${activePopup.data.registrationNumber || 'Fleet Vehicle'}`
                      : activePopup.type === 'college'
                      ? 'Apex College Campus Terminal'
                      : safeStopName(activePopup.data.stop)}
                    {activePopup.type === 'bus' && activePopup.data.id === selectedBusId && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                        My Bus
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {activePopup.type === 'bus'
                      ? safeRouteName(null, activePopup.data)
                      : activePopup.type === 'college'
                      ? 'Terminal Campus Destination'
                      : safeRouteName(null, null, activePopup.data.routeName)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePopup(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Complete Bus Information Panel (All 10 required attributes) */}
            {activePopup.type === 'bus' && (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Current Status</span>
                    <span
                      className={`inline-flex items-center gap-1 font-bold text-xs ${
                        activePopup.data.status === 'delayed'
                          ? 'text-amber-400'
                          : activePopup.data.status === 'unavailable'
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      ●{' '}
                      {activePopup.data.status === 'delayed'
                        ? 'Delayed +8 min'
                        : activePopup.data.status === 'on-time'
                        ? 'On Time'
                        : activePopup.data.status === 'unavailable'
                        ? 'Unavailable'
                        : 'En Route'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Current Speed</span>
                    <span className="font-bold text-slate-100 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-blue-400" />
                      {safeSpeed(activePopup.data.currentSpeed)} km/h
                    </span>
                  </div>
                </div>

                <div className="space-y-1 py-1">
                  <div className="flex justify-between py-0.5 text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" /> Next Stop:
                    </span>
                    <span className="font-semibold text-slate-100">{activePopup.data.nextStopName || 'Approaching Stop'}</span>
                  </div>

                  <div className="flex justify-between py-0.5 text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" /> Arrival ETA:
                    </span>
                    <span className="font-bold text-emerald-400">
                      {activePopup.data.id === selectedBusId && studentJourney?.predictedBusArrivalTime
                        ? safeEta(studentJourney.predictedBusArrivalTime, '08:26 AM')
                        : safeEta(activePopup.data.etaToStudentStop, '08:26 AM')}
                    </span>
                  </div>

                  <div className="flex justify-between py-0.5 text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-amber-400" /> Dist. to Student Stop:
                    </span>
                    <span className="font-semibold text-slate-200">{distanceToStudentStop}</span>
                  </div>

                  <div className="flex justify-between py-0.5 text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1">
                      <UserIcon className="w-3 h-3 text-slate-400" /> Driver:
                    </span>
                    <span className="font-medium text-slate-200">{safeDriverName(activePopup.data)}</span>
                  </div>

                  <div className="flex justify-between py-0.5 text-slate-300">
                    <span className="text-slate-400">Occupancy:</span>
                    <span className="font-medium text-slate-200">
                      {activePopup.data.currentOccupancy || 0} / {activePopup.data.capacity || 50} seats (
                      {Math.round(((activePopup.data.currentOccupancy || 0) / (activePopup.data.capacity || 50)) * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    GPS: {activePopup.data.lastUpdated || '2.5s update'}
                  </span>
                  <button
                    onClick={() => {
                      if (onSelectBus) onSelectBus(activePopup.data.id);
                      centerOnBus(activePopup.data);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors"
                  >
                    Track This Bus
                  </button>
                </div>
              </div>
            )}

            {/* Stop Information Panel */}
            {activePopup.type === 'stop' && (
              <div className="space-y-2 text-xs">
                {activePopup.data.isClosed ? (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs space-y-1.5">
                    <div className="font-extrabold text-rose-300 flex items-center gap-1.5 text-xs">
                      <span>⛔</span> STOP TEMPORARILY CLOSED
                    </div>
                    <p className="text-[11px] text-rose-200">
                      Closed due to: <strong>{activePopup.data.closedReason || 'Flyover Construction & Maintenance'}</strong>.
                    </p>
                    <div className="text-amber-300 font-bold pt-1.5 border-t border-rose-500/30 text-[11px] flex items-center gap-1">
                      <span>↪️</span> Temporary Boarding Point: <strong>{activePopup.data.alternativeStopName || 'Main Road Junction (150m ahead)'}</strong>
                    </div>
                  </div>
                ) : activePopup.data.isTemporaryAlternative ? (
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs space-y-1.5">
                    <div className="font-extrabold text-amber-300 flex items-center gap-1.5 text-xs">
                      <span>🚏</span> ACTIVE TEMPORARY DETOUR STOP
                    </div>
                    <p className="text-[11px] text-amber-200">
                      Designated pickup stop today bypassing flyover construction on {activePopup.data.originalStopName || 'Main Road'}.
                    </p>
                    <div className="text-emerald-300 font-bold pt-1.5 border-t border-amber-500/30 text-[11px]">
                      ✓ Board your bus here today (150m ahead of usual stop). Bus ETA: 8:20 AM.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between py-0.5 text-slate-300">
                      <span className="text-slate-400">Stop Sequence:</span>
                      <span className="font-bold text-slate-200">Stop #{activePopup.data.stopOrder}</span>
                    </div>
                    <div className="flex justify-between py-0.5 text-slate-300">
                      <span className="text-slate-400">Scheduled Time:</span>
                      <span className="font-bold text-blue-400">{safeEta(activePopup.data.stop.scheduledTime, '08:20 AM')}</span>
                    </div>
                    <div className="flex justify-between py-0.5 text-slate-300">
                      <span className="text-slate-400">Geofence Radius:</span>
                      <span className="font-medium text-slate-200">{activePopup.data.stop.geofenceRadiusMeters} meters</span>
                    </div>
                    {selectedBus && selectedBus.currentLocation && (
                      <div className="flex justify-between py-0.5 text-slate-300">
                        <span className="text-slate-400">Geofence Distance:</span>
                        <span className="font-bold text-emerald-400">
                          {(() => {
                            const d = Math.hypot(
                              (activePopup.data.stop.lat - selectedBus.currentLocation.lat) * 111,
                              (activePopup.data.stop.lng - selectedBus.currentLocation.lng) * 111
                            );
                            return d < 1 ? `${Math.round(d * 1000)}m away` : `${d.toFixed(2)} km away`;
                          })()}
                        </span>
                      </div>
                    )}
                    {(activePopup.data.isNextStop || (selectedBus && activePopup.data.stop.id === selectedBus.nextStopId)) && (
                      <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[11px] font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span>🎯</span> Next Stop (Approaching)
                        </span>
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                          NEXT
                        </span>
                      </div>
                    )}
                    {activePopup.data.stop.id === highlightedStopId && !activePopup.data.isNextStop && !(selectedBus && activePopup.data.stop.id === selectedBus.nextStopId) && (
                      <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[11px] font-medium flex items-center gap-1.5">
                        <span>🚏</span> Selected checkpoint on active route.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* College Landmark Panel */}
            {activePopup.type === 'college' && (
              <div className="space-y-2 text-xs">
                <p className="text-slate-300 text-[11px]">
                  Central Terminal Arrival Hub for all campus routes with monitored gates and geo-attendance sensors.
                </p>
                <div className="flex justify-between py-0.5 text-slate-300 border-t border-slate-800 pt-1.5">
                  <span className="text-slate-400">Campus Geofence:</span>
                  <span className="font-bold text-blue-400">250 meters</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Map Status & Legend Footer */}
        <div className="absolute bottom-2 left-2 right-2 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[10px] text-slate-300">
          <div className="pointer-events-auto flex items-center gap-2.5 rounded-lg bg-slate-900/90 px-2.5 py-1 backdrop-blur-md border border-slate-800 shadow-sm">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> On Time
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Delayed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Unavailable
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Route Changed
            </span>
            {routes.some((r) => r.isTemporarilyChanged) && (
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> 🚧 Detour Bypass
              </span>
            )}
          </div>

          <div
            id="map-bottom-legend"
            className="pointer-events-auto flex items-center gap-2 rounded-lg bg-slate-900/90 px-2.5 py-1 backdrop-blur-md border border-slate-800 text-[10px] text-slate-400 shadow-sm"
          >
            <span id="map-bottom-route-label">
              Route: <strong id="map-bottom-route-name" className="text-slate-200">{safeRouteName(selectedRoute, selectedBus)}</strong>
            </span>
            <span>·</span>
            <span id="map-bottom-route-progress">
              Progress: <strong className="text-emerald-400">{selectedBus?.routeProgress ?? 45}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Large View Telemetry & Journey HUD (Shown in Large/Full-Screen Mode) */}
      {isFullScreen && (
        <div className="w-full md:w-80 lg:w-96 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col h-auto md:h-full z-30 shadow-2xl overflow-y-auto">
          {/* HUD Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                Live Journey Telemetry
              </span>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🚌</span> {safeBusNumber(selectedBus)}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    selectedBus?.status === 'delayed'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {selectedBus?.status === 'delayed' ? 'Delayed +8 min' : 'On Time'}
                </span>
              </h3>
            </div>
            <button
              onClick={handleToggleExpand}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Large Tracking View"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Synchronized Metrics Cards */}
          <div className="p-4 space-y-4 flex-1">
            {/* Active Corridor & ETA Badge */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Assigned Route</span>
                <span className="font-semibold text-slate-200 text-right">{safeRouteName(selectedRoute, selectedBus)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Your Pickup Stop</span>
                <span className="font-bold text-amber-400 text-right">{safeStopName(studentStop, 'Main Road Stop')}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 block">Pickup ETA</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">
                    {safeEta(studentJourney?.predictedBusArrivalTime, '08:26 AM')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">College Arrival</span>
                  <span className="text-base font-extrabold text-blue-400 font-mono">
                    {safeEta(studentJourney?.predictedCollegeArrivalTime, '09:04 AM')}
                  </span>
                </div>
              </div>
            </div>

            {/* Route Progression Timeline */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Route Progress</h4>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {selectedBus?.routeProgress ?? 50}% Completed
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${selectedBus?.routeProgress ?? 50}%` }}
                />
              </div>

              {/* Stops Chain List */}
              <div className="space-y-2 pt-1">
                {selectedRoute?.stops.map((stop, sIdx) => {
                  const isCurrentTarget = stop.id === selectedBus?.nextStopId;
                  const isStudentStop = stop.id === highlightedStopId;
                  const isArrivedStop = stop.isCompleted || (selectedBus?.routeProgress ?? 0) > ((sIdx + 1) / selectedRoute.stops.length) * 100;

                  return (
                    <div
                      key={stop.id}
                      className={`flex items-center gap-2 text-xs p-1.5 rounded-lg transition-colors ${
                        stop.isTemporarilyUnavailable
                          ? 'bg-rose-500/15 border border-rose-500/40'
                          : isStudentStop
                          ? 'bg-amber-500/15 border border-amber-500/30'
                          : isCurrentTarget
                          ? 'bg-blue-500/10 border border-blue-500/20'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          stop.isTemporarilyUnavailable
                            ? 'bg-rose-600 text-white'
                            : isArrivedStop
                            ? 'bg-emerald-500 text-white'
                            : isStudentStop
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : isCurrentTarget
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {stop.isTemporarilyUnavailable ? '✕' : isArrivedStop ? '✓' : sIdx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`truncate font-medium ${
                            stop.isTemporarilyUnavailable
                              ? 'text-rose-300 line-through font-bold'
                              : isStudentStop
                              ? 'text-amber-300 font-bold'
                              : isCurrentTarget
                              ? 'text-blue-300'
                              : 'text-slate-300'
                          }`}
                        >
                          {safeStopName(stop)}
                        </p>
                        {stop.isTemporarilyUnavailable && (
                          <p className="text-[10px] text-amber-300 font-bold mt-0.5">
                            ↪️ Temp: {stop.alternativeStopName || 'Main Road Junction'}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {stop.isTemporarilyUnavailable ? 'CLOSED' : safeEta(stop.scheduledTime, '08:20 AM')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Driver & Telemetry Details */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-base">
                    👨‍✈️
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-100">{safeDriverName(selectedBus)}</h5>
                    <p className="text-[11px] text-slate-400 font-mono">{safeDriverPhone(selectedBus)}</p>
                  </div>
                </div>
                <a
                  href={`tel:${safeDriverPhone(selectedBus)}`}
                  className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                  title="Call Driver"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Speed</span>
                  <span className="font-bold text-slate-200">{safeSpeed(selectedBus?.currentSpeed)} km/h</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Occupancy</span>
                  <span className="font-bold text-slate-200">
                    {occupancyStats.current} / {occupancyStats.total} ({occupancyStats.percentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => centerOnBus()}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Crosshair className="w-4 h-4 text-amber-400" /> Center & Lock My Bus
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
