import React, { useEffect } from 'react';
import {
  Briefcase,
  Home,
  Dumbbell,
  BookOpen,
  Plus,
  Check,
  ClipboardList,
  Sparkles,
  Flame,
  LucideIcon,
} from 'lucide-react';
import { useAuthStore, useTasksStore, useHabitsStore, useUIStore } from '../store';
import Layout from '../components/layout/Layout';
import ProgressRing from '../components/ui/ProgressRing';
import EmptyState from '../components/ui/EmptyState';
import { TaskSkeleton, HabitSkeleton } from '../components/ui/Skeleton';
import type { Task, Habit } from '../types';

// Category config with Lucide icons
interface CategoryConfig {
  icon: LucideIcon;
  label: string;
  color: string;
}

const categoryConfig: Record<string, CategoryConfig> = {
  work: { icon: Briefcase, label: 'Work', color: 'bg-blue-100 text-blue-700' },
  personal: { icon: Home, label: 'Personal', color: 'bg-purple-100 text-purple-700' },
  health: { icon: Dumbbell, label: 'Health', color: 'bg-green-100 text-green-700' },
  learning: { icon: BookOpen, label: 'Learning', color: 'bg-amber-100 text-amber-700' },
};

// Icon mapping for habits (stored as string IDs in DB)
const habitIconMap: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  running: Dumbbell,
  reading: BookOpen,
  fitness: Dumbbell,
  meditation: Dumbbell,
  water: Dumbbell,
  target: Dumbbell,
  art: Dumbbell,
  music: Dumbbell,
  work: Briefcase,
  growth: Dumbbell,
  coffee: Dumbbell,
  sleep: Home,
  writing: BookOpen,
};

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const { tasks, fetchTasks, toggleComplete, isLoading: tasksLoading } = useTasksStore();
  const { habits, fetchHabits, incrementProgress, isLoading: habitsLoading } = useHabitsStore();
  const { openAddTaskModal, openAddHabitModal } = useUIStore();

  useEffect(() => {
    fetchTasks();
    fetchHabits();
  }, []);

  // Get today's tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTasks = tasks.filter((t) => {
    const taskDate = new Date(t.date);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  const completedToday = todayTasks.filter((t) => t.completed).length;
  const progress = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format date
  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-slate-800">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-slate-500 mt-1">{formatDate()}</p>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Today's Progress</h2>
              <p className="text-sm text-slate-500 mt-1">
                {completedToday} of {todayTasks.length} tasks completed
              </p>
            </div>
            <ProgressRing
              progress={progress}
              size={80}
              strokeWidth={8}
              color={progress === 100 ? '#10B981' : '#6366F1'}
            />
          </div>
        </div>

        {/* Today's Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800">Today's Tasks</h2>
            <button
              onClick={() => openAddTaskModal()}
              className="text-indigo-500 text-sm font-medium hover:text-indigo-600"
            >
              + Add
            </button>
          </div>

          {tasksLoading ? (
            <div className="space-y-3">
              <TaskSkeleton />
              <TaskSkeleton />
            </div>
          ) : todayTasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No tasks for today"
              description="Add a task to get started with your day"
              actionLabel="Add Task"
              onAction={() => openAddTaskModal()}
            />
          ) : (
            <div className="space-y-3">
              {todayTasks.slice(0, 5).map((task) => (
                <TaskCard key={task._id} task={task} onToggle={() => toggleComplete(task._id)} />
              ))}
              {todayTasks.length > 5 && (
                <p className="text-center text-sm text-slate-500 py-2">
                  +{todayTasks.length - 5} more tasks
                </p>
              )}
            </div>
          )}
        </section>

        {/* Active Habits */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800">Active Habits</h2>
            <button
              onClick={() => openAddHabitModal()}
              className="text-indigo-500 text-sm font-medium hover:text-indigo-600"
            >
              + Add
            </button>
          </div>

          {habitsLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              <HabitSkeleton />
              <HabitSkeleton />
            </div>
          ) : habits.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No habits yet"
              description="Build positive habits and track your streaks"
              actionLabel="Add Habit"
              onAction={() => openAddHabitModal()}
            />
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {habits.map((habit) => (
                <HabitCard key={habit._id} habit={habit} onIncrement={() => incrementProgress(habit._id)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* FAB */}
      <button
        onClick={() => openAddTaskModal()}
        className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 transition-colors flex items-center justify-center z-30"
        aria-label="Add task"
      >
        <Plus size={28} strokeWidth={2} />
      </button>
    </Layout>
  );
};

// Task Card Component
const TaskCard: React.FC<{ task: Task; onToggle: () => void }> = ({ task, onToggle }) => {
  const category = categoryConfig[task.category];
  const CategoryIcon = category.icon;

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${
        task.completed ? 'border-green-100' : 'border-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-slate-300 hover:border-indigo-400'
          }`}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.completed && <Check size={14} strokeWidth={3} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${category.color}`}>
              <CategoryIcon size={12} strokeWidth={2} />
              {category.label}
            </span>
            {task.time && <span className="text-xs text-slate-400">{task.time}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Habit Card Component
const HabitCard: React.FC<{ habit: Habit; onIncrement: () => void }> = ({ habit, onIncrement }) => {
  const progressPercent = Math.min((habit.progress / habit.target) * 100, 100);

  // Get the icon component from the habit's stored icon ID
  const HabitIcon = habitIconMap[habit.icon] || Sparkles;

  return (
    <div className="flex-shrink-0 w-40 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <HabitIcon size={24} strokeWidth={2} className="text-slate-700" />
        {habit.streak >= 7 && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <Flame size={12} strokeWidth={2} />
            {habit.streak}
          </span>
        )}
      </div>
      <h3 className="font-medium text-slate-800 text-sm truncate">{habit.name}</h3>

      {/* Progress bar */}
      <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-500">
          {habit.progress}/{habit.target}
        </span>
        <button
          onClick={onIncrement}
          className="w-7 h-7 bg-indigo-500 text-white rounded-full text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center"
          aria-label="Increment progress"
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default HomePage;