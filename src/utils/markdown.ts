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

        const previewButton = isWebCode
          ? `<button type="button" class="preview-code-btn px-2.5 py-1 text-[11px] font-bold rounded-full bg-[var(--ac)] text-[var(--fg)] hover:opacity-95 active:scale-95 transition-all flex items-center gap-1 shadow-xs cursor-pointer" data-code="${encoded}" title="Preview this code in a new page"><span>Preview ↗</span></button>`
          : '';

        return `<pre class="relative group my-2.5 p-3.5 pt-9 rounded-2xl bg-[#0d0d11] text-[#e6e6ea] font-mono text-[0.88em] overflow-x-auto border border-white/10 shadow-md"><div class="absolute top-2 left-3 flex items-center gap-2 select-none"><span class="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span><span class="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span><span class="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span><span class="text-[10.5px] text-zinc-400 font-semibold uppercase tracking-wider ml-1">${lang}</span></div><div class="absolute top-2 right-2.5 flex items-center gap-1.5">${previewButton}<button type="button" class="copy-code-btn px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white/15 hover:bg-white/25 text-white active:scale-95 transition-all cursor-pointer" data-code="${encoded}">Copy</button></div><code>${codeEscaped}</code></pre>`;
      }

      return part
        .replace(/^\n/, '')
        .replace(/^#{1,3} (.+)$/gm, '<b class="block text-[1.12em] font-bold mt-2 mb-1 text-inherit">$1</b>')
        .replace(/^[-*] (.+)$/gm, '<div class="flex items-start gap-2 my-0.5"><span class="text-[var(--ac)]">•</span><span>$1</span></div>')
        .replace(/`([^`\n]+)`/g, '<code class="font-mono text-[0.88em] bg-[var(--bg3)] px-1.5 py-0.5 rounded-md text-inherit">$1</code>')
        .replace(/\*\*([^*\n]+)\*\*/g, '<b class="font-semibold text-inherit">$1</b>')
        .replace(/\*([^*\n]+)\*/g, '<i class="italic">$1</i>');
    })
    .join('');
}
