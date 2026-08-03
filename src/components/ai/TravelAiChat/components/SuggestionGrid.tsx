import { motion, Variants } from 'framer-motion';
import { Check } from 'lucide-react';
import { ChatTransitionState } from '../types/chat.types';

export interface SuggestionGridProps {
  suggestedActions: string[];
  sendQuickAction: (action: string) => void;
  revealVariants: Variants;
  chatState: ChatTransitionState;
}

export const SuggestionGrid = ({
  suggestedActions,
  sendQuickAction,
  revealVariants,
  chatState
}: SuggestionGridProps) => {
  if (suggestedActions.length === 0) return null;

  return (
    <motion.div
      variants={revealVariants}
      initial="hidden"
      animate={chatState === 'closing' ? 'closing' : 'visible'}
      custom={0.52}
      className="mb-4 mt-2"
    >
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
        {suggestedActions.map((action, index) => {
          const isSelected = action === 'View in My Trips';
          return (
            <button
              key={action}
              type="button"
              onClick={() => sendQuickAction(action)}
              className={`flex shrink-0 snap-center items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-1.5 text-xs transition duration-200 active:scale-[0.98] ${
                isSelected
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/20 bg-white/5 text-blue-100 hover:bg-white/10'
              }`}
              style={{ animationDelay: `${index * 45}ms` }}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {action}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
