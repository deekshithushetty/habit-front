import React, { useState, useEffect } from 'react';
import { useUIStore } from '../store';
import { useAddTaskMutation, useUpdateTaskMutation } from '../hooks/useTasks';
import { formatInputDate, getTodayDateKey } from '../lib/dates';
import Modal from '../components/ui/Modal';
import AppIcon, { AppIconName } from '../components/ui/AppIcon';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import type { TaskCategory, TaskFrequency } from '../types';

const CATEGORY_ICON = {
  work: 'work',
  personal: 'personal',
  health: 'health',
  learning: 'learning',
} as const;

const categoryOptions: { value: TaskCategory; label: string; icon: AppIconName }[] = [
  { value: 'work', label: 'Work', icon: CATEGORY_ICON.work },
  { value: 'personal', label: 'Personal', icon: CATEGORY_ICON.personal },
  { value: 'health', label: 'Health', icon: CATEGORY_ICON.health },
  { value: 'learning', label: 'Learning', icon: CATEGORY_ICON.learning },
];

const frequencyOptions: { value: TaskFrequency; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const AddTaskModal: React.FC = () => {
  const { isAddTaskModalOpen, editingTask, closeAddTaskModal } = useUIStore();
  const addTaskMutation = useAddTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'personal' as TaskCategory,
    time: '',
    frequency: 'once' as TaskFrequency,
    date: getTodayDateKey(),
  });

  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        category: editingTask.category,
        time: editingTask.time || '',
        frequency: editingTask.frequency,
        date: formatInputDate(editingTask.date),
      });
    } else {
      setFormData({
        title: '',
        category: 'personal',
        time: '',
        frequency: 'once',
        date: getTodayDateKey(),
      });
    }
    setError(null);
  }, [editingTask, isAddTaskModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const taskData = {
        title: formData.title.trim(),
        category: formData.category,
        time: formData.time || undefined,
        frequency: formData.frequency,
        date: formData.date,
      };

      if (editingTask) {
        await updateTaskMutation.mutateAsync({ id: editingTask._id, updates: taskData });
      } else {
        await addTaskMutation.mutateAsync(taskData);
      }

      closeAddTaskModal();
    } catch {
      setError('Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isAddTaskModalOpen}
      onClose={closeAddTaskModal}
      title={editingTask ? 'Edit Task' : 'Add New Task'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {editingTask && (
          <div className={`rounded-xl border px-4 py-3 ${
            editingTask.completed
              ? 'border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20'
              : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'
          }`}>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Status: {editingTask.completed ? 'Completed' : 'Pending'}
            </p>
            {editingTask.completed && editingTask.lastCompletedAt && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Completed on {new Date(editingTask.lastCompletedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        )}

        {/* Title */}
        <Input
          label="Task Title"
          placeholder="What needs to be done?"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          required
          autoFocus
        />

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Category
          </label>
          <div className="grid grid-cols-4 gap-2">
            {categoryOptions.map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, category: value }))}
                className={`p-3 rounded-xl text-center transition-all ${
                  formData.category === value
                    ? 'bg-indigo-100 dark:bg-indigo-950/50 ring-2 ring-indigo-500'
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="flex justify-center mb-1">
                  <AppIcon name={icon} className="w-5 h-5" />
                </span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Time (optional)
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Repeat
          </label>
          <div className="flex gap-2">
            {frequencyOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, frequency: value }))}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  formData.frequency === value
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={closeAddTaskModal}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="flex-1"
          >
            {editingTask ? 'Save Changes' : 'Add Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTaskModal;
