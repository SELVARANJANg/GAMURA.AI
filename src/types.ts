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
    model: "gemini-2.5-flash",
    color: "#19d07f",
    desc: "Flagship multimodal neural intelligence with instant response times and visual reasoning.",
    badge: "Primary"
  },
  {
    id: "bububai",
    name: "BUBUBAI",
    by: "Gamura Lab",
    model: "gpt-4o-mini",
    color: "#10a37f",
    desc: "Lightning-fast conversational reasoning, creative thinking and rapid coding engine.",
    badge: "Fast"
  },
  {
    id: "sr",
    name: "SR",
    by: "Selvaranjan Core",
    model: "claude-3-5-sonnet",
    color: "#0a84ff",
    desc: "Deep architectural logic, nuanced prose, and elite full-stack system synthesis.",
    badge: "Architect"
  },
  {
    id: "deepseek",
    name: "DEEPSEEK",
    by: "DeepSeek AI",
    model: "deepseek-r1",
    color: "#4d6bfe",
    desc: "Next-generation mathematical reasoning, logic chain deduction, and algorithmic problem-solving.",
    badge: "Reasoning"
  },
  {
    id: "llama",
    name: "LLAMA 3.3",
    by: "Meta Open",
    model: "llama-3.3-70b",
    color: "#0468d7",
    desc: "High-throughput open frontier model with vast world knowledge and concise speed.",
    badge: "Speed"
  },
  {
    id: "perplexity",
    name: "PERPLEXITY",
    by: "Sonar Research",
    model: "sonar-reasoning",
    color: "#20b2aa",
    desc: "Web-grounded research intelligence synthesizing verified facts and real-time data.",
    badge: "Search"
  },
  {
    id: "mistral",
    name: "MISTRAL",
    by: "Mistral AI",
    model: "mistral-large",
    color: "#f97316",
    desc: "High-precision European language model excelling in multilingual nuance and code generation.",
    badge: "Frontier"
  },
  {
    id: "qwen",
    name: "QWEN 2.5",
    by: "Alibaba Cloud",
    model: "qwen-2.5-72b",
    color: "#8b5cf6",
    desc: "Massive multilingual reasoning, polyglot coding, and technical problem-solving engine.",
    badge: "Polyglot"
  }
];

export const PERSONAS: Record<string, PersonaInfo> = {
  general: {
    title: "Assistant",
    instruction: "You are Gamura AI, created and architected by Selvaranjan Ganthi (also known as SR, Selvaranjan G, Ranjan, Selva, and BUBUBAI). If asked who created you, who made Gamura AI, or who Selvaranjan G is, explain with pride, accuracy, and detail that he is the visionary software architect and creator behind Gamura AI. Deliver structured, articulate, and accurate answers. Do not attempt to generate images or video files. When asked for code, UI design, websites, or components, generate complete, high-quality, beautiful UI/UX design code (HTML, Tailwind CSS, and interactive JavaScript) inside ```html so it can be previewed directly in an isolated iframe modal."
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
