/**
 * Daily usage limit and 24-hour chat expiration manager for Gamura AI
 * Supports per-user quotas (3 messages / day, 3 images / day)
 * and automatic 24-hour / date-change thread cleanup.
 */
import { Thread } from '../types';

const STORAGE_USAGE_PREFIX = 'gamura_daily_usage_v2';
const STORAGE_IMAGE_USAGE_PREFIX = 'gamura_daily_image_usage_v2';
const STORAGE_INTERACTION_PREFIX = 'gamura_last_interaction_v2';
const LEGACY_USAGE_KEY = 'gamura_daily_usage_v1';
const LEGACY_IMAGE_USAGE_KEY = 'gamura_daily_image_usage_v1';

export const MAX_DAILY_MESSAGES = 3;
export const MAX_DAILY_IMAGES = 3;
export const EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface DailyUsage {
  date: string;
  count: number;
}

/**
 * Returns formatted calendar date (YYYY-MM-DD) in local time
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes user identifier into a safe localStorage key segment
 */
export function sanitizeUserKey(userId?: string | null): string {
  if (!userId || typeof userId !== 'string') return 'guest';
  const clean = userId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return clean || 'guest';
}

/**
 * Calculates remaining time string until midnight reset
 */
export function getTimeUntilReset(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffHours}h ${diffMinutes}m`;
}

/**
 * Retrieves daily message usage for a specific user (or guest)
 */
export function getDailyUsage(userId?: string | null): {
  used: number;
  remaining: number;
  max: number;
  isExceeded: boolean;
  date: string;
  timeUntilReset: string;
} {
  const today = getTodayDateString();
  const userSegment = sanitizeUserKey(userId);
  const key = `${STORAGE_USAGE_PREFIX}_${userSegment}`;
  let count = 0;

  try {
    let raw = localStorage.getItem(key);
    // Backward compatibility migration for guest
    if (!raw && userSegment === 'guest') {
      raw = localStorage.getItem(LEGACY_USAGE_KEY);
    }

    if (raw) {
      const parsed: DailyUsage = JSON.parse(raw);
      if (parsed && parsed.date === today && typeof parsed.count === 'number') {
        count = parsed.count;
      }
    }
  } catch (e) {
    console.warn('Failed to read daily message usage:', e);
  }

  const remaining = Math.max(0, MAX_DAILY_MESSAGES - count);
  const isExceeded = count >= MAX_DAILY_MESSAGES;

  return {
    used: count,
    remaining,
    max: MAX_DAILY_MESSAGES,
    isExceeded,
    date: today,
    timeUntilReset: getTimeUntilReset(),
  };
}

/**
 * Increments daily message usage for a specific user (or guest)
 */
export function incrementDailyUsage(userId?: string | null): {
  used: number;
  remaining: number;
  isExceeded: boolean;
} {
  const today = getTodayDateString();
  const userSegment = sanitizeUserKey(userId);
  const key = `${STORAGE_USAGE_PREFIX}_${userSegment}`;
  const current = getDailyUsage(userId);
  const newCount = current.used + 1;

  try {
    const usageData: DailyUsage = {
      date: today,
      count: newCount,
    };
    localStorage.setItem(key, JSON.stringify(usageData));
    updateLastInteraction(userId);
  } catch (e) {
    console.warn('Failed to save daily message usage:', e);
  }

  return {
    used: newCount,
    remaining: Math.max(0, MAX_DAILY_MESSAGES - newCount),
    isExceeded: newCount >= MAX_DAILY_MESSAGES,
  };
}

/**
 * Retrieves daily image upload usage for a specific user (or guest)
 */
export function getDailyImageUsage(userId?: string | null): {
  used: number;
  remaining: number;
  max: number;
  isExceeded: boolean;
  date: string;
  timeUntilReset: string;
} {
  const today = getTodayDateString();
  const userSegment = sanitizeUserKey(userId);
  const key = `${STORAGE_IMAGE_USAGE_PREFIX}_${userSegment}`;
  let count = 0;

  try {
    let raw = localStorage.getItem(key);
    if (!raw && userSegment === 'guest') {
      raw = localStorage.getItem(LEGACY_IMAGE_USAGE_KEY);
    }

    if (raw) {
      const parsed: DailyUsage = JSON.parse(raw);
      if (parsed && parsed.date === today && typeof parsed.count === 'number') {
        count = parsed.count;
      }
    }
  } catch (e) {
    console.warn('Failed to read daily image usage:', e);
  }

  const remaining = Math.max(0, MAX_DAILY_IMAGES - count);
  const isExceeded = count >= MAX_DAILY_IMAGES;

  return {
    used: count,
    remaining,
    max: MAX_DAILY_IMAGES,
    isExceeded,
    date: today,
    timeUntilReset: getTimeUntilReset(),
  };
}

/**
 * Increments daily image upload usage for a specific user (or guest)
 */
export function incrementDailyImageUsage(amount: number = 1, userId?: string | null): {
  used: number;
  remaining: number;
  isExceeded: boolean;
} {
  const today = getTodayDateString();
  const userSegment = sanitizeUserKey(userId);
  const key = `${STORAGE_IMAGE_USAGE_PREFIX}_${userSegment}`;
  const current = getDailyImageUsage(userId);
  const newCount = current.used + amount;

  try {
    const usageData: DailyUsage = {
      date: today,
      count: newCount,
    };
    localStorage.setItem(key, JSON.stringify(usageData));
    updateLastInteraction(userId);
  } catch (e) {
    console.warn('Failed to save daily image usage:', e);
  }

  return {
    used: newCount,
    remaining: Math.max(0, MAX_DAILY_IMAGES - newCount),
    isExceeded: newCount >= MAX_DAILY_IMAGES,
  };
}

/**
 * Resets daily message and image quota for testing / dev convenience
 */
export function resetDailyUsage(userId?: string | null): void {
  const userSegment = sanitizeUserKey(userId);
  try {
    localStorage.removeItem(`${STORAGE_USAGE_PREFIX}_${userSegment}`);
    localStorage.removeItem(`${STORAGE_IMAGE_USAGE_PREFIX}_${userSegment}`);
    localStorage.removeItem(LEGACY_USAGE_KEY);
    localStorage.removeItem(LEGACY_IMAGE_USAGE_KEY);
  } catch (e) {
    console.warn('Failed to reset daily usage:', e);
  }
}

/**
 * Records user's last interaction timestamp and date
 */
export function updateLastInteraction(userId?: string | null): void {
  const userSegment = sanitizeUserKey(userId);
  const key = `${STORAGE_INTERACTION_PREFIX}_${userSegment}`;
  try {
    const data = {
      timestamp: Date.now(),
      date: getTodayDateString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to record last interaction:', e);
  }
}

/**
 * Retrieves the recorded last interaction for this user
 */
export function getLastInteraction(userId?: string | null): {
  timestamp: number;
  date: string;
} | null {
  const userSegment = sanitizeUserKey(userId);
  const key = `${STORAGE_INTERACTION_PREFIX}_${userSegment}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

