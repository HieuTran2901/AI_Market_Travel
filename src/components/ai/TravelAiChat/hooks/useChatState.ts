import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TravelChatMessage, ChatAttachment, ConversationSession } from '../types/chat.types';
import { createGreetingMessage, hydrateMessages, hydrateTravelContext } from '../utils/messageFormatter';
import { getSessionsIndex, saveSessionsIndex, createNewSession, generateSessionTitle, getSessionStorageKey } from '../utils/sessionManager';
import { getChatStorageKey } from '../utils/chatConstants';

export const useChatState = (accountOwnerId: string | number | null, userFullName?: string) => {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [requestError, setRequestError] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingResponseKind, setPendingResponseKind] = useState<'TEXT' | 'ITINERARY' | 'LISTING_RECOMMENDATIONS' | null>(null);
  const [savingDraftId, setSavingDraftId] = useState<string | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [messages, setMessages] = useState<TravelChatMessage[]>(() => [createGreetingMessage(userFullName)]);
  const [travelContext, setTravelContext] = useState<Record<string, unknown>>({});
  const [lastCompletedMessageId, setLastCompletedMessageId] = useState<string | undefined>();
  
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Migrate old local storage key to a session if needed, then load sessions
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const oldKey = getChatStorageKey(accountOwnerId);
    const stored = window.localStorage.getItem(oldKey);
    let loadedSessions = getSessionsIndex(accountOwnerId);
    
    if (stored && loadedSessions.length === 0) {
      const parsed = JSON.parse(stored);
      const msgs = Array.isArray(parsed) ? parsed : parsed.messages || [];
      if (msgs.length > 1) { // More than just greeting
        const session = createNewSession('NORMAL_CHAT');
        session.title = generateSessionTitle(msgs);
        session.messageCount = msgs.length;
        loadedSessions = [session];
        saveSessionsIndex(loadedSessions, accountOwnerId);
        window.localStorage.setItem(getSessionStorageKey(session.id, accountOwnerId), stored);
      }
      window.localStorage.removeItem(oldKey);
    }
    setSessions(loadedSessions);
  }, [accountOwnerId]);

  const ownerScopedMessages = messages;
  const history = useMemo(() => ownerScopedMessages.map(({ role, content }) => ({ role, content })), [ownerScopedMessages]);

  const clearSensitiveAiQueries = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['ai-conversations'] });
    queryClient.removeQueries({ queryKey: ['ai-conversation'] });
    queryClient.removeQueries({ queryKey: ['ai-trip-draft'] });
    queryClient.removeQueries({ queryKey: ['my-trips'] });
    queryClient.removeQueries({ queryKey: ['trip-detail'] });
  }, [queryClient]);

  const switchSession = useCallback((sessionId: string, fallbackName?: string, _workingMode?: boolean, defaultSuggestions: string[] = []) => {
    setIsLoading(false);
    setRequestError(false);
    setUploadError('');
    setInput('');
    setPendingResponseKind(null);
    setSavingDraftId(null);
    setSuggestedActions(defaultSuggestions);
    setUnreadCount(0);
    setLastCompletedMessageId(undefined);
    setAttachments((current) => {
      current.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));
      return [];
    });
    
    setCurrentSessionId(sessionId);
    const sessionKey = getSessionStorageKey(sessionId, accountOwnerId);
    const nextMessages = hydrateMessages(sessionKey, fallbackName);
    setMessages(nextMessages);
    setTravelContext(hydrateTravelContext(nextMessages));
    clearSensitiveAiQueries();
  }, [accountOwnerId, clearSensitiveAiQueries]);

  return {
    input, setInput,
    isLoading, setIsLoading,
    attachments, setAttachments,
    uploadError, setUploadError,
    requestError, setRequestError,
    unreadCount, setUnreadCount,
    pendingResponseKind, setPendingResponseKind,
    savingDraftId, setSavingDraftId,
    suggestedActions, setSuggestedActions,
    messages, setMessages,
    travelContext, setTravelContext,
    lastCompletedMessageId, setLastCompletedMessageId,
    ownerScopedMessages,
    history,
    sessions, setSessions,
    currentSessionId, setCurrentSessionId,
    switchSession,
    clearSensitiveAiQueries
  };
};
