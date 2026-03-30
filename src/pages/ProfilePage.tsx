import React from 'react';
import { useAuthStore, useUIStore } from '../store';
import { useAllHabits } from '../hooks/useHabits';
import AppIcon, { resolveHabitIconName } from '../components/ui/AppIcon';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const { data: habits = [] } = useAllHabits();

  const longestStreak = habits.reduce((max, habit) => Math.max(max, habit.streak), 0);
  const totalProgress = habits.reduce((sum, habit) => sum + habit.progress, 0);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Profile</h1>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full text-white text-3xl font-bold mb-4">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{user?.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{user?.email}</p>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Member since {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-2xl font-bold text-indigo-500">{habits.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Habits</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-2xl font-bold text-amber-500 flex justify-center"><AppIcon name="streak" className="w-7 h-7" /></p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{longestStreak} best</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-2xl font-bold text-purple-500">{totalProgress}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Progress</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Preferences</h3>
            <Button variant="secondary" onClick={toggleTheme}>
              {theme === 'dark' ? 'Use light mode' : 'Use dark mode'}
            </Button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Switch between light and dark themes. Your preference is saved on this device.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Your Habits</h3>

          {habits.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-4">No habits created yet</p>
          ) : (
            <div className="space-y-3">
              {habits.map((habit) => (
                <div
                  key={habit._id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl"><AppIcon name={resolveHabitIconName(habit.icon)} className="w-6 h-6" /></span>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{habit.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Target: {habit.target}/week
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {habit.streak > 0 && (
                      <p className="text-sm font-medium text-amber-500"><AppIcon name="streak" className="w-3 h-3 inline-block mr-1 align-[-2px]" />{habit.streak} day streak</p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {habit.progress}/{habit.target} this week
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl"><AppIcon name="trophy" className="w-8 h-8" /></span>
            <div>
              <h3 className="font-semibold">Achievements</h3>
              <p className="text-sm text-white/80">Coming soon!</p>
            </div>
          </div>
          <p className="text-sm text-white/80">
            Complete tasks and maintain streaks to unlock badges.
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full py-3 px-4 bg-red-50 dark:bg-red-950/30 text-red-600 font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>

        <div className="text-center py-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">TaskFlow v1.0.0</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Built with care using MERN Stack</p>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
