import React, { useState, useMemo, useEffect } from 'react';
import { useTransport } from '../../context/TransportContext';
import { InteractiveMap } from '../common/InteractiveMap';
import { isBusOnRoute } from '../../utils/safeDisplay';
import {
  Bus as BusIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Sliders,
  Send,
  FileSpreadsheet,
  AlertOctagon,
  ChevronRight,
  Filter,
  Maximize2,
  Check,
  X,
  UserX,
  ShieldCheck,
} from 'lucide-react';
import { PASSENGER_DEMAND_PREDICTIONS } from '../../data/mockDatabase';

export const AdminDashboard: React.FC = () => {
  const {
    users,
    approveDriver,
    rejectDriver,
    buses,
    routes,
    weather,
    traffic,
    arrivalRecords,
    anomalyAlerts,
    emergencyReports,
    simulateBreakdown,
    simulateBusReplacement,
    simulateRouteChange,
    simulateHeavyTraffic,
    simulateRain,
    resetSimulation,
    selectedBypassRouteId,
    selectBypassRoute,
  } = useTransport();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'arrivals' | 'demand' | 'dispatch' | 'approvals'>('overview');
  const [selectedBusId, setSelectedBusId] = useState<string>('bus-07');
  const [replacementOldBus, setReplacementOldBus] = useState('bus-07');
  const [replacementNewBus, setReplacementNewBus] = useState('bus-12');
  const [replacementSuccess, setReplacementSuccess] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [fleetFilter, setFleetFilter] = useState<'all' | 'active'>('all');
  const [driverFilter, setDriverFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Driver metrics
  const allDrivers = useMemo(() => users.filter((u) => u.role === 'driver'), [users]);
  const pendingDrivers = useMemo(() => allDrivers.filter((d) => d.approvalStatus === 'pending'), [allDrivers]);
  const approvedDrivers = useMemo(() => allDrivers.filter((d) => d.approvalStatus === 'approved'), [allDrivers]);
  const rejectedDrivers = useMemo(() => allDrivers.filter((d) => d.approvalStatus === 'rejected'), [allDrivers]);

  const displayedDrivers = useMemo(() => {
    if (driverFilter === 'pending') return pendingDrivers;
    if (driverFilter === 'approved') return approvedDrivers;
    if (driverFilter === 'rejected') return rejectedDrivers;
    return allDrivers;
  }, [driverFilter, allDrivers, pendingDrivers, approvedDrivers, rejectedDrivers]);

  // Fleet overview statistics
  const totalBuses = buses.length;
  const arrivedBuses = buses.filter((b) => b.status === 'arrived' || (b.status as string) === 'ARRIVED');
  const delayedBuses = buses.filter((b) => b.status === 'delayed' || (b.status as string) === 'DELAYED');
  const unavailableBuses = buses.filter((b) => b.status === 'unavailable' || (b.status as string) === 'UNAVAILABLE');
  const onRouteBuses = useMemo(() => buses.filter((b) => isBusOnRoute(b, buses)), [buses]);
  const activeBuses = onRouteBuses;

  const visibleBuses = useMemo(() => {
    if (fleetFilter === 'active') {
      return onRouteBuses;
    }
    return buses;
  }, [buses, fleetFilter, onRouteBuses]);

  // Keep selected/focused bus state consistent
  useEffect(() => {
    if (visibleBuses.length > 0) {
      const isSelectedVisible = visibleBuses.some((b) => b.id === selectedBusId);
      if (!isSelectedVisible && fleetFilter === 'active') {
        setSelectedBusId(visibleBuses[0].id);
      }
    }
  }, [fleetFilter, visibleBuses, selectedBusId]);

  const handleExecuteReplacement = () => {
    simulateBusReplacement(replacementOldBus, replacementNewBus);
    setReplacementSuccess(true);
    setTimeout(() => setReplacementSuccess(false), 4000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Admin Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
              👨‍💼 Administrator Console
            </span>
            <span className="text-xs text-slate-500">Live College Fleet Control Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Transportation Command & Dispatch
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Real-time fleet telemetry, automated arrival logs, AI capacity forecasting, and anomaly detection
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedTab === 'overview' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Fleet
          </button>
          <button
            onClick={() => setSelectedTab('arrivals')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedTab === 'arrivals' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Arrival Logs ({arrivalRecords.length})
          </button>
          <button
            onClick={() => setSelectedTab('demand')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedTab === 'demand' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI Demand & Capacity
          </button>
          <button
            onClick={() => setSelectedTab('dispatch')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedTab === 'dispatch' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bus Replacement
          </button>
          <button
            id="admin-tab-approvals"
            onClick={() => setSelectedTab('approvals')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              selectedTab === 'approvals' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Driver Approvals</span>
            {pendingDrivers.length > 0 ? (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                {pendingDrivers.length}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-normal">
                ({allDrivers.length})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div
          id="admin-stat-total-fleet"
          onClick={() => setFleetFilter('all')}
          className={`rounded-2xl border p-4 shadow-xs cursor-pointer transition-all ${
            fleetFilter === 'all'
              ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
          title="Click to view all buses"
        >
          <span className="text-slate-500 text-xs block mb-1">Total Fleet</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{totalBuses}</span>
            <span className="text-[11px] text-slate-400">vehicles</span>
          </div>
        </div>

        <div
          id="admin-stat-on-route"
          onClick={() => setFleetFilter((prev) => (prev === 'active' ? 'all' : 'active'))}
          className={`rounded-2xl border p-4 shadow-xs cursor-pointer transition-all ${
            fleetFilter === 'active'
              ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
          title="Click to toggle On Route filter"
        >
          <span className="text-slate-500 text-xs block mb-1">On Route</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-blue-600">{onRouteBuses.length}</span>
            <span className="text-[11px] text-blue-600/80 font-semibold">tracking active</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-slate-500 text-xs block mb-1">Arrived at Campus</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600">{arrivedBuses.length}</span>
            <span className="text-[11px] text-emerald-600/80 font-semibold">completed</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-slate-500 text-xs block mb-1">Delayed</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600">{delayedBuses.length}</span>
            <span className="text-[11px] text-amber-600/80 font-semibold">corridor traffic</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-slate-500 text-xs block mb-1">Anomalies / SOS</span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold ${
                anomalyAlerts.length > 0 || emergencyReports.length > 0 ? 'text-rose-600' : 'text-slate-700'
              }`}
            >
              {anomalyAlerts.length + emergencyReports.length}
            </span>
            <span className="text-[11px] text-slate-400">reported</span>
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & LIVE FLEET MAP */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Map (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <h3 className="text-sm font-bold text-slate-900">Live Campus Transportation Map</h3>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="hidden sm:inline">Selected:</span>
                  <span className="font-bold text-blue-600">
                    {buses.find((b) => b.id === selectedBusId)?.busNumber || 'None'}
                  </span>
                  <button
                    id="admin-expand-map-btn"
                    onClick={() => setIsMapExpanded(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold transition-colors ml-1"
                    title="Expand Live Campus Fleet Map"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Large View</span>
                  </button>
                </div>
              </div>

              <InteractiveMap
                buses={buses}
                routes={routes}
                selectedBusId={selectedBusId}
                selectedRouteId={buses.find((b) => b.id === selectedBusId)?.routeId}
                onSelectBus={(id) => setSelectedBusId(id)}
                height="460px"
                showTrafficOverlay={true}
                isExpanded={isMapExpanded}
                onToggleExpand={() => setIsMapExpanded((prev) => !prev)}
                filterMode={fleetFilter}
                onFilterModeChange={(mode) => {
                  if (mode === 'active') {
                    setFleetFilter('active');
                  } else if (mode === 'all') {
                    setFleetFilter('all');
                  }
                }}
              />
            </div>
          </div>

          {/* Right Fleet Telemetry & Anomaly Alerts (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Anomaly Alerts Panel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Telemetry Anomalies ({anomalyAlerts.length})
                  </h4>
                </div>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {anomalyAlerts.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                    No active anomalies detected. All corridors operating smoothly.
                  </div>
                ) : (
                  anomalyAlerts.map((anom) => (
                    <div
                      key={anom.id}
                      className="p-3 rounded-xl border border-rose-200 bg-rose-50/70 text-xs text-rose-900"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-rose-700">{anom.busNumber}</span>
                        <span className="text-[10px] text-slate-500">{anom.timestamp}</span>
                      </div>
                      <p className="text-[11px] leading-snug">{anom.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Fleet Bus List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {fleetFilter === 'active' ? 'On Route Fleet' : 'All Active Buses'} ({visibleBuses.length})
                </h4>
                {fleetFilter === 'active' && (
                  <button
                    onClick={() => setFleetFilter('all')}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Show All
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                {visibleBuses.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                    No buses currently on route.
                  </div>
                ) : (
                  visibleBuses.map((bus) => (
                    <div
                      key={bus.id}
                      onClick={() => setSelectedBusId(bus.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        selectedBusId === bus.id
                          ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{bus.busNumber}</span>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            bus.status === 'arrived'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bus.status === 'delayed'
                              ? 'bg-amber-100 text-amber-800'
                              : bus.status === 'unavailable'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {bus.status === 'delayed' ? 'DELAYED +8M' : bus.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{bus.driverName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-slate-700">{Math.round(bus.currentSpeed)} km/h</span>
                      <span className="block text-[10px] text-slate-400">
                        {bus.currentOccupancy}/{bus.capacity} seats
                      </span>
                    </div>
                  </div>
                )))
              }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REAL-TIME BUS ARRIVAL LOG */}
      {selectedTab === 'arrivals' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Official Campus Arrival Log (Morning Transit)
              </h3>
              <p className="text-xs text-slate-500">
                Live automated arrival records verified via Campus Terminal Geofence (250m)
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              <span>{arrivalRecords.length} Buses Logged Arrived</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Bus Number</th>
                  <th className="py-3 px-4 font-bold">Route Code</th>
                  <th className="py-3 px-4 font-bold">Driver Name</th>
                  <th className="py-3 px-4 font-bold">Arrival Time</th>
                  <th className="py-3 px-4 font-bold">Punctuality</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {arrivalRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 font-mono">
                      {rec.busNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {rec.routeCode} ({rec.routeName})
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {rec.driverName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-700 font-mono">
                      {rec.arrivalTime}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.onTime
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.onTime ? '🟢 ON TIME' : '🟡 DELAYED (+6m)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> ARRIVED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PASSENGER DEMAND PREDICTION & OVERCAPACITY */}
      {selectedTab === 'demand' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  AI Passenger Demand Prediction & Fleet Optimization
                </h3>
                <p className="text-xs text-slate-500">
                  Forecasts passenger surge based on class schedules, day of week, and historical boarding telemetry
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PASSENGER_DEMAND_PREDICTIONS.map((demand) => (
                <div
                  key={demand.routeId}
                  className={`rounded-2xl border p-5 transition-all ${
                    demand.overcapacityRisk
                      ? 'border-amber-300 bg-amber-50/50 ring-2 ring-amber-400/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 text-sm">{demand.routeName}</h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        demand.overcapacityRisk
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {demand.utilizationRate}% Utilization
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Bus Capacity</span>
                      <span className="font-bold text-slate-800 text-sm">{demand.busCapacity} seats</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Expected Demand</span>
                      <span
                        className={`font-bold text-sm ${
                          demand.overcapacityRisk ? 'text-amber-700' : 'text-slate-800'
                        }`}
                      >
                        {demand.expectedPassengers} students
                      </span>
                    </div>
                  </div>

                  {/* AI Recommendation Message */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                    {demand.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BUS REPLACEMENT & EMERGENCY DISPATCH */}
      {selectedTab === 'dispatch' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Bus Replacement Dispatcher */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Bus Replacement Dispatcher
                </h3>
                <p className="text-xs text-slate-500">
                  Seamlessly transfer students and route assignments when a bus breaks down
                </p>
              </div>
            </div>

            {replacementSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
                ✅ Replacement bus assigned! Broadcast notification sent to all students:
                <br />
                <span className="text-slate-700 font-normal">
                  "Previous Bus: {replacementOldBus} ❌ Unavailable. Replacement Bus: {replacementNewBus}. Expected at stop: 8:18 AM."
                </span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Unavailable / Broken Bus:
                </label>
                <select
                  value={replacementOldBus}
                  onChange={(e) => setReplacementOldBus(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="bus-07">BUS-07 (Route A - North Corridor - Priya's Bus)</option>
                  <option value="bus-09">BUS-09 (Route A - Delayed)</option>
                  <option value="bus-03">BUS-03 (Route B - Metro Link)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Available Replacement Bus (Standby):
                </label>
                <select
                  value={replacementNewBus}
                  onChange={(e) => setReplacementNewBus(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="bus-12">BUS-12 (North Express Backup - Driver: Suresh Reddy)</option>
                  <option value="bus-10">BUS-10 (Miyapur Depot Standby)</option>
                  <option value="bus-15">BUS-15 (North Connector Backup)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-600 border border-slate-200">
                💡 Automatically re-calculates walking buffers, updates student stop predictions, and triggers high-priority modal alerts.
              </div>

              <button
                type="button"
                onClick={handleExecuteReplacement}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-98 transition-all"
              >
                Assign Replacement & Broadcast Alert to Students
              </button>
            </div>
          </div>

          {/* Card 2: Route Change & Detour Broadcast */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Route Detour & Stop Modification
                </h3>
                <p className="text-xs text-slate-500">
                  Temporarily divert route around construction, road closures, or flooded streets
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Route:</label>
                <input
                  type="text"
                  readOnly
                  value="Route A — North Corridor"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detour Reason:</label>
                <input
                  type="text"
                  readOnly
                  value="Major Flyover Construction & Drain Maintenance"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alternative Stop Assigned:</label>
                <input
                  type="text"
                  readOnly
                  value="Main Road Junction (150m ahead)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700"
                />
              </div>

              <button
                type="button"
                onClick={simulateRouteChange}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-98 transition-all"
              >
                Broadcast Route Change Alert to Students
              </button>
            </div>
          </div>

          {/* Card 3: AI Bypass Routes Dispatcher */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    AI Bypass Routes Dispatcher (Corridor Optimization)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select and save AI dynamic bypass routes to immediately switch fleet routing and navigation on the live map
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Target Fleet: BUS-07
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Alternative Route A Card */}
              {(() => {
                const isRouteASelected =
                  selectedBypassRouteId === 'rec-1' ||
                  (!selectedBypassRouteId && buses.find((b) => b.id === 'bus-07')?.routeId !== 'route-b');
                return (
                  <div
                    onClick={() => selectBypassRoute('rec-1', 'bus-07')}
                    className={`p-4 rounded-xl border text-xs transition-all cursor-pointer ${
                      isRouteASelected
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900">Alternative Route A (Bypass Flyover)</span>
                      {isRouteASelected && (
                        <span className="rounded-full bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3" /> SELECTED & SAVED
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] mb-2.5">
                      Exit flyover 400m before bottleneck via arterial slip road. Avoids flyover congestion.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-700">
                      <span>Est. Travel Time: 35 mins</span>
                      <button
                        type="button"
                        id="admin-save-bypass-action-rec-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectBypassRoute('rec-1', 'bus-07');
                        }}
                        className={`font-bold transition-all px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer ${
                          isRouteASelected
                            ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700'
                            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 active:scale-95'
                        }`}
                      >
                        {isRouteASelected ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            <span>Saved 7 mins</span>
                          </>
                        ) : (
                          <span>Save 7 mins</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Alternative Route B Card */}
              {(() => {
                const isRouteBSelected =
                  selectedBypassRouteId === 'rec-2' ||
                  buses.find((b) => b.id === 'bus-07')?.routeId === 'route-b';
                return (
                  <div
                    onClick={() => selectBypassRoute('rec-2', 'bus-07')}
                    className={`p-4 rounded-xl border text-xs transition-all cursor-pointer ${
                      isRouteBSelected
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900">Alternative Route B (Metro Service Corridor)</span>
                      {isRouteBSelected && (
                        <span className="rounded-full bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3" /> SELECTED & SAVED
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] mb-2.5">
                      Bypass flyover via Metro Service Road parallel corridor. Smooth signal synchronization.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-700">
                      <span>Est. Travel Time: 39 mins</span>
                      <button
                        type="button"
                        id="admin-save-bypass-action-rec-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectBypassRoute('rec-2', 'bus-07');
                        }}
                        className={`font-bold transition-all px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer ${
                          isRouteBSelected
                            ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700'
                            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 active:scale-95'
                        }`}
                      >
                        {isRouteBSelected ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            <span>Saved 3 mins</span>
                          </>
                        ) : (
                          <span>Save 3 mins</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DRIVER APPROVALS & VERIFICATION */}
      {selectedTab === 'approvals' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Driver Authorization & Verification Console
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                  Under campus safety protocols, new driver sign-ups require administrator approval before accounts can access the mobile driver cockpit and GPS dispatch telemetry.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-500">Queue:</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>{pendingDrivers.length} Pending Approval</span>
              </span>
            </div>
          </div>

          {/* Filter Bar & Quick Stats */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Filter Drivers:</span>
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setDriverFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    driverFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({allDrivers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDriverFilter('pending')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    driverFilter === 'pending'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Pending</span>
                  {pendingDrivers.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white/20">
                      {pendingDrivers.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDriverFilter('approved')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    driverFilter === 'approved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Approved ({approvedDrivers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDriverFilter('rejected')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    driverFilter === 'rejected'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rejected ({rejectedDrivers.length})
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <span>
                Total registered drivers: <strong className="text-slate-800 font-bold">{allDrivers.length}</strong>
              </span>
            </div>
          </div>

          {/* Drivers List */}
          <div className="space-y-3">
            {displayedDrivers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
                <ShieldCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No driver accounts found in this filter.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Switch to "All" or simulate a new driver registration on the Welcome Screen.
                </p>
              </div>
            ) : (
              displayedDrivers.map((driver) => {
                const isPending = driver.approvalStatus === 'pending';
                const isApproved = driver.approvalStatus === 'approved';
                const isRejected = driver.approvalStatus === 'rejected';

                return (
                  <div
                    key={driver.id}
                    id={`driver-row-${driver.id}`}
                    className={`rounded-2xl border p-5 bg-white transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isPending
                        ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-200'
                        : isApproved
                        ? 'border-slate-200 hover:border-slate-300'
                        : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    {/* Left: Driver Info */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        👨‍✈️
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-extrabold text-slate-900">{driver.name}</h4>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {driver.identifier}
                          </span>
                          {/* Status Badge */}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-300 animate-pulse">
                              <Clock className="h-3 w-3" /> Pending Review
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Authorized Driver
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 border border-rose-300">
                              <UserX className="h-3 w-3 text-rose-600" /> Application Rejected
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          <span>
                            Email: <strong className="text-slate-700 font-medium">{driver.email || 'N/A'}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Registered:{' '}
                            <span className="text-slate-600">
                              {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : 'Active Fleet'}
                            </span>
                          </span>
                          {driver.assignedBusId && (
                            <>
                              <span>•</span>
                              <span>
                                Assigned Bus:{' '}
                                <strong className="text-blue-700 font-bold">
                                  {buses.find((b) => b.id === driver.assignedBusId)?.busNumber || driver.assignedBusId}
                                </strong>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            id={`approve-driver-${driver.id}`}
                            onClick={() => approveDriver(driver.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve Driver</span>
                          </button>
                          <button
                            type="button"
                            id={`reject-driver-${driver.id}`}
                            onClick={() => rejectDriver(driver.id)}
                            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Cockpit Access Granted
                          </span>
                          <button
                            type="button"
                            onClick={() => rejectDriver(driver.id)}
                            className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 text-[11px] font-medium transition-colors"
                          >
                            Revoke
                          </button>
                        </div>
                      )}

                      {isRejected && (
                        <button
                          type="button"
                          onClick={() => approveDriver(driver.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Re-Authorize Driver</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
