import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ChatTransitionState } from '../types/chat.types';

export interface QuickActionItem {
  title: string;
  helper: string;
  icon: React.ElementType;
  tone: string;
}

export interface QuickActionsProps {
  workingMode: boolean;
  chatState: ChatTransitionState;
  revealVariants: Variants;
  sendQuickAction: (action: string) => void;
  travelQuickActions: QuickActionItem[];
  workQuickActions: QuickActionItem[];
  user?: { fullName?: string };
}

export const QuickActions = ({
  workingMode,
  chatState,
  revealVariants,
  sendQuickAction,
  travelQuickActions,
  workQuickActions,
  user
}: QuickActionsProps) => {
  return (
    <>
      <motion.div variants={revealVariants} initial="hidden" animate={chatState === 'closing' ? 'closing' : 'visible'} custom={0.42} className="mb-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm leading-6 text-blue-50 shadow-sm">
        {workingMode
          ? "Hi! I'm your AI Work Assistant. I'm here to help you create the best listing possible."
          : `Hi ${user?.fullName?.split(' ')[0] || 'there'}! I'm your AI travel concierge. How can I help plan your next adventure?`}
      </motion.div>
      <motion.div variants={revealVariants} initial="hidden" animate={chatState === 'closing' ? 'closing' : 'visible'} custom={0.5} className="mb-4 grid grid-cols-2 gap-2">
        {(workingMode ? workQuickActions : travelQuickActions).map((action, index) => (
          <button
            key={action.title}
            type="button"
            onClick={() => sendQuickAction(action.title)}
            className={`rounded-2xl border border-white/10 bg-gradient-to-br ${action.tone} p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-white/20 active:scale-[0.98]`}
            style={{ animationDelay: `${index * 55}ms` }}
          >
            <action.icon className="mb-3 h-5 w-5" />
            <p className="text-sm font-bold text-white">{action.title}</p>
            <p className="mt-1 text-xs leading-5 text-blue-100">{action.helper}</p>
          </button>
        ))}
      </motion.div>
    </>
  );
};
