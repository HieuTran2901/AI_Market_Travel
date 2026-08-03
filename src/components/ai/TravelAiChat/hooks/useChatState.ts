import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TravelChatMessage, ChatAttachment } from '../types/chat.types';
import { createGreetingMessage, hydrateMessages, hydrateTravelContext } from '../utils/messageFormatter';

export const useChatState = (accountOwnerKey: string, userFullName?: string) => {
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
  const [messagesOwnerKey, setMessagesOwnerKey] = useState(accountOwnerKey);
  const [travelContext, setTravelContext] = useState<Record<string, unknown>>({});
  const [lastCompletedMessageId, setLastCompletedMessageId] = useState<string | undefined>();

  const ownerScopedMessages = useMemo(
    () => messagesOwnerKey === accountOwnerKey ? messages : [createGreetingMessage(userFullName)],
    [accountOwnerKey, messages, messagesOwnerKey, userFullName]
  );
  
  const history = useMemo(() => ownerScopedMessages.map(({ role, content }) => ({ role, content })), [ownerScopedMessages]);

  const clearSensitiveAiQueries = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['ai-conversations'] });
    queryClient.removeQueries({ queryKey: ['ai-conversation'] });
    queryClient.removeQueries({ queryKey: ['ai-trip-draft'] });
    queryClient.removeQueries({ queryKey: ['my-trips'] });
    queryClient.removeQueries({ queryKey: ['trip-detail'] });
  }, [queryClient]);

  const resetAiChatState = useCallback((storageKey: string, fallbackName?: string, _workingMode?: boolean, defaultSuggestions: string[] = []) => {
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
    const nextMessages = hydrateMessages(storageKey, fallbackName);
    setMessages(nextMessages);
    setMessagesOwnerKey(storageKey);
    setTravelContext(hydrateTravelContext(nextMessages));
    clearSensitiveAiQueries();
  }, [clearSensitiveAiQueries]);

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
    messagesOwnerKey, setMessagesOwnerKey,
    travelContext, setTravelContext,
    lastCompletedMessageId, setLastCompletedMessageId,
    ownerScopedMessages,
    history,
    resetAiChatState,
    clearSensitiveAiQueries
  };
};
