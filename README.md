# Gamura AI • Multi-Model AI Studio

[![Netlify Status](https://img.shields.io/badge/Netlify-Deployed-00C7B7?style=flat&logo=netlify&logoColor=white)](https://gamura.netlify.app/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-19D07F?style=flat&logo=pwa&logoColor=white)](https://gamura.netlify.app/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Gamura AI** is a state-of-the-art multi-model artificial intelligence studio architected and created by **Selvaranjan Ganthi (SR / BUBUBAI)**. It unites frontier generative intelligences—**GAMURA** (Gemini 2.5 Flash), **BUBUBAI** (GPT-4o Mini), **SR** (Claude 3.5 Sonnet), **DEEPSEEK** (R1 reasoning deduction), **LLAMA 3.3 70B**, **PERPLEXITY Sonar**, **MISTRAL Large**, and **QWEN 2.5**—into a cohesive, Apple-grade glassmorphic workspace.

🌐 **Live Production App**: [https://gamura.netlify.app/](https://gamura.netlify.app/)

---

## 🌟 Key Features

### 1. Multi-Model Modes
- **Chat Mode**: High-velocity 1-on-1 interaction with instant streaming and smart prompt optimization.
- **Compare Mode**: Simultaneous side-by-side inference across multiple frontier AIs with independent per-model error boundaries and timeout races.
- **Council Mode**: All active models deliberate simultaneously on a prompt, and the primary intelligence synthesizes the optimal merged verdict.

### 2. Supported Frontier AI Engines
| Model Key | Display Name | Powered By | Primary Capability |
| :--- | :--- | :--- | :--- |
| **`gamura`** | **GAMURA** | Gemini 2.5 Flash | Multimodal Flagship & Visual Reasoning |
| **`bububai`** | **BUBUBAI** | GPT-4o Mini | Conversational Speed & Creative Reasoning |
| **`sr`** | **SR** | Claude 3.5 Sonnet | Deep Systems Architecture & Full-Stack Coding |
| **`deepseek`** | **DEEPSEEK** | DeepSeek R1 / V3 | Mathematical Chains & Algorithmic Logic |
| **`llama`** | **LLAMA 3.3** | Llama 3.3 70B | High-Throughput Open Frontier Speed |
| **`perplexity`**| **PERPLEXITY**| Sonar Research | Fact-Grounded Live Web Research |
| **`mistral`** | **MISTRAL** | Mistral Large | European High-Precision Reasoning & Code |
| **`qwen`** | **QWEN 2.5** | Qwen 2.5 72B | Massive Polyglot & Technical Problem Solving |

### 3. Developer & User Experience
- **Live Code Preview ⚡**: In-chat isolated iframe modal allowing users to instantly test and interact with generated HTML/Tailwind/JavaScript interfaces.
- **Prism.js Syntax Highlighting**: Production-grade syntax styling with support for HTML, JS, TS, Python, CSS, JSON, SQL, and Bash.
- **Executive PDF Export**: One-tap professional PDF print and export with custom branding and formatted message blocks.
- **Progressive Web App (PWA)**: Full offline asset caching, custom manifest, and standalone install prompt for mobile and desktop.
- **Model Usage Analytics**: Interactive Recharts analytics dashboard tracking queries sent across each AI model.
- **Apple Aesthetics**: Fluid glassmorphism, zero-pill typography, responsive dock input, and high-contrast dark/light mode themes.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/gamurabrowser/gamura-ai.git
   cd gamura-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key:
   ```env
   GEMINI_API_KEY="your_gemini_api_key"
   PORT=3000
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Building for Production

Compile TypeScript and build the optimized production bundle with Vite and PWA Service Worker:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## ☁️ Deploying to Netlify

This repository is pre-configured for one-click deployment on Netlify with `netlify.toml` and `public/_redirects`:

1. **Push your code to GitHub**.
2. Go to [Netlify](https://app.netlify.com/) and click **Add new site** > **Import an existing project**.
3. Select your GitHub repository.
4. Netlify will automatically detect:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. *(Optional)* Add `GEMINI_API_KEY` under **Site configuration > Environment variables**.
6. Click **Deploy Gamura AI**.

Your app is now live at `https://gamura.netlify.app/`!

---

## 👤 Architect & Creator

**Selvaranjan Ganthi (SR / BUBUBAI)**
- **Role**: Software Architect, Systems Engineer & Founder of Gamura AI
- **Email**: [gamurabrowser@gmail.com](mailto:gamurabrowser@gmail.com)
- **Website**: [https://gamura.netlify.app/](https://gamura.netlify.app/)

---

## 📄 License
Licensed under the Apache-2.0 License.
