import React from 'react';
import { useAuthStore, useUIStore } from '../store';
import { useHabits, useIncrementHabitMutation } from '../hooks/useHabits';
import { useTasks, useToggleTaskMutation } from '../hooks/useTasks';
import Layout from '../components/layout/Layout';
import AppIcon, { AppIconName, resolveHabitIconName } from '../components/ui/AppIcon';
import ProgressRing from '../components/ui/ProgressRing';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { TaskSkeleton, HabitSkeleton } from '../components/ui/Skeleton';
import type { Task, Habit } from '../types';

const categoryConfig = {
  work: { icon: 'work' as AppIconName, label: 'Work', color: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' },
  personal: { icon: 'personal' as AppIconName, label: 'Personal', color: 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300' },
  health: { icon: 'health' as AppIconName, label: 'Health', color: 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300' },
  learning: { icon: 'learning' as AppIconName, label: 'Learning', color: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' },
};

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const { openAddTaskModal, openAddHabitModal } = useUIStore();
  const { tasks, isInitialLoading: tasksLoading } = useTasks({ filter: 'today', limit: 50 });
  const {
    habits,
    hasMore: hasMoreHabits,
    isInitialLoading: habitsLoading,
    isFetchingNextPage: habitsLoadingMore,
    fetchNextPage: loadMoreHabits,
  } = useHabits({ limit: 8 });
  const toggleTaskMutation = useToggleTaskMutation();
  const incrementHabitMutation = useIncrementHabitMutation();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTasks = tasks.filter((task) => {
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  const completedToday = todayTasks.filter((task) => task.completed).length;
  const progress = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = () =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{formatDate()}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Today's Progress</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Today's Tasks</h2>
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
              icon={<AppIcon name="task" className="w-8 h-8" />}
              title="No tasks for today"
              description="Add a task to get started with your day"
              actionLabel="Add Task"
              onAction={() => openAddTaskModal()}
            />
          ) : (
            <div className="space-y-3">
              {todayTasks.slice(0, 5).map((task) => (
                <TaskCard key={task._id} task={task} onToggle={() => toggleTaskMutation.mutate(task)} />
              ))}
              {todayTasks.length > 5 && (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-2">
                  +{todayTasks.length - 5} more tasks
                </p>
              )}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Active Habits</h2>
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
              icon={<AppIcon name="sparkles" className="w-8 h-8" />}
              title="No habits yet"
              description="Build positive habits and track your streaks"
              actionLabel="Add Habit"
              onAction={() => openAddHabitModal()}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {habits.map((habit) => (
                  <HabitCard key={habit._id} habit={habit} onIncrement={() => incrementHabitMutation.mutate(habit)} />
                ))}
              </div>
              {hasMoreHabits && (
                <div className="px-4">
                  <Button
                    variant="secondary"
                    className="w-full"
                    isLoading={habitsLoadingMore}
                    onClick={() => loadMoreHabits()}
                  >
                    Load more habits
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <button
        onClick={() => openAddTaskModal()}
        className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 transition-colors flex items-center justify-center z-30"
        aria-label="Add task"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </Layout>
  );
};

const TaskCard: React.FC<{ task: Task; onToggle: () => void }> = ({ task, onToggle }) => {
  const category = categoryConfig[task.category];

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border transition-all ${
        task.completed ? 'border-green-100 dark:border-green-900/40' : 'border-slate-100 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
          }`}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.completed && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`font-medium ${task.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${category.color}`}>
              <AppIcon name={category.icon} className="w-3.5 h-3.5 inline-block mr-1 align-[-2px]" /> {category.label}
            </span>
            {task.time && (
              <span className="text-xs text-slate-400 dark:text-slate-500">{task.time}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const HabitCard: React.FC<{ habit: Habit; onIncrement: () => void }> = ({ habit, onIncrement }) => {
  const progressPercent = Math.min((habit.progress / habit.target) * 100, 100);

  return (
    <div className="flex-shrink-0 w-40 bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">
          <AppIcon name={resolveHabitIconName(habit.icon)} className="w-6 h-6" />
        </span>
        {habit.streak >= 7 && (
          <span className="text-xs bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
            <AppIcon name="streak" className="w-3 h-3 inline-block mr-1 align-[-2px]" /> {habit.streak}
          </span>
        )}
      </div>
      <h3 className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">{habit.name}</h3>

      <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {habit.progress}/{habit.target}
        </span>
        <button
          onClick={onIncrement}
          className="w-7 h-7 bg-indigo-500 text-white rounded-full text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center"
          aria-label="Increment progress"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default HomePage;
