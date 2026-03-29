import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon | string;  // Support both Lucide icons and legacy strings
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon,  // Rename to Icon (capital) to use as component
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  // Check if it's a Lucide icon component (function) or string emoji
  const isLucideIcon = typeof Icon === 'function';

  return (
    <div className="text-center py-10 px-4">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {isLucideIcon ? (
          <Icon size={32} strokeWidth={1.5} className="text-slate-400" />
        ) : (
          <span className="text-3xl">{Icon}</span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-indigo-500 text-sm font-medium hover:text-indigo-600"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;