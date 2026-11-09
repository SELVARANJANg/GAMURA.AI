import { Thread } from '../types';
import { parseMarkdown } from './markdown';

/**
 * Generates an executive, beautifully styled printable document and launches native PDF printing
 */
export function exportThreadToPdf(thread?: Thread, modelName: string = 'GAMURA'): void {
  if (!thread || !thread.msgs || thread.msgs.length === 0) {
    alert('There are no messages in this chat to export.');
    return;
  }

  const threadTitle = thread.title || 'Untitled Conversation';
  const threadDate = new Date(thread.t || Date.now()).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const messagesHtml = thread.msgs
    .map((msg, index) => {
      const isUser = msg.role === 'user';
      const roleLabel = isUser ? 'You' : msg.who || modelName;
      const parsedText = msg.content ? parseMarkdown(msg.content) : '';

      return `
      <div class="message-card ${isUser ? 'user-card' : 'assistant-card'}">
        <div class="message-header">
          <span class="role-badge ${isUser ? 'user-badge' : 'assistant-badge'}">${roleLabel}</span>
          <span class="message-num">#${index + 1}</span>
        </div>
        <div class="message-body">
          ${parsedText || '<p><i>No content</i></p>'}
        </div>
      </div>
      `;
    })
    .join('');

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${threadTitle} • Gamura AI Transcript</title>
  <style>
    @page {
      margin: 1.5cm;
      size: A4 portrait;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      line-height: 1.6;
      margin: 0;
      padding: 24px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header-left {
      max-width: 70%;
    }
    .logo-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .brand-name {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #10b981;
      letter-spacing: 1px;
    }
    .thread-title {
      font-size: 22px;
      font-weight: 700;
      color: #1e293b;
      margin: 6px 0 2px 0;
      line-height: 1.3;
    }
    .meta-date {
      font-size: 12px;
      color: #64748b;
    }
    .header-right {
      text-align: right;
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
    }
    .author-badge {
      display: inline-block;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 600;
      color: #334155;
      margin-top: 4px;
    }
    .messages-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .message-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .user-card {
      background-color: #f8fafc;
      border-left: 4px solid #10b981;
    }
    .assistant-card {
      background-color: #ffffff;
      border-left: 4px solid #0284c7;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px dashed #e2e8f0;
    }
    .role-badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .user-badge {
      background-color: #d1fae5;
      color: #065f46;
    }
    .assistant-badge {
      background-color: #e0f2fe;
      color: #0369a1;
    }
    .message-num {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
    }
    .message-body {
      font-size: 14px;
      color: #1e293b;
    }
    pre {
      background: #0f172a !important;
      color: #f8fafc !important;
      padding: 14px;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      overflow-x: auto;
      page-break-inside: avoid;
      break-inside: avoid;
      margin: 10px 0;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9em;
    }
    .copy-code-btn, .preview-code-btn {
      display: none !important;
    }
    .footer {
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="logo-row">
        <span class="brand-name">Gamura AI</span>
        <span class="brand-sub">• Multi-Model Studio</span>
      </div>
      <h1 class="thread-title">${threadTitle}</h1>
      <div class="meta-date">Exported on ${threadDate}</div>
    </div>
    <div class="header-right">
      <div>Platform: <b>gamura.netlify.app</b></div>
      <div class="author-badge">Architect: Selvaranjan Ganthi (SR)</div>
    </div>
  </div>

  <div class="messages-container">
    ${messagesHtml}
  </div>

  <div class="footer">
    Transcribed securely from Gamura AI • Unified Intelligence Platform (GAMURA • BUBUBAI • SR)
  </div>
</body>
</html>`;

  // Use hidden print iframe for smooth native PDF generation
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';

  document.body.appendChild(printIframe);

  const doc = printIframe.contentWindow?.document || printIframe.contentDocument;
  if (!doc) {
    // Popup fallback
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
    return;
  }

  doc.open();
  doc.write(fullHtml);
  doc.close();

  // Trigger print after iframe renders
  setTimeout(() => {
    try {
      printIframe.contentWindow?.focus();
      printIframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print error, falling back to new window:', e);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(fullHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
    } finally {
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      }, 60000);
    }
  }, 400);
}
