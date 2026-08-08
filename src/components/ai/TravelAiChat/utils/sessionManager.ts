import { ConversationSession, TravelChatMessage, ConversationType } from '../types/chat.types';
import { getChatSessionsIndexKey } from './chatConstants';

export const generateSessionTitle = (messages: TravelChatMessage[]): string => {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'New Conversation';
  const title = firstUserMessage.content.trim().split('\n')[0];
  return title.length > 30 ? title.substring(0, 30) + '...' : title;
};

export const getSessionsIndex = (ownerId?: string | number | null): ConversationSession[] => {
  if (typeof window === 'undefined') return [];
  const key = getChatSessionsIndexKey(ownerId);
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return [];
    return JSON.parse(stored) as ConversationSession[];
  } catch (e) {
    console.error('Failed to parse sessions index', e);
    return [];
  }
};

export const saveSessionsIndex = (sessions: ConversationSession[], ownerId?: string | number | null) => {
  if (typeof window === 'undefined') return;
  const key = getChatSessionsIndexKey(ownerId);
  window.localStorage.setItem(key, JSON.stringify(sessions));
};

export const getSessionStorageKey = (sessionId: string, ownerId?: string | number | null) => {
  return `${getChatSessionsIndexKey(ownerId)}:session:${sessionId}`;
};

export const deleteSession = (sessionId: string, ownerId?: string | number | null) => {
  if (typeof window === 'undefined') return;
  const sessions = getSessionsIndex(ownerId);
  const updatedSessions = sessions.filter(s => s.id !== sessionId);
  saveSessionsIndex(updatedSessions, ownerId);
  window.localStorage.removeItem(getSessionStorageKey(sessionId, ownerId));
};

export const createNewSession = (type: ConversationType = 'NORMAL_CHAT'): ConversationSession => {
  const id = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    title: 'New Conversation',
    type,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messageCount: 1,
  };
};
