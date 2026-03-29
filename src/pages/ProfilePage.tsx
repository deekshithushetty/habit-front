import React from 'react';
import { useAuthStore, useHabitsStore } from '../store';
import Layout from '../components/layout/Layout';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { habits } = useHabitsStore();

  const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const totalProgress = habits.reduce((sum, h) => sum + h.progress, 0);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-slate-800">Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
          {/* Avatar */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full text-white text-3xl font-bold mb-4">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
          <p className="text-slate-500 text-sm mt-1">{user?.email}</p>
          
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Member since {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <p className="text-2xl font-bold text-indigo-500">{habits.length}</p>
            <p className="text-xs text-slate-500 mt-1">Habits</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <p className="text-2xl font-bold text-amber-500">🔥</p>
            <p className="text-xs text-slate-500 mt-1">{longestStreak} best</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <p className="text-2xl font-bold text-purple-500">{totalProgress}</p>
            <p className="text-xs text-slate-500 mt-1">Progress</p>
          </div>
        </div>

        {/* Active Habits */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Habits</h3>
          
          {habits.length === 0 ? (
            <p className="text-center text-slate-500 py-4">No habits created yet</p>
          ) : (
            <div className="space-y-3">
              {habits.map((habit) => (
                <div
                  key={habit._id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habit.icon}</span>
                    <div>
                      <p className="font-medium text-slate-800">{habit.name}</p>
                      <p className="text-xs text-slate-500">
                        Target: {habit.target}/week
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {habit.streak > 0 && (
                      <p className="text-sm font-medium text-amber-500">
                        🔥 {habit.streak} day streak
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      {habit.progress}/{habit.target} this week
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements placeholder */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h3 className="font-semibold">Achievements</h3>
              <p className="text-sm text-white/80">Coming soon!</p>
            </div>
          </div>
          <p className="text-sm text-white/80">
            Complete tasks and maintain streaks to unlock badges.
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-3 px-4 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>

        {/* App info */}
        <div className="text-center py-4">
          <p className="text-xs text-slate-400">TaskFlow v1.0.0</p>
          <p className="text-xs text-slate-400 mt-1">Built with ❤️ using MERN Stack</p>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
