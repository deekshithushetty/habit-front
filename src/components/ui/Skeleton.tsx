import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
}) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : undefined),
  };

  return (
    <div
      className={`skeleton ${variants[variant]} ${className}`}
      style={style}
    />
  );
};

export const TaskSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" width={24} height={24} />
      <div className="flex-1">
        <Skeleton width="70%" className="mb-2" />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
  </div>
);

export const HabitSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 w-40">
    <Skeleton width="40%" height={24} className="mb-2" />
    <Skeleton width="60%" className="mb-2" />
    <Skeleton width="100%" height={8} className="mb-2" />
    <Skeleton width="50%" height={12} />
  </div>
);

export default Skeleton;
