import { Message } from '../types';

/**
 * Extracts concise, high-signal topic tags from conversation messages to re-orient the user
 */
export function extractContextTopics(messages: Message[], threadTitle?: string): string[] {
  if (!messages || messages.length === 0) {
    return [];
  }

  // Combine title and user prompts
  const userTexts = messages
    .filter((m) => m.role === 'user' && m.content)
    .map((m) => m.content)
    .join(' ');

  const textToAnalyze = `${threadTitle || ''} ${userTexts}`.toLowerCase();

  const stopWords = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
    'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
    'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me',
    'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only',
    'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should',
    'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
    'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
    'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
    'will', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves', 'please', 'tell',
    'write', 'code', 'make', 'give', 'help', 'explain', 'show', 'create'
  ]);

  // Extract clean words
  const words = textToAnalyze
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w) && !/^\d+$/.test(w));

  // Count word frequencies
  const freqMap = new Map<string, number>();
  for (const word of words) {
    freqMap.set(word, (freqMap.get(word) || 0) + 1);
  }

  // Sort by frequency
  const sorted = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));

  // Return top 2 to 4 unique topics
  const topics = sorted.slice(0, 3);

  // If no good keywords extracted, fall back to capitalized title keywords
  if (topics.length === 0 && threadTitle) {
    return threadTitle
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 2);
  }

  return topics;
}
