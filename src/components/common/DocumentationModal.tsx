import React, { useState } from 'react';
import {
  FileText,
  Database,
  Cpu,
  ShieldCheck,
  Code,
  Layers,
  MapPin,
  Sparkles,
  GitBranch,
} from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'aiml' | 'api'>('architecture');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                System Documentation & Architecture Manual
              </h3>
              <p className="text-xs text-slate-500">
                College Smart Transport: Full-Stack Architecture, AI/ML Specifications & Relational Schemas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'architecture' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Architecture & Roles</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'schema' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Relational Schema</span>
          </button>
          <button
            onClick={() => setActiveTab('aiml')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'aiml' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>AI / ML Predictor Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'api' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>Server-Side Gemini API</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-2 text-xs space-y-4 text-slate-700 leading-relaxed">
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                <h4 className="font-bold text-blue-900 text-sm mb-1">
                  Core Guiding Principle
                </h4>
                <p className="text-blue-800 font-medium">
                  “Don’t just track the bus. Intelligently manage and predict the student’s complete journey from home to college.”
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <h5 className="font-bold text-slate-900 mb-1">👨‍🎓 Student Experience</h5>
                  <p className="text-slate-600 text-[11px]">
                    Mobile-first view focused on "When Should I Leave Home?", live walking buffer calculations, alternative buses for missed rides, and natural language delay grounding.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <h5 className="font-bold text-slate-900 mb-1">👨‍✈️ Driver Cockpit</h5>
                  <p className="text-slate-600 text-[11px]">
                    Hands-free voice assistant supporting 6 languages (Telugu, Hindi, English, Tamil, Kannada, Malayalam), turn-by-turn geofencing, emergency SOS, and road condition reports.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <h5 className="font-bold text-slate-900 mb-1">👨‍💼 Administrator Console</h5>
                  <p className="text-slate-600 text-[11px]">
                    Central fleet management, real-time arrival logs, bus replacement dispatcher, passenger demand prediction, and telemetry anomaly alerts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3 font-mono text-[11.5px]">
              <div className="p-3 rounded-xl bg-slate-900 text-slate-200 overflow-x-auto">
                <span className="text-emerald-400 font-bold">// 1. Users Table (Role-Based Access)</span>
                <pre>{`TABLE users {
  id VARCHAR PRIMARY KEY,
  identifier VARCHAR UNIQUE, -- Roll number, Driver ID, or Email
  name VARCHAR NOT NULL,
  role VARCHAR CHECK (role IN ('student', 'driver', 'admin')),
  password_hash VARCHAR NOT NULL,
  assigned_bus_id VARCHAR REFERENCES buses(id),
  assigned_stop_id VARCHAR REFERENCES stops(id),
  walking_time_minutes INT DEFAULT 7,
  preferred_language VARCHAR DEFAULT 'te'
};`}</pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 text-slate-200 overflow-x-auto">
                <span className="text-blue-400 font-bold">// 2. Buses & Telemetry Table</span>
                <pre>{`TABLE buses {
  id VARCHAR PRIMARY KEY,
  bus_number VARCHAR UNIQUE, -- 'BUS-07'
  registration_number VARCHAR, -- 'TS-09-UB-1047'
  capacity INT NOT NULL,
  current_occupancy INT NOT NULL,
  driver_id VARCHAR REFERENCES users(id),
  route_id VARCHAR REFERENCES routes(id),
  status VARCHAR CHECK (status IN ('on-time', 'delayed', 'unavailable', 'route-changed', 'arrived')),
  current_lat DECIMAL(10,6),
  current_lng DECIMAL(10,6),
  current_speed_kmh DECIMAL(5,2),
  replacement_bus_id VARCHAR REFERENCES buses(id)
};`}</pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 text-slate-200 overflow-x-auto">
                <span className="text-purple-400 font-bold">// 3. Bus Arrival Logs Table</span>
                <pre>{`TABLE bus_arrival_records {
  id VARCHAR PRIMARY KEY,
  bus_number VARCHAR NOT NULL,
  route_code VARCHAR NOT NULL,
  driver_name VARCHAR NOT NULL,
  arrival_time VARCHAR NOT NULL,
  geofence_verified BOOLEAN DEFAULT TRUE,
  punctuality VARCHAR CHECK (punctuality IN ('ON_TIME', 'DELAYED'))
};`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'aiml' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <h5 className="font-bold text-slate-900 mb-1">1. ETA & Delay Regression Model</h5>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Inputs: GPS coordinate vectors, live velocity, historical corridor segment travel times, traffic congestion coefficient (1.0x to 1.95x), precipitation friction index, and passenger boarding dwell times.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <h5 className="font-bold text-slate-900 mb-1">2. "When Should I Leave Home?" Algorithm</h5>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Formula: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold">LeaveTime = PredictedStopETA - (StudentWalkingTime + SafetyBuffer)</code>. Ensures zero missed buses while minimizing waiting time exposed to inclement weather.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <h5 className="font-bold text-slate-900 mb-1">3. Missed Bus Rerouting & Capacity Allocation</h5>
                <p className="text-slate-600 text-xs leading-relaxed">
                  When triggered, queries all concurrent corridor buses, evaluates seat availability, estimates college gate arrival, and highlights the earliest compatible bus with confidence scoring.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                All Gemini AI interactions are routed securely through the Express backend endpoint (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/api/ai/explain</code>) using the official <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">@google/genai</code> SDK, guaranteeing client-side API key protection and graceful fallback.
              </p>
              <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                <pre>{`POST /api/ai/explain
Content-Type: application/json

{
  "busNumber": "BUS-07",
  "stopName": "Main Road",
  "delayMinutes": 8,
  "trafficCondition": "heavy",
  "weatherCondition": "Rain Expected",
  "rainProbability": 72
}

Response (200 OK):
{
  "explanation": "BUS-07 is expected to be delayed by approximately 8 minutes due to severe bottlenecking near KPHB arterial and wet road conditions. Please adjust your departure time accordingly."
}`}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
