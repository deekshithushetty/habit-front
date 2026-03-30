import React from 'react';
import {
  BookOpen,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Coffee,
  Dumbbell,
  Droplets,
  Flame,
  Hand,
  Home,
  Laptop,
  MoonStar,
  Music,
  PenSquare,
  Palette,
  PersonStanding,
  Sparkles,
  Sprout,
  Target,
  Trophy,
  BedDouble,
  LucideProps,
} from 'lucide-react';

export type AppIconName =
  | 'work'
  | 'personal'
  | 'health'
  | 'learning'
  | 'task'
  | 'sparkles'
  | 'run'
  | 'book'
  | 'strength'
  | 'mindful'
  | 'water'
  | 'target'
  | 'art'
  | 'music'
  | 'laptop'
  | 'plant'
  | 'coffee'
  | 'rest'
  | 'journal'
  | 'streak'
  | 'trophy'
  | 'wave'
  | 'success';

const iconMap: Record<AppIconName, React.ComponentType<LucideProps>> = {
  work: Briefcase,
  personal: Home,
  health: Dumbbell,
  learning: BookOpen,
  task: ClipboardList,
  sparkles: Sparkles,
  run: PersonStanding,
  book: BookOpen,
  strength: Dumbbell,
  mindful: MoonStar,
  water: Droplets,
  target: Target,
  art: Palette,
  music: Music,
  laptop: Laptop,
  plant: Sprout,
  coffee: Coffee,
  rest: BedDouble,
  journal: PenSquare,
  streak: Flame,
  trophy: Trophy,
  wave: Hand,
  success: CheckCircle2,
};

const legacyHabitIconMap: Record<string, AppIconName> = {
  '✨': 'sparkles',
  '🏃': 'run',
  '📚': 'book',
  '💪': 'strength',
  '🧘': 'mindful',
  '💧': 'water',
  '🎯': 'target',
  '🎨': 'art',
  '🎵': 'music',
  '💻': 'laptop',
  '🌱': 'plant',
  '☕': 'coffee',
  '🛏️': 'rest',
  '📝': 'journal',
};

interface AppIconProps extends Omit<LucideProps, 'name'> {
  name: AppIconName;
}

const AppIcon: React.FC<AppIconProps> = ({ name, ...props }) => {
  const Icon = iconMap[name];
  return <Icon {...props} />;
};

export const resolveHabitIconName = (value: string): AppIconName => {
  if ((value as AppIconName) in iconMap) {
    return value as AppIconName;
  }

  return legacyHabitIconMap[value] ?? 'sparkles';
};

export default AppIcon;
