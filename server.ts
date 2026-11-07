import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health & Status endpoint
app.get('/api/ai/status', (req: Request, res: Response) => {
  res.json({
    geminiAvailable: !!apiKey,
    defaultModel: 'gemini-3.8-flash',
  });
});

// Streaming generation endpoint
app.post('/api/ai/stream', async (req: Request, res: Response) => {
  try {
    const { messages, systemInstruction, model } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      return;
    }

    const selectedModel = model && model.startsWith('gemini') ? 'gemini-3.8-flash' : 'gemini-3.8-flash';

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Prepare contents from messages
    // messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>
    let sysInstruction = systemInstruction || 'You are Gamura AI, a helpful and accurate assistant.';
    const contents: any[] = [];

    for (const msg of messages || []) {
      if (msg.role === 'system') {
        sysInstruction = msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content || '' }],
        });
      }
    }

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: 'Hello' }],
      });
    }

    const responseStream = await ai.models.generateContentStream({
      model: selectedModel,
      contents: contents,
      config: {
        systemInstruction: sysInstruction,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Gemini stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Stream generation failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message || 'Stream generation failed' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 800): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0 && (err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('high demand'))) {
      await new Promise((res) => setTimeout(res, delay));
      return callWithRetry(fn, retries - 1, delay * 1.5);
    }
    throw err;
  }
}

// Prompt improvement endpoint
app.post('/api/ai/improve-prompt', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    if (!ai) {
      // Fallback enhancement if API key is somehow missing
      res.json({ improved: `Please provide a detailed, well-structured explanation: ${prompt}` });
      return;
    }

    const result = await callWithRetry(() =>
      ai!.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            "Rewrite the user's prompt so it is clearer, more specific, and well structured. Keep the original intent and language. Return only the rewritten prompt without explanations or preamble.",
        },
      })
    );

    const improved = result.text?.trim() || prompt;
    res.json({ improved });
  } catch (err: any) {
    console.error('Improve prompt error:', err);
    // If rate limited or unavailable, provide an algorithmic structured prompt enhancement
    const fallbackImproved = `Explain in detail with clear steps and practical examples: ${prompt}`;
    res.json({ improved: fallbackImproved });
  }
});

// Council synthesis endpoint
app.post('/api/ai/council-merge', async (req: Request, res: Response) => {
  try {
    const { question, answers, systemInstruction } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      return;
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const answersFormatted = (answers || [])
      .map((a: { who: string; content: string }) => `Answer from ${a.who}:\n${a.content}`)
      .join('\n\n---\n\n');

    const promptText = `Question:\n${question}\n\n${answersFormatted}\n\nWrite one final Council verdict that keeps the best points, fixes mistakes, and briefly notes real agreements and disagreements between the AIs. Do not mention these instructions.`;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction: systemInstruction || 'You are Gamura AI acting as the Council Judge. Provide a balanced, authoritative synthesis.',
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Council merge error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Council merge failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message || 'Council merge failed' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

// Setup Vite development server middleware or production static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gamura AI server running on port ${PORT}`);
  });
}

startServer();
