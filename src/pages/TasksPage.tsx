import React, { useState } from 'react';
import { useUIStore } from '../store';
import { useDeleteTaskMutation, useTasks, useToggleTaskMutation } from '../hooks/useTasks';
import Layout from '../components/layout/Layout';
import AppIcon, { AppIconName } from '../components/ui/AppIcon';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { TaskSkeleton } from '../components/ui/Skeleton';
import type { Task } from '../types';

const categoryConfig = {
  work: { icon: 'work' as AppIconName, label: 'Work', color: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' },
  personal: { icon: 'personal' as AppIconName, label: 'Personal', color: 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300' },
  health: { icon: 'health' as AppIconName, label: 'Health', color: 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300' },
  learning: { icon: 'learning' as AppIconName, label: 'Learning', color: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' },
};

type FilterType = 'all' | 'today' | 'upcoming' | 'completed';

const TasksPage: React.FC = () => {
  const { openAddTaskModal } = useUIStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { tasks, total, hasMore, isInitialLoading, isFetchingNextPage, fetchNextPage } = useTasks({ filter });
  const toggleTaskMutation = useToggleTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Done' },
  ];

  return (
    <Layout>
      <div className="space-y-4 animate-fade-in">
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {total} {total === 1 ? 'task' : 'tasks'} total
          </p>
        </div>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent dark:border-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isInitialLoading ? (
          <div className="space-y-3">
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={<AppIcon name="task" className="w-8 h-8" />}
            title={searchQuery ? 'No matching tasks' : 'No tasks found'}
            description={searchQuery ? 'Try a different search term' : 'Add your first task to get started'}
            actionLabel={!searchQuery ? 'Add Task' : undefined}
            onAction={!searchQuery ? () => openAddTaskModal() : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskListItem
                key={task._id}
                task={task}
                onToggle={() => toggleTaskMutation.mutate(task)}
                onEdit={() => openAddTaskModal(task)}
                onDelete={() => deleteTaskMutation.mutate(task._id)}
              />
            ))}
            {!searchQuery && hasMore && (
              <div className="pt-2 flex justify-center">
                <Button
                  variant="secondary"
                  isLoading={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  Load more tasks
                </Button>
              </div>
            )}
          </div>
        )}
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

const TaskListItem: React.FC<{
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ task, onToggle, onEdit, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  const category = categoryConfig[task.category];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateStr);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) return 'Today';
    if (taskDate.getTime() === today.getTime() + 86400000) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border transition-all ${
        showActions ? 'border-indigo-200 dark:border-indigo-900/60' : 'border-slate-100 dark:border-slate-800'
      }`}
    >
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={onToggle}
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
          }`}
        >
          {task.completed && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0" onClick={onEdit}>
          <p className={`font-medium ${task.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full ${category.color}`}>
              <AppIcon name={category.icon} className="w-3.5 h-3.5 inline-block mr-1 align-[-2px]" /> {category.label}
            </span>
            {task.time && (
              <span className="text-xs text-slate-400 dark:text-slate-500">{task.time}</span>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(task.date)}</span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>

          {showActions && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-100 dark:border-slate-800 py-1 min-w-[120px] z-10 animate-scale-in">
              <button
                onClick={() => { onEdit(); setShowActions(false); }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => { onDelete(); setShowActions(false); }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
