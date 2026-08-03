import { aiService } from '@/services/aiService';
import { storageService } from '@/services/storageService';
import { createMessage, isTripSaveConfirmation, extractDestination, isConversationalPrompt, isTripPlanningPrompt, normalizePromptText, isListingRecommendationPrompt, extractBudget, inferCategories, extractDuration, normalizeAssistantResponse } from '../utils/messageFormatter';

export interface MessageActionsProps {
  setSavingDraftId: (id: string | null) => void;
  setRequestError: (error: boolean) => void;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setSuggestedActions: (actions: string[]) => void;
  setUploadError: (error: string) => void;
  setAttachments: React.Dispatch<React.SetStateAction<any[]>>;
  setInput: (input: string) => void;
  setPendingResponseKind: (kind: 'TEXT' | 'ITINERARY' | 'LISTING_RECOMMENDATIONS' | null) => void;
  setLastCompletedMessageId: (id: string | undefined) => void;
  setTravelContext: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  clearSensitiveAiQueries: () => void;
  setIsLoading: (loading: boolean) => void;
}

export const useMessageActions = (
  actions: MessageActionsProps,
  queryClient: any,
  accountOwnerRef: React.MutableRefObject<string>,
  accountOwnerId: number | null,
  MAX_IMAGES: number,
  MAX_IMAGE_SIZE: number,
  _workingMode: boolean,
  messages: any[],
  travelContext: any,
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  suggestionChips: string[],
  requestControllerRef: React.MutableRefObject<AbortController | null>,
  savingDraftId: string | null,
  input: string,
  attachments: any[],
  isLoading: boolean,
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>,
  isVisible: boolean
) => {
  const {
    setSavingDraftId, setRequestError, setMessages, setSuggestedActions,
    setUploadError, setAttachments, setInput, setPendingResponseKind,
    setLastCompletedMessageId, setTravelContext,
    setIsLoading: setIsLoadingAction
  } = actions;


  const uploadAttachments = async () => {
    const uploaded: any[] = [];
    for (const attachment of attachments) {
      setAttachments((current: any[]) => current.map((item: any) => (item.id === attachment.id ? { ...item, status: 'uploading', progress: 35 } : item)));
      try {
        const response = await storageService.uploadImage(attachment.file, 'chat');
        const uploadedUrl = response.data;
        const next = { ...attachment, uploadedUrl, status: 'uploaded' as const, progress: 100 };
        uploaded.push(next);
        setAttachments((current: any[]) => current.map((item: any) => (item.id === attachment.id ? next : item)));
      } catch (err) {
        console.error('Image upload failed', err);
        setUploadError('Failed to upload image. Please try again.');
        setAttachments((current: any[]) => current.filter((item: any) => item.id !== attachment.id));
      }
    }
    return uploaded;
  };

  const saveTripDraft = async (messageId: string, draftId: string) => {
    if (savingDraftId) return;
    const requestOwnerKey = accountOwnerRef.current;
    setSavingDraftId(draftId);
    setRequestError(false);
    try {
      const result = await aiService.confirmTripDraft(draftId);
      if (requestOwnerKey !== accountOwnerRef.current) return;
      setMessages((current) => current.map((message) => {
        if (message.id !== messageId) return message;
        return {
          ...message,
          savedTrip: result.trip,
          itineraryCard: message.itineraryCard ? { ...message.itineraryCard, savedTrip: result.trip } : message.itineraryCard,
        };
      }));
      await queryClient.invalidateQueries({ queryKey: ['my-trips'] });
      await queryClient.invalidateQueries({ queryKey: ['trip-detail', result.trip.slug] });
      setSuggestedActions(['View in My Trips', 'Continue editing']);
    } catch (error) {
      if (requestOwnerKey !== accountOwnerRef.current) return;
      console.error('Failed to save AI trip draft:', error);
      setRequestError(true);
      setMessages((current) => [
        ...current,
        createMessage('assistant', 'I could not add that trip to My Trips yet. Please try again.', undefined, {
          type: 'ERROR',
          kind: 'ERROR',
        }),
      ]);
    } finally {
      if (requestOwnerKey === accountOwnerRef.current) {
        setSavingDraftId(null);
      }
    }
  };

const validateFiles = (files: File[]) => {
    setUploadError('');
    const room = MAX_IMAGES - attachments.length;
    const valid = files.slice(0, room).filter((file) => {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files can be attached.');
        return false;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setUploadError('Images must be 5MB or smaller.');
        return false;
      }
      return true;
    });

    if (files.length > room) setUploadError(`You can attach up to ${MAX_IMAGES} images.`);
    return valid;
  };

const addFiles = (fileList: FileList | File[]) => {
    const files = validateFiles(Array.from(fileList));
    if (!files.length) return;
    const next = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'local' as const,
    }));
    setAttachments((current) => [...current, ...next]);
  };

