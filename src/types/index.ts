// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

// Task types
export type TaskCategory = 'work' | 'personal' | 'health' | 'learning';
export type TaskFrequency = 'once' | 'daily' | 'weekly';

export interface Task {
  _id: string;
  userId: string;
  title: string;
  category: TaskCategory;
  time: string | null;
  frequency: TaskFrequency;
  completed: boolean;
  date: string;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TasksResponse {
  count: number;
  tasks: Task[];
}

export interface TaskResponse {
  message: string;
  task: Task;
}

export interface CreateTaskInput {
  title: string;
  category?: TaskCategory;
  time?: string;
  frequency?: TaskFrequency;
  date: string;
}

export interface UpdateTaskInput {
  title?: string;
  category?: TaskCategory;
  time?: string;
  frequency?: TaskFrequency;
  completed?: boolean;
  date?: string;
}

// Habit types
export interface Habit {
  _id: string;
  userId: string;
  name: string;
  icon: string;
  progress: number;
  target: number;
  streak: number;
  lastCompleted: string | null;
  isTargetMet?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitsResponse {
  count: number;
  habits: Habit[];
}

export interface HabitResponse {
  message: string;
  habit: Habit;
}

export interface CreateHabitInput {
  name: string;
  target: number;
  icon?: string;
}

export interface UpdateHabitInput {
  progress?: number;
  increment?: boolean;
}

// API Error type
export interface ApiError {
  message: string;
  errors?: string[];
}

// Navigation types
export type TabType = 'home' | 'tasks' | 'insights' | 'profile';

// Chart data types
export interface ChartDataPoint {
  day: string;
  completed: number;
  total: number;
}