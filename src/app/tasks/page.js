'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Target,
  Plus,
  CheckCircle,
  Trash2,
  X,
  AlertCircle,
  Loader2,
  Star,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', color: 'text-green-600', bg: 'bg-green-100', xp: 5, icon: '💚' },
  medium: { label: 'Medium', color: 'text-orange-600', bg: 'bg-orange-100', xp: 10, icon: '🧡' },
  hard: { label: 'Hard', color: 'text-red-600', bg: 'bg-red-100', xp: 15, icon: '❤️' },
};

export default function GoalsPage() {
  const [userId, setUserId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium'
  });

  // Get userId from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uid = localStorage.getItem('userId');
      if (uid) setUserId(uid);
    }
  }, []);

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('userid', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTasks(data || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Create task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const xpReward = DIFFICULTY_CONFIG[formData.difficulty].xp;

    try {
      const { error: createError } = await supabase
        .from('tasks')
        .insert({
          userid: userId,
          title: formData.title,
          description: formData.description,
          difficulty: formData.difficulty,
          xp_reward: xpReward,
          completed: false,
          created_at: new Date().toISOString()
        });

      if (createError) throw createError;

      // Reset form and reload
      setFormData({ title: '', description: '', difficulty: 'medium' });
      setIsCreateModalOpen(false);
      loadTasks();
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err);
    }
  };

  // Complete task (award XP)
  const handleCompleteTask = async (task) => {
    try {
      // Mark task as complete
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (updateError) throw updateError;

      // Award XP to user
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('userId', userId)
        .single();

      if (profileError) throw profileError;

      const newPoints = (profile.points || 0) + task.xp_reward;
      const newLevel = Math.floor(newPoints / 100) + 1;

      let newRank;
      if (newLevel >= 21) newRank = 'Master';
      else if (newLevel >= 16) newRank = 'Expert';
      else if (newLevel >= 11) newRank = 'Advanced';
      else if (newLevel >= 6) newRank = 'Intermediate';
      else if (newLevel >= 3) newRank = 'Novice';
      else newRank = 'Beginner';

      const { error: updateProfileError } = await supabase
        .from('user_profiles')
        .update({
          points: newPoints,
          level: newLevel,
          rank: newRank
        })
        .eq('userId', userId);

      if (updateProfileError) throw updateProfileError;

      alert(`🎉 Task completed! You earned ${task.xp_reward} XP!`);
      loadTasks();
    } catch (err) {
      console.error('Error completing task:', err);
      setError(err);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) throw deleteError;
      loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err);
    }
  };

  // Filter tasks
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-8 h-8 text-blue-600" />
              Tasks
            </h1>
            <p className="text-gray-600 mt-1">Complete tasks to earn XP and level up</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 font-medium transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold">Error</h3>
              <p className="text-sm">{error.message || 'Something went wrong'}</p>
            </div>
          </div>
        )}

        {/* Active Tasks */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Active Tasks ({activeTasks.length})
          </h2>

          {activeTasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No active tasks</h3>
              <p className="text-gray-500 mt-1">Create your first task to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {activeTasks.map(task => {
                const config = DIFFICULTY_CONFIG[task.difficulty];
                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} flex items-center gap-1`}>
                            {config.icon} {config.label}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-gray-600 text-sm">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {task.xp_reward} XP
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => handleCompleteTask(task)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="text-xs text-gray-400 ml-auto">
                        Created {new Date(task.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <section>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full flex items-center justify-between text-xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Completed Tasks ({completedTasks.length})
              </span>
              {showCompleted ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {showCompleted && (
              <div className="space-y-3">
                {completedTasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 text-green-600 p-2 rounded-full">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 line-through decoration-gray-400">
                          {task.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Completed {new Date(task.completed_at).toLocaleDateString()} • +{task.xp_reward} XP
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-gray-400 hover:text-red-500 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Create New Task</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Complete project documentation"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Add more details about this task..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, difficulty: key })}
                      className={`p-4 rounded-xl border-2 transition-all ${formData.difficulty === key
                        ? `${config.bg} border-${key === 'easy' ? 'green' : key === 'medium' ? 'orange' : 'red'}-500`
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="text-2xl mb-1">{config.icon}</div>
                      <div className={`font-semibold text-sm ${formData.difficulty === key ? config.color : 'text-gray-700'}`}>
                        {config.label}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
                        <Zap className="w-3 h-3" />
                        {config.xp} XP
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
