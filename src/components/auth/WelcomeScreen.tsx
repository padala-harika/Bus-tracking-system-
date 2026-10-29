import React, { useState } from 'react';
import { useTransport } from '../../context/TransportContext';
import { UserRole } from '../../types';
import {
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  KeyRound,
  Bus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserPlus,
  LogIn,
  ShieldAlert,
  ShieldCheck,
  Building,
  UserCheck,
} from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { routes, login, registerStudent, registerDriver } = useTransport();

  // Active modal state
  const [activeRoleForLogin, setActiveRoleForLogin] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Sign In inputs
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingApprovalNotice, setPendingApprovalNotice] = useState<{
    driverId: string;
    message: string;
  } | null>(null);

  // Student Sign Up inputs
  const [studentName, setStudentName] = useState('');
  const [studentRollNumber, setStudentRollNumber] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentStopId, setStudentStopId] = useState('stop-a3');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentSuccessBanner, setStudentSuccessBanner] = useState<string | null>(null);

  // Driver Sign Up inputs
  const [driverName, setDriverName] = useState('');
  const [driverIdInput, setDriverIdInput] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [showDriverPassword, setShowDriverPassword] = useState(false);
  const [driverSubmittedNotice, setDriverSubmittedNotice] = useState<{
    name: string;
    driverId: string;
    email: string;
  } | null>(null);

  // Password Recovery Modal
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleOpenAuth = (role: UserRole, mode: 'login' | 'signup' = 'login') => {
    // Admin does NOT allow public sign up
    const targetMode = role === 'admin' ? 'login' : mode;
    setActiveRoleForLogin(role);
    setAuthMode(targetMode);
    setErrorMsg('');
    setPendingApprovalNotice(null);
    setStudentSuccessBanner(null);
    setDriverSubmittedNotice(null);

    // Prefill demo default credentials when opening in login mode
    if (targetMode === 'login') {
      if (role === 'student') {
        setIdentifier('24CS070');
        setPassword('student123');
      } else if (role === 'driver') {
        setIdentifier('DRV-07');
        setPassword('driver123');
      } else if (role === 'admin') {
        setIdentifier('admin@college.edu');
        setPassword('admin123');
      }
    } else {
      // Clear inputs for clean sign up experience
      setIdentifier('');
      setPassword('');
      if (role === 'student') {
        setStudentName('');
        setStudentRollNumber('');
        setStudentEmail('');
        setStudentPassword('');
        setStudentStopId('stop-a3');
      } else if (role === 'driver') {
        setDriverName('');
        setDriverIdInput('');
        setDriverEmail('');
        setDriverPassword('');
      }
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPendingApprovalNotice(null);

    if (!identifier || !password) {
      setErrorMsg('Please enter both your account identifier and password.');
      return;
    }

    if (!activeRoleForLogin) return;

    const result = login(identifier.trim(), password, activeRoleForLogin);

    if (!result.success) {
      if (result.isPendingApproval) {
        setPendingApprovalNotice({
          driverId: identifier.trim().toUpperCase(),
          message: result.message || 'Driver account pending administrator verification.',
        });
      } else {
        setErrorMsg(result.message || 'Invalid credentials or role mismatch. Please verify your details.');
      }
    }
  };

  const handleStudentSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!studentName.trim() || !studentRollNumber.trim() || !studentEmail.trim() || !studentPassword.trim()) {
      setErrorMsg('Please fill in all student registration fields.');
      return;
    }

    if (studentPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    const regResult = registerStudent({
      name: studentName.trim(),
      rollNumber: studentRollNumber.trim().toUpperCase(),
      email: studentEmail.trim().toLowerCase(),
      password: studentPassword,
      stopId: studentStopId,
    });

    if (!regResult.success) {
      setErrorMsg(regResult.message);
      return;
    }

    // Success: Transition to Student Login with credentials prefilled
    setStudentSuccessBanner(
      `Welcome ${studentName}! Your account has been registered. You can now log in below.`
    );
    setIdentifier(studentRollNumber.trim().toUpperCase());
    setPassword(studentPassword);
    setAuthMode('login');
  };

  const handleDriverSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!driverName.trim() || !driverIdInput.trim() || !driverEmail.trim() || !driverPassword.trim()) {
      setErrorMsg('Please fill in all driver registration fields.');
      return;
    }

    if (driverPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    const regResult = registerDriver({
      name: driverName.trim(),
      driverId: driverIdInput.trim().toUpperCase(),
      email: driverEmail.trim().toLowerCase(),
      password: driverPassword,
    });

    if (!regResult.success) {
      setErrorMsg(regResult.message);
      return;
    }

    // Show pending approval confirmation screen
    setDriverSubmittedNotice({
      name: driverName.trim(),
      driverId: driverIdInput.trim().toUpperCase(),
      email: driverEmail.trim().toLowerCase(),
    });
  };

  const handleQuickDemoLogin = (role: UserRole, id: string, pass: string) => {
    setActiveRoleForLogin(role);
    setAuthMode('login');
    setIdentifier(id);
    setPassword(pass);
    setPendingApprovalNotice(null);
    setErrorMsg('');
    login(id, pass, role);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-50 via-blue-50/20 to-slate-100">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

      {/* Main Welcome Container */}
      <div className="relative z-10 w-full max-w-4xl text-center">
        {/* College Transportation Crest / Badge */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/25 ring-8 ring-blue-100/60">
          <Bus className="h-8 w-8" />
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 font-display">
          COLLEGE SMART TRANSPORT
        </h1>
        <p className="mt-2 text-base sm:text-lg text-slate-600 font-medium">
          “Your journey, intelligently managed.”
        </p>

        <p className="mt-4 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Intelligent end-to-end trip prediction, live GPS tracking, AI-powered arrival forecasting, and automated fleet coordination from home to campus.
        </p>

        {/* Section Heading: "Who are you?" */}
        <div className="mt-10 sm:mt-12">
          <span className="inline-block rounded-full bg-blue-100/80 px-4 py-1 text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">
            Portal Access
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Select Your Role
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Choose your portal to continue to your dashboard
          </p>
        </div>

        {/* Three Large Role Options Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 text-left">
          {/* 1. Student Card */}
          <div
            id="role-card-student"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-3xl group-hover:scale-110 transition-transform">
                  👨‍🎓
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200">
                  Student Portal
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Student
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Track your assigned bus, check AI arrival predictions at your stop, receive departure alerts, and access alternative backup buses if delayed.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                id="btn-login-student"
                onClick={() => handleOpenAuth('student', 'login')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-sm font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Login as Student</span>
              </button>
            </div>
          </div>

          {/* 2. Driver Card */}
          <div
            id="role-card-driver"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-3xl group-hover:scale-110 transition-transform">
                  👨‍✈️
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  Driver Portal
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Driver
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Mobile-first driver cockpit with one-tap trip initiation, multilingual voice navigation (Telugu, Hindi, etc.), automatic stop alerts, and SOS dispatch.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                id="btn-login-driver"
                onClick={() => handleOpenAuth('driver', 'login')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 px-4 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Login as Driver</span>
              </button>
            </div>
          </div>

          {/* 3. Admin Card */}
          <div
            id="role-card-admin"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-purple-500 transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-50 text-3xl group-hover:scale-110 transition-transform">
                  👨‍💼
                </div>
                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 border border-purple-200 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Admin Portal
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Admin
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Central management console: fleet oversight, driver verification & approvals, real-time arrival logs, bus replacement workflows, and AI route telemetry.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                id="btn-login-admin"
                onClick={() => handleOpenAuth('admin', 'login')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 px-4 text-sm font-bold text-white shadow-xs hover:bg-purple-700 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Login as Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Reviewer Demo Fill Bar */}
        <div className="mt-10 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="font-bold text-slate-800">Quick Demo Evaluator:</span>
            <span className="text-slate-500 hidden sm:inline">Launch directly into any account state with 1-click</span>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <button
              id="demo-student-priya"
              onClick={() => handleQuickDemoLogin('student', '24CS070', 'student123')}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors"
            >
              Demo Student (Priya)
            </button>
            <button
              id="demo-driver-approved"
              onClick={() => handleQuickDemoLogin('driver', 'DRV-07', 'driver123')}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors"
            >
              Demo Driver (Ravi - Approved)
            </button>
            <button
              id="demo-driver-pending"
              onClick={() => {
                setActiveRoleForLogin('driver');
                setAuthMode('login');
                setIdentifier('DRV-19');
                setPassword('driver123');
                setPendingApprovalNotice({
                  driverId: 'DRV-19',
                  message:
                    'Driver Account Pending Admin Approval: Registration for DRV-19 (Mahesh Babu) has been received and requires administrator verification before dashboard access is permitted.',
                });
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100 transition-colors border border-amber-200"
              title="Test pending driver restriction"
            >
              Test Pending Driver (Mahesh)
            </button>
            <button
              id="demo-admin"
              onClick={() => handleQuickDemoLogin('admin', 'admin@college.edu', 'admin123')}
              className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100 transition-colors"
            >
              Demo Admin (Dr. Sharma)
            </button>
          </div>
        </div>
      </div>

      {/* Role-Based Login & Sign-Up Modal */}
      {activeRoleForLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 text-left my-8">
            {/* Close button */}
            <button
              onClick={() => {
                setActiveRoleForLogin(null);
                setPendingApprovalNotice(null);
                setErrorMsg('');
                setStudentSuccessBanner(null);
                setDriverSubmittedNotice(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                {activeRoleForLogin === 'student' ? '👨‍🎓' : activeRoleForLogin === 'driver' ? '👨‍✈️' : '👨‍💼'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900 capitalize">
                    {activeRoleForLogin} Portal
                  </h3>
                  {activeRoleForLogin === 'admin' && (
                    <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                      <Lock className="h-3 w-3" /> Secure Console
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {activeRoleForLogin === 'student'
                    ? 'Student Bus Tracking, Arrival Forecasting & Route Notifications'
                    : activeRoleForLogin === 'driver'
                    ? 'Driver GPS Dispatch, Multilingual Audio & Turn-by-Turn Navigation'
                    : 'Fleet Coordination, Route Analytics & Driver Approvals'}
                </p>
              </div>
            </div>

            {/* Top Mode Tabs (Sign In vs Sign Up) */}
            {activeRoleForLogin !== 'admin' ? (
              <div className="flex rounded-xl bg-slate-100 p-1 mb-5 border border-slate-200 text-xs">
                <button
                  type="button"
                  id="tab-sign-in"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg('');
                    setPendingApprovalNotice(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-bold rounded-lg transition-all ${
                    authMode === 'login'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  id="tab-sign-up"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMsg('');
                    setPendingApprovalNotice(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-bold rounded-lg transition-all ${
                    authMode === 'signup'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>
                    {activeRoleForLogin === 'student' ? 'Create Account / Sign Up' : 'Driver Sign Up'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="mb-5 p-3 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-bold">Restricted Administration Access</p>
                  <p className="text-[11px] text-purple-700">
                    Public registration is disabled for safety and fleet control. Admin accounts are provisioned exclusively by college transport IT.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Student Success Banner when registered */}
            {studentSuccessBanner && authMode === 'login' && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Account Created Successfully!</p>
                  <p className="text-[11px] text-emerald-700">{studentSuccessBanner}</p>
                </div>
              </div>
            )}

            {/* Driver Pending Approval Alert */}
            {pendingApprovalNotice && (
              <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Driver Account Pending Admin Approval</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Driver profile <strong className="font-semibold">{pendingApprovalNotice.driverId}</strong> has been registered but has not yet been verified by the Transport Administrator. You will be able to access the Driver Dashboard once approved.
                </p>
                <div className="pt-2 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-amber-700">
                    Need approval to test?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      // Switch to Admin to approve
                      handleOpenAuth('admin', 'login');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs"
                  >
                    Open Admin Console to Approve
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1: LOGIN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                {/* Identifier Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {activeRoleForLogin === 'student'
                      ? 'Student Roll Number / Student ID'
                      : activeRoleForLogin === 'driver'
                      ? 'Driver ID / Mobile Number'
                      : 'Admin ID / College Email'}
                  </label>
                  <input
                    id="login-identifier-input"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      activeRoleForLogin === 'student'
                        ? 'e.g. 24CS070 or your registered roll number'
                        : activeRoleForLogin === 'driver'
                        ? 'e.g. DRV-07 or DRV-19'
                        : 'e.g. admin@college.edu'
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
                      required
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="btn-submit-login"
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In to {activeRoleForLogin.toUpperCase()} Dashboard</span>
                </button>

                {/* Switch to Sign Up link if student or driver */}
                {activeRoleForLogin !== 'admin' && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setErrorMsg('');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Don't have an account?{' '}
                      <span className="underline">
                        {activeRoleForLogin === 'student'
                          ? 'Create Student Account'
                          : 'Register as Driver'}
                      </span>
                    </button>
                  </div>
                )}

                {/* Demo credentials note */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-500">
                  Demo Credentials: <span className="font-semibold text-slate-700">{identifier}</span> /{' '}
                  <span className="font-semibold text-slate-700">{password}</span>
                </div>
              </form>
            )}

            {/* TAB 2: STUDENT SIGN UP FORM */}
            {authMode === 'signup' && activeRoleForLogin === 'student' && (
              <form onSubmit={handleStudentSignUp} className="space-y-3.5 text-xs">
                <div className="rounded-xl bg-blue-50 p-3 border border-blue-200 text-blue-900 text-xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                    <span>Instant Student Registration</span>
                  </div>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Enter your student details and pick your daily boarding stop. You will be able to log in immediately.
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    id="student-signup-name"
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Ananya Roy"
                    required
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Roll Number & Email in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Roll Number / Student ID
                    </label>
                    <input
                      id="student-signup-roll"
                      type="text"
                      value={studentRollNumber}
                      onChange={(e) => setStudentRollNumber(e.target.value)}
                      placeholder="e.g. 24CS105"
                      required
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      College Email Address
                    </label>
                    <input
                      id="student-signup-email"
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="e.g. ananya.roy@college.edu"
                      required
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Password</label>
                  <div className="relative">
                    <input
                      id="student-signup-password"
                      type={showStudentPassword ? 'text' : 'password'}
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="Create secure password (min 4 characters)"
                      required
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 pr-10 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showStudentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Pickup Stop Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pickup Stop / Morning Boarding Point
                  </label>
                  <select
                    id="student-signup-stop"
                    value={studentStopId}
                    onChange={(e) => setStudentStopId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    {routes.map((route) => (
                      <optgroup key={route.id} label={`${route.code} — ${route.name}`}>
                        {route.stops
                          .filter((s) => !s.name.includes('Apex College Campus Terminal'))
                          .map((stop) => (
                            <option key={stop.id} value={stop.id}>
                              {stop.name} (Scheduled: {stop.scheduledTime})
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Your bus assignment and departure recommendations will be tuned to this stop.
                  </p>
                </div>

                {/* Submit Sign Up Button */}
                <button
                  type="submit"
                  id="btn-submit-student-signup"
                  className="w-full mt-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register & Proceed to Student Login</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                  >
                    Already have an account? <span className="text-blue-600 underline">Sign In</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: DRIVER SIGN UP FORM */}
            {authMode === 'signup' && activeRoleForLogin === 'driver' && (
              <div>
                {driverSubmittedNotice ? (
                  /* Driver Registration Submitted Confirmation Screen */
                  <div className="space-y-4 py-2 text-xs">
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3">
                      <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <span>Registration Received — Pending Admin Approval</span>
                      </div>
                      <p className="text-xs leading-relaxed text-amber-900">
                        Thank you, <strong className="font-semibold">{driverSubmittedNotice.name}</strong>. Your driver registration profile has been recorded in the transport database.
                      </p>
                      <div className="rounded-lg bg-white/80 p-3 border border-amber-200 text-slate-700 space-y-1 font-mono text-[11px]">
                        <div>
                          <span className="text-slate-400">Driver ID:</span>{' '}
                          <strong className="text-slate-900 font-bold">{driverSubmittedNotice.driverId}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Email:</span> {driverSubmittedNotice.email}
                        </div>
                        <div>
                          <span className="text-slate-400">Verification Status:</span>{' '}
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-sans font-bold">
                            Pending Admin Review
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        In accordance with campus safety protocols, newly registered driver accounts require administrator verification before the Driver Cockpit and GPS dispatch system can be accessed.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDriverSubmittedNotice(null);
                          setAuthMode('login');
                          setIdentifier(driverSubmittedNotice.driverId);
                          setPassword(driverPassword);
                        }}
                        className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-700 text-center transition-colors"
                      >
                        Return to Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Allow reviewer to switch to admin console to approve immediately
                          handleOpenAuth('admin', 'login');
                        }}
                        className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 py-2.5 text-xs font-bold text-white text-center shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Log in as Admin to Approve</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Driver Sign Up Form */
                  <form onSubmit={handleDriverSignUp} className="space-y-3.5 text-xs">
                    <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-amber-900 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800">
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                        <span>Administrator Approval Required</span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        In accordance with campus transport safety protocols, all driver registrations undergo administrative verification before driver dashboard access is granted.
                      </p>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                      <input
                        id="driver-signup-name"
                        type="text"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="e.g. Ramesh Goud"
                        required
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>

                    {/* Driver ID / Employee ID & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Employee / Driver ID
                        </label>
                        <input
                          id="driver-signup-id"
                          type="text"
                          value={driverIdInput}
                          onChange={(e) => setDriverIdInput(e.target.value)}
                          placeholder="e.g. DRV-15"
                          required
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 uppercase focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Email Address
                        </label>
                        <input
                          id="driver-signup-email"
                          type="email"
                          value={driverEmail}
                          onChange={(e) => setDriverEmail(e.target.value)}
                          placeholder="e.g. ramesh.driver@college.edu"
                          required
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                      <div className="relative">
                        <input
                          id="driver-signup-password"
                          type={showDriverPassword ? 'text' : 'password'}
                          value={driverPassword}
                          onChange={(e) => setDriverPassword(e.target.value)}
                          placeholder="Create account password (min 4 characters)"
                          required
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 pr-10 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDriverPassword(!showDriverPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showDriverPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Notice on post-registration workflow */}
                    <p className="text-[11px] text-slate-500 italic">
                      Note: Once submitted, an administrator will review your credentials in the Admin Console.
                    </p>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      id="btn-submit-driver-signup"
                      className="w-full mt-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Submit Driver Registration (Pending Approval)</span>
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                      >
                        Already have an approved account? <span className="text-emerald-600 underline">Sign In</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-left">
            <h4 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-blue-600" /> Password Recovery
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Enter your registered ID or college email address to receive secure OTP reset instructions.
            </p>

            {forgotSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Reset Link Dispatched
                </div>
                <p>A secure password reset verification link has been dispatched to your registered address.</p>
                <button
                  onClick={() => {
                    setForgotPasswordOpen(false);
                    setForgotSuccess(false);
                  }}
                  className="w-full mt-2 rounded-lg bg-emerald-600 py-2 text-white font-semibold"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter ID or college email"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setForgotPasswordOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setForgotSuccess(true)}
                    className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700"
                  >
                    Send Reset Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
