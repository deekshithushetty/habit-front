import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Task, Habit } from '../types';
import { setAuthToken, authApi, tasksApi, habitsApi, getErrorMessage } from '../services/api';
import { queryClient } from '../lib/queryClient';

type ThemeMode = 'light' | 'dark';

const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';

  try {
    const raw = window.localStorage.getItem('ui-storage');
    if (!raw) return 'light';

    const parsed = JSON.parse(raw) as { state?: { theme?: ThemeMode } };
    return parsed.state?.theme === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

const applyThemeToDocument = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;

  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const replaceTaskById = (tasks: Task[], nextTask: Task) =>
  tasks.map((task) => (task._id === nextTask._id ? nextTask : task));

const replaceHabitById = (habits: Habit[], nextHabit: Habit) =>
  habits.map((habit) => (habit._id === nextHabit._id ? nextHabit : habit));

const getOptimisticIncrementedHabit = (habit: Habit): Habit => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let streak = habit.streak;
  let lastCompleted = habit.lastCompleted;

  if (!habit.lastCompleted) {
    streak = 1;
    lastCompleted = now.toISOString();
  } else {
    const lastDate = new Date(habit.lastCompleted);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak += 1;
      lastCompleted = now.toISOString();
    } else if (diffDays > 1) {
      streak = 1;
      lastCompleted = now.toISOString();
    }
  }

  const progress = habit.progress + 1;

  return {
    ...habit,
    progress,
    streak,
    lastCompleted,
    isTargetMet: progress >= habit.target,
    updatedAt: now.toISOString(),
  };
};

// Auth Store
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(email, password);
          setAuthToken(response.token);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error) {
          set({ error: getErrorMessage(error), isLoading: false });
          return false;
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(name, email, password);
          setAuthToken(response.token);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error) {
          set({ error: getErrorMessage(error), isLoading: false });
          return false;
        }
      },

      logout: () => {
        setAuthToken(null);
        queryClient.clear();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),

      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }
        
        setAuthToken(token);
        set({ isLoading: true });
        
        try {
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

// Tasks Store
interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  filter: 'all' | 'today' | 'upcoming' | 'completed';
  category: string | null;
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  
  // Actions
  fetchTasks: (options?: { page?: number; limit?: number; append?: boolean }) => Promise<void>;
  loadMoreTasks: () => Promise<void>;
  addTask: (task: Parameters<typeof tasksApi.create>[0]) => Promise<boolean>;
  updateTask: (id: string, updates: Parameters<typeof tasksApi.update>[1]) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  toggleComplete: (id: string) => Promise<boolean>;
  setFilter: (filter: 'all' | 'today' | 'upcoming' | 'completed') => void;
  setCategory: (category: string | null) => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  filter: 'all',
  category: null,
  page: 1,
  limit: 20,
  total: 0,
  hasMore: false,

  fetchTasks: async (options) => {
    const nextPage = options?.page ?? 1;
    const nextLimit = options?.limit ?? get().limit;
    const append = options?.append ?? nextPage > 1;

    set({
      error: null,
      isLoading: !append,
      isLoadingMore: append,
    });

    try {
      const params: { filter?: string; category?: string; page?: number; limit?: number } = {
        page: nextPage,
        limit: nextLimit,
      };
      const { filter, category } = get();
      
      if (filter !== 'all') params.filter = filter;
      if (category) params.category = category;
      
      const response = await tasksApi.getAll(params);
      set((state) => ({
        tasks: append ? [...state.tasks, ...response.tasks] : response.tasks,
        isLoading: false,
        isLoadingMore: false,
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        hasMore: response.pagination.hasMore,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false, isLoadingMore: false });
    }
  },

  loadMoreTasks: async () => {
    const { isLoading, isLoadingMore, hasMore, page, limit } = get();
    if (isLoading || isLoadingMore || !hasMore) return;
    await get().fetchTasks({ page: page + 1, limit, append: true });
  },

  addTask: async (taskData) => {
    try {
      const response = await tasksApi.create(taskData);
      set((state) => ({
        tasks: [response.task, ...state.tasks],
        total: state.total + 1,
      }));
      return true;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      return false;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const response = await tasksApi.update(id, updates);
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === id ? response.task : t)),
      }));
      return true;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      return false;
    }
  },

  deleteTask: async (id) => {
    try {
      await tasksApi.delete(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== id),
        total: Math.max(0, state.total - 1),
      }));
      return true;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      return false;
    }
  },

  toggleComplete: async (id) => {
    const task = get().tasks.find((t) => t._id === id);
    if (!task) return false;

    const optimisticTask: Task = {
      ...task,
      completed: !task.completed,
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      error: null,
      tasks: replaceTaskById(state.tasks, optimisticTask),
    }));

    try {
      const response = await tasksApi.update(id, { completed: optimisticTask.completed });
      set((state) => ({
        tasks: replaceTaskById(state.tasks, response.task),
      }));
      return true;
    } catch (error) {
      set((state) => ({
        error: getErrorMessage(error),
        tasks: replaceTaskById(state.tasks, task),
      }));
      return false;
    }
  },

  setFilter: (filter) => {
    set({ filter, page: 1, tasks: [], total: 0, hasMore: false });
  },

  setCategory: (category) => {
    set({ category, page: 1, tasks: [], total: 0, hasMore: false });
  },
}));

