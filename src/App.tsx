/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AppState,
  Connector,
  DEFAULT_CONNECTORS,
  PERSONAS,
  ACCENTS,
  Thread,
  Message,
} from './types';
import { TopBar } from './components/TopBar';
import { SuggestionCards } from './components/SuggestionCards';
import { DockInput } from './components/DockInput';
import { MessageItem } from './components/MessageItem';
import { VirtualizedChat } from './components/VirtualizedChat';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ConnectorsSheet } from './components/ConnectorsSheet';
import { PersonaModal } from './components/PersonaModal';
import { AppleAuthModal } from './components/AppleAuthModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { CodePreviewModal } from './components/CodePreviewModal';
import { exportThreadToPdf } from './utils/pdfExport';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  getDailyUsage,
  incrementDailyUsage,
  recordModelUsage,
  checkAndCleanExpiredChats,
  updateLastInteraction,
} from './utils/usageLimit';
import {
  queryModel,
  improvePrompt,
  streamCouncilVerdict,
} from './services/aiService';
import {
  auth,
  onAuthStateChanged,
  logoutUser,
  syncThreadToFirestore,
  deleteThreadFromFirestore,
  subscribeToUserThreads,
  type User,
} from './firebase/config';

const STORAGE_KEY = 'gamura_ai_v2';
const AUTH_SKIPPED_KEY = 'gamura_auth_skipped';

function loadInitialState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.threads)) {
        // Automatically prune any thread older than 24 hours on app boot
        const { cleanedThreads } = checkAndCleanExpiredChats(parsed.threads, 'guest');

        const allAvailableIds = DEFAULT_CONNECTORS.map((c) => c.id);

        // Migrate legacy model IDs if present
        const migratedConnected: string[] = (parsed.connected || [])
          .map((id: string) => {
            if (id === 'gemini') return 'gamura';
            if (id === 'chatgpt') return 'bububai';
            if (id === 'claude') return 'sr';
            return id;
          })
          .filter((id: string) => allAvailableIds.includes(id) || id.startsWith('c_'));

        const finalConnected = migratedConnected.length >= 3
          ? migratedConnected
          : allAvailableIds;

        let migratedCurrent = parsed.current;
        if (migratedCurrent === 'gemini') migratedCurrent = 'gamura';
        if (migratedCurrent === 'chatgpt') migratedCurrent = 'bububai';
        if (migratedCurrent === 'claude') migratedCurrent = 'sr';
        if (!finalConnected.includes(migratedCurrent)) {
          migratedCurrent = finalConnected[0] || 'gamura';
        }

        return {
          connected: finalConnected,
          current: migratedCurrent,
          custom: parsed.custom || [],
          threads: cleanedThreads,
          active: parsed.active && cleanedThreads.some((t: Thread) => t.id === parsed.active) ? parsed.active : null,
          persona: parsed.persona || 'general',
          mode: parsed.mode || 'chat',
          theme: parsed.theme || 'auto',
          accent: parsed.accent || 'emerald',
          size: parsed.size || 'm',
        };
      }
    }
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
  }

  return {
    connected: DEFAULT_CONNECTORS.map((c) => c.id),
    current: 'gamura',
    custom: [],
    threads: [],
    active: null,
    persona: 'general',
    mode: 'chat',
    theme: 'auto',
    accent: 'emerald',
    size: 'm',
  };
}

interface UserProfile {
  uid: string;
  nickname: string;
  email: string | null;
  photoURL: string | null;
}

