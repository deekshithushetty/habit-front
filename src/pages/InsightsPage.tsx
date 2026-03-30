import React, { useState } from 'react';
import { useAllHabits } from '../hooks/useHabits';
import { useAllTasks } from '../hooks/useTasks';
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
import type { Habit } from '../types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDate = (value: string) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getHeatLevelClass = (count: number) => {
  if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
  if (count === 1) return 'bg-indigo-200 dark:bg-indigo-900/80';
  if (count === 2) return 'bg-indigo-300 dark:bg-indigo-800';
  if (count === 3) return 'bg-indigo-500 dark:bg-indigo-700';
  return 'bg-indigo-700 dark:bg-indigo-500';
};

interface HeatmapCell {
  date: Date;
  dateKey: string;
  count: number;
  inCurrentYear: boolean;
}

const InsightsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const { data: tasks = [] } = useAllTasks();
  const { data: habits = [] } = useAllHabits();

  const completedTasks = tasks.filter((task) => task.completed);
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const longestStreak = habits.reduce((max, habit) => Math.max(max, habit.streak), 0);
  const totalHabitProgress = habits.reduce((sum, habit) => sum + habit.progress, 0);
  const activeHabits = habits.length;
  const currentYear = new Date().getFullYear();

  const activityByDate = completedTasks.reduce<Record<string, number>>((acc, task) => {
    const key = toDateKey(normalizeDate(task.date));
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  habits.forEach((habit) => {
    if (!habit.lastCompleted) return;
    const completedDate = normalizeDate(habit.lastCompleted);
    if (completedDate.getFullYear() !== currentYear) return;
    const key = toDateKey(completedDate);
    activityByDate[key] = (activityByDate[key] || 0) + 1;
  });

  const startOfYear = new Date(currentYear, 0, 1);
  startOfYear.setHours(0, 0, 0, 0);
  const endOfYear = new Date(currentYear, 11, 31);
  endOfYear.setHours(0, 0, 0, 0);

  const gridStart = new Date(startOfYear);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const gridEnd = new Date(endOfYear);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const heatmapCells: HeatmapCell[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const date = new Date(cursor);
    const dateKey = toDateKey(date);
    heatmapCells.push({
      date,
      dateKey,
      count: activityByDate[dateKey] || 0,
      inCurrentYear: date.getFullYear() === currentYear,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const heatmapWeeks: HeatmapCell[][] = [];
  for (let index = 0; index < heatmapCells.length; index += 7) {
    heatmapWeeks.push(heatmapCells.slice(index, index + 7));
  }

  const monthMarkers = heatmapWeeks
    .map((week, weekIndex) => ({ week, weekIndex }))
    .filter(({ week }) => week.some((cell) => cell.inCurrentYear && cell.date.getDate() === 1))
    .map(({ week, weekIndex }) => {
      const firstOfMonth = week.find((cell) => cell.inCurrentYear && cell.date.getDate() === 1)!;
      return {
        weekIndex,
        label: MONTH_LABELS[firstOfMonth.date.getMonth()],
      };
    });

  const bestDayCount = Math.max(0, ...Object.values(activityByDate));

  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const data = [];

    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayTasks = tasks.filter((task) => {
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === date.getTime();
      });

      data.push({
        day: days[date.getDay()],
        completed: dayTasks.filter((task) => task.completed).length,
        total: dayTasks.length,
      });
    }

    return data;
  };

  const weeklyData = getWeeklyData();
  const thisWeekCompleted = weeklyData.reduce((sum, day) => sum + day.completed, 0);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Insights</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your progress and achievements</p>
        </div>

        <div className="flex justify-center">
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                timeRange === 'week'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                timeRange === 'month'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon="✅" label="Tasks Completed" value={completedTasks.length.toString()} subtext={`${completionRate}% rate`} color="bg-green-50 dark:bg-green-950/30" />
          <StatCard icon="📋" label="Total Tasks" value={totalTasks.toString()} subtext={`${totalTasks - completedTasks.length} remaining`} color="bg-blue-50 dark:bg-blue-950/30" />
          <StatCard icon="🔥" label="Best Streak" value={longestStreak.toString()} subtext="days" color="bg-amber-50 dark:bg-amber-950/30" />
          <StatCard icon="✨" label="Active Habits" value={activeHabits.toString()} subtext={`${totalHabitProgress} total progress`} color="bg-purple-50 dark:bg-purple-950/30" />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Weekly Activity</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">{thisWeekCompleted} tasks this week</span>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.25)',
                    color: '#e2e8f0',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'completed' ? `${value} completed` : `${value} total`,
                    name === 'completed' ? 'Completed' : 'Total',
                  ]}
                />
                <Bar dataKey="total" fill="#334155" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="completed" fill="#6366F1" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-2 mb-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Consistency Heatmap
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {bestDayCount} max in a day
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Daily intensity for completed tasks plus recorded habit completion days in {currentYear}.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="ml-10 flex h-5 mb-2 relative">
                {monthMarkers.map((marker) => (
                  <span
                    key={`${marker.label}-${marker.weekIndex}`}
                    className="absolute text-[11px] text-slate-400 dark:text-slate-500"
                    style={{ left: `${marker.weekIndex * 16}px` }}
                  >
                    {marker.label}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="w-8 pt-1 space-y-1">
                  {DAY_LABELS.map((label, index) => (
                    <div
                      key={label}
                      className={`h-3 text-[11px] text-slate-400 dark:text-slate-500 ${index % 2 === 1 ? '' : 'opacity-0'}`}
                    >
                      {label}
                    </div>
                  ))}
                </div>

                <div className="flex gap-1">
                  {heatmapWeeks.map((week, weekIndex) => (
                    <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                      {week.map((cell) => {
                        const formatted = cell.date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });

                        return (
                          <div
                            key={cell.dateKey}
                            className={`h-3 w-3 rounded-[3px] transition-transform hover:scale-125 ${
                              cell.inCurrentYear
                                ? getHeatLevelClass(cell.count)
                                : 'bg-transparent'
                            }`}
                            title={cell.inCurrentYear ? `${cell.count} completions on ${formatted}` : ''}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-slate-400 dark:text-slate-500">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={`legend-${level}`}
                className={`h-3 w-3 rounded-[3px] ${getHeatLevelClass(level)}`}
              />
            ))}
            <span>More</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Habit Progress</h2>

          {habits.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-4">No habits to show</p>
          ) : (
            <div className="space-y-4">
              {habits.map((habit) => (
                <HabitProgressItem key={habit._id} habit={habit} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-2">Consistency Score</h2>
          <div className="flex items-center gap-4">
            <span className="text-5xl font-bold">{completionRate}%</span>
            <div className="flex-1">
              <p className="text-white/80 text-sm">
                {completionRate >= 80
                  ? "Excellent! You're on fire! 🔥"
                  : completionRate >= 50
                    ? 'Good progress! Keep it up! 💪'
                    : "Keep pushing! You've got this! 🌟"}
              </p>
              <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const StatCard: React.FC<{
  icon: string;
  label: string;
  value: string;
  subtext: string;
  color: string;
}> = ({ icon, label, value, subtext, color }) => (
  <div className={`${color} rounded-xl p-4`}>
    <div className="flex items-center gap-2 mb-2">
      <span className="emoji-safe text-lg">{icon}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtext}</p>
  </div>
);

const HabitProgressItem: React.FC<{ habit: Habit }> = ({ habit }) => {
  const progressPercent = Math.min((habit.progress / habit.target) * 100, 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span>{habit.icon}</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{habit.name}</span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {habit.progress}/{habit.target}
          {habit.streak > 0 && (
            <span className="ml-2 text-amber-500"><span className="emoji-safe">🔥</span> {habit.streak}</span>
          )}
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default InsightsPage;
