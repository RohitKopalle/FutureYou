'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Heart,
  Brain,
  BookOpen,
  Users,
  Smile,
  Flame,
  Loader2,
  Calendar,
  Activity,
  IndianRupee,
  Trophy,
  Zap,
  ArrowUpRight
} from 'lucide-react';

const DOMAINS = [
  { id: 'physical', label: 'Physical Health', icon: Heart, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', gradient: 'from-red-500 to-rose-600' },
  { id: 'mental', label: 'Mental Health', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', gradient: 'from-purple-500 to-violet-600' },
  { id: 'career', label: 'Career/Education', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', gradient: 'from-blue-500 to-cyan-600' },
  { id: 'relationships', label: 'Relationships', icon: Users, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100', gradient: 'from-green-500 to-emerald-600' },
  { id: 'finance', label: 'Finance', icon: IndianRupee, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-100', gradient: 'from-yellow-500 to-amber-600' },
  { id: 'hobbies', label: 'Hobbies', icon: Smile, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100', gradient: 'from-pink-500 to-fuchsia-600' },
];

const RANK_COLORS = {
  'Beginner': 'bg-gray-500',
  'Novice': 'bg-blue-500',
  'Intermediate': 'bg-green-500',
  'Advanced': 'bg-purple-500',
  'Expert': 'bg-orange-500',
  'Master': 'bg-yellow-500',
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [domainData, setDomainData] = useState({});
  const [quickStats, setQuickStats] = useState({
    totalLogs: 0,
    daysActive: 0,
    longestStreak: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        router.push('/login');
        return;
      }
      fetchDashboardData(userId);
    }
  }, [router]);

  const fetchDashboardData = async (userId) => {
    try {
      setLoading(true);
      setError('');

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('userId', userId)
        .single();

      if (profileError || !profileData) {
        setError('User profile not found');
        setLoading(false);
        return;
      }

      setUserData(profileData);

      // Fetch habits data for this user
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('userId', userId)
        .order('date', { ascending: false });

      if (habitsError) {
        console.error('Error fetching habits:', habitsError);
      } else {
        // Get latest entry for each domain
        const latestByDomain = {};
        const uniqueDates = new Set();

        habitsData?.forEach((habit) => {
          // Track unique dates
          if (habit.date) {
            uniqueDates.add(habit.date);
          }

          // Get latest entry for each domain
          const domain = habit.domain || Object.keys(DOMAINS).find(
            key => habit[key] !== null && habit[key] !== undefined
          );

          if (domain && (!latestByDomain[domain] ||
            (!latestByDomain[domain].date || (habit.date && habit.date > latestByDomain[domain].date)))) {
            latestByDomain[domain] = habit;
          }
        });

        setDomainData(latestByDomain);
        setQuickStats({
          totalLogs: habitsData?.length || 0,
          daysActive: uniqueDates.size || 0,
          longestStreak: profileData.longestStreak || 0,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No logs yet';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'No logs yet';
    }
  };

  const getNextLevelXP = (level) => {
    return level * 100;
  };

  const getXPProgress = () => {
    if (!userData) return { current: 0, next: 100, percentage: 0 };
    const currentXP = userData.points || 0;
    const level = userData.level || 1;
    const nextLevelXP = getNextLevelXP(level);
    const currentLevelXP = (level - 1) * 100;
    const progressXP = currentXP - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    const percentage = Math.min(100, Math.max(0, (progressXP / neededXP) * 100));
    return { current: progressXP, next: neededXP, percentage, currentXP, nextLevelXP };
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8 pt-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !userData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8 pt-24">
        <div className="mx-auto max-w-7xl">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium">{error || 'Failed to load dashboard'}</p>
          </div>
        </div>
      </main>
    );
  }

  const { current, next, percentage, currentXP, nextLevelXP } = getXPProgress();
  const userLevel = userData.level || 1;
  const userRank = userData.rank || 'Beginner';
  const streak = userData.currentStreak || 0;
  const userName = userData.name || 'User';

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 md:p-8 pt-24 pb-20">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header / Player Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl text-white p-8 md:p-10 fade-in-animation">
          {/* Background Patterns */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar & Level */}
            <div className="relative">
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-white/10 backdrop-blur-md border-4 border-white/20 flex items-center justify-center shadow-2xl">
                <span className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                  {getInitials(userName)}
                </span>
              </div>
              <div className="absolute -bottom-3 -right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white">
                LVL {userLevel}
              </div>
            </div>

            {/* Stats & Progress */}
            <div className="flex-1 w-full text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{userName}</h1>
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <span className="px-3 py-1 rounded-full bg-white/20 text-sm font-medium backdrop-blur-sm border border-white/10">
                      {userRank}
                    </span>
                    <div className="flex items-center gap-1.5 text-orange-200 font-bold bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/30">
                      <Flame className="h-4 w-4 fill-current animate-pulse" />
                      <span>{streak} Day Streak</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-center md:justify-end">
                  <div className="text-center bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10 min-w-[80px]">
                    <div className="text-2xl font-bold">{quickStats.totalLogs}</div>
                    <div className="text-xs text-blue-100">Logs</div>
                  </div>
                  <div className="text-center bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10 min-w-[80px]">
                    <div className="text-2xl font-bold">{quickStats.longestStreak}</div>
                    <div className="text-xs text-blue-100">Best Streak</div>
                  </div>
                </div>
              </div>

              {/* XP Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium text-blue-100">
                  <span>XP Progress</span>
                  <span>{Math.round(current)} / {next} XP</span>
                </div>
                <div className="h-4 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm shadow-inner relative">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full relative shadow-lg transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-blue-200/80">
                  <span>Current: {currentXP} XP</span>
                  <span>Next Level: {nextLevelXP} XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Your Domains
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DOMAINS.map((domain, index) => {
              const Icon = domain.icon;
              const latestLog = domainData[domain.label] || domainData[domain.id];
              const lastLogDate = latestLog?.date ? formatDate(latestLog.date) : 'No logs yet';

              return (
                <div
                  key={domain.id}
                  className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 relative overflow-hidden fade-in-animation"
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 ${domain.bg} rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500`} />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl ${domain.bg} ${domain.color} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        {lastLogDate}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-1">{domain.label}</h3>
                    <p className="text-sm text-gray-500 mb-6 line-clamp-2">
                      Track your progress in {domain.label.toLowerCase()}
                    </p>

                    <Link
                      href={`/add?domain=${encodeURIComponent(domain.label)}`}
                      className={`flex items-center justify-center w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${domain.gradient} opacity-90 hover:opacity-100 shadow-lg shadow-gray-200 hover:shadow-xl transition-all duration-300 active:scale-95`}
                    >
                      <Zap className="w-4 h-4 mr-2 fill-current" />
                      Log Activity
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}