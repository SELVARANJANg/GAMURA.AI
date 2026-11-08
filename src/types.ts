export interface Connector {
  id: string;
  name: string;
  by: string;
  model: string;
  color: string;
  desc: string;
  badge?: string;
  custom?: boolean;
}

export interface PersonaInfo {
  title: string;
  instruction: string;
}

export interface CmpItem {
  who: string;
  content: string;
  err?: boolean;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  kind?: 'chat' | 'compare' | 'council';
  who?: string;
  step?: string;
  err?: boolean;
  done?: boolean;
  judge?: string;
  cmp?: CmpItem[];
}

export interface Thread {
  id: string;
  title: string;
  msgs: Message[];
  pin: boolean;
  t: number;
}

export interface AppState {
  connected: string[];
  current: string;
  custom: Connector[];
  threads: Thread[];
  active: string | null;
  persona: string;
  mode: 'chat' | 'compare' | 'council';
  theme: 'auto' | 'light' | 'dark';
  accent: 'emerald' | 'blue' | 'violet' | 'orange' | 'pink';
  size: 's' | 'm' | 'l';
}

export const DEFAULT_CONNECTORS: Connector[] = [
  {
    id: "gemini",
    name: "Gemini",
    by: "Google",
    model: "gemini-3.8-flash",
    color: "#4285f4",
    desc: "Google's ultra-fast multimodal intelligence.",
    badge: "Built-in"
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    by: "OpenAI",
    model: "gpt-4o-mini",
    color: "#10a37f",
    desc: "Versatile reasoning, creative writing & code.",
    badge: "Fast"
  },
  {
    id: "claude",
    name: "Claude",
    by: "Anthropic",
    model: "claude-sonnet-4",
    color: "#d97706",
    desc: "Thoughtful, deep analysis and nuanced prose.",
    badge: "Reasoning"
  },
  {
    id: "deepseek",
    name: "DeepSeek R1",
    by: "DeepSeek",
    model: "deepseek/deepseek-r1",
    color: "#3b82f6",
    desc: "Deep chain-of-thought logic, math & algorithmic reasoning.",
    badge: "Coding"
  },
  {
    id: "perplexity",
    name: "Perplexity",
    by: "OpenRouter",
    model: "perplexity/sonar-reasoning",
    color: "#20b2aa",
    desc: "Real-time web search grounding and cited live answers.",
    badge: "Search"
  },
  {
    id: "nvidia",
    name: "NVIDIA Llama 3.1 405B",
    by: "NVIDIA / OpenRouter",
    model: "meta-llama/llama-3.1-405b-instruct",
    color: "#76b900",
    desc: "Titan 405B parameters for enterprise deep reasoning.",
    badge: "405B Titan"
  },
  {
    id: "mistral",
    name: "Mistral Large 2",
    by: "Mistral AI / OpenRouter",
    model: "mistralai/mistral-large-2407",
    color: "#f59e0b",
    desc: "Flagship 128k context multilingual & code champion.",
    badge: "Large 2"
  },
  {
    id: "qwen",
    name: "Qwen 2.5 72B",
    by: "Alibaba / OpenRouter",
    model: "qwen/qwen-2.5-72b-instruct",
    color: "#0284c7",
    desc: "Premier multilingual math & complex STEM reasoning.",
    badge: "STEM 72B"
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    by: "OpenRouter",
    model: "openrouter/auto",
    color: "#9333ea",
    desc: "Multi-provider routing & open meta-intelligence.",
    badge: "Universal"
  },
  {
    id: "muse",
    name: "Muse",
    by: "Muse AI",
    model: "muse-creative-v2",
    color: "#ec4899",
    desc: "Artistic ideation, storytelling & aesthetic design.",
    badge: "Creative"
  },
  {
    id: "llama",
    name: "Llama 3.3 70B",
    by: "Meta AI",
    model: "meta-llama/llama-3.3-70b-instruct",
    color: "#8b5cf6",
    desc: "Meta's flagship open-weights champion.",
    badge: "Open"
  },
  {
    id: "grok",
    name: "Grok",
    by: "xAI",
    model: "x-ai/grok-2-1212",
    color: "#ef4444",
    desc: "Witty, truthful, and real-time bold insights.",
    badge: "Unfiltered"
  }
];

export const PERSONAS: Record<string, PersonaInfo> = {
  general: { title: "Assistant", instruction: "You are Gamura AI, a helpful, intelligent, and concise assistant. Deliver clear, accurate, and structured answers." },
  code: { title: "Coder", instruction: "You are an elite software architect and senior engineer. Provide production-grade, bug-free code with brief, illuminating explanations." },
  tutor: { title: "Tutor", instruction: "You are a warm and patient expert tutor. Explain concepts step by step with vivid real-world analogies and intuitive examples." },
  write: { title: "Writer", instruction: "You are a master essayist, editor, and creative writer. Produce captivating, articulate, and polished prose." },
  trans: { title: "Translator", instruction: "You are a world-class polyglot translator. Translate faithfully and idiomatically preserving cultural nuance and tone." },
  fun: { title: "Playful", instruction: "You are witty, humorous, and entertaining while remaining genuinely helpful. Keep responses lively and clever." },
};

export const ACCENTS: Record<string, [string, string]> = {
  emerald: ["#19d07f", "#032214"],
  blue: ["#0a84ff", "#ffffff"],
  violet: ["#a35cf5", "#ffffff"],
  orange: ["#ff9f0a", "#1a0f00"],
  pink: ["#ff375f", "#ffffff"],
};

export const SUGGESTIONS = [
  { tag: "Explain", prompt: "Explain how the internet works in simple words" },
  { tag: "Code", prompt: "Write a Python script that renames all files in a folder" },
  { tag: "Plan", prompt: "Plan a 3-day trip to Chennai on a student budget" },
  { tag: "Ideas", prompt: "Give me 10 app ideas a college student can build" }
];
