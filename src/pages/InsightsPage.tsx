import React, { useEffect, useState } from 'react';
import { useTasksStore, useHabitsStore } from '../store';
import Layout from '../components/layout/Layout';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  CheckCircle,
  ClipboardList,
  Flame,
  Sparkles,
  Dumbbell,
  Star,
  LucideIcon,
} from 'lucide-react';
import type { Habit } from '../types';

// Icon mapping for habits (stored as string IDs in DB)
const habitIconMap: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  running: Dumbbell,
  reading: Dumbbell,
  fitness: Dumbbell,
  meditation: Dumbbell,
  water: Dumbbell,
  target: Dumbbell,
  art: Dumbbell,
  music: Dumbbell,
  work: Dumbbell,
  growth: Dumbbell,
  coffee: Dumbbell,
  sleep: Dumbbell,
  writing: Dumbbell,
};

const InsightsPage: React.FC = () => {
  const { tasks, fetchTasks } = useTasksStore();
  const { habits, fetchHabits } = useHabitsStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    fetchTasks();
    fetchHabits();
  }, []);

  // Calculate stats
  const completedTasks = tasks.filter((t) => t.completed);
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const totalHabitProgress = habits.reduce((sum, h) => sum + h.progress, 0);
  const activeHabits = habits.length;

  // Generate weekly data
  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayTasks = tasks.filter((t) => {
        const taskDate = new Date(t.date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === date.getTime();
      });

      data.push({
        day: days[date.getDay()],
        completed: dayTasks.filter((t) => t.completed).length,
        total: dayTasks.length,
      });
    }

    return data;
  };

  const weeklyData = getWeeklyData();
  const thisWeekCompleted = weeklyData.reduce((sum, d) => sum + d.completed, 0);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-slate-800">Insights</h1>
          <p className="text-slate-500 text-sm mt-1">Track your progress and achievements</p>
        </div>

        {/* Time Range Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                timeRange === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                timeRange === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={CheckCircle}
            label="Tasks Completed"
            value={completedTasks.length.toString()}
            subtext={`${completionRate}% rate`}
            color="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            icon={ClipboardList}
            label="Total Tasks"
            value={totalTasks.toString()}
            subtext={`${totalTasks - completedTasks.length} remaining`}
            color="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={Flame}
            label="Best Streak"
            value={longestStreak.toString()}
            subtext="days"
            color="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            icon={Sparkles}
            label="Active Habits"
            value={activeHabits.toString()}
            subtext={`${totalHabitProgress} total progress`}
            color="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>

        {/* Weekly Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Weekly Activity</h2>
            <span className="text-sm text-slate-500">
              {thisWeekCompleted} tasks this week
            </span>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'completed' ? `${value} completed` : `${value} total`,
                    name === 'completed' ? 'Completed' : 'Total',
                  ]}
                />
                <Bar
                  dataKey="total"
                  fill="#E2E8F0"
                  radius={[4, 4, 0, 0]}
                  name="Total"
                />
                <Bar
                  dataKey="completed"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                  name="Completed"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Habits Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Habit Progress</h2>

          {habits.length === 0 ? (
            <p className="text-center text-slate-500 py-4">No habits to show</p>
          ) : (
            <div className="space-y-4">
              {habits.map((habit) => (
                <HabitProgressItem key={habit._id} habit={habit} />
              ))}
            </div>
          )}
        </div>

        {/* Consistency Score */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-2">Consistency Score</h2>
          <div className="flex items-center gap-4">
            <span className="text-5xl font-bold">{completionRate}%</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {completionRate >= 80 ? (
                  <>
                    <Flame size={16} className="text-amber-300" />
                    <p className="text-white/90 text-sm">Excellent! You're on fire!</p>
                  </>
                ) : completionRate >= 50 ? (
                  <>
                    <Dumbbell size={16} className="text-white/80" />
                    <p className="text-white/90 text-sm">Good progress! Keep it up!</p>
                  </>
                ) : (
                  <>
                    <Star size={16} className="text-yellow-300" />
                    <p className="text-white/90 text-sm">Keep pushing! You've got this!</p>
                  </>
                )}
              </div>
              <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const StatCard: React.FC<{
  icon: LucideIcon;
  label: string;
  value: string;
  subtext: string;
  color: string;
  iconColor: string;
}> = ({ icon: Icon, label, value, subtext, color, iconColor }) => (
  <div className={`${color} rounded-xl p-4`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon size={20} strokeWidth={2} className={iconColor} />
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
    <p className="text-xs text-slate-500 mt-0.5">{subtext}</p>
  </div>
);

const HabitProgressItem: React.FC<{ habit: Habit }> = ({ habit }) => {
  const progressPercent = Math.min((habit.progress / habit.target) * 100, 100);
  const HabitIcon = habitIconMap[habit.icon] || Sparkles;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <HabitIcon size={18} strokeWidth={2} className="text-slate-600" />
          <span className="text-sm font-medium text-slate-700">{habit.name}</span>
        </div>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          {habit.progress}/{habit.target}
          {habit.streak > 0 && (
            <span className="ml-2 text-amber-500 flex items-center gap-0.5">
              <Flame size={12} strokeWidth={2} />
              {habit.streak}
            </span>
          )}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default InsightsPage;