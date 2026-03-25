import React, { useState, useEffect } from 'react';
import { useTasksStore, useUIStore } from '../store';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import type { TaskCategory, TaskFrequency } from '../types';

const categoryOptions: { value: TaskCategory; label: string; emoji: string }[] = [
  { value: 'work', label: 'Work', emoji: '💼' },
  { value: 'personal', label: 'Personal', emoji: '🏠' },
  { value: 'health', label: 'Health', emoji: '💪' },
  { value: 'learning', label: 'Learning', emoji: '📚' },
];

const frequencyOptions: { value: TaskFrequency; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const AddTaskModal: React.FC = () => {
  const { isAddTaskModalOpen, editingTask, closeAddTaskModal } = useUIStore();
  const { addTask, updateTask } = useTasksStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'personal' as TaskCategory,
    time: '',
    frequency: 'once' as TaskFrequency,
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        category: editingTask.category,
        time: editingTask.time || '',
        frequency: editingTask.frequency,
        date: new Date(editingTask.date).toISOString().split('T')[0],
      });
    } else {
      setFormData({
        title: '',
        category: 'personal',
        time: '',
        frequency: 'once',
        date: new Date().toISOString().split('T')[0],
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

      let success;
      if (editingTask) {
        success = await updateTask(editingTask._id, taskData);
      } else {
        success = await addTask(taskData);
      }

      if (success) {
        closeAddTaskModal();
      } else {
        setError('Failed to save task. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
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
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Category
          </label>
          <div className="grid grid-cols-4 gap-2">
            {categoryOptions.map(({ value, label, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, category: value }))}
                className={`p-3 rounded-xl text-center transition-all ${
                  formData.category === value
                    ? 'bg-indigo-100 ring-2 ring-indigo-500'
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl block mb-1">{emoji}</span>
                <span className="text-xs font-medium text-slate-600">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Time (optional)
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
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
