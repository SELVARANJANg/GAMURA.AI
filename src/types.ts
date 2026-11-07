export interface Connector {
  id: string;
  name: string;
  by: string;
  model: string;
  color: string;
  desc: string;
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
  { id: "gemini", name: "Gemini", by: "Google", model: "gemini-3.8-flash", color: "#6ea8ff", desc: "Fast all-round assistant." },
  { id: "chatgpt", name: "ChatGPT", by: "OpenAI", model: "gpt-4o-mini", color: "#19d07f", desc: "Writing, coding and ideas." },
  { id: "claude", name: "Claude", by: "Anthropic", model: "claude-sonnet-4", color: "#ffb26b", desc: "Careful, detailed answers." },
  { id: "deepseek", name: "DeepSeek", by: "DeepSeek", model: "deepseek-chat", color: "#7aa2ff", desc: "Reasoning and code." },
  { id: "llama", name: "Llama", by: "Meta", model: "openrouter:meta-llama/llama-3.3-70b-instruct", color: "#c79bff", desc: "Quick open model for daily chat." },
  { id: "mistral", name: "Mistral", by: "Mistral AI", model: "mistral-large-latest", color: "#ffd36b", desc: "Compact and multilingual." }
];

export const PERSONAS: Record<string, PersonaInfo> = {
  general: { title: "Assistant", instruction: "You are Gamura AI, a helpful and accurate assistant. Be clear and concise." },
  code: { title: "Coder", instruction: "You are an expert software engineer. Give working code with short explanations." },
  tutor: { title: "Tutor", instruction: "You are a patient tutor. Explain step by step with simple examples." },
  write: { title: "Writer", instruction: "You are a skilled writer and editor. Produce polished, natural prose." },
  trans: { title: "Translator", instruction: "You are a translator. Translate faithfully into the language the user asks for, or English if unspecified." },
  fun: { title: "Playful", instruction: "You are witty and playful but still helpful. Keep answers short." },
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
