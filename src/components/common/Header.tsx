import React, { useState } from 'react';
import { useTransport } from '../../context/TransportContext';
import {
  Bell,
  Bus,
  CloudRain,
  Sun,
  AlertTriangle,
  User as UserIcon,
  LogOut,
  HelpCircle,
  FileText,
  Activity,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { SupportedLanguage } from '../../types';
import { LANGUAGE_METADATA } from '../../services/voiceAssistant';

interface HeaderProps {
  onOpenDocs: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDocs }) => {
  const {
    currentUser,
    selectedRole,
    logout,
    setSelectedRole,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    weather,
    traffic,
    driverLanguage,
    setDriverLanguage,
  } = useTransport();

  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Bus className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                COLLEGE SMART TRANSPORT
              </h1>
              <span className="hidden sm:inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/60">
                AI Powered
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
              “Your journey, intelligently managed.”
            </p>
          </div>
        </div>

        {/* Center Live Operational Indicators */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          {/* Weather Status */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-slate-700">
            {weather.rainProbability > 50 ? (
              <CloudRain className="h-3.5 w-3.5 text-blue-500" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span className="font-semibold">{weather.condition}</span>
            <span className="text-slate-400">({weather.temperatureC}°C)</span>
          </div>

          {/* Traffic Status */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-slate-700">
            <span
              className={`h-2 w-2 rounded-full ${
                traffic === 'severe'
                  ? 'bg-rose-500 animate-pulse'
                  : traffic === 'heavy'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="text-slate-500">Traffic:</span>
            <span className="font-semibold capitalize text-slate-800">{traffic}</span>
          </div>
        </div>

        {/* Right User Controls & Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher for seamless demonstration */}
          {selectedRole && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setSelectedRole('student')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedRole === 'student' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Student Dashboard"
              >
                👨‍🎓 Student
              </button>
              <button
                onClick={() => setSelectedRole('driver')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedRole === 'driver' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Driver Dashboard"
              >
                👨‍✈️ Driver
              </button>
              <button
                onClick={() => setSelectedRole('admin')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedRole === 'admin' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Admin Dashboard"
              >
                👨‍💼 Admin
              </button>
            </div>
          )}

          {/* Multilingual Voice language selector for Driver */}
          {selectedRole === 'driver' && (
            <div className="relative">
              <select
                value={driverLanguage}
                onChange={(e) => setDriverLanguage(e.target.value as SupportedLanguage)}
                className="text-xs bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                title="Select Driver Voice Language"
              >
                {Object.entries(LANGUAGE_METADATA).map(([code, meta]) => (
                  <option key={code} value={code}>
                    {meta.flag} {meta.label} ({meta.nativeName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Documentation Modal Launcher */}
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            title="System Documentation & Relational Schema"
          >
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Docs & API</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white p-3 shadow-2xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900">Transport Notifications</h3>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-medium">
                      {notifications.length}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 text-xs">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">No notifications yet.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          n.read
                            ? 'bg-slate-50/70 border-slate-100 text-slate-500'
                            : 'bg-blue-50/50 border-blue-100 text-slate-800 font-medium'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              n.type === 'alert'
                                ? 'bg-rose-100 text-rose-700'
                                : n.type === 'warning'
                                ? 'bg-amber-100 text-amber-800'
                                : n.type === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Logout */}
          {currentUser ? (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] font-medium text-slate-500 uppercase">{currentUser.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
