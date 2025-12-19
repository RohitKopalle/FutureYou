'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertCircle,
  Loader2,
  Zap,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

const DOMAINS = [
  { id: 'Physical Health', icon: '💪' },
  { id: 'Mental Health', icon: '🧠' },
  { id: 'Career/Education', icon: '📚' },
  { id: 'Finance', icon: '💰' },
  { id: 'Relationships', icon: '❤️' },
  { id: 'Hobbies', icon: '🎨' },
];

export default function AIInsightsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [simulations, setSimulations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uid = localStorage.getItem('userId');
      if (!uid) {
        router.push('/login');
        return;
      }
      setUserId(uid);
      fetchSimulations(uid);
    }
  }, [router]);

  const fetchSimulations = async (uid) => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('simulations')
        .select('*')
        .eq('userId', uid)
        .order('generatedAt', { ascending: false });

      if (fetchError) throw fetchError;
      setSimulations(data || []);
    } catch (err) {
      console.error('Error fetching simulations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to delete ALL predictions? This cannot be undone.')) return;

    try {
      const { error: deleteError } = await supabase
        .from('simulations')
        .delete()
        .eq('userId', userId);

      if (deleteError) throw deleteError;

      setSimulations([]);
    } catch (err) {
      console.error('Error clearing history:', err);
      setError('Failed to clear history');
    }
  };

  const deleteSimulation = async (id) => {
    if (!confirm('Are you sure you want to delete this prediction?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('simulations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSimulations(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting simulation:', err);
      setError('Failed to delete prediction');
    }
  };

  const generateInsights = async (domainId) => {
    setGenerating(true);
    setError('');

    try {
      // Fetch user's habit data for this domain
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('userId', userId)
        .eq('domain', domainId)
        .order('date', { ascending: false })
        .limit(30);

      if (habitsError) throw habitsError;

      if (!habits || habits.length === 0) {
        // Show a more user-friendly error/warning
        setError(`No habit data found for ${domainId}. Please log some habits first!`);
        setGenerating(false);
        // Do not deselect domain so user sees what they clicked
        return;
      }

      // Generate predictions based on patterns
      const predictions = await generatePredictions(domainId, habits);

      // Save to simulations table
      const { error: insertError } = await supabase
        .from('simulations')
        .insert({
          userId: userId,
          domain: domainId,
          timeline: '30days',
          projection: predictions
        });

      if (insertError) throw insertError;

      // Refresh simulations
      await fetchSimulations(userId);
      setSelectedDomain(null);
    } catch (err) {
      console.error('Error generating insights:', err);
      setError(err.message || 'Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  };

  const generatePredictions = async (domain, habits) => {
    try {
      const recentHabits = habits.slice(0, 14);
      // Simplify habit data for the prompt to save tokens
      const habitSummary = recentHabits.map(h => ({
        date: h.date,
        // Include all potential fields, nulls will be filtered or shown as null
        sleep: h.sleepHours,
        exercise: h.exerciseMinutes,
        mood: h.mood,
        study: h.studyHours,
        food: h.foodQuality,
        spending: h.spending,
        screen: h.screenTime,
        social: h.socialCount,
        relationshipTime: h.qualityTime,
        connectionQuality: h.connectionQuality
      }));

      const prompt = `You are a personal development AI coach analyzing habit tracking data.

Domain: ${domain}
Recent habit data (last 14 days): ${JSON.stringify(habitSummary)}

Analyze this data and provide:
1. Current trend (improving/stable/declining)
2. A brief prediction about their progress
3. What will happen if they continue this pattern (future outcome in 30 days)
4. 3-4 specific, actionable suggestions for improvement

Respond ONLY with a valid JSON object in this exact format:
{
  "trend": "improving" or "stable" or "declining",
  "prediction": "string",
  "futureOutcome": "string",
  "suggestions": ["string", "string", "string"],
  "dataPoints": number
}

Be encouraging but honest. Focus on the specific domain. Do not use markdown.`;

      const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouter API Key is missing');
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://futureyou.app',
          'X-Title': 'FutureYou'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful personal development coach. Always respond with valid JSON only, no markdown or extra text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter error:', response.status, errorText);
        let errorMessage = `API request failed with status ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
          }
        } catch (e) {
          // response was not JSON
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Clean up response if it contains markdown code blocks
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();

      let predictions;
      try {
        predictions = JSON.parse(cleanedResponse);
      } catch (e) {
        console.error('JSON Parse Error:', e, 'Response:', aiResponse);
        throw new Error('Failed to parse AI response');
      }

      return {
        ...predictions,
        dataPoints: habits.length,
        lastUpdated: new Date().toISOString(),
        generatedBy: 'AI (Mistral 7B)'
      };
    } catch (error) {
      console.error('AI generation error:', error);
      throw error; // Re-throw to be handled by generateInsights
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'improving': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'declining': return <TrendingDown className="w-5 h-5 text-red-600" />;
      default: return <Zap className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'improving': return 'bg-green-50 border-green-200';
      case 'declining': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  if (!userId || loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 md:p-8 pt-24 pb-20">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* 1️⃣ Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-600" />
              AI Insights
            </h1>
            <p className="text-gray-600 mt-1">Future predictions based on your habits</p>
          </div>

          <button
            onClick={clearHistory}
            className="self-start md:self-center px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* 2️⃣ Domain Selection Cards */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Generate New Prediction
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {DOMAINS.map((domain) => {
              const isSelected = selectedDomain === domain.id;
              return (
                <button
                  key={domain.id}
                  onClick={() => {
                    setSelectedDomain(domain.id);
                    generateInsights(domain.id);
                  }}
                  disabled={generating}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 hover:-translate-y-1 hover:shadow-md ${isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-100 bg-white hover:border-purple-200'
                    } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-3xl">{domain.icon}</span>
                  <span className="text-xs font-bold text-gray-700 text-center">{domain.id}</span>

                  {generating && isSelected && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 3️⃣ Generated Insights List */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Prediction History</h2>

          {simulations.length === 0 ? (
            /* 4️⃣ Empty State */
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Insights Yet</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Select a domain above to let our AI analyze your habits and predict your future progress.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {simulations.map((sim) => {
                const domainConfig = DOMAINS.find(d => d.id === sim.domain) || { icon: '❓' };
                const projection = sim.projection;

                return (
                  <div
                    key={sim.id}
                    className={`bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md ${getTrendColor(projection.trend)}`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm border border-gray-100">
                          {domainConfig.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{sim.domain}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(sim.generatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                          {getTrendIcon(projection.trend)}
                        </div>
                        <button
                          onClick={() => deleteSimulation(sim.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Delete Prediction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Prediction Content */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1 opacity-70">Prediction</h4>
                        <p className="text-gray-800 font-medium leading-relaxed">
                          {projection.prediction}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1 opacity-70">Future Outlook</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {projection.futureOutcome}
                        </p>
                      </div>

                      {/* Suggestions */}
                      <div className="bg-white/60 rounded-xl p-4 border border-gray-200/50">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500 fill-current" />
                          Suggestions
                        </h4>
                        <ul className="space-y-2">
                          {projection.suggestions?.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-blue-500 mt-1.5 text-[10px]">●</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Footer */}
                      <div className="pt-4 border-t border-gray-200/50 flex justify-between items-center text-xs text-gray-400">
                        <span>Based on {projection.dataPoints || 0} logs</span>
                        <span>{projection.generatedBy || 'AI'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

