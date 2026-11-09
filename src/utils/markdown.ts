import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function unescapeHtml(str: string): string {
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

/**
 * Highlights raw source code using PrismJS with fallback to escaped HTML
 */
export function highlightCode(code: string, language: string): string {
  const langKey = (language || 'javascript').toLowerCase();
  let grammar = Prism.languages[langKey];

  if (!grammar) {
    if (langKey === 'html' || langKey === 'xml' || langKey === 'svg') {
      grammar = Prism.languages.markup;
    } else if (langKey === 'ts') {
      grammar = Prism.languages.typescript;
    } else if (langKey === 'js') {
      grammar = Prism.languages.javascript;
    } else if (langKey === 'py') {
      grammar = Prism.languages.python;
    } else if (langKey === 'sh' || langKey === 'shell') {
      grammar = Prism.languages.bash;
    }
  }

  if (grammar) {
    try {
      return Prism.highlight(code, grammar, langKey);
    } catch (e) {
      // Fallback
    }
  }

  return escapeHtml(code);
}

export function parseMarkdown(text: string): string {
  if (!text) return '';
  const escaped = escapeHtml(text);

  // Split by code blocks
  return escaped
    .split(/(```[\s\S]*?```)/)
    .map((part) => {
      const match = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
      if (match) {
        const lang = match[1] || 'code';
        const codeEscaped = match[2].replace(/\n$/, '');
        const rawCode = unescapeHtml(codeEscaped);
        const encoded = encodeURIComponent(rawCode);

        // Detect if this is HTML, web markup, or UI design code that can be previewed
        const isWebCode =
          ['html', 'htm', 'svg', 'xml', 'jsx', 'tsx'].includes(lang.toLowerCase()) ||
          rawCode.includes('<html') ||
          rawCode.includes('<div') ||
          rawCode.includes('<!DOCTYPE') ||
          rawCode.includes('<body') ||
          rawCode.includes('<svg');

        // Prism syntax highlight
        const highlighted = highlightCode(rawCode, lang);

        const previewButton = isWebCode
          ? `<button type="button" class="preview-code-btn px-2.5 py-1 text-[11px] font-bold rounded-full bg-[var(--ac)] text-[var(--fg)] hover:opacity-95 active:scale-95 transition-all flex items-center gap-1 shadow-xs cursor-pointer" data-code="${encoded}" title="Preview this code in an isolated iframe modal"><span>Preview ⚡</span></button>`
          : '';

        return `<pre class="relative group my-3 p-3.5 pt-9.5 rounded-2xl bg-[#0d0d12] text-[#f1f1f4] font-mono text-[0.88em] overflow-x-auto border border-white/10 shadow-lg"><div class="absolute top-2 left-3 flex items-center gap-2 select-none"><span class="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block shadow-xs"></span><span class="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block shadow-xs"></span><span class="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block shadow-xs"></span><span class="text-[10.5px] text-zinc-400 font-semibold uppercase tracking-wider ml-1">${lang}</span></div><div class="absolute top-2 right-2.5 flex items-center gap-1.5">${previewButton}<button type="button" class="copy-code-btn px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 active:scale-95 transition-all cursor-pointer border border-white/10" data-code="${encoded}">Copy</button></div><code class="language-${lang}">${highlighted}</code></pre>`;
      }

      return part
        .replace(/^\n/, '')
        .replace(/^#{1,3} (.+)$/gm, '<b class="block text-[1.12em] font-bold mt-2.5 mb-1 text-inherit">$1</b>')
        .replace(/^[-*] (.+)$/gm, '<div class="flex items-start gap-2 my-0.5"><span class="text-[var(--ac)] shrink-0">•</span><span>$1</span></div>')
        .replace(/`([^`\n]+)`/g, '<code class="font-mono text-[0.88em] bg-[var(--bg3)] px-1.5 py-0.5 rounded-md text-inherit border border-[var(--ln)]">$1</code>')
        .replace(/\*\*([^*\n]+)\*\*/g, '<b class="font-semibold text-inherit">$1</b>')
        .replace(/\*([^*\n]+)\*/g, '<i class="italic text-inherit">$1</i>');
    })
    .join('');
}