const removeAttachment = (id: string) => {
    setAttachments((current) => {
      const target = current.find((attachment) => attachment.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((attachment) => attachment.id !== id);
    });
  };

const sendMessage = async (text = input) => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    const requestOwnerKey = accountOwnerRef.current;
    const requestOwnerId = accountOwnerId;
    const trimmedText = text.trim();
    if (trimmedText && isTripSaveConfirmation(trimmedText)) {
      const userMessage = createMessage('user', trimmedText);
      setMessages((current) => [...current, userMessage]);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = '42px';
      const latestDraftMessage = messages.slice().reverse().find((m: any) => m.id === savingDraftId);
      if (latestDraftMessage?.itineraryCard?.draftId) {
        await saveTripDraft(latestDraftMessage.id, latestDraftMessage.itineraryCard.draftId);
      } else {
        setMessages((current) => [
          ...current,
          createMessage('assistant', 'I do not have an active trip preview to save yet. Tell me where you want to go and I will prepare one first.', undefined, {
            type: 'CLARIFICATION',
          }),
        ]);
      }
      return;
    }
    const destination = extractDestination(trimmedText);
    const conversationalOnly = isConversationalPrompt(trimmedText);
    const hasTravelContext = !conversationalOnly && Boolean(destination || travelContext.destination || travelContext.responseMode);
    const wantsItinerary = !conversationalOnly && (isTripPlanningPrompt(trimmedText) || (hasTravelContext && /cheaper|more food|near the beach|what should|what to do|ideas|weekend|wife|people|re hon|them mon an/i.test(normalizePromptText(trimmedText))));
    const wantsRecommendations = !conversationalOnly && !wantsItinerary && (isListingRecommendationPrompt(trimmedText) || hasTravelContext);
    const responseKind = conversationalOnly ? 'TEXT' : wantsItinerary ? 'ITINERARY' : wantsRecommendations ? 'LISTING_RECOMMENDATIONS' : 'TEXT';
    const controller = new AbortController();
    requestControllerRef.current?.abort();
    requestControllerRef.current = controller;
    setIsLoadingAction(true);
    setRequestError(false);
    setPendingResponseKind(responseKind);
    setUploadError('');

    try {
      const uploaded = await uploadAttachments();
      if (requestOwnerKey !== accountOwnerRef.current || controller.signal.aborted) return;
      const uploadedUrls = uploaded.map((attachment) => attachment.uploadedUrl).filter(Boolean);
      const inferredBudget = extractBudget(trimmedText);
      const inferredCategories = inferCategories(trimmedText);
      const inferredDuration = wantsItinerary ? extractDuration(trimmedText) : undefined;
      const hintLines = [
        destination ? `Destination hint: ${destination}` : '',
        inferredDuration ? `Duration hint: ${inferredDuration} days` : '',
        inferredBudget ? `Budget hint: ${inferredBudget} VND` : '',
        inferredCategories?.length ? `Category hints: ${inferredCategories.join(', ')}` : '',
      ].filter(Boolean);
      const messageContent = [
        trimmedText || 'Please review these travel images.',
        hintLines.length ? `Travel context hints:\n${hintLines.join('\n')}` : '',
        uploadedUrls.length ? `Attached image URLs:\n${uploadedUrls.join('\n')}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');
      const userMessage = createMessage(
        'user',
        trimmedText || 'Please review these travel images.',
        uploaded.map(({ id, previewUrl, uploadedUrl }: any) => ({ id, previewUrl, uploadedUrl }))
      );
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = '42px';
      setAttachments([]);
      setSuggestedActions([]);

      const response = await aiService.chatWithAssistant(
        {
          message: messageContent,
          history: messages.slice(-12),
          historyOwnerId: requestOwnerId,
          contextDestination: destination,
          extractedContext: travelContext,
        },
        controller.signal
      );
      if (requestOwnerKey !== accountOwnerRef.current || controller.signal.aborted) return;
      const aiMessage = normalizeAssistantResponse(response);
      if (response.extractedContext) {
        setTravelContext(response.extractedContext);
      }
      const nextSuggestions = response.itineraryCard?.followUpSuggestions || response.suggestions || response.suggestedActions || [];
      setSuggestedActions(nextSuggestions.length ? nextSuggestions : suggestionChips);
      setMessages([...nextMessages, aiMessage]);
      setLastCompletedMessageId(aiMessage.id);
      if (aiMessage.kind === 'ITINERARY') {
        setSuggestedActions(aiMessage.itineraryCard?.followUpSuggestions?.length ? aiMessage.itineraryCard.followUpSuggestions : ['Adjust this for a lower budget', 'Add more food stops', 'Make it family-friendly']);
      }
      if (!isVisible) setUnreadCount((count) => count + 1);
    } catch (error) {
      if ((error as any)?.name === 'CanceledError' || (error as any)?.code === 'ERR_CANCELED') return;
      if (requestOwnerKey !== accountOwnerRef.current) return;
      console.error('Failed to send chat message:', error);
      setRequestError(true);
      setUploadError(error instanceof Error ? error.message : 'The AI concierge could not respond right now.');
      setMessages((current) => [...current, createMessage('assistant', 'Sorry, I could not connect to the travel concierge right now. Please try again.')]);
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
      if (requestOwnerKey === accountOwnerRef.current) {
        setIsLoadingAction(false);
        setPendingResponseKind(null);
      }
    }
  };

const sendQuickAction = (title: string) => {
    const promptMap: Record<string, string> = {
      'Plan a trip': 'Plan a relaxing 4-day trip with stays, food, and local highlights.',
      'Find hotels': 'Find hotels that match my travel style and budget.',
      'Build itinerary': 'Build a day-by-day itinerary with routes and timing.',
      'Ask about visa': 'What visa or entry rules should I check before traveling?',
    };
    sendMessage(promptMap[title] || title);
  };

  return {
    saveTripDraft,
    validateFiles,
    addFiles,
    removeAttachment,
    sendMessage,
    sendQuickAction
  };
};
