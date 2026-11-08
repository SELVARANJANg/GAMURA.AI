import React, { useMemo } from 'react';
import { X, BarChart3, PieChart as PieIcon, Sparkles, Clock, Zap, Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getDailyUsage, getModelStats } from '../utils/usageLimit';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  activeModelName: string;
  connectedCount: number;
}

const MODEL_COLORS: Record<string, string> = {
  GAMURA: '#19d07f',
  BUBUBAI: '#10a37f',
  SR: '#0a84ff',
  Gemini: '#19d07f',
  ChatGPT: '#10a37f',
  Claude: '#0a84ff',
};

const DEFAULT_COLOR = '#19d07f';

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  isOpen,
  onClose,
  activeModelName,
  connectedCount,
}) => {
  const daily = useMemo(() => getDailyUsage(), [isOpen]);
  const modelData = useMemo(() => {
    const raw = getModelStats();
    return raw.map((item) => ({
      ...item,
      color: MODEL_COLORS[item.name] || DEFAULT_COLOR,
    }));
  }, [isOpen]);

  const totalMessages = useMemo(
    () => modelData.reduce((acc, curr) => acc + curr.count, 0),
    [modelData]
  );

  const topModel = useMemo(() => {
    if (modelData.length === 0) return { name: activeModelName, count: 0 };
    return [...modelData].sort((a, b) => b.count - a.count)[0];
  }, [modelData, activeModelName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-2xl transition-opacity duration-300 ease-out"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Glassmorphism Analytics Modal */}
      <div
        className="relative w-full max-w-[620px] max-h-[90dvh] overflow-y-auto rounded-[32px] bg-[var(--gl)]/95 backdrop-blur-3xl border border-white/20 dark:border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.6)] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-250 select-none my-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Gamura AI Model Analytics Dashboard"
      >
        {/* Subtle chromatic ambient top glow */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--ac)] via-[#0a84ff] to-[#bf5af2] opacity-80 shrink-0" />

        {/* Top Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-[var(--ln)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--ac)]/15 text-[var(--ac)] flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[var(--tx)] flex items-center gap-1.5">
                <span>Model Usage Analytics</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-[var(--ac)] text-[var(--fg)]">
                  Live
                </span>
              </h2>
              <p className="text-[12px] text-[var(--mu)]">
                Messages sent across your frontier AI models
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--bg3)]/60 hover:bg-[var(--bg3)] flex items-center justify-center text-[var(--mu)] hover:text-[var(--tx)] transition-all active:scale-90"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Metric 1: Daily Limit */}
          <div className="p-3 rounded-[18px] bg-[var(--bg2)] border border-[var(--ln)] flex flex-col shadow-xs">
            <div className="flex items-center justify-between text-[var(--mu)] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Today</span>
              <Clock className="w-3.5 h-3.5 text-[var(--ac)]" />
            </div>
            <div className="text-[20px] font-black text-[var(--tx)]">
              {daily.used} <span className="text-[13px] font-semibold text-[var(--mu)]">/ {daily.max}</span>
            </div>
            <span className="text-[11px] text-[var(--mu)] mt-0.5">
              {daily.isExceeded ? 'Limit reached' : `${daily.remaining} left today`}
            </span>
          </div>

          {/* Metric 2: Top Model */}
          <div className="p-3 rounded-[18px] bg-[var(--bg2)] border border-[var(--ln)] flex flex-col shadow-xs">
            <div className="flex items-center justify-between text-[var(--mu)] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Favorite</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-[15px] font-bold text-[var(--tx)] truncate" title={topModel.name}>
              {topModel.name}
            </div>
            <span className="text-[11px] text-[var(--mu)] mt-0.5">
              {topModel.count} queries sent
            </span>
          </div>

          {/* Metric 3: Total Prompts */}
          <div className="p-3 rounded-[18px] bg-[var(--bg2)] border border-[var(--ln)] flex flex-col shadow-xs">
            <div className="flex items-center justify-between text-[var(--mu)] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
              <Activity className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-[20px] font-black text-[var(--tx)]">
              {totalMessages}
            </div>
            <span className="text-[11px] text-[var(--mu)] mt-0.5">
              lifetime prompts
            </span>
          </div>

          {/* Metric 4: Active Connectors */}
          <div className="p-3 rounded-[18px] bg-[var(--bg2)] border border-[var(--ln)] flex flex-col shadow-xs">
            <div className="flex items-center justify-between text-[var(--mu)] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Fleet</span>
              <Zap className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-[20px] font-black text-[var(--tx)]">
              {connectedCount}
            </div>
            <span className="text-[11px] text-[var(--mu)] mt-0.5">
              models enabled
            </span>
          </div>
        </div>

        {/* Charts Section */}
        <div className="px-5 space-y-4 pb-6">
          {/* Chart 1: Messages per model (BarChart) */}
          <div className="p-4 rounded-[22px] bg-[var(--bg2)] border border-[var(--ln)] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13.5px] font-bold text-[var(--tx)] flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[var(--ac)]" />
                <span>Messages Sent per Model</span>
              </h3>
              <span className="text-[11px] text-[var(--mu)]">Interactive breakdown</span>
            </div>

            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    stroke="var(--mu)"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis stroke="var(--mu)" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(28,28,30,0.92)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      backdropFilter: 'blur(10px)',
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {modelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Share Distribution (Donut Chart) */}
          <div className="p-4 rounded-[22px] bg-[var(--bg2)] border border-[var(--ln)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-left">
              <h3 className="text-[13.5px] font-bold text-[var(--tx)] flex items-center gap-1.5 mb-1">
                <PieIcon className="w-4 h-4 text-[#a35cf5]" />
                <span>Model Workload Distribution</span>
              </h3>
              <p className="text-[12px] text-[var(--mu)] leading-relaxed">
                Distribution of prompts across reasoning, search, enterprise, and open-weights intelligence.
              </p>

              {/* Legend preview */}
              <div className="flex flex-wrap gap-2 mt-3">
                {modelData.slice(0, 5).map((m) => (
                  <span
                    key={m.name}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--tx)] px-2 py-0.5 rounded-full bg-[var(--bg3)]"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="truncate max-w-[80px]">{m.name}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="w-[150px] h-[150px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(28,28,30,0.92)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <Pie
                    data={modelData}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={36}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {modelData.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Footer Done */}
        <div className="p-4 px-6 border-t border-[var(--ln)] flex items-center justify-between bg-[var(--bg3)]/30 shrink-0">
          <span className="text-[12px] text-[var(--mu)]">
            Daily limit: 3 chats/day • Resets at midnight
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-5 rounded-full bg-[var(--ac)] text-[var(--fg)] font-bold text-[13px] active:scale-95 transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
