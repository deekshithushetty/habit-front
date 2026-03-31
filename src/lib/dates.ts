const pad = (value: number) => value.toString().padStart(2, '0');

export const toLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const getTodayDateKey = () => toLocalDateKey(new Date());

export const getDateKey = (value: string | Date) => {
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }

  return toLocalDateKey(new Date(value));
};

export const dateKeyToDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addDaysToDateKey = (dateKey: string, days: number) => {
  const nextDate = dateKeyToDate(dateKey);
  nextDate.setDate(nextDate.getDate() + days);
  return toLocalDateKey(nextDate);
};

export const formatInputDate = (value: string | Date) => getDateKey(value);

export const formatMonthDay = (value: string | Date) =>
  dateKeyToDate(getDateKey(value)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

export const formatMonthYear = (value: string | Date) =>
  dateKeyToDate(getDateKey(value)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
