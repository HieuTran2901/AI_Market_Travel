import { motion, Variants, AnimatePresence } from 'framer-motion';
import { Pin, Settings, History, X, Sparkles } from 'lucide-react';
import { TravelLauncherRobot } from './FloatingButtons';
import { ChatTransitionState, RobotMood } from '../types/chat.types';

export interface ChatHeaderProps {
  chatState: ChatTransitionState;
  robotMood: RobotMood;
  workingMode: boolean;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  minimizeChat: () => void;
  closeChat: () => void;
  headerRobotVariants: Variants;
  revealVariants: Variants;
}

export const ChatHeader = ({
  chatState,
  robotMood,
  workingMode,
  isSettingsOpen,
  setIsSettingsOpen,
  minimizeChat,
  closeChat,
  headerRobotVariants,
  revealVariants
}: ChatHeaderProps) => {
  return (
    <motion.div
      className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-4 py-4"
      variants={revealVariants}
      initial="hidden"
      animate={chatState === 'closing' ? 'closing' : 'visible'}
      custom={0.39}
    >
      <div aria-hidden="true" className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <motion.div
            className="travel-ai-header-robot relative"
            variants={headerRobotVariants}
            initial="hidden"
            animate={chatState === 'closing' ? 'closing' : 'visible'}
          >
            <motion.div
              animate={workingMode ? { 
                rotate: [0, 8, -4, 0], 
                scale: [1, 1.15, 1], 
                filter: [
                  'drop-shadow(0 0 0px rgba(59,130,246,0))', 
                  'drop-shadow(0 0 15px rgba(59,130,246,0.8))', 
                  'drop-shadow(0 0 0px rgba(59,130,246,0))'
                ] 
              } : {}}
              transition={{ duration: 1, ease: 'easeInOut' }}
            >
              <TravelLauncherRobot mood={robotMood} hasUnread={false} pressed={false} portalActive={false} />
            </motion.div>
            <Sparkles aria-hidden="true" className="travel-ai-header-sparkle absolute -right-1 -top-1 h-3.5 w-3.5 text-cyan-100" />
          </motion.div>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 truncate text-base font-bold">
              {workingMode ? 'AI Work Assistant' : 'Travel AI Concierge'} <Sparkles className="h-4 w-4 text-violet-200" />
              {workingMode && <span className="ml-1 rounded bg-gradient-to-r from-purple-500 to-indigo-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">PRO</span>}
            </h2>
            <div className="mt-0.5 flex items-center text-xs font-medium text-blue-100">
              <span className="travel-ai-online-dot mr-1.5 shrink-0 inline-block h-2 w-2 rounded-full bg-emerald-400" />
              <div className="relative grid [grid-template-areas:'content']">
                <AnimatePresence>
                  {workingMode ? (
                    <motion.span
                      key="working"
                      initial={{ opacity: 0, y: 4, filter: 'blur(2px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -4, filter: 'blur(2px)' }}
                      transition={{ duration: 0.3 }}
                      className="[grid-area:content] whitespace-nowrap"
                    >
                      Online • Full Working Mode
                    </motion.span>
                  ) : (
                    <motion.span
                      key="normal"
                      initial={{ opacity: 0, y: 4, filter: 'blur(2px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -4, filter: 'blur(2px)' }}
                      transition={{ duration: 0.3 }}
                      className="[grid-area:content] whitespace-nowrap"
                    >
                      Online • AI-powered
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-blue-100 transition hover:bg-white/10" aria-label="Pin chat">
            <Pin className="h-4 w-4" />
          </button>
          <button 
            type="button" 
            onClick={() => {
              console.log("Settings clicked");
              setIsSettingsOpen(!isSettingsOpen);
            }} 
            className="flex h-9 w-9 items-center justify-center rounded-full text-blue-100 transition hover:bg-white/10" 
            aria-label="AI Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={minimizeChat}
            className="flex h-9 w-9 items-center justify-center rounded-full text-blue-100 transition hover:bg-white/10"
            aria-label="Conversation history"
          >
            <History className="h-4 w-4" />
          </button>
          <button type="button" onClick={closeChat} className="flex h-9 w-9 items-center justify-center rounded-full text-blue-100 transition hover:bg-white/10" aria-label="Close chat">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
