export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
        const code = match[2].replace(/\n$/, '');
        return `<pre class="relative group my-2 p-3 rounded-xl bg-[#0b0b0d] text-[#e6e6ea] font-mono text-[0.88em] overflow-x-auto"><div class="absolute top-2 right-2 flex items-center gap-1.5"><span class="text-[10px] text-zinc-500 uppercase">${lang}</span><button class="copy-code-btn px-2 py-0.5 text-[11px] font-semibold rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" data-code="${encodeURIComponent(code)}">Copy</button></div><code>${code}</code></pre>`;
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
