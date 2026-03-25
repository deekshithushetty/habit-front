import axios from 'axios';
import type {
  AuthResponse,
  TasksResponse,
  TaskResponse,
  HabitsResponse,
  HabitResponse,
  CreateTaskInput,
  UpdateTaskInput,
  CreateHabitInput,
  UpdateHabitInput,
  User
} from '../types';

// Fallback to localhost for local development if the env var isn't set
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Initialize token from localStorage
export const initAuthToken = () => {
  const token = localStorage.getItem('token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Auth API
export const authApi = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

// Tasks API
export const tasksApi = {
  getAll: async (params?: { filter?: string; category?: string }): Promise<TasksResponse> => {
    const response = await api.get<TasksResponse>('/tasks', { params });
    return response.data;
  },

  create: async (task: CreateTaskInput): Promise<TaskResponse> => {
    const response = await api.post<TaskResponse>('/tasks', task);
    return response.data;
  },

  update: async (id: string, task: UpdateTaskInput): Promise<TaskResponse> => {
    const response = await api.put<TaskResponse>(`/tasks/${id}`, task);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/tasks/${id}`);
    return response.data;
  },
};

// Habits API
export const habitsApi = {
  getAll: async (): Promise<HabitsResponse> => {
    const response = await api.get<HabitsResponse>('/habits');
    return response.data;
  },

  create: async (habit: CreateHabitInput): Promise<HabitResponse> => {
    const response = await api.post<HabitResponse>('/habits', habit);
    return response.data;
  },

  update: async (id: string, habit: UpdateHabitInput): Promise<HabitResponse> => {
    const response = await api.put<HabitResponse>(`/habits/${id}`, habit);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/habits/${id}`);
    return response.data;
  },

  resetStreak: async (id: string): Promise<HabitResponse> => {
    const response = await api.post<HabitResponse>(`/habits/${id}/reset-streak`);
    return response.data;
  },
};

// Error handler helper
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default api;
