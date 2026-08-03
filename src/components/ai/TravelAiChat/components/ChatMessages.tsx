import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ChatTransitionState } from '../types/chat.types';

export interface ChatMessagesProps {
  chatState: ChatTransitionState;
  revealVariants: Variants;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isDragging?: boolean;
  pendingResponseKind?: 'TEXT' | 'ITINERARY' | 'LISTING_RECOMMENDATIONS' | null;
  isLoading?: boolean;
  user?: { fullName?: string };
  children: React.ReactNode;
}

export const ChatMessages = ({
  chatState,
  revealVariants,
  messagesEndRef,
  children
}: ChatMessagesProps) => {
  return (
    <motion.div
      className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.18),transparent_34%),linear-gradient(180deg,rgba(15,39,92,0.9),rgba(7,22,51,1))] px-4 py-4 pb-8 [scrollbar-width:thin]"
      variants={revealVariants}
      initial="hidden"
      animate={chatState === 'closing' ? 'closing' : 'visible'}
      custom={0.48}
    >
      {children}
      <div ref={messagesEndRef} className="h-4" />
    </motion.div>
  );
};
