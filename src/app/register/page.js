'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Mail, Lock, CheckCircle, TrendingUp, Users, IndianRupee, BookOpen, Sparkles, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

const DOMAINS = [
  { id: 'physical', label: 'Physical Health', icon: TrendingUp, description: 'Exercise, sleep, nutrition' },
  { id: 'mental', label: 'Mental Health', icon: Sparkles, description: 'Stress, mood, meditation' },
  { id: 'career', label: 'Career/Education', icon: BookOpen, description: 'Study time, skill building' },
  { id: 'relationships', label: 'Relationships', icon: Users, description: 'Social connections, family time' },
  { id: 'finance', label: 'Finance', icon: IndianRupee, description: 'Savings, spending habits' },
  { id: 'hobbies', label: 'Hobbies', icon: Sparkles, description: 'Fun activities, creativity' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form data - removed goals array
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    ratings: {},
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleRatingChange = (domainId, rating) => {
    setFormData(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [domainId]: rating }
    }));
  };

  const validateStep1 = () => {
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Valid email is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (Object.keys(formData.ratings).length !== DOMAINS.length) {
      setError('Please rate all domains');
      return false;
    }
    return true;
  };

  const calculateStats = () => {
    // Logic takes scores from Step 2 (ratings)
    const totalRating = Object.values(formData.ratings).reduce((sum, rating) => sum + rating, 0);
    const points = totalRating * 10;
    const level = Math.floor(points / 100) + 1;

    // Determine rank based on level
    let rank;
    if (level >= 21) {
      rank = 'Master';
    } else if (level >= 16) {
      rank = 'Expert';
    } else if (level >= 11) {
      rank = 'Advanced';
    } else if (level >= 6) {
      rank = 'Intermediate';
    } else if (level >= 3) {
      rank = 'Novice';
    } else {
      rank = 'Beginner';
    }

    return { points, level, rank };
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Generate unique userId
      const userId = crypto.randomUUID();

      // Calculate stats based on Step 2 ratings
      const { points, level, rank } = calculateStats();

      // Insert into user_profiles table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          userId: userId,
          name: formData.username,
          email: formData.email,
          points: points,
          level: level,
          rank: rank,
          currentStreak: 0,
          longestStreak: 0,
          quizCompleted: true,
        });

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error(profileError.message || 'Failed to create user profile');
      }

      // Insert each domain rating into habits table
      const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

      for (const [domainId, rating] of Object.entries(formData.ratings)) {
        const domainName = DOMAINS.find(d => d.id === domainId)?.label || domainId;

        // Create habit record with rating in appropriate column
        const habitData = {
          userId: userId,
          domain: domainName,
          date: currentDate,
          physical: domainId === 'physical' ? rating : null,
          mental: domainId === 'mental' ? rating : null,
          career: domainId === 'career' ? rating : null,
          relationships: domainId === 'relationships' ? rating : null,
          finance: domainId === 'finance' ? rating : null,
          growth: domainId === 'growth' ? rating : null,
          hobbies: domainId === 'hobbies' ? rating : null,
        };

        const { error: habitError } = await supabase
          .from('habits')
          .insert(habitData);

       
      }

      // Note: Goal insertion loop removed as step 3 was removed

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    
    // If we are on Step 2, validate and Submit immediately
    if (step === 2) {
      if (!validateStep2()) return;
      handleSubmit();
      return;
    }
    
    setStep(step + 1);
    setError('');
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 flex items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8 fade-in-animation">
          <Link href="/" className="inline-block mb-4">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              FutureYou
            </span>
          </Link>

          {/* Progress Indicator (Now calculated for 2 steps) */}
          <div className="max-w-xs mx-auto mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase">Step {step} of 2</span>
              <span className="text-xs font-medium text-gray-500">{Math.round((step / 2) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="glass-card rounded-2xl shadow-xl p-8 md:p-10 fade-in-animation" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
            {step === 1 && 'Create Your Account'}
            {step === 2 && 'Baseline Assessment'}
          </h1>
          <p className="text-gray-600 text-center mb-8">
            {step === 1 && 'Get started on your journey to a better you'}
            {step === 2 && 'Rate your current satisfaction (1-5) to set your starting level'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center animate-shake">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          {/* Step 1: Basic Registration */}
          {step === 1 && (
            <div className="space-y-5 fade-in-animation">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 sm:text-sm text-gray-900"
                    placeholder="Choose a username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 sm:text-sm text-gray-900"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-white/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 sm:text-sm text-gray-900"
                      placeholder="Min 6 chars"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-white/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 sm:text-sm text-gray-900"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Domain Ratings */}
          {step === 2 && (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar fade-in-animation">
              {DOMAINS.map((domain) => {
                const Icon = domain.icon;
                return (
                  <div key={domain.id} className="bg-white/50 border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg mr-3">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{domain.label}</h3>
                        <p className="text-xs text-gray-500">{domain.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleRatingChange(domain.id, rating)}
                          className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${formData.ratings[domain.id] === rating
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-4 border-t border-gray-100">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex items-center px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className={`flex-1 flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed ${loading
                ? 'bg-gray-400'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5'
                }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Processing...
                </>
              ) : step === 2 ? (
                <>
                  Complete Registration
                  <CheckCircle className="ml-2 h-5 w-5" />
                </>
              ) : (
                <>
                  Next Step
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-bold text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}