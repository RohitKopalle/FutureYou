'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chart from 'chart.js/auto';
import {
  ArrowLeft,
  Activity,
  TrendingUp,
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
  'Physical Health': 'rgba(239, 68, 68, 0.7)',
  'Mental Health': 'rgba(168, 85, 247, 0.7)',
  'Career/Education': 'rgba(59, 130, 246, 0.7)',
  'Relationships': 'rgba(34, 197, 94, 0.7)',
  'Finance': 'rgba(234, 179, 8, 0.7)',
  'Hobbies': 'rgba(236, 72, 153, 0.7)',
};

// Helper: Get local date string YYYY-MM-DD (avoids timezone issues)
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Generate last N days ending TODAY
const getLast30Days = (numDays) => {
  const days = [];
  const today = new Date();
  for (let i = numDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(getLocalDateString(date));
  }
  return days;
};

// XP Calculation - SAME LOGIC AS add/page.js
const calculateLogXP = (log) => {
  let xp = 0;
  const domain = log.domain;

  const getNum = (val) => (val !== null && val !== undefined && val !== '' ? Number(val) : null);

  if (domain === 'Physical Health') {
    const sleep = getNum(log.sleepHours);
    if (sleep !== null) {
      if (sleep >= 7 && sleep <= 9) xp += 15;
      else if (sleep >= 6 && sleep <= 10) xp += 10;
      else if (sleep >= 4 && sleep <= 12) xp += 5;
      else xp -= 2;
    }
    const exercise = getNum(log.exerciseMinutes);
    if (exercise !== null) {
      if (exercise >= 40) xp += 15;
      else if (exercise >= 25) xp += 10;
      else if (exercise >= 10) xp += 5;
      else if (exercise > 0) xp -= 2;
    }
    const food = getNum(log.foodQuality);
    if (food !== null) {
      if (food >= 8) xp += 15;
      else if (food >= 6) xp += 10;
      else if (food >= 4) xp += 5;
      else if (food >= 1) xp -= 2;
    }
  } else if (domain === 'Mental Health') {
    const mood = getNum(log.mood);
    if (mood !== null) {
      if (mood >= 8) xp += 15;
      else if (mood >= 6) xp += 10;
      else if (mood >= 4) xp += 5;
      else if (mood >= 1) xp -= 2;
    }
  } else if (domain === 'Career/Education') {
    const study = getNum(log.studyHours);
    if (study !== null) {
      if (study >= 5) xp += 20;
      else if (study >= 3) xp += 15;
      else if (study >= 2) xp += 10;
      else if (study >= 1) xp += 5;
      else if (study >= 0) xp -= 2;
    }
  } else if (domain === 'Finance') {
    const spending = getNum(log.spending);
    if (spending !== null) {
      if (spending <= 500) xp += 20;
      else if (spending <= 1000) xp += 15;
      else if (spending <= 4000) xp += 10;
      else if (spending <= 8000) xp += 5;
      else xp -= 2;
    }
  } else if (domain === 'Hobbies') {
    const duration = getNum(log.screenTime);
    if (duration !== null) {
      if (duration >= 5) xp += 15;
      else if (duration >= 3) xp += 10;
      else if (duration >= 1) xp += 5;
    }
  } else if (domain === 'Relationships') {
    const time = getNum(log.qualityTime);
    if (time !== null) {
      if (time >= 4) xp += 15;
      else if (time >= 3) xp += 10;
      else if (time >= 1) xp += 5;
      else if (time >= 0) xp -= 2;
    }
    const count = getNum(log.socialCount);
    if (count !== null) {
      if (count >= 5) xp += 15;
      else if (count >= 3) xp += 10;
      else if (count >= 2) xp += 5;
      else if (count >= 1) xp += 2;
    }
    const quality = getNum(log.connectionQuality);
    if (quality !== null) {
      if (quality >= 8) xp += 15;
      else if (quality >= 6) xp += 10;
      else if (quality >= 4) xp += 5;
      else if (quality >= 1) xp -= 2;
    }
  }

  return Math.min(50, Math.max(-20, xp));
};

