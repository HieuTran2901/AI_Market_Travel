import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  X, Sparkles, Zap, BrainCircuit, Paintbrush, 
  ChevronDown, RefreshCcw
} from 'lucide-react';
import { Select } from '../../../ui/Select';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workingMode?: boolean;
  onApplyWorkingMode?: (mode: boolean) => void;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({ isOpen, onClose, workingMode = false, onApplyWorkingMode }) => {
  const [isWorkingMode, setIsWorkingMode] = useState(workingMode);
  const [isApplying, setIsApplying] = useState(false);
  const [activeMode, setActiveMode] = useState('smart');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [toneOfVoice, setToneOfVoice] = useState('Friendly');
  const [responseLength, setResponseLength] = useState('Medium');
  const [language, setLanguage] = useState('English');
  const [personalization, setPersonalization] = useState({
    remember: true,
    history: true,
  });

  const [scrollPosition, setScrollPosition] = useState({ top: false, bottom: true });
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setScrollPosition({
        top: scrollTop > 0,
        bottom: Math.ceil(scrollTop + clientHeight) < scrollHeight
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsWorkingMode(workingMode);
      setIsApplying(false);
      // Small delay to allow layout to settle before checking scroll
      const timer = setTimeout(checkScroll, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isAdvancedOpen, workingMode]);

  // Handle body scroll locking
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const modes = [
    { id: 'smart', title: 'Smart Mode', desc: 'Balanced answers with creativity and accuracy.', icon: Sparkles, tag: 'Recommended' },
    { id: 'fast', title: 'Fast Mode', desc: 'Fast responses for quick edits.', icon: Zap },
    { id: 'deep', title: 'Deep Mode', desc: 'Long, detailed, thoughtful generation.', icon: BrainCircuit },
    { id: 'creative', title: 'Creative Mode', desc: 'More persuasive, emotional marketing copy.', icon: Paintbrush },
  ];

  const handleApply = () => {
    if (isApplying) return;
    setIsApplying(true);
    
    setTimeout(() => {
      if (onApplyWorkingMode) {
        onApplyWorkingMode(isWorkingMode);
      }
      setIsApplying(false);
      onClose();
    }, 600);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile Overlay - Added pointer-events-auto */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm lg:hidden pointer-events-auto"
            onClick={!isApplying ? onClose : undefined}
          />

          {/* Modal Container - Added pointer-events-auto */}
          <motion.div
            initial={{ opacity: 0, x: 30, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[110] flex max-h-[90vh] flex-col overflow-hidden rounded-t-[24px] border-t border-white/10 bg-[#0A1020]/95 shadow-2xl backdrop-blur-xl sm:inset-x-4 sm:bottom-auto sm:top-1/2 sm:max-h-[85vh] sm:-translate-y-1/2 sm:rounded-[24px] sm:border md:mx-auto md:w-[480px] lg:bottom-[92px] lg:left-auto lg:right-[460px] lg:top-auto lg:h-[min(720px,calc(100dvh-130px))] lg:max-h-[calc(100dvh-130px)] lg:w-[420px] lg:translate-y-0"
          >
            {/* Header (fixed) */}
            <div className={`flex shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4 transition-opacity ${isApplying ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <h2 className="text-lg font-black text-white">AI Concierge Settings</h2>
                <p className="mt-0.5 text-xs font-medium text-slate-400">Customize how the AI assistant behaves while helping you.</p>
              </div>
              <button onClick={onClose} disabled={isApplying} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content (scrollable) */}
            <div className={`relative flex-1 overflow-hidden transition-opacity ${isApplying ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Top Scroll Shadow */}
              <div 
                className={`pointer-events-none absolute left-0 right-0 top-0 z-10 h-12 transition-opacity duration-300 ${
                  scrollPosition.top ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.18), transparent)' }}
              />
              
              {/* Bottom Scroll Shadow */}
              <div 
                className={`pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-12 transition-opacity duration-300 ${
                  scrollPosition.bottom ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.18), transparent)' }}
              />

              <div 
                ref={scrollRef}
                onScroll={checkScroll}
                className="h-full overflow-y-auto px-5 py-6 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
              
              {/* SECTION 1: AI Work Mode */}
              <div className="mb-8 relative z-0">
                <div className={`relative mb-4 flex items-center justify-between rounded-xl border p-4 transition-all duration-300 ${
                  isWorkingMode 
                    ? 'border-purple-500/50 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]' 
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-sm font-bold ${isWorkingMode ? 'text-purple-300' : 'text-white'}`}>
                        ✨ Enable Working Mode
                      </h3>
                      <span className="rounded bg-gradient-to-r from-purple-500 to-indigo-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
                        NEW
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-[260px]">
                      Switch to full working mode with a dedicated AI assistant for Listing Management.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsWorkingMode(!isWorkingMode)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${isWorkingMode ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-slate-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isWorkingMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {!isWorkingMode && (
                  <div className="space-y-3">
                    {modes.map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setActiveMode(mode.id)}
                        className={`group relative flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                          activeMode === mode.id 
                            ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_4px_20px_rgba(59,130,246,0.1)]' 
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          activeMode === mode.id ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'bg-white/10 text-slate-400 group-hover:text-white'
                        }`}>
                          <mode.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-bold ${activeMode === mode.id ? 'text-blue-100' : 'text-slate-200'}`}>
                              {mode.title}
                            </h4>
                            {mode.tag && (
                              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-300 ring-1 ring-blue-500/30">
                                {mode.tag}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-400">{mode.desc}</p>
                        </div>
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          activeMode === mode.id ? 'border-blue-500 bg-blue-500' : 'border-slate-500 bg-transparent'
                        }`}>
                          {activeMode === mode.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: Response Preferences */}
              <div className="mb-8">
                <h3 className="mb-4 text-sm font-bold text-white">Response Preferences</h3>
                
                <div className="mb-4 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Response Length</label>
                  <Select 
                    value={responseLength} 
                    onChange={(e: any) => setResponseLength(e.target.value)}
                  >
                    {['Short', 'Medium', 'Long'].map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>

                <div className="mb-4 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tone of Voice</label>
                  <Select 
                    value={toneOfVoice} 
                    onChange={(e: any) => setToneOfVoice(e.target.value)}
                  >
                    {['Professional', 'Luxury', 'Friendly', 'Business', 'Minimal', 'Storytelling'].map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Language</label>
                  <Select 
                    value={language} 
                    onChange={(e: any) => setLanguage(e.target.value)}
                  >
                    {['Auto Detect', 'English', 'Vietnamese', 'Japanese', 'Chinese', 'French'].map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
              </div>

              {/* SECTION 3: Personalization */}
              <div className="mb-8">
                <h3 className="mb-4 text-sm font-bold text-white">Personalization</h3>
                <div className="space-y-1 rounded-xl border border-white/10 bg-white/5 p-2">
                  {[
                    { id: 'remember', label: 'Remember my preferences' },
                    { id: 'history', label: 'Use travel history' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 transition hover:bg-white/5">
                      <span className="text-sm font-medium text-slate-200">{item.label}</span>
                      <button 
                        type="button"
                        onClick={() => setPersonalization(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${personalization[item.id as keyof typeof personalization] ? 'bg-emerald-500' : 'bg-slate-600'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${personalization[item.id as keyof typeof personalization] ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: Advanced */}
              <div className="mb-2 rounded-xl border border-white/10 bg-white/5">
                <button 
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/5"
                >
                  Advanced Features
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isAdvancedOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/10"
                    >
                      <div className="space-y-5 px-4 pb-5 pt-4">
                        {[
                          { label: 'Temperature', val: 0.7 },
                          { label: 'Creativity', val: 0.8 },
                          { label: 'Precision', val: 0.9 },
                          { label: 'SEO Strength', val: 0.5 },
                          { label: 'Luxury Vocabulary', val: 0.6 },
                          { label: 'Marketing Tone', val: 0.8 },
                        ].map(slider => (
                          <div key={slider.label}>
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-medium text-slate-400">{slider.label}</span>
                              <span className="text-xs font-bold text-slate-200">{slider.val.toFixed(1)}</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <div className="h-full bg-indigo-500" style={{ width: `${slider.val * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
            </div>

            {/* Footer (fixed) */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-5 py-4">
              <button type="button" disabled={isApplying} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:pointer-events-none">
                <RefreshCcw className="h-4 w-4" /> Reset Default
              </button>
              <button 
                type="button" 
                onClick={handleApply}
                disabled={isApplying}
                className={`relative overflow-hidden inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-black text-white shadow-lg transition hover:shadow-xl ${
                  isApplying 
                    ? 'bg-purple-500/80 justify-center cursor-wait pointer-events-none shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                }`}
              >
                {isApplying && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 bg-white/40 blur-md rounded-xl"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {isApplying ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-pulse text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" /> Applying...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Apply Changes
                    </>
                  )}
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};