/**
 * 24-Hour & Date-Change Chat Thread Cleanup Utility
 * Automatically deletes or archives threads if:
 * 1. The thread creation / last update timestamp is older than 24 hours (86,400,000 ms)
 * 2. The calendar date has changed since the user's previous interaction
 */
export function checkAndCleanExpiredChats(
  threads: Thread[],
  userId?: string | null
): {
  cleanedThreads: Thread[];
  hasChanges: boolean;
  deletedCount: number;
  reason?: '24h_expired' | 'date_changed';
} {
  if (!threads || threads.length === 0) {
    updateLastInteraction(userId);
    return { cleanedThreads: [], hasChanges: false, deletedCount: 0 };
  }

  const now = Date.now();
  const today = getTodayDateString();
  const lastInteraction = getLastInteraction(userId);
  const cutoffTime = now - EXPIRATION_MS;

  const isDateChanged = Boolean(
    lastInteraction?.date && lastInteraction.date !== today
  );

  let deletedCount = 0;
  let reason: '24h_expired' | 'date_changed' | undefined = undefined;

  const cleanedThreads = threads.filter((thread) => {
    const threadTime = Number(thread.t) || 0;
    // Condition 1: Older than 24 hours
    const isOlderThan24h = threadTime > 0 && threadTime < cutoffTime;

    // Condition 2: If date changed and thread is pinned, user might want to keep pinned,
    // but unpinned threads from previous calendar day are expired
    const isFromPreviousDate = isDateChanged && threadTime < cutoffTime;

    if (isOlderThan24h || isFromPreviousDate) {
      deletedCount++;
      if (isDateChanged) {
        reason = 'date_changed';
      } else if (!reason) {
        reason = '24h_expired';
      }
      return false; // Remove expired thread
    }
    return true;
  });

  const hasChanges = deletedCount > 0;
  updateLastInteraction(userId);

  return {
    cleanedThreads,
    hasChanges,
    deletedCount,
    reason,
  };
}

// Track model usage for Recharts analytics dashboard
const MODEL_STATS_KEY = 'gamura_model_usage_v2';

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