// Helper: Calculate average (only non-null values)
const calculateAverage = (values) => {
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validValues.length === 0) return 0;
  const sum = validValues.reduce((a, b) => a + b, 0);
  return Math.round((sum / validValues.length) * 10) / 10;
};

export default function AnalysisPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [habits, setHabits] = useState([]);
  const [dateRange, setDateRange] = useState(30);
  const [userProfile, setUserProfile] = useState(null);

  const lineChartRef = useRef(null);
  const barChartRef = useRef(null);
  const radarChartRef = useRef(null);
  const lineChartInstance = useRef(null);
  const barChartInstance = useRef(null);
  const radarChartInstance = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          router.push('/login');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('userId', userId)
          .single();

        if (profileError) throw profileError;
        setUserProfile(profile);

        const { data: habitsData, error: habitsError } = await supabase
          .from('habits')
          .select('*')
          .eq('userId', userId)
          .order('date', { ascending: true });

        if (habitsError) throw habitsError;

        console.log('Fetched Habits:', habitsData);
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

  const processedData = useMemo(() => {
    if (loading) return null;

    const dates = getLast30Days(dateRange);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    console.log('Date Range:', startDate, 'to', endDate);

    const filteredHabits = habits.filter(h => {
      const logDate = h.date.split('T')[0];
      return logDate >= startDate && logDate <= endDate;
    });

    console.log('Filtered Habits:', filteredHabits.length);

    const dailyXP = {};
    const domainCounts = {};
    const domainMetrics = {};

    dates.forEach(date => { dailyXP[date] = 0; });
    DOMAINS.forEach(d => {
      domainCounts[d] = 0;
      domainMetrics[d] = [];
    });

    let totalXP = 0;
    filteredHabits.forEach(log => {
      const logDate = log.date.split('T')[0];

      const xp = calculateLogXP(log);
      if (dailyXP.hasOwnProperty(logDate)) {
        dailyXP[logDate] += xp;
      }
      totalXP += xp;

      if (domainCounts.hasOwnProperty(log.domain)) {
        domainCounts[log.domain]++;
      }

      const getNum = (val) => (val !== null && val !== undefined && val !== '' ? Number(val) : null);
      let metricValue = null;

      switch (log.domain) {
        case 'Physical Health':
          // Combine sleep, exercise, and food quality
          // XP Rules: Sleep < 4 or > 12 = -2 XP.  Exercise 1-9 min = -2 XP. Food 1 = -2 XP.

          const sleepScore = (() => {
            const s = getNum(log.sleepHours);
            if (s === null) return null;
            if (s >= 7 && s <= 9) return 10;
            if (s >= 6 && s <= 10) return 7;
            if (s >= 5 && s <= 11) return 5;
            return 0; // <5 or >11 is -2 XP => Score 0
          })();

          const exerciseScore = (() => {
            const e = getNum(log.exerciseMinutes);
            if (e === null) return null;
            if (e >= 60) return 10;
            if (e >= 30) return 7;
            if (e >= 15) return 5;
            if (e >= 10) return 3; // 10-14 mins = +5 XP
            return 0; // <10 mins (including 1-9 mins which is -2 XP) => Score 0
          })();

          const foodScore = (() => {
            const f = getNum(log.foodQuality);
            if (f === null) return null;
            if (f >= 8) return 10; // +15 XP
            if (f >= 6) return 8;  // +10 XP
            if (f >= 4) return 5;  // +5 XP
            return 0; // 1-3 (incl 1 which is -2 XP) => Score 0
          })();

          const physicalScores = [sleepScore, exerciseScore, foodScore].filter(v => v !== null);
          if (physicalScores.length > 0) {
            metricValue = physicalScores.reduce((a, b) => a + b, 0) / physicalScores.length;
          }
          break;

        case 'Mental Health':
          // XP: Mood >= 8 (+15), >=6 (+10), >=4 (+5), >=1 (-2)
          const m = getNum(log.mood);
          if (m !== null) {
            if (m >= 8) metricValue = 10;
            else if (m >= 6) metricValue = 7;
            else if (m >= 4) metricValue = 5;
            else metricValue = 0; // Mood 1-3 is -2 XP => Score 0
          }
          break;

        case 'Career/Education':
          // XP: >=1 hr (+5+), <1 hr (-2 XP)
          const study = getNum(log.studyHours);
          if (study !== null) {
            if (study >= 4) metricValue = 10;
            else if (study >= 2) metricValue = 7;
            else if (study >= 1) metricValue = 5;
            else metricValue = 0; // <1 hr (incl 0) is -2 XP => Score 0
          }
          break;

        case 'Finance':
          // XP: <=8000 (+5+), >8000 (-2 XP)
          const spending = getNum(log.spending);
          if (spending !== null) {
            if (spending <= 500) metricValue = 10;
            else if (spending <= 1500) metricValue = 8;
            else if (spending <= 3000) metricValue = 6;
            else if (spending <= 8000) metricValue = 4;
            else metricValue = 0; // >8000 is -2 XP => Score 0
          }
          break;

        case 'Relationships':
          // XP penalties for time < 1hr? Or time >= 0 is -2 XP?
          // add/page.js logic for Rel: time >= 4 (+15), time >= 3 (+10), time >= 1 (+5), time >= 0 (-2)
          // So time < 1 but >= 0 gets -2 XP. 
          const timeScore = (() => {
            const t = getNum(log.qualityTime);
            if (t === null) return null;
            if (t >= 3) return 10;
            if (t >= 1) return 7;
            return 0; // <1 hr is -2 XP => Score 0
          })();

          // XP: Count >=1 (+2+). Count 0? Undefined but likely 0 XP or not logged.
          const socialScore = (() => {
            const c = getNum(log.socialCount);
            if (c === null) return null;
            if (c >= 5) return 10;
            if (c >= 3) return 7;
            if (c >= 1) return 5;
            return 0;
          })();

          // XP: Quality >= 4 (+5+), < 4 (-2 XP likely 1-3)
          const connQuality = (() => {
            const q = getNum(log.connectionQuality);
            if (q === null) return null;
            if (q >= 8) return 10;
            if (q >= 6) return 8;
            if (q >= 4) return 5;
            return 0; // 1-3 is -2 XP => Score 0
          })();

          const relScores = [timeScore, socialScore, connQuality].filter(v => v !== null);
          if (relScores.length > 0) {
            metricValue = relScores.reduce((a, b) => a + b, 0) / relScores.length;
          }
          break;

        case 'Hobbies':
          // XP: >=1 (+5+), <1 (0 XP? or -2?)
          // Usually <1 is not awarded. Code didn't explicit show -2.
          // But consistency: <1 hr = 0 score.
          const hobbyTime = getNum(log.screenTime);
          if (hobbyTime !== null) {
            if (hobbyTime >= 3) metricValue = 10;
            else if (hobbyTime >= 1) metricValue = 7;
            else metricValue = 0; // <1 hr => Score 0
          }
          break;
      }

      if (metricValue !== null && domainMetrics.hasOwnProperty(log.domain)) {
        domainMetrics[log.domain].push(metricValue);
      }
    });

    const cumulativeXP = [];
    let runningTotal = 0;
    dates.forEach(date => {
      runningTotal += dailyXP[date];
      cumulativeXP.push(runningTotal);
    });

    const radarData = DOMAINS.map(d => calculateAverage(domainMetrics[d]));

    // Streak grid (last 14 days) - aligned to weekdays
    const streakDates = getLast30Days(14);
    const streakGrid = [];

    // Add empty cells to align first date with correct weekday
    const firstDateStr = streakDates[0];
    const [fy, fm, fd] = firstDateStr.split('-').map(Number);
    const firstDate = new Date(fy, fm - 1, fd);
    const firstDayOfWeek = firstDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    for (let i = 0; i < firstDayOfWeek; i++) {
      streakGrid.push({ date: null, hasLog: false, isEmpty: true });
    }

    streakDates.forEach(dateStr => {
      const [y, m, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, day);
      const hasLog = habits.some(h => h.date.split('T')[0] === dateStr);
      streakGrid.push({ date: dateObj, hasLog, isEmpty: false });
    });

    const sortedDomains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
    const topDomain = sortedDomains[0] && sortedDomains[0][1] > 0 ? sortedDomains[0][0] : 'None';

    const result = {
      dates: dates.map(d => {
        const [y, m, day] = d.split('-').map(Number);
        return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      xpData: cumulativeXP,
      domainCounts,
      radarData,
      streakGrid,
      totalLogs: filteredHabits.length,
      avgXP: filteredHabits.length ? Math.round(totalXP / filteredHabits.length) : 0,
      topDomain
    };

    console.log('Processed Data:', result);
    return result;

  }, [habits, dateRange, loading]);

  useEffect(() => {
    if (!processedData || loading) return;

    if (lineChartInstance.current) lineChartInstance.current.destroy();
    if (barChartInstance.current) barChartInstance.current.destroy();
    if (radarChartInstance.current) radarChartInstance.current.destroy();

    if (lineChartRef.current) {
      lineChartInstance.current = new Chart(lineChartRef.current.getContext('2d'), {
        type: 'line',
        data: {
          labels: processedData.dates,
          datasets: [{
            label: 'Cumulative XP',
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
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }
          }
        }
      });
    }

    if (barChartRef.current) {
      barChartInstance.current = new Chart(barChartRef.current.getContext('2d'), {
        type: 'bar',
        data: {
          labels: DOMAINS,
          datasets: [{
            label: 'Logs',
            data: DOMAINS.map(d => processedData.domainCounts[d]),
            backgroundColor: DOMAINS.map(d => DOMAIN_COLORS[d]),
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { stepSize: 1 } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    if (radarChartRef.current) {
      radarChartInstance.current = new Chart(radarChartRef.current.getContext('2d'), {
        type: 'radar',
        data: {
          labels: DOMAINS,
          datasets: [{
            label: 'Avg Score (0-10)',
            data: processedData.radarData,
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
            borderColor: '#a855f7',
            borderWidth: 2,
            pointBackgroundColor: '#a855f7',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              angleLines: { color: '#e5e7eb' },
              grid: { color: '#e5e7eb' },
              min: 0,
              max: 10,
              ticks: { display: false }
            }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

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
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 md:p-8 pt-24 pb-20">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 fade-in-animation">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Progress Analysis</h1>
            <p className="text-gray-500">Visualize your journey and habits</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            {[7, 30, 365].map((days) => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === days ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {days === 365 ? 'All Time' : `Last ${days} Days`}
              </button>
            ))}
          </div>
        </div>

        {processedData?.totalLogs === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center fade-in-animation">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No data found</h3>
            <p className="text-gray-500 mb-6">
              {dateRange === 365 ? "You haven't logged any habits yet. Start today!" : "No habits found in this time range. Try selecting 'All Time' or log a new habit."}
            </p>
            <Link href="/add" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
              Log Your First Habit
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in-animation" style={{ animationDelay: '0.1s' }}>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Activity className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Logs</p>
                  <p className="text-2xl font-bold text-gray-900">{processedData?.totalLogs || 0}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><TrendingUp className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Avg XP / Log</p>
                  <p className="text-2xl font-bold text-gray-900">{processedData?.avgXP || 0}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Award className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Top Focus</p>
                  <p className="text-2xl font-bold text-gray-900">{processedData?.topDomain || 'None'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 fade-in-animation" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">XP Growth</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full">Cumulative</span>
                </div>
                <div className="h-64 w-full relative"><canvas ref={lineChartRef}></canvas></div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 fade-in-animation" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Domain Focus</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Activity Count</span>
                </div>
                <div className="h-64 w-full relative"><canvas ref={barChartRef}></canvas></div>
              </div>

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
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${day.isEmpty
                        ? 'bg-transparent'
                        : day.hasLog
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 hover:scale-105'
                          : 'bg-gray-100 text-gray-400 hover:scale-105'
                        }`}
                      title={day.date ? day.date.toLocaleDateString() : ''}
                    >
                      {day.isEmpty ? '' : day.date?.getDate()}
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">Current Streak: <span className="font-bold text-green-600">{userProfile?.currentStreak || 0} Days</span></p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 fade-in-animation" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Balance Check</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-purple-50 text-purple-600 rounded-full">Avg Ratings (0-10)</span>
                </div>
                <div className="h-64 w-full flex items-center justify-center relative"><canvas ref={radarChartRef}></canvas></div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}