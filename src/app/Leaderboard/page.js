'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Trophy,
    Medal,
    User,
    Crown,
    ArrowLeft,
    Loader2,
    Shield,
    Star
} from 'lucide-react';
import Link from 'next/link';

export default function LeaderboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const uid = localStorage.getItem('userId');
            if (!uid) {
                router.push('/login');
                return;
            }
            setCurrentUserId(uid);
            fetchLeaderboard();
        }
    }, [router]);

    const fetchLeaderboard = async () => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .order('points', { ascending: false })
                .limit(50);

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-100" />;
            case 1: return <Medal className="w-6 h-6 text-gray-400 fill-gray-100" />;
            case 2: return <Medal className="w-6 h-6 text-amber-700 fill-amber-100" />;
            default: return <span className="text-gray-500 font-bold w-6 text-center">{index + 1}</span>;
        }
    };

    const getRankColor = (index) => {
        switch (index) {
            case 0: return 'bg-yellow-50 border-yellow-200';
            case 1: return 'bg-gray-50 border-gray-200';
            case 2: return 'bg-amber-50 border-amber-200';
            default: return 'bg-white border-gray-100';
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50/50 p-4 md:p-8 pt-24 pb-20">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
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
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            Global Leaderboard
                        </h1>
                        <p className="text-gray-600 mt-1">Top achievers in the FutureYou community</p>
                    </div>
                </div>

                {/* Leaderboard List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Rank</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Level</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((user, index) => {
                                    const isCurrentUser = user.userId === currentUserId;
                                    return (
                                        <tr
                                            key={user.id || index}
                                            className={`transition-colors ${isCurrentUser
                                                    ? 'bg-blue-50/50 hover:bg-blue-50'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100">
                                                    {getRankIcon(index)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${isCurrentUser ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className={`font-medium ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'}`}>
                                                            {user.name || 'Anonymous'}
                                                            {isCurrentUser && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">You</span>}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{user.rank || 'Beginner'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Shield className="w-4 h-4 text-purple-500" />
                                                    <span className="text-sm font-medium text-gray-700">Lvl {user.level || 1}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    <span className="text-sm font-bold text-gray-900">{user.points?.toLocaleString() || 0}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {users.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            No users found. Be the first to join!
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