// Habits Store
interface HabitsState {
  habits: Habit[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  
  // Actions
  fetchHabits: (options?: { page?: number; limit?: number; append?: boolean }) => Promise<void>;
  loadMoreHabits: () => Promise<void>;
  addHabit: (habit: Parameters<typeof habitsApi.create>[0]) => Promise<boolean>;
  updateHabit: (id: string, updates: Parameters<typeof habitsApi.update>[1]) => Promise<boolean>;
  deleteHabit: (id: string) => Promise<boolean>;
  incrementProgress: (id: string) => Promise<boolean>;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  page: 1,
  limit: 12,
  total: 0,
  hasMore: false,

  fetchHabits: async (options) => {
    const nextPage = options?.page ?? 1;
    const nextLimit = options?.limit ?? get().limit;
    const append = options?.append ?? nextPage > 1;

    set({
      error: null,
      isLoading: !append,
      isLoadingMore: append,
    });

    try {
      const response = await habitsApi.getAll({ page: nextPage, limit: nextLimit });
      set((state) => ({
        habits: append ? [...state.habits, ...response.habits] : response.habits,
        isLoading: false,
        isLoadingMore: false,
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        hasMore: response.pagination.hasMore,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false, isLoadingMore: false });
    }
  },

  loadMoreHabits: async () => {
    const { isLoading, isLoadingMore, hasMore, page, limit } = get();
    if (isLoading || isLoadingMore || !hasMore) return;
    await get().fetchHabits({ page: page + 1, limit, append: true });
  },

  addHabit: async (habitData) => {
    try {
      const response = await habitsApi.create(habitData);
      set((state) => ({
        habits: [response.habit, ...state.habits],
        total: state.total + 1,
      }));
      return true;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      return false;
    }
  },

  updateHabit: async (id, updates) => {
    try {
      const response = await habitsApi.update(id, updates);
      set((state) => ({
        habits: state.habits.map((h) => (h._id === id ? response.habit : h)),
      }));
      return true;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      return false;
    }
  },

  deleteHabit: async (id) => {
    try {
      await habitsApi.delete(id);
      set((state) => ({
        habits: state.habits.filter((h) => h._id !== id),
        total: Math.max(0, state.total - 1),
      }));
      return true;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      return false;
    }
  },

  incrementProgress: async (id) => {
    const habit = get().habits.find((h) => h._id === id);
    if (!habit) return false;

    const optimisticHabit = getOptimisticIncrementedHabit(habit);

    set((state) => ({
      error: null,
      habits: replaceHabitById(state.habits, optimisticHabit),
    }));

    try {
      const response = await habitsApi.update(id, { increment: true });
      set((state) => ({
        habits: replaceHabitById(state.habits, response.habit),
      }));
      return true;
    } catch (error) {
      set((state) => ({
        error: getErrorMessage(error),
        habits: replaceHabitById(state.habits, habit),
      }));
      return false;
    }
  },
}));

// UI Store
interface UIState {
  activeTab: 'home' | 'tasks' | 'insights' | 'profile';
  theme: ThemeMode;
  isAddTaskModalOpen: boolean;
  isAddHabitModalOpen: boolean;
  editingTask: Task | null;
  
  setActiveTab: (tab: 'home' | 'tasks' | 'insights' | 'profile') => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  openAddTaskModal: (task?: Task) => void;
  closeAddTaskModal: () => void;
  openAddHabitModal: () => void;
  closeAddHabitModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeTab: 'home',
      theme: getStoredTheme(),
      isAddTaskModalOpen: false,
      isAddHabitModalOpen: false,
      editingTask: null,

      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleTheme: () =>
        set((state) => {
          const nextTheme: ThemeMode = state.theme === 'light' ? 'dark' : 'light';
          applyThemeToDocument(nextTheme);
          return { theme: nextTheme };
        }),
      setTheme: (theme) => {
        applyThemeToDocument(theme);
        set({ theme });
      },
      openAddTaskModal: (task) => set({ isAddTaskModalOpen: true, editingTask: task || null }),
      closeAddTaskModal: () => set({ isAddTaskModalOpen: false, editingTask: null }),
      openAddHabitModal: () => set({ isAddHabitModalOpen: true }),
      closeAddHabitModal: () => set({ isAddHabitModalOpen: false }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ theme: state.theme, activeTab: state.activeTab }),
      onRehydrateStorage: () => (state) => {
        applyThemeToDocument(state?.theme ?? 'light');
      },
    }
  )
);
