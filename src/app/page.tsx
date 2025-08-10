'use client';

import { 
  Zap, 
  Menu, 
  ChevronDown, 
  Search, 
  Sun, 
  Bell, 
  User, 
  LogOut,
  Home as HomeIcon, 
  Ship, 
  CheckSquare, 
  List, 
  ClipboardList,
  Wifi,
  Phone,
  Monitor,
  SwitchCamera,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { dashboardService, DashboardData } from '../lib/dashboardService';
import { signOut, getBrowserClient } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  // Only show protected UI after auth confirms a user
  const showProtected = authChecked && !!user;

  // Fake data for the line chart - online status from Week 3 to Week 28
  const chartData = [
    { date: 'WK 3', cabinSwitch: 5, wifi: 8, pbx: 3, tv: 2 },
    { date: 'WK 4', cabinSwitch: 12, wifi: 15, pbx: 8, tv: 6 },
    { date: 'WK 5', cabinSwitch: 18, wifi: 22, pbx: 14, tv: 10 },
    { date: 'WK 6', cabinSwitch: 25, wifi: 28, pbx: 20, tv: 16 },
    { date: 'WK 7', cabinSwitch: 32, wifi: 35, pbx: 26, tv: 22 },
    { date: 'WK 8', cabinSwitch: 38, wifi: 42, pbx: 32, tv: 28 },
    { date: 'WK 9', cabinSwitch: 45, wifi: 48, pbx: 38, tv: 34 },
    { date: 'WK 10', cabinSwitch: 52, wifi: 55, pbx: 44, tv: 40 },
    { date: 'WK 11', cabinSwitch: 58, wifi: 62, pbx: 50, tv: 46 },
    { date: 'WK 12', cabinSwitch: 65, wifi: 68, pbx: 56, tv: 52 },
    { date: 'WK 13', cabinSwitch: 72, wifi: 75, pbx: 62, tv: 58 },
    { date: 'WK 14', cabinSwitch: 78, wifi: 82, pbx: 68, tv: 64 },
    { date: 'WK 15', cabinSwitch: 85, wifi: 88, pbx: 74, tv: 70 },
    { date: 'WK 16', cabinSwitch: 88, wifi: 92, pbx: 80, tv: 76 },
    { date: 'WK 17', cabinSwitch: 92, wifi: 95, pbx: 86, tv: 82 },
    { date: 'WK 18', cabinSwitch: 94, wifi: 97, pbx: 90, tv: 86 },
    { date: 'WK 19', cabinSwitch: 96, wifi: 98, pbx: 92, tv: 88 },
    { date: 'WK 20', cabinSwitch: 97, wifi: 99, pbx: 94, tv: 90 },
    { date: 'WK 21', cabinSwitch: 98, wifi: 99, pbx: 95, tv: 92 },
    { date: 'WK 22', cabinSwitch: 98, wifi: 99, pbx: 96, tv: 93 },
    { date: 'WK 23', cabinSwitch: 99, wifi: 99, pbx: 97, tv: 94 },
    { date: 'WK 24', cabinSwitch: 99, wifi: 99, pbx: 97, tv: 95 },
    { date: 'WK 25', cabinSwitch: 99, wifi: 99, pbx: 98, tv: 96 },
    { date: 'WK 26', cabinSwitch: 99, wifi: 99, pbx: 98, tv: 96 },
    { date: 'WK 27', cabinSwitch: 99, wifi: 99, pbx: 98, tv: 97 },
    { date: 'WK 28', cabinSwitch: 99, wifi: 99, pbx: 98, tv: 97 },
  ];

  // Colors for the pie chart
  const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7'];

  // State for pie chart data to prevent hydration issues
  const [pieChartData, setPieChartData] = useState<Array<{name: string, value: number, color: string}>>([]);

  // Function to generate pie chart data from dashboard data
  const getPieChartData = () => {
    if (!dashboardData) return [];
    
    return [
      { 
        name: 'Cabin Switch', 
        value: dashboardData.cabinSwitch.offline.total, 
        color: '#f97316',
        cabinCrew: dashboardData.cabinSwitch.offline.crew,
        cabinPax: dashboardData.cabinSwitch.offline.pax,
        publicCrew: 0,
        publicPax: 0
      },
      { 
        name: 'WiFi', 
        value: dashboardData.wifi.offline.total, 
        color: '#3b82f6',
        cabinCrew: dashboardData.wifi.offline.cabinCrew,
        cabinPax: dashboardData.wifi.offline.cabinPax,
        publicCrew: dashboardData.wifi.offline.publicCrew,
        publicPax: dashboardData.wifi.offline.publicPax
      },
      { 
        name: 'PBX', 
        value: dashboardData.pbx.offline.total, 
        color: '#22c55e',
        cabinCrew: dashboardData.pbx.offline.cabinCrew,
        cabinPax: dashboardData.pbx.offline.cabinPax,
        publicCrew: dashboardData.pbx.offline.publicCrew,
        publicPax: dashboardData.pbx.offline.publicPax
      },
      { 
        name: 'TV', 
        value: dashboardData.tv.offline.total, 
        color: '#a855f7',
        cabinCrew: dashboardData.tv.offline.crew,
        cabinPax: dashboardData.tv.offline.pax,
        publicCrew: 0,
        publicPax: 0
      }
    ].filter(item => item.value > 0); // Only show systems with offline devices
  };

  // Update pie chart data when dashboard data changes
  useEffect(() => {
    if (dashboardData) {
      setPieChartData(getPieChartData());
    }
  }, [dashboardData]);

  // Fetch dashboard data only after auth is checked and a user exists
  useEffect(() => {
    if (!authChecked || !user) return;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.getDashboardData();
        setDashboardData(data);
        setPieChartData(getPieChartData());
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, user]);

  // Auth effect: confirm session with getUser() before showing dashboard.
  useEffect(() => {
    const supabaseBrowser = getBrowserClient();
    if (!supabaseBrowser) {
      console.error('Failed to get browser client');
      return;
    }

    const confirmSession = async () => {
      try {
        // First check if a session exists locally
        const { data: { session } } = await supabaseBrowser.auth.getSession();
        if (!session) {
          setUser(null);
          setAuthChecked(true);
          return;
        }
        // Validate the session with the server. If token is expired/invalid, this will fail,
        // preventing a dashboard flash followed by redirect.
        const { data: userResp, error: userErr } = await supabaseBrowser.auth.getUser();
        if (userErr || !userResp?.user) {
          console.warn('Session invalid or user not found; treating as signed out');
          setUser(null);
          setAuthChecked(true);
          return;
        }
        setUser(userResp.user);
        setAuthChecked(true);
      } catch (e) {
        console.error('Error confirming session:', e);
        setUser(null);
        setAuthChecked(true);
      }
    };

    confirmSession();

    // Listen for auth changes and re-confirm when signed in
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_OUT') {
          setUser(null);
          return;
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
          try {
            if (session?.user) {
              setUser(session.user);
            } else {
              const { data: userResp, error: userErr } = await supabaseBrowser.auth.getUser();
              if (!userErr && userResp?.user) setUser(userResp.user);
            }
          } catch {}
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Client-side guard: patiently wait for session before deciding to redirect.
  // This prevents a brief flash to the dashboard followed by an unnecessary sign-in redirect on first load.
  useEffect(() => {
    if (!authChecked || user) return;
    let cancelled = false;
    const supabaseBrowser = getBrowserClient();
    const start = Date.now();
    const maxWaitMs = 2500; // allow time for session restoration on cold loads

    const waitForSessionThenMaybeRedirect = async () => {
      if (!supabaseBrowser) return router.replace('/auth/signin?loggedOut=1');
      try {
        while (!cancelled && Date.now() - start < maxWaitMs) {
          const { data: { session } } = await supabaseBrowser.auth.getSession();
          if (session?.user) {
            // Session appeared; stop checking and keep the user on the page
            setUser(session.user);
            return;
          }
          await new Promise(r => setTimeout(r, 150));
        }
      } catch (_) {
        // fall through to redirect
      }
      if (!cancelled) {
        router.replace('/auth/signin?loggedOut=1');
      }
    };

    waitForSessionThenMaybeRedirect();
    return () => { cancelled = true; };
  }, [authChecked, user, router]);

  const handleSignOut = async () => {
    // Use the unified signOut function from supabaseClient
    try {
      await signOut();
    } finally {
      // Client-side fallback to ensure navigation even if network is slow
      try {
        router.replace('/auth/signin?loggedOut=1');
      } catch (e) {
        // no-op
      }
    }
  };

  const truncateEmail = (email: string) => {
    if (email.length > 20) {
      return email.substring(0, 17) + '...';
    }
    return email;
  };

  if (!showProtected) {
    // Render a minimal placeholder to avoid flashing dashboard before redirect/sign-in
    return (
      <div className="min-h-screen bg-slate-800 text-white flex items-center justify-center">
        <div className="flex items-center space-x-2 text-slate-300 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking session…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium">
              <span className="text-green-500">Beaty</span>
              <span className="text-orange-500">.pro</span>
            </span>
          </div>
          
          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm">{truncateEmail(user.email)}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-md shadow-lg border border-slate-600 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-slate-400 border-b border-slate-600">
                        {user.email}
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin?loggedOut=1"
                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 min-h-screen border-r border-slate-700">
          <nav className="p-4">
            <div className="space-y-2">
              <div className="bg-teal-600 rounded px-3 py-2 flex items-center space-x-3">
                <HomeIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </div>
              
              <div className="text-slate-400 text-xs uppercase tracking-wider px-3 py-2">CONTROLS</div>
              
              <Link href="/ship-drawings" className="px-3 py-2 flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Ship className="w-5 h-5" />
                  <span>Ship Drawings</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Link>
              

              <Link href="/remarks" className="px-3 py-2 flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
                <div className="flex items-center space-x-3">
                  <CheckSquare className="w-5 h-5" />
                  <span>Remarks</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Link>
              
              <Link href="/public-cable-list" className="px-3 py-2 flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
                <div className="flex items-center space-x-3">
                  <List className="w-5 h-5" />
                  <span>Public Cable List</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Link>
              
              <Link href="/cabin-cable-list" className="px-3 py-2 flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
                <div className="flex items-center space-x-3">
                  <ClipboardList className="w-5 h-5" />
                  <span>Cabin Cable List</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Dashboard Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Ship Systems Dashboard - <span className="text-slate-400">WGC <span className="text-sm">3.0</span></span></h1>
            </div>
            <div className="text-slate-400 text-sm">
              {dashboardData?.lastUpdated 
                ? `Last Updated: ${new Date(dashboardData.lastUpdated).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}`
                : 'Last Updated: Loading...'
              }
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Status Cards Stacked */}
            <div className="col-span-3">
              <div className="space-y-4">
                {/* Cabin Switch Status */}
                <div className="bg-slate-700 rounded-lg p-3 h-24">
                <div className="flex justify-between items-start mb-0">
                  <div className="text-slate-400 text-xs">Cabin Switch Status</div>
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <SwitchCamera className="h-4 w-4 text-white" />
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    <div className="text-slate-400 text-sm">Loading...</div>
                  </div>
                ) : error ? (
                  <div className="text-red-400 text-sm">Error loading data</div>
                ) : (
                  <div className="-mt-1">
                    <div className="flex">
                      <div className="text-right mr-3">
                        <div className="text-lg font-semibold">
                          {dashboardData?.cabinSwitch.online.total || 0}
                        </div>
                        <div className={`text-lg font-semibold ${(dashboardData?.cabinSwitch.offline.total || 0) > 0 ? 'flash-offline' : ''}`}>
                          {dashboardData?.cabinSwitch.offline.total || 0}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-xs text-green-400 font-medium flex items-center" style={{ height: '24px' }}>ONLINE</div>
                        <div className="text-xs text-red-500 font-medium flex items-center" style={{ height: '24px', marginTop: '2px' }}>OFFLINE</div>
                      </div>
                    </div>

                  </div>
                )}
              </div>

                {/* WiFi Status */}
                <div className="bg-slate-700 rounded-lg p-3 h-24">
                <div className="flex justify-between items-start mb-0">
                  <div className="text-slate-400 text-xs">WiFi Status</div>
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Wifi className="h-4 w-4 text-white" />
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    <div className="text-slate-400 text-sm">Loading...</div>
                  </div>
                ) : error ? (
                  <div className="text-red-400 text-sm">Error loading data</div>
                ) : (
                  <div className="-mt-1">
                    <div className="flex">
                      <div className="text-right mr-3">
                        <div className="text-lg font-semibold">
                          {dashboardData?.wifi.online.total || 0}
                        </div>
                        <div className={`text-lg font-semibold ${(dashboardData?.wifi.offline.total || 0) > 0 ? 'flash-offline' : ''}`}>
                          {dashboardData?.wifi.offline.total || 0}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-xs text-green-400 font-medium flex items-center" style={{ height: '24px' }}>ONLINE</div>
                        <div className="text-xs text-red-500 font-medium flex items-center" style={{ height: '24px', marginTop: '2px' }}>OFFLINE</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

                {/* PBX Status */}
                <div className="bg-slate-700 rounded-lg p-3 h-24">
                <div className="flex justify-between items-start mb-0">
                  <div className="text-slate-400 text-xs">PBX Status</div>
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    <div className="text-slate-400 text-sm">Loading...</div>
                  </div>
                ) : error ? (
                  <div className="text-red-400 text-sm">Error loading data</div>
                ) : (
                  <div className="-mt-1">
                    <div className="flex">
                      <div className="text-right mr-3">
                        <div className="text-lg font-semibold">
                          {dashboardData?.pbx.online.total || 0}
                        </div>
                        <div className={`text-lg font-semibold ${(dashboardData?.pbx.offline.total || 0) > 0 ? 'flash-offline' : ''}`}>
                          {dashboardData?.pbx.offline.total || 0}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-xs text-green-400 font-medium flex items-center" style={{ height: '24px' }}>ONLINE</div>
                        <div className="text-xs text-red-500 font-medium flex items-center" style={{ height: '24px', marginTop: '2px' }}>OFFLINE</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

                {/* TV Status */}
                <div className="bg-slate-700 rounded-lg p-3 h-24">
                <div className="flex justify-between items-start mb-0">
                  <div className="text-slate-400 text-xs">TV Status</div>
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Monitor className="h-4 w-4 text-white" />
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    <div className="text-slate-400 text-sm">Loading...</div>
                  </div>
                ) : error ? (
                  <div className="text-red-400 text-sm">Error loading data</div>
                ) : (
                  <div className="-mt-1">
                    <div className="flex">
                      <div className="text-right mr-3">
                        <div className="text-lg font-semibold">
                          {dashboardData?.tv.online.total || 0}
                        </div>
                        <div className={`text-lg font-semibold ${(dashboardData?.tv.offline.total || 0) > 0 ? 'flash-offline' : ''}`}>
                          {dashboardData?.tv.offline.total || 0}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-xs text-green-400 font-medium flex items-center" style={{ height: '24px' }}>ONLINE</div>
                        <div className="text-xs text-red-500 font-medium flex items-center" style={{ height: '24px', marginTop: '2px' }}>OFFLINE</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              </div>

              {/* Pie Chart - Offline Systems */}
              <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-4 shadow-2xl h-[320px] mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-slate-400 text-sm">Offline Distribution</div>
                  <div className="text-slate-400 text-xs">
                    {dashboardData?.totalOffline || 0} Total Offline
                  </div>
                </div>
                {/* Pie Chart */}
                <div className="relative transform-gpu h-56">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-full text-red-400 text-sm">
                      Error loading data
                    </div>
                  ) : pieChartData.length > 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="relative">
                        <ResponsiveContainer width={200} height={200}>
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              innerRadius={40}
                              fill="#8884d8"
                              dataKey="value"
                              startAngle={90}
                              endAngle={-270}
                              paddingAngle={4}
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.color}
                                  stroke="#1f2937"
                                  strokeWidth={1}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  const value = payload[0].value;
                                  const name = payload[0].name;
                                  
                                  let breakdown = '';
                                  if (data.cabinCrew > 0 || data.cabinPax > 0 || data.publicCrew > 0 || data.publicPax > 0) {
                                    const cabinTotal = (data.cabinCrew || 0) + (data.cabinPax || 0);
                                    const publicTotal = (data.publicCrew || 0) + (data.publicPax || 0);
                                    
                                    breakdown = `\n\nCABIN: ${cabinTotal}\nPUBLIC: ${publicTotal}`;
                                  }
                                  
                                  return (
                                    <div style={{
                                      backgroundColor: 'rgba(55, 65, 81, 0.6)',
                                      border: '1px solid #4B5563',
                                      borderRadius: '6px',
                                      padding: '6px 10px',
                                      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.2)',
                                      color: '#F3F4F6',
                                      fontWeight: 'bold',
                                      fontSize: '10px',
                                      whiteSpace: 'pre-line',
                                      lineHeight: '1.2'
                                    }}>
                                      <div style={{ color: '#F3F4F6', fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>
                                        {name}
                                      </div>
                                      <div style={{ color: '#F3F4F6', fontWeight: 'bold', fontSize: '10px' }}>
                                        <span style={{ color: '#dc2626' }}>{value} OFFLINE</span>{breakdown}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Legend */}
                        <div className="absolute left-0 bottom-0 -ml-24 space-y-2">
                          {pieChartData.map((entry, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-sm" 
                                style={{ backgroundColor: entry.color }}
                              ></div>
                              <span className="text-xs text-slate-300">{entry.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                      All systems online
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Charts */}
            <div className="col-span-9">
              <div className="bg-slate-700 rounded-lg p-4 h-[432px]">
                <div className="mb-4">
                  <div className="text-slate-400 text-sm font-medium">Online Status</div>
                </div>
                {/* Line Chart */}
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF" 
                        fontSize={10}
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        interval={0}
                        tickMargin={8}
                      />
                      <YAxis 
                        stroke="#9CA3AF" 
                        fontSize={12}
                        tick={{ fill: '#9CA3AF' }}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#374151', 
                          border: '1px solid #4B5563',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }}
                        labelStyle={{ color: '#9CA3AF' }}
                      />
                      <Legend 
                        wrapperStyle={{ color: '#F3F4F6' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cabinSwitch" 
                        stroke="#f97316" 
                        strokeWidth={2}
                        name="Cabin Switch"
                        dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="wifi" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="WiFi"
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pbx" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        name="PBX"
                        dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="tv" 
                        stroke="#a855f7" 
                        strokeWidth={2}
                        name="TV"
                        dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Offline Summary Table */}
              <div className="mt-6">
                <div className="bg-slate-700 rounded-lg p-4 h-[320px]">
                  <div className="mb-4">
                    <div className="text-slate-400 text-sm font-medium">Offline Summary</div>
                  </div>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        <div className="text-slate-400 text-sm ml-2">Loading...</div>
                      </div>
                    ) : error ? (
                      <div className="text-red-400 text-sm text-center py-8">Error loading data</div>
                    ) : dashboardData ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-600">
                              <th className="text-left py-2 px-3 text-slate-300 font-medium">System</th>
                              <th className="text-center py-2 px-3 text-slate-300 font-medium">Cabin Crew</th>
                              <th className="text-center py-2 px-3 text-slate-300 font-medium">Cabin Pax</th>
                              <th className="text-center py-2 px-3 text-slate-300 font-medium">Public Crew</th>
                              <th className="text-center py-2 px-3 text-slate-300 font-medium">Public Pax</th>
                              <th className="text-center py-2 px-3 text-slate-300 font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-slate-600">
                              <td className="py-2 px-3 text-slate-300 font-medium">Cabin Switch</td>
                              <td className="py-2 px-3 text-center text-red-400">{dashboardData.cabinSwitch.offline.crew || 0}</td>
                              <td className="py-2 px-3 text-center text-red-400">{dashboardData.cabinSwitch.offline.pax || 0}</td>
                              <td className="py-2 px-3 text-center text-red-400">-</td>
                              <td className="py-2 px-3 text-center text-red-400">-</td>
                              <td className="py-2 px-3 text-center text-red-500 font-semibold">{dashboardData.cabinSwitch.offline.total || 0}</td>
                            </tr>
                            <tr className="border-b border-slate-600">
                              <td className="py-2 px-3 text-slate-300 font-medium">WiFi</td>
                              <td className="py-2 px-3 text-center text-red-400">{dashboardData.wifi.offline.cabinCrew || 0}</td>
                              <td className="py-2 px-3 text-center text-red-400">{dashboardData.wifi.offline.cabinPax || 0}</td>
                              <td className="py-2 px-3 text-center text-red-400">{dashboardData.wifi.offline.publicCrew || 0}</td>
                              <td className="py-2 px-3 text-center text-red-400">{dashboardData.wifi.offline.publicPax || 0}</td>
                              <td className="py-2 px-3 text-center text-red-500 font-semibold">{dashboardData.wifi.offline.total || 0}</td>
                            </tr>
                            <tr className="border-b border-slate-600">
                              <td className="py-2 px-3 text-slate-300 font-medium">PBX</td>
                              <td className="py-2 px-3 text-center text-red-400">{dashboardData.pbx.offline.cabinCrew || 0}</td>
                              <td className="py-2 px-3 text-center text-red-400">{dashboardData.pbx.offline.cabinPax || 0}</td>
                              <td className="py-2 px-3 text-center text-red-400">{dashboardData.pbx.offline.publicCrew || 0}</td>
                              <td className="py-2 px-3 text-center text-red-400">{dashboardData.pbx.offline.publicPax || 0}</td>
                              <td className="py-2 px-3 text-center text-red-500 font-semibold">{dashboardData.pbx.offline.total || 0}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 text-slate-300 font-medium">TV</td>
                              <td className="py-2 px-3 text-center text-red-400">{dashboardData.tv.offline.cabinCrew || 0}</td>
                              <td className="py-2 px-3 text-center text-red-400">{dashboardData.tv.offline.cabinPax || 0}</td>
                              <td className="py-2 px-3 text-center text-red-400">-</td>
                              <td className="py-2 px-3 text-center text-red-400">-</td>
                              <td className="py-2 px-3 text-center text-red-500 font-semibold">{dashboardData.tv.offline.total || 0}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-sm text-center py-8">No data available</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </main>
      </div>
    </div>
  );
}



