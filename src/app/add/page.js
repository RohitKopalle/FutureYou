'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Heart,
  Brain,
  BookOpen,
  Users,
  Smile,
  Zap,
  Loader2,
  Calendar,
  IndianRupee,
  ArrowLeft,
  CheckCircle2,
  Trophy
} from 'lucide-react';
import Link from 'next/link';

const DOMAINS = [
  { id: 'Physical Health', label: 'Physical Health', icon: Heart, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', gradient: 'from-red-500 to-rose-600' },
  { id: 'Mental Health', label: 'Mental Health', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', gradient: 'from-purple-500 to-violet-600' },
  { id: 'Career/Education', label: 'Career/Education', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', gradient: 'from-blue-500 to-cyan-600' },
  { id: 'Relationships', label: 'Relationships', icon: Users, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100', gradient: 'from-green-500 to-emerald-600' },
  { id: 'Finance', label: 'Finance', icon: IndianRupee, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-100', gradient: 'from-yellow-500 to-amber-600' },
  { id: 'Hobbies', label: 'Hobbies', icon: Smile, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100', gradient: 'from-pink-500 to-fuchsia-600' },
];

const MOOD_EMOJIS = ['😢', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '🥳', '😍'];

export default function AddLogPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [earnedXP, setEarnedXP] = useState(0);

  // Form fields
  const [formData, setFormData] = useState({
    sleepHours: '',
    exerciseMinutes: '',
    foodQuality: '',
    mood: '',
    studyHours: '',
    screenTime: '',
    spending: '',
    // Relationships
    qualityTime: '',
    socialCount: '',
    connectionQuality: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uid = localStorage.getItem('userId');
      if (!uid) {
        router.push('/login');
        return;
      }
      setUserId(uid);
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const domainParam = params.get('domain');

      if (domainParam) {
        const matchedDomain = DOMAINS.find(d => d.label === domainParam);
        if (matchedDomain) {
          setSelectedDomain(matchedDomain);
        }
      }
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const calculateXP = () => {
    if (!selectedDomain) return 0;

    let xp = 0;
    const domain = selectedDomain.label;

    // Calculate XP based on quality of values
    if (domain === 'Physical Health') {
      if (formData.sleepHours) {
        const sleep = parseFloat(formData.sleepHours);
        if (sleep >= 7 && sleep <= 9) xp += 15;
        else if (sleep >= 6 && sleep <= 10) xp += 10;
        else if (sleep >= 4 && sleep <= 12) xp += 5;
        else xp -= 2;
      }
      if (formData.exerciseMinutes) {
        const exercise = parseInt(formData.exerciseMinutes);
        if (exercise >= 40) xp += 15;
        else if (exercise >= 25) xp += 10;
        else if (exercise >= 10) xp += 5;
        else if (exercise > 0) xp -= 2;
      }
      if (formData.foodQuality) {
        const food = parseInt(formData.foodQuality);
        if (food >= 8) xp += 15;
        else if (food >= 6) xp += 10;
        else if (food >= 4) xp += 5;
        else if (food >= 1) xp -= 2;
      }
    } else if (domain === 'Mental Health') {
      if (formData.mood) {
        const mood = parseInt(formData.mood);
        if (mood >= 8) xp += 15;
        else if (mood >= 6) xp += 10;
        else if (mood >= 4) xp += 5;
        else if (mood >= 1) xp -= 2;
      }
    } else if (domain === 'Career/Education') {
      if (formData.studyHours) {
        const study = parseFloat(formData.studyHours);
        if (study >= 5) xp += 20;
        else if (study >= 3) xp += 15;
        else if (study >= 2) xp += 10;
        else if (study >= 1) xp += 5;
        else if (study >= 0) xp -= 2;
      }
    } else if (domain === 'Finance') {
      if (formData.spending) {
        const spending = parseFloat(formData.spending);
        if (spending <= 500) xp += 20;
        else if (spending <= 1000) xp += 15;
        else if (spending <= 4000) xp += 10;
        else if (spending <= 8000) xp += 5;
        else xp -= 2;
      }
    } else if (domain === 'Hobbies') {
      if (formData.screenTime) {
        const screen = parseFloat(formData.screenTime);
        if (screen >= 5) xp += 15;
        else if (screen >= 3) xp += 10;
        else if (screen >= 1) xp += 5;
      }
    } else if (domain === 'Relationships') {
      // Quality Time: More time = more XP
      if (formData.qualityTime) {
        const time = parseFloat(formData.qualityTime);
        if (time >= 4) xp += 15;
        else if (time >= 3) xp += 10;
        else if (time >= 1) xp += 5;
        else if (time >= 0) xp -= 2;
      }

      // Social Interactions: More connections = more XP
      if (formData.socialCount) {
        const count = parseInt(formData.socialCount);
        if (count >= 5) xp += 15;
        else if (count >= 3) xp += 10;
        else if (count >= 2) xp += 5;
        else if (count >= 1) xp += 2;
      }

      // Connection Quality: Higher = more XP
      if (formData.connectionQuality) {
        const quality = parseInt(formData.connectionQuality);
        if (quality >= 8) xp += 15;
        else if (quality >= 6) xp += 10;
        else if (quality >= 4) xp += 5;
        else if (quality >= 1) xp -= 2;
      }
    }

    if (formData.notes && formData.notes.trim() !== '') {
      xp += 0;
    }

    return Math.min(50, Math.max(-20, xp));
  };

  const handleSubmit = async () => {
    if (!selectedDomain) {
      setError('Please select a domain');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use local date to avoid timezone issues
      const getLocalDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const currentDate = getLocalDate(new Date());

      // Calculate yesterday's date
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = getLocalDate(yesterdayDate);


      const xpEarned = calculateXP();
      setEarnedXP(xpEarned);

      const habitData = {
        userId: userId,
        domain: selectedDomain.label,
        date: currentDate,
        sleepHours: formData.sleepHours ? parseFloat(formData.sleepHours) : null,
        studyHours: formData.studyHours ? parseFloat(formData.studyHours) : null,
        screenTime: formData.screenTime ? parseFloat(formData.screenTime) : null,
        exerciseMinutes: formData.exerciseMinutes ? parseInt(formData.exerciseMinutes) : null,
        foodQuality: formData.foodQuality ? parseInt(formData.foodQuality) : null,
        spending: formData.spending ? parseFloat(formData.spending) : null,
        mood: formData.mood ? parseInt(formData.mood) : null,
        qualityTime: formData.qualityTime ? parseFloat(formData.qualityTime) : null,
        socialCount: formData.socialCount ? parseInt(formData.socialCount) : null,
        connectionQuality: formData.connectionQuality ? parseInt(formData.connectionQuality) : null,
      };

      // Check if user has already logged today
      const { data: todayLogs, error: todayError } = await supabase
        .from('habits')
        .select('id')
        .eq('userId', userId)
        .eq('date', currentDate);

      if (todayError) throw todayError;

      const hasLoggedToday = todayLogs && todayLogs.length > 0;

      // Insert the new log
      const { error: habitError } = await supabase.from('habits').insert(habitData);
      if (habitError) throw habitError;

      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('userId', userId)
        .single();
      if (userError) throw userError;

      const newPoints = (userData.points || 0) + xpEarned;
      const newLevel = Math.floor(newPoints / 100) + 1;

      let newRank;
      if (newLevel >= 21) newRank = 'Master';
      else if (newLevel >= 16) newRank = 'Expert';
      else if (newLevel >= 11) newRank = 'Advanced';
      else if (newLevel >= 6) newRank = 'Intermediate';
      else if (newLevel >= 3) newRank = 'Novice';
      else newRank = 'Beginner';

      // Streak Logic
      let newStreak = userData.currentStreak || 0;

      if (!hasLoggedToday) {
        // This is the first log of the day

        // Check if user logged yesterday
        const { data: yesterdayLogs, error: yesterdayError } = await supabase
          .from('habits')
          .select('id')
          .eq('userId', userId)
          .eq('date', yesterday)
          .limit(1);

        if (yesterdayError) throw yesterdayError;

        const hasLoggedYesterday = yesterdayLogs && yesterdayLogs.length > 0;

        if (hasLoggedYesterday) {
          // Continue streak
          newStreak++;
        } else {
          // Reset streak (unless it's the very first log ever, but logic holds: 0 -> 1)
          newStreak = 1;
        }
      }
      // If hasLoggedToday is true, we do NOT change the streak.

      const newLongestStreak = Math.max(userData.longestStreak || 0, newStreak);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          points: newPoints,
          level: newLevel,
          rank: newRank,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          updatedAt: new Date().toISOString(),
        })
        .eq('userId', userId);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2500);
    } catch (err) {
      console.error('Error logging habit:', err);
      setError(err.message || 'Failed to log habit');
      setLoading(false);
    }
  };

  const renderDomainFields = () => {
    if (!selectedDomain) return null;
    const domain = selectedDomain.label;

    return (
      <div className="space-y-6 mt-8 fade-in-animation">
        {domain === 'Physical Health' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Hours (0-24)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.sleepHours}
                  onChange={(e) => handleInputChange('sleepHours', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 bg-gray-50/50"
                  placeholder="e.g. 7.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exercise Minutes</label>
                <input
                  type="number"
                  min="0"
                  value={formData.exerciseMinutes}
                  onChange={(e) => handleInputChange('exerciseMinutes', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 bg-gray-50/50"
                  placeholder="e.g. 45"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Food Quality (1-10)</label>
              <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
                <span>🍔 Junk / Processed</span>
                <span>🥗 Balanced / Healthy</span>
              </div>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleInputChange('foodQuality', rating)}
                    className={`w-10 h-10 rounded-lg font-bold transition-all duration-200 ${formData.foodQuality === rating
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                1 = Mostly processed/fast food, 10 = Whole, nutrient-dense meals
              </p>
            </div>
          </>
        )}

        {domain === 'Mental Health' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Mood (1-10)</label>
            <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
              <span>😞 Distressed</span>
              <span>😐 Neutral</span>
              <span>🤩 Thriving</span>
            </div>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleInputChange('mood', rating)}
                  className={`p-3 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 ${formData.mood === rating
                    ? 'bg-purple-100 border-2 border-purple-500 shadow-lg scale-110'
                    : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                    }`}
                >
                  <span className="text-2xl">{MOOD_EMOJIS[rating - 1]}</span>
                  <span className={`text-xs font-bold ${formData.mood === rating ? 'text-purple-700' : 'text-gray-500'}`}>{rating}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Rate how you felt overall today, from very low to excellent
            </p>
          </div>
        )}

        {domain === 'Career/Education' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Study Hours</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={formData.studyHours}
              onChange={(e) => handleInputChange('studyHours', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 bg-gray-50/50"
              placeholder="e.g. 4"
            />
          </div>
        )}

        {domain === 'Finance' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Spending Amount (₹)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <IndianRupee className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.spending}
                onChange={(e) => handleInputChange('spending', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 bg-gray-50/50"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {domain === 'Hobbies' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time spent on Hobbies (hours)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={formData.screenTime}
              onChange={(e) => handleInputChange('screenTime', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 bg-gray-50/50"
              placeholder="e.g. 1.5"
            />
          </div>
        )}

        {domain === 'Relationships' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality Time (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.qualityTime}
                  onChange={(e) => handleInputChange('qualityTime', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 bg-gray-50/50"
                  placeholder="e.g. 2.5"
                />
                <p className="text-xs text-gray-500 mt-1">Time spent with family/friends</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Social Interactions</label>
                <input
                  type="number"
                  min="0"
                  value={formData.socialCount}
                  onChange={(e) => handleInputChange('socialCount', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 bg-gray-50/50"
                  placeholder="e.g. 3"
                />
                <p className="text-xs text-gray-500 mt-1">Meaningful conversations today</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Connection Quality (1-10)</label>
              <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
                <span>😔 Lonely</span>
                <span>😊 Connected</span>
                <span>🥰 Fulfilled</span>
              </div>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleInputChange('connectionQuality', rating)}
                    className={`w-10 h-10 rounded-lg font-bold transition-all duration-200 ${formData.connectionQuality === rating
                      ? 'bg-green-600 text-white shadow-lg shadow-green-500/30 scale-110'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                1 = Isolated/lonely | 10 = Deeply connected/fulfilled
              </p>
            </div>
          </div>
        )}


        {/* XP Preview */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Estimated Reward</p>
              <p className="text-xs text-gray-500">Based on your inputs</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-blue-600">{calculateXP()} XP</span>
        </div >

        {/* Submit Button */}
        < button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full px-6 py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 flex items-center justify-center gap-2 ${loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5'
            }`
          }
        >
          {
            loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Logging...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Log Activity
              </>
            )}
        </button >
      </div >
    );
  };

  if (!userId) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full animate-bounce-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Awesome Job!</h2>
          <p className="text-gray-600 mb-6">You have successfully logged your activity.</p>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 rounded-xl p-4 mb-8">
            <p className="text-sm text-yellow-800 font-medium uppercase tracking-wider mb-1">Earned</p>
            <p className="text-4xl font-bold text-yellow-600">+{earnedXP} XP</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting to dashboard...
          </div>
        </div>
      </main>
    );
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 md:p-8 pt-24 pb-20">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 fade-in-animation">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Log Activity</h1>
            <div className="flex items-center gap-2 text-gray-500 mt-1">
              <Calendar className="h-4 w-4" />
              <span>{today}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center animate-shake">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          {/* Domain Selector */}
          {!selectedDomain ? (
            <div className="fade-in-animation">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                What did you focus on today?
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {DOMAINS.map((domain, index) => {
                  const Icon = domain.icon;
                  return (
                    <button
                      key={domain.id}
                      type="button"
                      onClick={() => setSelectedDomain(domain)}
                      className="group p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300 text-center hover:-translate-y-1 hover:shadow-lg"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center ${domain.bg} ${domain.color} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <p className="font-semibold text-gray-900">{domain.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="fade-in-animation">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${selectedDomain.bg} ${selectedDomain.color}`}>
                    <selectedDomain.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedDomain.label}</h2>
                    <p className="text-sm text-gray-500">Logging for today</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedDomain(null);
                    setFormData({
                      sleepHours: '',
                      exerciseMinutes: '',
                      foodQuality: '',
                      mood: '',
                      studyHours: '',
                      screenTime: '',
                      spending: '',
                    });
                  }}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 underline"
                >
                  Change Domain
                </button>
              </div>

              {renderDomainFields()}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
