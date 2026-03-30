import React, { useState } from 'react';
import { useUIStore } from '../store';
import { useAddHabitMutation } from '../hooks/useHabits';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const iconOptions = ['✨', '🏃', '📚', '💪', '🧘', '💧', '🎯', '🎨', '🎵', '💻', '🌱', '☕', '🛏️', '📝'];

const AddHabitModal: React.FC = () => {
  const { isAddHabitModalOpen, closeAddHabitModal } = useUIStore();
  const addHabitMutation = useAddHabitMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    target: 7,
    icon: '✨',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await addHabitMutation.mutateAsync({
        name: formData.name.trim(),
        target: formData.target,
        icon: formData.icon,
      });

      closeAddHabitModal();
      setFormData({
        name: '',
        target: 7,
        icon: '✨',
      });
    } catch {
      setError('Failed to create habit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isAddHabitModalOpen}
      onClose={closeAddHabitModal}
      title="Create New Habit"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Choose an Icon
          </label>
          <div className="grid grid-cols-7 gap-2">
            {iconOptions.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                className={`emoji-safe p-3 rounded-xl text-center transition-all text-xl ${
                  formData.icon === icon
                    ? 'bg-indigo-100 dark:bg-indigo-950/50 ring-2 ring-indigo-500'
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Habit Name"
          placeholder="e.g., Morning meditation"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Weekly Target (times per week)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={7}
              value={formData.target}
              onChange={(e) => setFormData((prev) => ({ ...prev, target: parseInt(e.target.value, 10) }))}
              className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-300">{formData.target}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            {formData.target === 7
              ? 'Every day! 🌟'
              : `${7 - formData.target} rest day${7 - formData.target !== 1 ? 's' : ''} per week`}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={closeAddHabitModal}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="flex-1"
          >
            Create Habit
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddHabitModal;
