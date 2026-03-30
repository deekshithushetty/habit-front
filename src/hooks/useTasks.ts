import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { CreateTaskInput, Task, TasksResponse, UpdateTaskInput } from '../types';
import { tasksApi } from '../services/api';
import { enqueueOfflineAction, isOfflineMutationError } from '../lib/offlineSync';
import { useAuthStore } from '../store';

const DEFAULT_TASKS_LIMIT = 20;
const ALL_TASKS_LIMIT = 100;

type TaskFilter = 'all' | 'today' | 'upcoming' | 'completed';

interface UseTasksOptions {
  filter?: TaskFilter;
  category?: string | null;
  limit?: number;
}

const buildTaskParams = (
  page: number,
  options: UseTasksOptions,
) => ({
  page,
  limit: options.limit ?? DEFAULT_TASKS_LIMIT,
  filter: options.filter && options.filter !== 'all' ? options.filter : undefined,
  category: options.category ?? undefined,
});

const flattenTaskPages = (data?: InfiniteData<TasksResponse, unknown>) =>
  data?.pages.flatMap((page) => page.tasks) ?? [];

const updateInfiniteTaskPages = (
  data: InfiniteData<TasksResponse, unknown> | undefined,
  updater: (task: Task) => Task,
) => {
  if (!data) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      tasks: page.tasks.map(updater),
    })),
  };
};

const removeTaskFromInfinitePages = (
  data: InfiniteData<TasksResponse, unknown> | undefined,
  id: string,
) => {
  if (!data) return data;

  return {
    ...data,
    pages: data.pages.map((page, index) => {
      const nextTasks = page.tasks.filter((task) => task._id !== id);
      const total = index === 0 ? Math.max(0, page.pagination.total - 1) : page.pagination.total;

      return {
        ...page,
        count: nextTasks.length,
        pagination: {
          ...page.pagination,
          total,
          hasMore: page.pagination.hasMore || nextTasks.length === page.pagination.limit,
        },
        tasks: nextTasks,
      };
    }),
  };
};

const prependTaskToInfinitePages = (
  data: InfiniteData<TasksResponse, unknown> | undefined,
  task: Task,
) => {
  if (!data || data.pages.length === 0) return data;

  return {
    ...data,
    pages: data.pages.map((page, index) => {
      if (index !== 0) return page;

      const nextTasks = [task, ...page.tasks];
      return {
        ...page,
        count: nextTasks.length,
        pagination: {
          ...page.pagination,
          total: page.pagination.total + 1,
        },
        tasks: nextTasks,
      };
    }),
  };
};

const fetchAllTasks = async (options: Omit<UseTasksOptions, 'limit'> = {}) => {
  let page = 1;
  let hasMore = true;
  const tasks: Task[] = [];

  while (hasMore) {
    const response = await tasksApi.getAll(buildTaskParams(page, { ...options, limit: ALL_TASKS_LIMIT }));
    tasks.push(...response.tasks);
    hasMore = response.pagination.hasMore;
    page += 1;
  }

  return tasks;
};

export const useTasks = (options: UseTasksOptions = {}) => {
  const userId = useAuthStore((state) => state.user?.id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const query = useInfiniteQuery({
    queryKey: ['tasks', 'list', userId, options.filter ?? 'all', options.category ?? null, options.limit ?? DEFAULT_TASKS_LIMIT],
    queryFn: ({ pageParam }) => tasksApi.getAll(buildTaskParams(pageParam, options)),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    enabled: isAuthenticated && Boolean(userId),
  });

  return {
    ...query,
    tasks: flattenTaskPages(query.data),
    total: query.data?.pages[0]?.pagination.total ?? 0,
    hasMore: query.hasNextPage ?? false,
    isInitialLoading: query.isLoading && !query.data,
  };
};

export const useAllTasks = (options: Omit<UseTasksOptions, 'limit'> = {}) => {
  const userId = useAuthStore((state) => state.user?.id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['tasks', 'all', userId, options.filter ?? 'all', options.category ?? null],
    queryFn: () => fetchAllTasks(options),
    enabled: isAuthenticated && Boolean(userId),
  });
};

export const useAddTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: CreateTaskInput) => tasksApi.create(task),
    onSuccess: (response) => {
      queryClient.setQueriesData<InfiniteData<TasksResponse, unknown>>(
        { queryKey: ['tasks', 'list'] },
        (current) => prependTaskToInfinitePages(current, response.task),
      );
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTaskInput }) =>
      tasksApi.update(id, updates),
    onSuccess: (response) => {
      queryClient.setQueriesData<InfiniteData<TasksResponse, unknown>>(
        { queryKey: ['tasks', 'list'] },
        (current) => updateInfiniteTaskPages(current, (task) => (
          task._id === response.task._id ? response.task : task
        )),
      );
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', 'list'] });

      const previousTasks = queryClient.getQueriesData<InfiniteData<TasksResponse, unknown>>({
        queryKey: ['tasks', 'list'],
      });

      queryClient.setQueriesData<InfiniteData<TasksResponse, unknown>>(
        { queryKey: ['tasks', 'list'] },
        (current) => removeTaskFromInfinitePages(current, id),
      );

      return { previousTasks };
    },
    onError: (_error, _id, context) => {
      context?.previousTasks.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useToggleTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Task) =>
      tasksApi.update(task._id, { completed: !task.completed }),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', 'list'] });

      const previousTasks = queryClient.getQueriesData<InfiniteData<TasksResponse, unknown>>({
        queryKey: ['tasks', 'list'],
      });

      queryClient.setQueriesData<InfiniteData<TasksResponse, unknown>>(
        { queryKey: ['tasks', 'list'] },
        (current) => updateInfiniteTaskPages(current, (currentTask) => (
          currentTask._id === task._id
            ? {
                ...currentTask,
                completed: !currentTask.completed,
                updatedAt: new Date().toISOString(),
              }
            : currentTask
        )),
      );

      return { previousTasks };
    },
    onError: (_error, _task, context) => {
      if (isOfflineMutationError()) {
        enqueueOfflineAction({
          type: 'task-completed',
          taskId: _task._id,
          completed: !_task.completed,
        });
        return;
      }

      context?.previousTasks.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSuccess: (response) => {
      queryClient.setQueriesData<InfiniteData<TasksResponse, unknown>>(
        { queryKey: ['tasks', 'list'] },
        (current) => updateInfiniteTaskPages(current, (task) => (
          task._id === response.task._id ? response.task : task
        )),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
