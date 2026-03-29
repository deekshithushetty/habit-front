import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Task, Habit } from '../types';
import { setAuthToken, authApi, tasksApi, habitsApi, getErrorMessage } from '../services/api';

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
  error: string | null;
  filter: 'all' | 'today' | 'upcoming' | 'completed';
  category: string | null;
  
  // Actions
  fetchTasks: () => Promise<void>;
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
  error: null,
  filter: 'all',
  category: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const params: { filter?: string; category?: string } = {};
      const { filter, category } = get();
      
      if (filter !== 'all') params.filter = filter;
      if (category) params.category = category;
      
      const response = await tasksApi.getAll(params);
      set({ tasks: response.tasks, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  addTask: async (taskData) => {
    try {
      const response = await tasksApi.create(taskData);
      set((state) => ({ tasks: [response.task, ...state.tasks] }));
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
    return get().updateTask(id, { completed: !task.completed });
  },

  setFilter: (filter) => {
    set({ filter });
    get().fetchTasks();
  },

  setCategory: (category) => {
    set({ category });
    get().fetchTasks();
  },
}));

// Habits Store
interface HabitsState {
  habits: Habit[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchHabits: () => Promise<void>;
  addHabit: (habit: Parameters<typeof habitsApi.create>[0]) => Promise<boolean>;
  updateHabit: (id: string, updates: Parameters<typeof habitsApi.update>[1]) => Promise<boolean>;
  deleteHabit: (id: string) => Promise<boolean>;
  incrementProgress: (id: string) => Promise<boolean>;
}

export const useHabitsStore = create<HabitsState>((set) => ({
  habits: [],
  isLoading: false,
  error: null,

  fetchHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await habitsApi.getAll();
      set({ habits: response.habits, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  addHabit: async (habitData) => {
    try {
      const response = await habitsApi.create(habitData);
      set((state) => ({ habits: [response.habit, ...state.habits] }));
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
      }));
      return true;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      return false;
    }
  },

  incrementProgress: async (id) => {
    try {
      const response = await habitsApi.update(id, { increment: true });
      set((state) => ({
        habits: state.habits.map((h) => (h._id === id ? response.habit : h)),
      }));
      return true;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      return false;
    }
  },
}));

// UI Store
interface UIState {
  activeTab: 'home' | 'tasks' | 'insights' | 'profile';
  isAddTaskModalOpen: boolean;
  isAddHabitModalOpen: boolean;
  editingTask: Task | null;
  
  setActiveTab: (tab: 'home' | 'tasks' | 'insights' | 'profile') => void;
  openAddTaskModal: (task?: Task) => void;
  closeAddTaskModal: () => void;
  openAddHabitModal: () => void;
  closeAddHabitModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'home',
  isAddTaskModalOpen: false,
  isAddHabitModalOpen: false,
  editingTask: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  
  openAddTaskModal: (task) => set({ isAddTaskModalOpen: true, editingTask: task || null }),
  
  closeAddTaskModal: () => set({ isAddTaskModalOpen: false, editingTask: null }),
  
  openAddHabitModal: () => set({ isAddHabitModalOpen: true }),
  
  closeAddHabitModal: () => set({ isAddHabitModalOpen: false }),
}));