import { habitsApi, tasksApi } from '../services/api';
import { queryClient } from './queryClient';

type OfflineAction =
  | { type: 'task-completed'; taskId: string; completed: boolean }
  | { type: 'habit-increment'; habitId: string };

const OFFLINE_QUEUE_KEY = 'taskflow-offline-actions';

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readQueue = (): OfflineAction[] => {
  if (!canUseStorage()) return [];

  const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as OfflineAction[];
  } catch {
    window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return [];
  }
};

const writeQueue = (queue: OfflineAction[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

export const enqueueOfflineAction = (action: OfflineAction) => {
  const queue = readQueue();
  queue.push(action);
  writeQueue(queue);
};

export const flushOfflineActions = async () => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  const queue = readQueue();
  if (queue.length === 0) return;

  const remaining: OfflineAction[] = [];

  for (const action of queue) {
    try {
      if (action.type === 'task-completed') {
        await tasksApi.update(action.taskId, { completed: action.completed });
      } else if (action.type === 'habit-increment') {
        await habitsApi.update(action.habitId, { increment: true });
      }
    } catch {
      remaining.push(action);
      break;
    }
  }

  writeQueue(remaining);

  if (remaining.length === 0) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['habits'] }),
    ]);
  }
};

export const startOfflineSync = () => {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    void flushOfflineActions();
  };

  window.addEventListener('online', handleOnline);
  void flushOfflineActions();

  return () => {
    window.removeEventListener('online', handleOnline);
  };
};

export const isOfflineMutationError = () =>
  typeof navigator !== 'undefined' && !navigator.onLine;
