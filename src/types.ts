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
  images?: string[];
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
    id: "gamura",
    name: "GAMURA",
    by: "Gamura Core",
    model: "gemini-3.8-flash",
    color: "#19d07f",
    desc: "Flagship multimodal neural intelligence with instant response times and reasoning.",
    badge: "Primary"
  },
  {
    id: "bububai",
    name: "BUBUBAI",
    by: "Gamura Lab",
    model: "gpt-4o-mini",
    color: "#10a37f",
    desc: "Fast, versatile conversational reasoning, creative thinking and coding engine.",
    badge: "Fast"
  },
  {
    id: "sr",
    name: "SR",
    by: "Selvaranjan Core",
    model: "claude-3-5-sonnet",
    color: "#0a84ff",
    desc: "Deep architectural logic, nuanced prose, and elite full-stack code synthesis.",
    badge: "Architect"
  }
];

export const PERSONAS: Record<string, PersonaInfo> = {
  general: {
    title: "Assistant",
    instruction: "You are Gamura AI, a world-class helpful and intelligent assistant. Deliver structured, articulate, and accurate answers. Do not attempt to generate images or video files. When asked for code, UI design, websites, or components, generate complete, high-quality, beautiful UI/UX design code (HTML, Tailwind CSS, and interactive JavaScript) that can be previewed directly."
  },
  code: {
    title: "Coder",
    instruction: "You are an elite software architect and senior frontend/backend engineer. Provide production-grade, bug-free, beautifully styled code with modern UI/UX design. When asked for user interfaces, write clean self-contained HTML with Tailwind CSS. Do not generate video or image files."
  },
  tutor: {
    title: "Tutor",
    instruction: "You are a warm, patient, and brilliant tutor. Explain concepts step by step with vivid real-world analogies, clean diagrams, and intuitive examples. Do not generate video or image files."
  },
  write: {
    title: "Writer",
    instruction: "You are a master essayist, editor, and creative writer. Produce captivating, articulate, and polished prose. Do not generate video or image files."
  },
  trans: {
    title: "Translator",
    instruction: "You are a world-class polyglot translator. Translate faithfully and idiomatically preserving cultural nuance and tone. Do not generate video or image files."
  },
  fun: {
    title: "Playful",
    instruction: "You are witty, humorous, and entertaining while remaining exceptionally helpful and insightful. Do not generate video or image files."
  },
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