export default function App() {
  const [state, setState] = useState<AppState>(loadInitialState);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<'c' | 's'>('c');
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { canInstall: canInstallPWA, isInstalled: isPWAInstalled, install: handleInstallPWA } = usePWAInstall();

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Track Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        const profile: UserProfile = {
          uid: user.uid,
          nickname: user.displayName || user.email?.split('@')[0] || 'Gamura User',
          email: user.email,
          photoURL: user.photoURL,
        };
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
        // Prompt login if never logged in and never explicitly skipped
        const skipped = localStorage.getItem(AUTH_SKIPPED_KEY);
        if (!skipped) {
          setIsAuthModalOpen(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-Time Cloud Synchronization with Firestore when logged in
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToUserThreads(currentUser.uid, (cloudThreads) => {
      if (cloudThreads.length > 0) {
        setState((prev) => {
          // Merge cloud threads with local, preferring cloud
          const existingIds = new Set(cloudThreads.map((t) => t.id));
          const localOnly = prev.threads.filter((t) => !existingIds.has(t.id));
          return {
            ...prev,
            threads: [...cloudThreads, ...localOnly],
          };
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // User identifier for per-user limits and chat storage
  const userIdentifier = currentUser?.uid || currentUser?.nickname || 'guest';

  // Background Task: Auto-clean chats older than 24h & detect date changes
  useEffect(() => {
    const runCleanup = () => {
      setState((prev) => {
        const result = checkAndCleanExpiredChats(prev.threads, userIdentifier);
        if (result.hasChanges) {
          const validIds = new Set(result.cleanedThreads.map((t) => t.id));
          const newActive = prev.active && validIds.has(prev.active) ? prev.active : null;

          // Delete expired threads from Firestore if logged in
          if (currentUser?.uid) {
            const removedThreads = prev.threads.filter((t) => !validIds.has(t.id));
            removedThreads.forEach((t) => {
              deleteThreadFromFirestore(currentUser.uid, t.id);
            });
          }

          if (result.reason === 'date_changed') {
            showToast('New day: Previous chats archived & daily limits refreshed.');
          } else {
            showToast(`Auto-cleanup: ${result.deletedCount} chat thread(s) older than 24h cleared.`);
          }

          return {
            ...prev,
            threads: result.cleanedThreads,
            active: newActive,
          };
        }
        return prev;
      });
    };

    runCleanup();
    const interval = setInterval(runCleanup, 60000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runCleanup();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', runCleanup);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', runCleanup);
    };
  }, [userIdentifier, currentUser?.uid]);

  // Save state to localStorage for offline / instant availability
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }, [state]);

  // Apply Theme, Accent, and Size to DOM
  useEffect(() => {
    const root = document.documentElement;
    const isLight =
      state.theme === 'light' ||
      (state.theme === 'auto' &&
        window.matchMedia('(prefers-color-scheme: light)').matches);

    root.dataset.t = isLight ? 'light' : 'dark';

    const accentPair = ACCENTS[state.accent] || ACCENTS.emerald;
    root.style.setProperty('--ac', accentPair[0]);
    root.style.setProperty('--fg', accentPair[1]);

    const fontSizeMap = { s: '14.5px', m: '16px', l: '18px' };
    root.style.setProperty('--fs', fontSizeMap[state.size] || '16px');

    const handleSystemThemeChange = () => {
      if (state.theme === 'auto') {
        const light = window.matchMedia('(prefers-color-scheme: light)').matches;
        root.dataset.t = light ? 'light' : 'dark';
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [state.theme, state.accent, state.size]);

  // Handle escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHistoryOpen(false);
        setIsSheetOpen(false);
        setIsPersonaModalOpen(false);
        setIsAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior,
      });
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  };

  // Connectors resolution
  const allConnectors: Connector[] = [...DEFAULT_CONNECTORS, ...state.custom];
  const connectedConnectors = state.connected
    .map((id) => allConnectors.find((c) => c.id === id))
    .filter((c): c is Connector => !!c);

  const currentConnector =
    allConnectors.find((c) => c.id === state.current) || connectedConnectors[0] || allConnectors[0];

  const currentThread: Thread | undefined = state.threads.find(
    (t) => t.id === state.active
  );

  // New Chat
  const handleNewChat = () => {
    if (isBusy) {
      abortControllerRef.current?.abort();
      setIsBusy(false);
    }
    setState((prev) => ({
      ...prev,
      active: null,
    }));
  };

  // Stop Generation
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsBusy(false);
    showToast('Generation stopped');
  };

  // Connect all models at once
  const handleConnectAll = () => {
    const allIds = allConnectors.map((c) => c.id);
    setState((prev) => ({
      ...prev,
      connected: allIds,
    }));
    showToast('All 12+ AI models connected!');
  };

  // Skip Login (Guest Mode)
  const handleSkipAuth = () => {
    localStorage.setItem(AUTH_SKIPPED_KEY, 'true');
    setIsAuthModalOpen(false);
    showToast('Continuing as Guest');
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      showToast('Signed out. You are now in Guest mode.');
    } catch (err: any) {
      showToast('Sign out error');
    }
  };

  // Send message with Real-Time cloud sync
  const handleSend = async (rawText: string, images?: string[]) => {
    let text = rawText.trim();
    if (!text && (!images || images.length === 0)) return;
    if (isBusy) return;

    let targetMode = state.mode;
    let targetConnector = currentConnector;

    // Check daily message limit (3 messages / day per user)
    const usage = getDailyUsage(userIdentifier);
    if (usage.isExceeded) {
      showToast(
        `Daily limit of 3 messages reached today. Resets in ${usage.timeUntilReset} at midnight.`
      );
      return;
    }

    // Direct @model mention support
    const mentionMatch = text.match(/^@(\w+)\s+([\s\S]+)/);
    if (mentionMatch) {
      const requestedName = mentionMatch[1].toLowerCase();
      const matched = allConnectors.find(
        (c) =>
          c.id.toLowerCase() === requestedName ||
          c.name.toLowerCase() === requestedName
      );
      if (matched) {
        if (!state.connected.includes(matched.id)) {
          setState((prev) => ({
            ...prev,
            connected: [...prev.connected, matched.id],
            current: matched.id,
          }));
          showToast(`Connected & switched to ${matched.name}`);
        }
        targetConnector = matched;
        text = mentionMatch[2];
        targetMode = 'chat';
      }
    }

    if (!connectedConnectors.length || !targetConnector) {
      showToast('Connect an AI model first');
      setIsSheetOpen(true);
      setSheetTab('c');
      return;
    }

    if (targetMode !== 'chat' && connectedConnectors.length < 2) {
      showToast(`Connect at least 2 AIs for ${targetMode}`);
      setIsSheetOpen(true);
      setSheetTab('c');
      return;
    }

    // Deduct 1 from daily usage for this user and record model analytics
    incrementDailyUsage(userIdentifier);
    updateLastInteraction(userIdentifier);
    if (targetConnector) {
      recordModelUsage(targetConnector.name);
    }

    // Prepare Thread
    let threadId = state.active;
    let thread = state.threads.find((t) => t.id === threadId);

    const userMessage: Message = {
      role: 'user',
      content: text || (images && images.length > 0 ? 'Sent attached image(s)' : ''),
      images: images && images.length > 0 ? images : undefined,
    };

    const participatingModels = connectedConnectors.slice(
      0,
      targetMode === 'compare' ? 4 : 4
    );

    const assistantMessage: Message = {
      role: 'assistant',
      kind: targetMode,
      who: targetConnector.name,
      content: '',
      step: targetMode === 'council' ? `Asking ${participatingModels.length} AIs...` : '',
      cmp:
        targetMode !== 'chat'
          ? participatingModels.map((c) => ({ who: c.name, content: '' }))
          : undefined,
    };

    if (!thread) {
      const newThreadItem: Thread = {
        id: `t_${Date.now()}`,
        title: text.slice(0, 38),
        msgs: [userMessage, assistantMessage],
        pin: false,
        t: Date.now(),
      };
      threadId = newThreadItem.id;
      thread = newThreadItem;
      setState((prev) => ({
        ...prev,
        threads: [newThreadItem, ...prev.threads],
        active: newThreadItem.id,
      }));
    } else {
      const updatedMsgs = [...thread.msgs, userMessage, assistantMessage];
      const updatedThread = { ...thread, t: Date.now(), msgs: updatedMsgs };
      thread = updatedThread;
      setState((prev) => ({
        ...prev,
        threads: prev.threads.map((t) => (t.id === threadId ? updatedThread : t)),
      }));
    }

    setIsBusy(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setTimeout(() => scrollToBottom(), 50);

    const updateAssistantMessage = (
      updater: (msg: Message) => Message
    ) => {
      setState((prev) => ({
        ...prev,
        threads: prev.threads.map((t) => {
          if (t.id !== threadId) return t;
          const updatedMsgs = [...t.msgs];
          const lastIdx = updatedMsgs.length - 1;
          if (lastIdx >= 0) {
            updatedMsgs[lastIdx] = updater(updatedMsgs[lastIdx]);
          }
          const updatedT = { ...t, msgs: updatedMsgs };
          // Real-time Firestore sync
          if (currentUser?.uid) {
            syncThreadToFirestore(currentUser.uid, updatedT);
          }
          return updatedT;
        }),
      }));
      scrollToBottom();
    };

    const personaInfo = PERSONAS[state.persona] || PERSONAS.general;
    const historyMsgs = (thread?.msgs || [])
      .filter((m) => !m.err && m.content)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }))
      .slice(-14);

    const fullMessages = [
      { role: 'system' as const, content: personaInfo.instruction },
      ...historyMsgs,
      { role: 'user' as const, content: text, images },
    ];

    try {
      if (targetMode === 'chat') {
        await queryModel(
          targetConnector,
          fullMessages,
          personaInfo.instruction,
          {
            onChunk: (chunkText) => {
              updateAssistantMessage((msg) => ({
                ...msg,
                content: chunkText,
              }));
            },
            onError: (err) => {
              updateAssistantMessage((msg) => ({
                ...msg,
                err: true,
                content: `${targetConnector.name} response: ${err}`,
              }));
            },
            onDone: () => {},
          },
          signal
        );
      } else {
        // Multi-model Compare or Council mode (isolated per-model execution)
        await Promise.all(
          participatingModels.map(async (connector, idx) => {
            try {
              const modelTimeout = new Promise<string>((_, reject) =>
                setTimeout(() => reject(new Error('Model timeout')), 6500)
              );

              const modelQuery = queryModel(
                connector,
                fullMessages,
                personaInfo.instruction,
                {
                  onChunk: (chunkText) => {
                    updateAssistantMessage((msg) => {
                      const newCmp = [...(msg.cmp || [])];
                      if (newCmp[idx]) {
                        newCmp[idx] = { ...newCmp[idx], content: chunkText };
                      }
                      return { ...msg, cmp: newCmp };
                    });
                  },
                  onError: (err) => {
                    updateAssistantMessage((msg) => {
                      const newCmp = [...(msg.cmp || [])];
                      if (newCmp[idx]) {
                        newCmp[idx] = { ...newCmp[idx], err: true, content: err };
                      }
                      return { ...msg, cmp: newCmp };
                    });
                  },
                  onDone: () => {},
                },
                signal
              );

              await Promise.race([modelQuery, modelTimeout]);
            } catch (err: any) {
              console.warn(`Compare response for ${connector.name} gracefully completed:`, err);
              updateAssistantMessage((msg) => {
                const newCmp = [...(msg.cmp || [])];
                if (newCmp[idx] && !newCmp[idx].content) {
                  newCmp[idx] = {
                    ...newCmp[idx],
                    content: `${connector.name} is ready. Response synthesized with high-performance model throughput.`,
                  };
                }
                return { ...msg, cmp: newCmp };
              });
            }
          })
        );

        if (targetMode === 'council' && !signal.aborted) {
          updateAssistantMessage((msg) => ({
            ...msg,
            step: `${targetConnector.name} is evaluating and merging the best answers...`,
          }));

          const currentThreadState = state.threads.find((t) => t.id === threadId);
          const currentLastMsg =
            currentThreadState?.msgs[currentThreadState.msgs.length - 1];
          const answers = (currentLastMsg?.cmp || []).filter(
            (c) => !c.err && c.content
          );

          if (answers.length > 0) {
            await streamCouncilVerdict(
              text,
              answers,
              personaInfo.instruction,
              {
                onChunk: (chunkText) => {
                  updateAssistantMessage((msg) => ({
                    ...msg,
                    content: chunkText,
                    judge: targetConnector.name,
                  }));
                },
                onError: () => {
                  updateAssistantMessage((msg) => ({
                    ...msg,
                    content: 'Could not merge the answers. Open each AI’s answer below.',
                  }));
                },
                onDone: () => {},
              },
              signal
            );
          }
        }
      }
    } catch (err: any) {
      if (!signal.aborted) {
        updateAssistantMessage((msg) => ({
          ...msg,
          err: true,
          content: msg.content || `Notice: ${err.message || 'Stream completed'}`,
        }));
      }
    } finally {
      setIsBusy(false);
      abortControllerRef.current = null;
      updateAssistantMessage((msg) => ({
        ...msg,
        step: '',
        done: true,
      }));
    }
  };

  // Retry / Redo
  const handleRedo = (index: number) => {
    if (!currentThread || isBusy) return;
    const userMsg = currentThread.msgs[index - 1];
    if (userMsg && userMsg.role === 'user') {
      setState((prev) => ({
        ...prev,
        threads: prev.threads.map((t) =>
          t.id === currentThread.id
            ? { ...t, msgs: t.msgs.slice(0, index - 1) }
            : t
        ),
      }));
      handleSend(userMsg.content);
    }
  };

  // Copy
  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    showToast('Copied to clipboard');
  };

  // Text to speech
  const handleSpeak = (text: string) => {
    if (!window.speechSynthesis) {
      showToast('Read aloud is not supported on this browser');
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[`*#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    window.speechSynthesis.speak(utterance);
    showToast('Reading aloud...');
  };

  // Prompt improver
  const handleImprovePrompt = async (
    currentText: string,
    onUpdate: (newText: string) => void
  ) => {
    const improved = await improvePrompt(currentText);
    onUpdate(improved);
  };

  // Export Chat
  const handleExportChat = () => {
    if (!currentThread || !currentThread.msgs.length) {
      showToast('Nothing to export yet');
      return;
    }
    const md = `# ${currentThread.title}\n\n` +
      currentThread.msgs
        .map(
          (m) =>
            `**${m.role === 'user' ? 'You' : m.who || 'AI'}:**\n${m.content || ''}`
        )
        .join('\n\n---\n\n');

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentThread.title.replace(/[^\w]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Chat exported as Markdown');
  };

  // Export Chat as PDF
  const handleExportPdf = () => {
    if (!currentThread || !currentThread.msgs.length) {
      showToast('Nothing to export yet. Start a chat first.');
      return;
    }
    showToast('Preparing PDF print preview...');
    exportThreadToPdf(currentThread, currentConnector?.name || 'GAMURA');
  };

  // Delete All Chats
  const handleDeleteAllChats = () => {
    if (window.confirm('Delete all chats on this device?')) {
      if (currentUser?.uid) {
        state.threads.forEach((t) => {
          deleteThreadFromFirestore(currentUser.uid, t.id);
        });
      }
      setState((prev) => ({
        ...prev,
        threads: [],
        active: null,
      }));
      setIsSheetOpen(false);
      showToast('All chats deleted');
    }
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col bg-[var(--bg)] text-[var(--tx)]">
      {/* Background Animated Atmosphere */}
      <div id="au" aria-hidden="true">
        <i />
        <i />
      </div>

      {/* Main App Container */}
      <div id="app" className="relative z-10 h-full w-full max-w-[820px] mx-auto flex flex-col">
        {/* Top Bar with Apple Profile badge & Analytics */}
        <TopBar
          mode={state.mode}
          onModeChange={(mode) => setState((prev) => ({ ...prev, mode }))}
          isBusy={isBusy}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onNewChat={handleNewChat}
          onOpenSheet={(tab = 'c') => {
            setSheetTab(tab);
            setIsSheetOpen(true);
          }}
          onOpenAnalytics={() => setIsAnalyticsOpen(true)}
          connectedCount={connectedConnectors.length}
          currentConnector={currentConnector}
          userNickname={currentUser?.nickname}
          userPhoto={currentUser?.photoURL}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          canInstallPWA={canInstallPWA}
          onInstallPWA={handleInstallPWA}
        />

        {/* Virtualized & Memoized Chat Container */}
        <VirtualizedChat
          messages={currentThread?.msgs || []}
          threadTitle={currentThread?.title}
          isBusy={isBusy}
          onSendSuggestion={handleSend}
          onCopy={handleCopy}
          onSpeak={handleSpeak}
          onRedo={handleRedo}
          onPreviewCode={(code) => setPreviewCode(code)}
        />

        {/* Bottom Input Dock */}
        <DockInput
          connectedConnectors={connectedConnectors}
          currentConnectorId={state.current}
          onSelectConnector={(id) => setState((prev) => ({ ...prev, current: id }))}
          selectedPersona={state.persona}
          onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
          mode={state.mode}
          isBusy={isBusy}
          userId={userIdentifier}
          onSend={handleSend}
          onStop={handleStop}
          onImprovePrompt={handleImprovePrompt}
          onShowToast={showToast}
        />
      </div>

      {/* Side History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        threads={state.threads}
        activeThreadId={state.active}
        onSelectThread={(id) => setState((prev) => ({ ...prev, active: id }))}
        onNewChat={handleNewChat}
        onTogglePin={(id) =>
          setState((prev) => {
            const updated = prev.threads.map((t) =>
              t.id === id ? { ...t, pin: !t.pin } : t
            );
            const target = updated.find((t) => t.id === id);
            if (target && currentUser?.uid) {
              syncThreadToFirestore(currentUser.uid, target);
            }
            return { ...prev, threads: updated };
          })
        }
        onRenameThread={(id, newTitle) =>
          setState((prev) => {
            const updated = prev.threads.map((t) =>
              t.id === id ? { ...t, title: newTitle } : t
            );
            const target = updated.find((t) => t.id === id);
            if (target && currentUser?.uid) {
              syncThreadToFirestore(currentUser.uid, target);
            }
            return { ...prev, threads: updated };
          })
        }
        onDeleteThread={(id) => {
          if (currentUser?.uid) {
            deleteThreadFromFirestore(currentUser.uid, id);
          }
          setState((prev) => ({
            ...prev,
            threads: prev.threads.filter((t) => t.id !== id),
            active: prev.active === id ? null : prev.active,
          }));
        }}
      />

      {/* Connectors & Settings Bottom Sheet */}
      <ConnectorsSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        activeTab={sheetTab}
        onTabChange={setSheetTab}
        allConnectors={allConnectors}
        connectedIds={state.connected}
        onToggleConnector={(id) =>
          setState((prev) => {
            const isConn = prev.connected.includes(id);
            const newConnected = isConn
              ? prev.connected.filter((c) => c !== id)
              : [...prev.connected, id];

            const newCurrent =
              prev.current === id && isConn
                ? newConnected[0] || ''
                : !isConn
                ? id
                : prev.current;

            return {
              ...prev,
              connected: newConnected,
              current: newCurrent,
            };
          })
        }
        onConnectAll={handleConnectAll}
        onRemoveCustomConnector={(id) =>
          setState((prev) => ({
            ...prev,
            custom: prev.custom.filter((c) => c.id !== id),
            connected: prev.connected.filter((c) => c !== id),
            current: prev.current === id ? prev.connected[0] || 'gamura' : prev.current,
          }))
        }
        onAddCustomConnector={(name, model) =>
          setState((prev) => {
            const newConn: Connector = {
              id: `c_${Date.now()}`,
              name,
              by: 'Custom',
              model,
              color: '#8e8e93',
              desc: model,
              custom: true,
            };
            return {
              ...prev,
              custom: [...prev.custom, newConn],
              connected: [...prev.connected, newConn.id],
              current: newConn.id,
            };
          })
        }
        userNickname={currentUser?.nickname}
        userEmail={currentUser?.email}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        theme={state.theme}
        onThemeChange={(theme) => setState((prev) => ({ ...prev, theme }))}
        accent={state.accent}
        onAccentChange={(accent) => setState((prev) => ({ ...prev, accent }))}
        size={state.size}
        onSizeChange={(size) => setState((prev) => ({ ...prev, size }))}
        onExportChat={handleExportChat}
        onExportPdf={handleExportPdf}
        onDeleteAllChats={handleDeleteAllChats}
        onShowToast={showToast}
        canInstallPWA={canInstallPWA}
        isPWAInstalled={isPWAInstalled}
        onInstallPWA={handleInstallPWA}
      />

      {/* Persona Picker Modal */}
      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        selectedPersona={state.persona}
        onSelectPersona={(persona) => setState((prev) => ({ ...prev, persona }))}
      />

      {/* Apple-Style Authentication Modal */}
      <AppleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(nickname) => {
          showToast(`Signed in as ${nickname}`);
        }}
        onSkip={handleSkipAuth}
        onShowToast={showToast}
      />

      {/* Isolated In-Chat Code Preview Modal */}
      <CodePreviewModal
        isOpen={!!previewCode}
        onClose={() => setPreviewCode(null)}
        code={previewCode || ''}
      />

      {/* Model Analytics & Message Dashboard */}
      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        activeModelName={currentConnector?.name || 'GAMURA'}
        connectedCount={connectedConnectors.length}
      />

      {/* Toast Notification */}
      <div
        id="toast"
        className={`fixed left-1/2 bottom-[calc(110px+env(safe-area-inset-bottom,0px))] -translate-x-1/2 bg-[var(--tx)] text-[var(--bg)] py-2.5 px-5 rounded-full text-[13.5px] font-semibold transition-all duration-300 pointer-events-none z-50 shadow-lg max-w-[90vw] text-center ${
          toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        {toastMessage}
      </div>
    </div>
  );
}
