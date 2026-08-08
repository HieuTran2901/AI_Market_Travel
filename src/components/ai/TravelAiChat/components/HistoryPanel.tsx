import React from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, Briefcase, Trash2, X } from 'lucide-react';
import { ConversationSession, ConversationType } from '../types/chat.types';

type HistoryPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  sessions: ConversationSession[];
  currentSessionId: string | null;
  activeType: ConversationType;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  activeType,
  onSelectSession,
  onNewSession,
  onDeleteSession
}) => {
  const filteredSessions = sessions
    .filter((s) => s.type === activeType)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const groupSessions = (sessionsList: ConversationSession[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: Record<string, ConversationSession[]> = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: []
    };

    sessionsList.forEach((session) => {
      const date = new Date(session.updatedAt);
      if (date >= today) groups['Today'].push(session);
      else if (date >= yesterday) groups['Yesterday'].push(session);
      else if (date >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) groups['Previous 7 Days'].push(session);
      else groups['Older'].push(session);
    });

    return groups;
  };

  const grouped = groupSessions(filteredSessions);

  return (
    <motion.div
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ x: isOpen ? 0 : '-100%', opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute inset-y-0 left-0 z-[100] w-[260px] flex flex-col bg-[#071126]/95 backdrop-blur-xl border-r border-blue-900/40 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h2 className="text-[13px] font-bold text-white flex items-center gap-2">
          {activeType === 'WORKING_MODE' ? (
            <><Briefcase className="h-4 w-4 text-purple-400" /> Workspace History</>
          ) : (
            <><MessageSquare className="h-4 w-4 text-blue-400" /> Chat History</>
          )}
        </h2>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3">
        <button
          onClick={onNewSession}
          className="flex items-center gap-2 w-full p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-white text-[13px] font-medium group"
        >
          <Plus className="h-4 w-4 text-slate-400 group-hover:text-white transition" />
          New Conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] px-2 pb-4">
        {Object.entries(grouped).map(([label, groupSessions]) => {
          if (groupSessions.length === 0) return null;
          return (
            <div key={label} className="mb-4">
              <h3 className="px-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-2">
                {label}
              </h3>
              <div className="flex flex-col gap-0.5">
                {groupSessions.map((session) => {
                  const isActive = session.id === currentSessionId;
                  return (
                    <div
                      key={session.id}
                      className={`group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${isActive ? 'bg-blue-500/10 text-blue-100' : 'text-slate-300 hover:bg-white/5'}`}
                      onClick={() => onSelectSession(session.id)}
                    >
                      <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                      <div className="flex-1 truncate text-[12px]">
                        {session.title}
                      </div>
                      
                      <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this conversation?')) {
                              onDeleteSession(session.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filteredSessions.length === 0 && (
          <div className="text-center p-4 text-[12px] text-slate-500">
            No history yet.
          </div>
        )}
      </div>
    </motion.div>
  );
};
