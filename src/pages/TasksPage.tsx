import React, { useEffect, useState } from 'react';
import { useTasksStore, useUIStore } from '../store';
import Layout from '../components/layout/Layout';
import EmptyState from '../components/ui/EmptyState';
import { TaskSkeleton } from '../components/ui/Skeleton';
import {
  Briefcase,
  Home,
  Dumbbell,
  BookOpen,
  Search,
  Plus,
  Check,
  MoreVertical,
  Pencil,
  Trash2,
  ClipboardList,
  LucideIcon,
} from 'lucide-react';
import type { Task } from '../types';

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

type FilterType = 'all' | 'today' | 'upcoming' | 'completed';

const TasksPage: React.FC = () => {
  const { tasks, fetchTasks, toggleComplete, deleteTask, isLoading, filter, setFilter } = useTasksStore();
  const { openAddTaskModal } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [filter]);

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
        {/* Header */}
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-slate-800">Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} total
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={20}
            strokeWidth={2}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Task List */}
        {isLoading ? (
          <div className="space-y-3">
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
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
                onToggle={() => toggleComplete(task._id)}
                onEdit={() => openAddTaskModal(task)}
                onDelete={() => deleteTask(task._id)}
              />
            ))}
          </div>
        )}
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

const TaskListItem: React.FC<{
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ task, onToggle, onEdit, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  const category = categoryConfig[task.category];
  const CategoryIcon = category.icon;

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
      className={`bg-white rounded-xl shadow-sm border transition-all ${
        showActions ? 'border-indigo-200' : 'border-slate-100'
      }`}
    >
      <div className="p-4 flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-slate-300 hover:border-indigo-400'
          }`}
        >
          {task.completed && <Check size={14} strokeWidth={3} className="text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={onEdit}>
          <p className={`font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${category.color}`}>
              <CategoryIcon size={12} strokeWidth={2} />
              {category.label}
            </span>
            {task.time && <span className="text-xs text-slate-400">{task.time}</span>}
            <span className="text-xs text-slate-400">{formatDate(task.date)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
          >
            <MoreVertical size={20} strokeWidth={2} />
          </button>

          {showActions && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-100 py-1 min-w-[120px] z-10 animate-scale-in">
              <button
                onClick={() => {
                  onEdit();
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Pencil size={16} strokeWidth={2} />
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={16} strokeWidth={2} />
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