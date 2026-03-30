import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { CreateHabitInput, Habit, HabitsResponse, UpdateHabitInput } from '../types';
import { habitsApi } from '../services/api';
import { enqueueOfflineAction, isOfflineMutationError } from '../lib/offlineSync';
import { useAuthStore } from '../store';

const DEFAULT_HABITS_LIMIT = 12;
const ALL_HABITS_LIMIT = 100;

interface UseHabitsOptions {
  limit?: number;
}

const buildHabitParams = (page: number, options: UseHabitsOptions) => ({
  page,
  limit: options.limit ?? DEFAULT_HABITS_LIMIT,
});

const flattenHabitPages = (data?: InfiniteData<HabitsResponse, unknown>) =>
  data?.pages.flatMap((page) => page.habits) ?? [];

const updateInfiniteHabitPages = (
  data: InfiniteData<HabitsResponse, unknown> | undefined,
  updater: (habit: Habit) => Habit,
) => {
  if (!data) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      habits: page.habits.map(updater),
    })),
  };
};

const prependHabitToInfinitePages = (
  data: InfiniteData<HabitsResponse, unknown> | undefined,
  habit: Habit,
) => {
  if (!data || data.pages.length === 0) return data;

  return {
    ...data,
    pages: data.pages.map((page, index) => {
      if (index !== 0) return page;

      const nextHabits = [habit, ...page.habits];
      return {
        ...page,
        count: nextHabits.length,
        pagination: {
          ...page.pagination,
          total: page.pagination.total + 1,
        },
        habits: nextHabits,
      };
    }),
  };
};

const removeHabitFromInfinitePages = (
  data: InfiniteData<HabitsResponse, unknown> | undefined,
  id: string,
) => {
  if (!data) return data;

  return {
    ...data,
    pages: data.pages.map((page, index) => {
      const nextHabits = page.habits.filter((habit) => habit._id !== id);
      const total = index === 0 ? Math.max(0, page.pagination.total - 1) : page.pagination.total;

      return {
        ...page,
        count: nextHabits.length,
        pagination: {
          ...page.pagination,
          total,
          hasMore: page.pagination.hasMore || nextHabits.length === page.pagination.limit,
        },
        habits: nextHabits,
      };
    }),
  };
};

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

const fetchAllHabits = async () => {
  let page = 1;
  let hasMore = true;
  const habits: Habit[] = [];

  while (hasMore) {
    const response = await habitsApi.getAll(buildHabitParams(page, { limit: ALL_HABITS_LIMIT }));
    habits.push(...response.habits);
    hasMore = response.pagination.hasMore;
    page += 1;
  }

  return habits;
};

export const useHabits = (options: UseHabitsOptions = {}) => {
  const userId = useAuthStore((state) => state.user?.id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const query = useInfiniteQuery({
    queryKey: ['habits', 'list', userId, options.limit ?? DEFAULT_HABITS_LIMIT],
    queryFn: ({ pageParam }) => habitsApi.getAll(buildHabitParams(pageParam, options)),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    enabled: isAuthenticated && Boolean(userId),
  });

  return {
    ...query,
    habits: flattenHabitPages(query.data),
    total: query.data?.pages[0]?.pagination.total ?? 0,
    hasMore: query.hasNextPage ?? false,
    isInitialLoading: query.isLoading && !query.data,
  };
};

export const useAllHabits = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['habits', 'all', userId],
    queryFn: fetchAllHabits,
    enabled: isAuthenticated && Boolean(userId),
  });
};

export const useAddHabitMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (habit: CreateHabitInput) => habitsApi.create(habit),
    onSuccess: (response) => {
      queryClient.setQueriesData<InfiniteData<HabitsResponse, unknown>>(
        { queryKey: ['habits', 'list'] },
        (current) => prependHabitToInfinitePages(current, response.habit),
      );
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
};

export const useUpdateHabitMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateHabitInput }) =>
      habitsApi.update(id, updates),
    onSuccess: (response) => {
      queryClient.setQueriesData<InfiniteData<HabitsResponse, unknown>>(
        { queryKey: ['habits', 'list'] },
        (current) => updateInfiniteHabitPages(current, (habit) => (
          habit._id === response.habit._id ? response.habit : habit
        )),
      );
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
};

export const useDeleteHabitMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => habitsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['habits', 'list'] });

      const previousHabits = queryClient.getQueriesData<InfiniteData<HabitsResponse, unknown>>({
        queryKey: ['habits', 'list'],
      });

      queryClient.setQueriesData<InfiniteData<HabitsResponse, unknown>>(
        { queryKey: ['habits', 'list'] },
        (current) => removeHabitFromInfinitePages(current, id),
      );

      return { previousHabits };
    },
    onError: (_error, _id, context) => {
      context?.previousHabits.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
};

export const useIncrementHabitMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (habit: Habit) => habitsApi.update(habit._id, { increment: true }),
    onMutate: async (habit) => {
      await queryClient.cancelQueries({ queryKey: ['habits', 'list'] });

      const previousHabits = queryClient.getQueriesData<InfiniteData<HabitsResponse, unknown>>({
        queryKey: ['habits', 'list'],
      });

      queryClient.setQueriesData<InfiniteData<HabitsResponse, unknown>>(
        { queryKey: ['habits', 'list'] },
        (current) => updateInfiniteHabitPages(current, (currentHabit) => (
          currentHabit._id === habit._id
            ? getOptimisticIncrementedHabit(currentHabit)
            : currentHabit
        )),
      );

      return { previousHabits };
    },
    onError: (_error, _habit, context) => {
      if (isOfflineMutationError()) {
        enqueueOfflineAction({
          type: 'habit-increment',
          habitId: _habit._id,
        });
        return;
      }

      context?.previousHabits.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSuccess: (response) => {
      queryClient.setQueriesData<InfiniteData<HabitsResponse, unknown>>(
        { queryKey: ['habits', 'list'] },
        (current) => updateInfiniteHabitPages(current, (habit) => (
          habit._id === response.habit._id ? response.habit : habit
        )),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
};
