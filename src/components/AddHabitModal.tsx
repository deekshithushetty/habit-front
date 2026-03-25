import React, { useState } from 'react';
import { useHabitsStore, useUIStore } from '../store';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const iconOptions = ['✨', '🏃', '📚', '💪', '🧘', '💧', '🎯', '🎨', '🎵', '💻', '🌱', '☕', '🛏️', '📝'];

const AddHabitModal: React.FC = () => {
  const { isAddHabitModalOpen, closeAddHabitModal } = useUIStore();
  const { addHabit } = useHabitsStore();
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
      const success = await addHabit({
        name: formData.name.trim(),
        target: formData.target,
        icon: formData.icon,
      });

      if (success) {
        closeAddHabitModal();
        // Reset form
        setFormData({
          name: '',
          target: 7,
          icon: '✨',
        });
      } else {
        setError('Failed to create habit. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
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
        {/* Icon */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Choose an Icon
          </label>
          <div className="grid grid-cols-7 gap-2">
            {iconOptions.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                className={`p-3 rounded-xl text-center transition-all text-xl ${
                  formData.icon === icon
                    ? 'bg-indigo-100 ring-2 ring-indigo-500'
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <Input
          label="Habit Name"
          placeholder="e.g., Morning meditation"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required
          autoFocus
        />

        {/* Target */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Weekly Target (times per week)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={7}
              value={formData.target}
              onChange={(e) => setFormData((prev) => ({ ...prev, target: parseInt(e.target.value) }))}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-indigo-600">{formData.target}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            {formData.target === 7
              ? 'Every day! 🌟'
              : `${7 - formData.target} rest day${7 - formData.target !== 1 ? 's' : ''} per week`}
          </p>
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
