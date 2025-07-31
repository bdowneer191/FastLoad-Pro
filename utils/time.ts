// Options for formatting time in Dhaka
const dhakaTimeOptions: Intl.DateTimeFormatOptions = {
  timeZone: 'Asia/Dhaka',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
};

// Options for formatting date in Dhaka
const dhakaDateOptions: Intl.DateTimeFormatOptions = {
  timeZone: 'Asia/Dhaka',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

export const getDhakaTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', dhakaTimeOptions);
};

export const getDhakaDate = (date: Date): string => {
  return date.toLocaleDateString('en-GB', dhakaDateOptions);
};


export const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00:00';
  }
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const isWithinLast24Hours = (date: Date): boolean => {
    const twentyFourHoursInMillis = 24 * 60 * 60 * 1000;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff >= 0 && diff <= twentyFourHoursInMillis;
};

export const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};
