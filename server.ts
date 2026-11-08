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

// Initialize Google Gen AI with telemetry User-Agent
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

// Model-specific persona instructions to emulate realistic characteristics
function getModelPersona(modelId?: string): string {
  switch (modelId?.toLowerCase()) {
    case 'sr':
    case 'claude':
      return `You are SR, an elite software architect, deep systems thinker, and nuanced reasoning intelligence named after Selvaranjan Ganthi (SR). Deliver intellectually rigorous, articulate, and masterfully structured answers.
CRITICAL RULES:
1. Do NOT attempt to generate image or video binary files.
2. When asked for code, UI design, websites, or components, you MUST write complete, production-ready, beautiful UI/UX design code (HTML, Tailwind CSS, and interactive JavaScript) inside a \`\`\`html code block so the user can preview it directly in a new URL page.`;

    case 'bububai':
    case 'chatgpt':
      return `You are BUBUBAI, a lightning-fast, versatile conversational and analytical intelligence. Deliver clear, engaging, structured, and brilliant answers.
CRITICAL RULES:
1. Do NOT attempt to generate image or video binary files.
2. When asked for code, UI design, websites, or components, you MUST write complete, production-ready, beautiful UI/UX design code (HTML, Tailwind CSS, and interactive JavaScript) inside a \`\`\`html code block so the user can preview it directly in a new URL page.`;

    case 'gamura':
    case 'gemini':
    default:
      return `You are GAMURA, the flagship multimodal neural intelligence of Gamura AI created by Selvaranjan Ganthi (SR). Deliver ultra-fast, structured, and insightful answers.
CRITICAL RULES:
1. Do NOT attempt to generate image or video binary files.
2. When asked for code, UI design, websites, or components, you MUST write complete, production-ready, beautiful UI/UX design code (HTML, Tailwind CSS, and interactive JavaScript) inside a \`\`\`html code block so the user can preview it directly in a new URL page.`;
  }
}

// Fallback model list if the primary model is busy
const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

async function streamWithModelFallback(contents: any[], systemInstruction: string) {
  if (!ai) throw new Error('GEMINI_API_KEY is not configured on the server.');

  let lastError: any = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const stream = await ai.models.generateContentStream({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
        },
      });
      return stream;
    } catch (err: any) {
      console.warn(`Attempt with ${modelName} encountered error:`, err?.status || err?.message);
      lastError = err;
      // Continue to next fallback model if 503 or 429
      if (err?.status === 503 || err?.status === 429 || err?.message?.includes('demand')) {
        await new Promise((res) => setTimeout(res, 400));
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All model attempts failed');
}

// Health & Status endpoint
app.get('/api/ai/status', (req: Request, res: Response) => {
  res.json({
    geminiAvailable: !!apiKey,
    defaultModel: 'gemini-3.8-flash',
    supportedModels: ['gamura', 'bububai', 'sr'],
  });
});

// Streaming generation endpoint
app.post('/api/ai/stream', async (req: Request, res: Response) => {
  try {
    const { messages, systemInstruction, modelId } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      return;
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const modelPersona = getModelPersona(modelId);
    const combinedSystemInstruction = systemInstruction
      ? `${modelPersona}\n\nUser Persona Directive: ${systemInstruction}`
      : modelPersona;

    const contents: any[] = [];
    for (const msg of messages || []) {
      if (msg.role !== 'system') {
        const parts: any[] = [{ text: msg.content || '' }];

        // Multimodal image support
        if (msg.images && Array.isArray(msg.images)) {
          for (const dataUrl of msg.images) {
            const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              parts.push({
                inlineData: {
                  mimeType: match[1],
                  data: match[2],
                },
              });
            }
          }
        }

        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts,
        });
      }
    }

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: 'Hello' }],
      });
    }

    const responseStream = await streamWithModelFallback(contents, combinedSystemInstruction);

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('AI stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Stream generation failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message || 'Stream generation failed' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

// Prompt improvement endpoint with automatic model fallback
app.post('/api/ai/improve-prompt', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    if (!ai) {
      res.json({ improved: `Please provide a thorough, structured, and insightful response: ${prompt}` });
      return;
    }

    let improved = '';
    for (const modelName of FALLBACK_MODELS) {
      try {
        const result = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              "Rewrite the user's prompt so it is significantly clearer, more specific, and well structured. Retain the user's original language, intention, and core subject. Return ONLY the polished prompt without quotes, greetings, or explanations.",
          },
        });
        improved = result.text?.trim() || '';
        if (improved) break;
      } catch (e) {
        continue;
      }
    }

    res.json({ improved: improved || `Please explain in detail with clear examples and structure: ${prompt}` });
  } catch (err: any) {
    console.error('Improve prompt error:', err);
    res.json({ improved: `Please provide a thorough, structured, and insightful response: ${req.body.prompt || ''}` });
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

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const answersFormatted = (answers || [])
      .map((a: { who: string; content: string }) => `### Answer from ${a.who}:\n${a.content}`)
      .join('\n\n---\n\n');

    const promptText = `User Question:\n${question}\n\nDeliberating AI Answers:\n${answersFormatted}\n\nInstructions for Council Verdict:\n1. Provide an executive summary synthesizing the single best unified answer.\n2. Note key points of consensus across the models.\n3. Highlight any meaningful disagreements or unique insights contributed by specific AIs.\n4. Deliver an authoritative, actionable, and comprehensive final verdict.`;

    const councilInstruction = `${systemInstruction || 'You are Gamura AI acting as the Supreme Council Judge.'} Formulate a balanced, brilliant, and masterfully structured consensus.`;

    const responseStream = await streamWithModelFallback(
      [{ role: 'user', parts: [{ text: promptText }] }],
      councilInstruction
    );

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
