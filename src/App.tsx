import React, { useState } from 'react';
import { TransportProvider, useTransport } from './context/TransportContext';
import { Header } from './components/common/Header';
import { WelcomeScreen } from './components/auth/WelcomeScreen';
import { StudentDashboard } from './components/student/StudentDashboard';
import { DriverDashboard } from './components/driver/DriverDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DemoScenarioBar } from './components/common/DemoScenarioBar';
import { DocumentationModal } from './components/common/DocumentationModal';

const MainLayout: React.FC = () => {
  const { currentUser, selectedRole } = useTransport();
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col pb-36">
      {/* Top Navigation Bar */}
      <Header onOpenDocs={() => setIsDocsOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1">
        {!currentUser || !selectedRole ? (
          <WelcomeScreen />
        ) : selectedRole === 'student' ? (
          <StudentDashboard />
        ) : selectedRole === 'driver' ? (
          <DriverDashboard />
        ) : (
          <AdminDashboard />
        )}
      </main>

      {/* Floating Demo Scenarios Tray */}
      <DemoScenarioBar />

      {/* Full Architecture & Schema Modal */}
      <DocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <TransportProvider>
      <MainLayout />
    </TransportProvider>
  );
}
