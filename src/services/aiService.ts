import { Connector, Message } from '../types';

declare global {
  interface Window {
    puter?: any;
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onError: (err: string) => void;
  onDone: () => void;
}

/**
 * Streams response from Gemini via backend server SSE
 */
async function streamGeminiServer(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  systemInstruction: string,
  modelName: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      systemInstruction,
      model: modelName,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No readable stream from server');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    if (signal?.aborted) break;
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') {
        callbacks.onDone();
        return fullText;
      }
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.text) {
          fullText += parsed.text;
          callbacks.onChunk(fullText);
        } else if (parsed.error) {
          callbacks.onError(parsed.error);
        }
      } catch (e) {
        // Ignore json parse error for partial lines
      }
    }
  }

  callbacks.onDone();
  return fullText;
}

/**
 * Streams response from Puter or fallback
 */
async function streamPuter(
  connector: Connector,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<string> {
  if (typeof window !== 'undefined' && window.puter && window.puter.ai && window.puter.ai.chat) {
    try {
      if (!window.puter.auth.isSignedIn()) {
        await window.puter.auth.signIn();
      }
      const puterStream = await window.puter.ai.chat(messages, {
        model: connector.model,
        stream: true,
      });

      let fullText = '';
      for await (const chunk of puterStream) {
        if (signal?.aborted) break;
        if (chunk && chunk.text) {
          fullText += chunk.text;
          callbacks.onChunk(fullText);
        }
      }
      callbacks.onDone();
      return fullText;
    } catch (err: any) {
      console.warn(`Puter error for ${connector.name}, trying backend fallback:`, err);
    }
  }

  // Graceful fallback to built-in Gemini engine if Puter is unavailable
  const fallbackNote = `[${connector.name} via Gamura Fast Engine]:\n`;
  callbacks.onChunk(fallbackNote);
  return await streamGeminiServer(
    messages,
    `You are simulating the style and intelligence of ${connector.name} (${connector.by}). Be insightful and concise.`,
    'gemini-3.8-flash',
    {
      onChunk: (text) => callbacks.onChunk(fallbackNote + text),
      onError: callbacks.onError,
      onDone: callbacks.onDone,
    },
    signal
  );
}

/**
 * Universal model query dispatcher
 */
export async function queryModel(
  connector: Connector,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  systemInstruction: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<string> {
  if (connector.id === 'gemini') {
    return await streamGeminiServer(messages, systemInstruction, connector.model, callbacks, signal);
  } else {
    return await streamPuter(connector, messages, callbacks, signal);
  }
}

/**
 * Optimizes a user prompt
 */
export async function improvePrompt(prompt: string): Promise<string> {
  const res = await fetch('/api/ai/improve-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    throw new Error('Failed to improve prompt');
  }

  const data = await res.json();
  return data.improved || prompt;
}

/**
 * Synthesizes council verdict
 */
export async function streamCouncilVerdict(
  question: string,
  answers: Array<{ who: string; content: string }>,
  systemInstruction: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch('/api/ai/council-merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      answers,
      systemInstruction,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error('Failed to merge council answers');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No readable stream from server');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    if (signal?.aborted) break;
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') {
        callbacks.onDone();
        return fullText;
      }
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.text) {
          fullText += parsed.text;
          callbacks.onChunk(fullText);
        } else if (parsed.error) {
          callbacks.onError(parsed.error);
        }
      } catch (e) {
        // ignore partial parse errors
      }
    }
  }

  callbacks.onDone();
  return fullText;
}
