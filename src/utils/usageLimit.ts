/**
 * Daily usage limit manager for Gamura AI
 * Users are limited to 3 messages per calendar day (YYYY-MM-DD)
 */

const STORAGE_USAGE_KEY = 'gamura_daily_usage_v1';
const MAX_DAILY_MESSAGES = 3;

export interface DailyUsage {
  date: string;
  count: number;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyUsage(): {
  used: number;
  remaining: number;
  max: number;
  isExceeded: boolean;
  date: string;
  timeUntilReset: string;
} {
  const today = getTodayDateString();
  let count = 0;

  try {
    const raw = localStorage.getItem(STORAGE_USAGE_KEY);
    if (raw) {
      const parsed: DailyUsage = JSON.parse(raw);
      if (parsed && parsed.date === today && typeof parsed.count === 'number') {
        count = parsed.count;
      }
    }
  } catch (e) {
    console.warn('Failed to read daily usage:', e);
  }

  // Calculate time until midnight
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const timeUntilReset = `${diffHours}h ${diffMinutes}m`;

  const remaining = Math.max(0, MAX_DAILY_MESSAGES - count);
  const isExceeded = count >= MAX_DAILY_MESSAGES;

  return {
    used: count,
    remaining,
    max: MAX_DAILY_MESSAGES,
    isExceeded,
    date: today,
    timeUntilReset,
  };
}

export function incrementDailyUsage(): {
  used: number;
  remaining: number;
  isExceeded: boolean;
} {
  const today = getTodayDateString();
  const current = getDailyUsage();
  const newCount = current.used + 1;

  try {
    const usageData: DailyUsage = {
      date: today,
      count: newCount,
    };
    localStorage.setItem(STORAGE_USAGE_KEY, JSON.stringify(usageData));
  } catch (e) {
    console.warn('Failed to save daily usage:', e);
  }

  return {
    used: newCount,
    remaining: Math.max(0, MAX_DAILY_MESSAGES - newCount),
    isExceeded: newCount >= MAX_DAILY_MESSAGES,
  };
}

/**
 * Image attachment limit: 3 images per day, refreshes every 24 hours at midnight
 */
const STORAGE_IMAGE_USAGE_KEY = 'gamura_daily_image_usage_v1';
const MAX_DAILY_IMAGES = 3;

export function getDailyImageUsage(): {
  used: number;
  remaining: number;
  max: number;
  isExceeded: boolean;
  date: string;
  timeUntilReset: string;
} {
  const today = getTodayDateString();
  let count = 0;

  try {
    const raw = localStorage.getItem(STORAGE_IMAGE_USAGE_KEY);
    if (raw) {
      const parsed: DailyUsage = JSON.parse(raw);
      if (parsed && parsed.date === today && typeof parsed.count === 'number') {
        count = parsed.count;
      }
    }
  } catch (e) {
    console.warn('Failed to read daily image usage:', e);
  }

  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const timeUntilReset = `${diffHours}h ${diffMinutes}m`;

  const remaining = Math.max(0, MAX_DAILY_IMAGES - count);
  const isExceeded = count >= MAX_DAILY_IMAGES;

  return {
    used: count,
    remaining,
    max: MAX_DAILY_IMAGES,
    isExceeded,
    date: today,
    timeUntilReset,
  };
}

export function incrementDailyImageUsage(amount: number = 1): {
  used: number;
  remaining: number;
  isExceeded: boolean;
} {
  const today = getTodayDateString();
  const current = getDailyImageUsage();
  const newCount = current.used + amount;

  try {
    const usageData: DailyUsage = {
      date: today,
      count: newCount,
    };
    localStorage.setItem(STORAGE_IMAGE_USAGE_KEY, JSON.stringify(usageData));
  } catch (e) {
    console.warn('Failed to save daily image usage:', e);
  }

  return {
    used: newCount,
    remaining: Math.max(0, MAX_DAILY_IMAGES - newCount),
    isExceeded: newCount >= MAX_DAILY_IMAGES,
  };
}

// Track model usage for Recharts analytics dashboard
const MODEL_STATS_KEY = 'gamura_model_usage_v1';

export function recordModelUsage(modelName: string) {
  try {
    const raw = localStorage.getItem(MODEL_STATS_KEY);
    const stats: Record<string, number> = raw ? JSON.parse(raw) : {};
    stats[modelName] = (stats[modelName] || 0) + 1;
    localStorage.setItem(MODEL_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to record model usage:', e);
  }
}

export function getModelStats(): Array<{ name: string; count: number; color?: string }> {
  try {
    const raw = localStorage.getItem(MODEL_STATS_KEY);
    const stats: Record<string, number> = raw ? JSON.parse(raw) : {};

    // Initial defaults for core frontier models
    const defaults: Record<string, number> = {
      GAMURA: 6,
      BUBUBAI: 5,
      SR: 4,
    };

    const combined: Record<string, number> = { ...defaults, ...stats };

    return Object.entries(combined).map(([name, count]) => ({
      name,
      count,
    }));
  } catch (e) {
    return [
      { name: 'GAMURA', count: 6 },
      { name: 'BUBUBAI', count: 5 },
      { name: 'SR', count: 4 },
    ];
  }
}
