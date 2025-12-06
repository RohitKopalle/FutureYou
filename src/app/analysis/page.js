'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chart from 'chart.js/auto';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Activity,
  Award,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

const DOMAINS = [
  'Physical Health',
  'Mental Health',
  'Career/Education',
  'Relationships',
  'Finance',
  'Hobbies'
];

const DOMAIN_COLORS = {
  'Physical Health': 'rgba(239, 68, 68, 0.7)', // red-500
  'Mental Health': 'rgba(168, 85, 247, 0.7)', // purple-500
  'Career/Education': 'rgba(59, 130, 246, 0.7)', // blue-500
  'Relationships': 'rgba(34, 197, 94, 0.7)', // green-500
  'Finance': 'rgba(234, 179, 8, 0.7)', // yellow-500
  'Hobbies': 'rgba(236, 72, 153, 0.7)', // pink-500
};

export default function AnalysisPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [habits, setHabits] = useState([]);
  const [dateRange, setDateRange] = useState(30); // 7, 30, or 365 (All time)
  const [userProfile, setUserProfile] = useState(null);

  // Canvas Refs
  const lineChartRef = useRef(null);
  const barChartRef = useRef(null);
  const radarChartRef = useRef(null);

  // Chart Instances Refs
  const lineChartInstance = useRef(null);
  const barChartInstance = useRef(null);
  const radarChartInstance = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          router.push('/login');
          return;
        }

        // Fetch User Profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('userId', userId)
          .single();

        if (profileError) throw profileError;
        setUserProfile(profile);

        // Fetch Habits
        const { data: habitsData, error: habitsError } = await supabase
          .from('habits')
          .select('*')
          .eq('userId', userId)
          .order('date', { ascending: true });

        if (habitsError) throw habitsError;
        setHabits(habitsData || []);

      } catch (err) {
        console.error('Error fetching analysis data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Process Data based on Date Range
  const processedData = useMemo(() => {
    if (!habits.length) return null;

    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - dateRange);

    const filteredHabits = habits.filter(h => new Date(h.date) >= cutoffDate);

    // 1. XP Progress (Cumulative) & Domain XP
    const xpByDate = {};
    const xpByDomain = {};
    DOMAINS.forEach(d => xpByDomain[d] = 0);

    let cumulativeXP = 0;

    // Initialize dates for the range to ensure continuous line
    for (let d = new Date(cutoffDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      xpByDate[dateStr] = 0;
    }

    filteredHabits.forEach(h => {
      let xp = 10; // Base XP for logging

      // Calculate XP based on domain-specific metrics
      switch (h.domain) {
        case 'Physical Health':
          if (h.exerciseDuration > 0) xp += Math.min(20, h.exerciseDuration / 2); // 1 min = 0.5 XP
          if (h.sleepHours >= 7) xp += 10;
          if (h.foodQuality >= 7) xp += 5;
          break;
        case 'Mental Health':
          if (h.meditationDuration > 0) xp += Math.min(20, h.meditationDuration); // 1 min = 1 XP
          if (h.mood >= 7) xp += 10;
          break;
        case 'Career/Education':
          if (h.studyHours > 0) xp += Math.min(30, h.studyHours * 5); // 1 hr = 5 XP
          if (h.readingDuration > 0) xp += Math.min(20, h.readingDuration / 2);
          break;
        case 'Relationships':
          if (h.qualityTime > 0) xp += Math.min(20, h.qualityTime * 5);
          if (h.connectionQuality >= 7) xp += 10;
          if (h.socialCount > 0) xp += 5;
          break;
        case 'Finance':
          // Assuming simple log count or manual input for now
          xp += 5;
          break;
        case 'Hobbies':
          // Assuming generic duration or just log
          xp += 10;
          break;
        default:
          break;
      }

      // General Mood Bonus
      if (h.mood >= 8) xp += 5;

      // Update Daily XP
      const date = h.date;
      if (xpByDate[date] !== undefined) {
        xpByDate[date] += xp;
      }

      // Update Domain XP
      if (xpByDomain[h.domain] !== undefined) {
        xpByDomain[h.domain] += xp;
      }
    });

    // Cumulative sum for Line Chart
    const sortedDates = Object.keys(xpByDate).sort();
    const xpData = [];
    let runningTotal = 0;
    sortedDates.forEach(date => {
      runningTotal += xpByDate[date];
      xpData.push(runningTotal);
    });


    // 2. Domain Activity (Count)
    const domainCounts = {};
    DOMAINS.forEach(d => domainCounts[d] = 0);
    filteredHabits.forEach(h => {
      if (domainCounts[h.domain] !== undefined) {
        domainCounts[h.domain]++;
      }
    });

    // 3. Radar Data (Total XP per Domain)
    // We use the calculated xpByDomain
    const radarData = DOMAINS.map(d => xpByDomain[d]);

    // 4. Streak Grid
    const streakGrid = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasLog = habits.some(h => h.date === dateStr);
      streakGrid.push({ date: d, hasLog });
    }

    return {
      dates: sortedDates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      xpData,
      domainCounts,
      radarData,
      streakGrid,
      totalLogs: filteredHabits.length,
      avgXP: filteredHabits.length ? Math.round(runningTotal / filteredHabits.length) : 0,
      topDomain: Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0][0]
    };

  }, [habits, dateRange]);


  // Initialize Charts
  useEffect(() => {
    if (!processedData || loading) return;

    // Destroy existing charts
    if (lineChartInstance.current) lineChartInstance.current.destroy();
    if (barChartInstance.current) barChartInstance.current.destroy();
    if (radarChartInstance.current) radarChartInstance.current.destroy();

    // 1. Line Chart
    if (lineChartRef.current) {
      const ctx = lineChartRef.current.getContext('2d');
      lineChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: processedData.dates,
          datasets: [{
            label: 'Estimated XP Growth',
            data: processedData.xpData,
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: '#3b82f6',
            tension: 0.4,
            pointRadius: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              titleColor: '#1f2937',
              bodyColor: '#1f2937',
              borderColor: '#e5e7eb',
              borderWidth: 1,
              padding: 10,
            }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // 2. Bar Chart
    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext('2d');
      barChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: DOMAINS,
          datasets: [{
            label: 'Logs',
            data: DOMAINS.map(d => processedData.domainCounts[d] || 0),
            backgroundColor: DOMAINS.map(d => DOMAIN_COLORS[d]),
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // 3. Radar Chart
    if (radarChartRef.current) {
      const ctx = radarChartRef.current.getContext('2d');
      radarChartInstance.current = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: DOMAINS,
          datasets: [{
            label: 'Total XP Earned',
            data: processedData.radarData,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: '#3b82f6',
            borderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              angleLines: { color: '#e5e7eb' },
              grid: { color: '#e5e7eb' },
              suggestedMin: 0,
              // Remove suggestedMax to let it scale automatically based on XP
              ticks: { backdropColor: 'transparent', display: false } // Hide ticks for cleaner look
            }
          },
          plugins: {
            legend: { display: false }, // Hide legend as it's just one dataset
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `XP Earned: ${context.raw}`;
                }
              }
            }
          }
        }
      });
    }

    // Cleanup function
    return () => {
      if (lineChartInstance.current) lineChartInstance.current.destroy();
      if (barChartInstance.current) barChartInstance.current.destroy();
      if (radarChartInstance.current) radarChartInstance.current.destroy();
    };
  }, [processedData, loading]);


  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 md:p-8 pt-24 pb-20">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 fade-in-animation">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Progress Analysis</h1>
            <p className="text-gray-500">Visualize your journey and habits</p>
          </div>

          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            {[7, 30, 365].map((days) => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === days
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {days === 365 ? 'All Time' : `Last ${days} Days`}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in-animation" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{processedData?.totalLogs || 0}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Avg XP / Log</p>
              <p className="text-2xl font-bold text-gray-900">{processedData?.avgXP || 0}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Top Focus</p>
              <p className="text-2xl font-bold text-gray-900">{processedData?.topDomain || 'None'}</p>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* XP Progress */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 fade-in-animation" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">XP Growth</h3>
              <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full">Cumulative</span>
            </div>
            <div className="h-64 w-full relative">
              <canvas ref={lineChartRef}></canvas>
            </div>
          </div>

          {/* Domain Activity */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 fade-in-animation" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Domain Focus</h3>
              <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Activity Count</span>
            </div>
            <div className="h-64 w-full relative">
              <canvas ref={barChartRef}></canvas>
            </div>
          </div>

          {/* Weekly Streak Grid */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 fade-in-animation" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Consistency</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div> Logged
                <div className="w-3 h-3 bg-gray-100 rounded-sm"></div> Missed
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs text-gray-400 font-medium py-1">{day}</div>
              ))}
              {processedData?.streakGrid.map((day, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all hover:scale-105 ${day.hasLog
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                    : 'bg-gray-100 text-gray-400'
                    }`}
                  title={day.date.toLocaleDateString()}
                >
                  {day.date.getDate()}
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Current Streak: <span className="font-bold text-green-600">{userProfile?.currentStreak || 0} Days</span>
              </p>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 fade-in-animation" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Balance Check</h3>
              <span className="text-xs font-medium px-2 py-1 bg-purple-50 text-purple-600 rounded-full">Avg Ratings</span>
            </div>
            <div className="h-64 w-full flex items-center justify-center relative">
              <canvas ref={radarChartRef}></canvas>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
