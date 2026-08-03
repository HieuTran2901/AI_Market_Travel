import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, Variants } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { AiSettingsModal } from './modals/ChatSettingsModal';
import { getChatStorageKey, MAX_IMAGES, MAX_IMAGE_SIZE, travelQuickActions, workQuickActions } from './utils/chatConstants';
import { suggestionChips } from './utils/messageFormatter';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessages } from './components/ChatMessages';
import { QuickActions } from './components/QuickActions';
import { ChatInput } from './components/ChatInput';
import { useChatState } from './hooks/useChatState';
import { useWorkingMode } from './hooks/useWorkingMode';
import { useMessageActions } from './hooks/useMessageActions';
import { useAutoScroll } from './hooks/useAutoScroll';
import { TravelMessage } from './components/MessageBubble';
import { TravelLauncherRobot, useRobotMood } from './components/FloatingButtons';
import { ChatTransitionState } from './types/chat.types';

const smoothEase = [0.16, 1, 0.3, 1] as const;
const exitEase = [0.4, 0, 0.2, 1] as const;
const handoffEase = [0.22, 1, 0.36, 1] as const;

export const TravelAiChat: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const accountOwnerId = user?.id ?? null;
  const accountOwnerKey = getChatStorageKey(accountOwnerId);
  const accountOwnerRef = useRef(accountOwnerKey);
  const previousOwnerKeyRef = useRef<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const launcherButtonRef = useRef<HTMLButtonElement>(null);

  const reducedMotion = useReducedMotion();
  const [chatState, setChatState] = useState<ChatTransitionState>('closed');
  
  const [isVisible, setIsVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    console.log("Settings:", isSettingsOpen);
  }, [isSettingsOpen]);
  const [messagesOwnerKey, setMessagesOwnerKey] = useState<string>(accountOwnerKey);
  const [isDragging, setIsDragging] = useState(false);
  const [launcherCompress, setLauncherCompress] = useState(false);
  const [launcherPortalActive, setLauncherPortalActive] = useState(false);

  const {
    messages, setMessages,
    input, setInput,
    attachments, setAttachments,
    isLoading, setIsLoading,
    savingDraftId, setSavingDraftId,
    requestError, setRequestError,
    uploadError, setUploadError,
    setPendingResponseKind,
    travelContext, setTravelContext,
    setSuggestedActions,
    lastCompletedMessageId, setLastCompletedMessageId,
    setUnreadCount,
    clearSensitiveAiQueries,
    unreadCount,
    pendingResponseKind
  } = useChatState(accountOwnerKey, user?.fullName);

  const { workingMode, showToast, applyWorkingMode } = useWorkingMode();

  const actions = {
    setSavingDraftId, setRequestError, setMessages, setSuggestedActions,
    setUploadError, setAttachments, setInput, setPendingResponseKind,
    setLastCompletedMessageId, setTravelContext, clearSensitiveAiQueries,
    setIsLoading,
    setUnreadCount
  };

  const {
    saveTripDraft, validateFiles, removeAttachment, sendMessage, sendQuickAction
  } = useMessageActions(
    actions, queryClient, accountOwnerRef, accountOwnerId, MAX_IMAGES, MAX_IMAGE_SIZE, workingMode, messages, travelContext,
    textareaRef, suggestionChips, requestControllerRef, savingDraftId, input, attachments, isLoading, setUnreadCount, chatState === 'open'
  );

  const robotMood = useRobotMood({ isSending: isLoading, error: requestError, lastCompletedMessageId });

  const canSend = input.trim().length > 0 || attachments.length > 0;
  const resizeComposer = (node: HTMLTextAreaElement) => {
    node.style.height = '42px';
    node.style.height = `${Math.min(node.scrollHeight, 104)}px`;
  };

  useAutoScroll(messagesEndRef, messages, isLoading, isVisible);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLauncherCompress = () => {
    if (reducedMotion) return;
    setLauncherCompress(true);
    setTimeout(() => { setLauncherCompress(false); }, 130);
  };

  const runPortalPulse = () => {
    if (reducedMotion) return;
    setLauncherPortalActive(true);
    setTimeout(() => { setLauncherPortalActive(false); }, 720);
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const clearFocusTimer = () => {
    if (focusTimerRef.current) {
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (authLoading) return;
    const previousOwnerKey = previousOwnerKeyRef.current;
    if (previousOwnerKey === accountOwnerKey) return;
    
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem(accountOwnerKey);
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          setMessages(parsed.map((msg: any) => ({ ...msg, createdAt: new Date(msg.createdAt) })));
        } catch (e) {
          console.error('Failed to parse saved chat messages:', e);
        }
      } else if (previousOwnerKey !== null) {
        setMessages([]);
      }
    }
    
    setMessagesOwnerKey(accountOwnerKey);
    accountOwnerRef.current = accountOwnerKey;
    previousOwnerKeyRef.current = accountOwnerKey;
  }, [accountOwnerKey, authLoading, setMessages]);

  useEffect(() => {
    if (typeof window === 'undefined' || authLoading || messagesOwnerKey !== accountOwnerKey) return;
    const serializable = messages.map((message) => ({
      ...message,
      itineraryCard: undefined,
      savedTrip: undefined,
      attachments: message.attachments?.map((a) => ({ id: a.id, previewUrl: a.previewUrl, uploadedUrl: a.uploadedUrl }))
    }));
    localStorage.setItem(accountOwnerKey, JSON.stringify(serializable));
  }, [messages, accountOwnerKey, authLoading, messagesOwnerKey]);

  useEffect(() => {
    if (!isVisible) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeChat(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isVisible]);

  useEffect(() => {
    return () => attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
  }, [attachments]);

  useEffect(() => {
    return () => { clearCloseTimer(); clearFocusTimer(); requestControllerRef.current?.abort(); };
  }, []);

  const openChat = () => {
    if (chatState === 'opening' || chatState === 'closing') return;
    if (isVisible) {
      closeChat();
      return;
    }
    startLauncherCompress();
    runPortalPulse();
    clearCloseTimer();
    clearFocusTimer();
    setChatState('opening');
    setIsVisible(true);
    setUnreadCount(0);
    focusTimerRef.current = setTimeout(() => {
      panelRef.current?.focus({ preventScroll: true });
      focusTimerRef.current = null;
    }, reducedMotion ? 90 : 520);
    closeTimerRef.current = setTimeout(() => {
      setChatState('open');
      closeTimerRef.current = null;
    }, reducedMotion ? 90 : 720);
  };

  const closeChat = () => {
    if (chatState === 'closed' || chatState === 'opening' || chatState === 'closing') return;
    clearCloseTimer();
    clearFocusTimer();
    setChatState('closing');
    closeTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setChatState('closed');
      closeTimerRef.current = null;
      setTimeout(() => launcherButtonRef.current?.focus(), 0);
    }, reducedMotion ? 90 : 620);
  };

  const minimizeChat = () => {
    closeChat();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  };

  const panelVariants: Variants = {
    hidden: reducedMotion
      ? { opacity: 0 }
      : { opacity: 0.7, y: 12, clipPath: 'inset(92% 0 0 92% round 999px)' },
    visible: {
      opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 28px)',
      transition: reducedMotion ? { duration: 0.08 } : { duration: 0.46, delay: 0.08, ease: handoffEase },
    },
    closing: (delayCollapse = false) =>
      reducedMotion
        ? { opacity: 0, transition: { duration: 0.08 } }
        : {
            opacity: 0.65, y: 22, clipPath: 'inset(92% 0 0 92% round 999px)',
            transition: { duration: 0.34, delay: delayCollapse ? 0.16 : 0, ease: exitEase },
          },
  };

  const headerRobotVariants: Variants = {
    hidden: reducedMotion
      ? { opacity: 1, scale: 1 }
      : { opacity: 0, scale: 0.75, y: 4 },
    visible: {
      opacity: 1, scale: 1, y: 0,
      transition: reducedMotion ? { duration: 0 } : { duration: 0.18, delay: 0.28, ease: handoffEase },
    },
    closing: reducedMotion
      ? { opacity: 0 }
      : {
          opacity: 0, scale: 0.78, rotate: [0, -4, 3, 0],
          transition: { opacity: { duration: 0.12, delay: 0.18 }, scale: { duration: 0.16, delay: 0.18 }, rotate: { duration: 0.2, ease: exitEase } },
        },
  };

  const revealVariants: Variants = {
    hidden: reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
    visible: (delay = 0) => ({
      opacity: 1, y: 0,
      transition: reducedMotion ? { duration: 0 } : { duration: 0.28, delay, ease: smoothEase },
    }),
    closing: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, transition: { duration: 0.14 } },
  };

  const robotVariants: Variants = {
    idle: { y: 0, rotate: 0, scale: 1 },
    activate: reducedMotion
      ? { y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 }
      : {
          x: -10, y: -6, rotate: -3, scale: [1, 0.94, 1.03], opacity: [1, 1, 0],
          transition: { duration: 0.28, ease: handoffEase },
        },
    return: reducedMotion
      ? { y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 }
      : {
          opacity: [0, 1], x: [-8, 0], y: [-4, 0], rotate: [-3, 0], scale: [0.94, 1],
          transition: { duration: 0.22, delay: 0.38, ease: handoffEase },
        },
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[1000]">
        <AnimatePresence mode="popLayout">
          {chatState !== 'closed' && (
            <motion.section
              key="travel-ai-panel"
              ref={panelRef}
              role="dialog"
              aria-modal="false"
              aria-label="Travel AI Concierge"
              tabIndex={-1}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                validateFiles(Array.from(event.dataTransfer.files));
              }}
              className={`travel-ai-motion-panel travel-ai-panel-state--${chatState} pointer-events-auto fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] flex h-[calc(100dvh-1.5rem-env(safe-area-inset-bottom))] max-h-[calc(100dvh-1.5rem-env(safe-area-inset-bottom))] origin-bottom-right flex-col overflow-hidden rounded-[28px] border border-blue-400/40 bg-[#071633] text-white shadow-2xl shadow-blue-950/50 ring-1 ring-violet-400/30 sm:inset-auto sm:bottom-[92px] sm:right-5 sm:h-[min(680px,calc(100dvh-130px))] sm:max-h-[calc(100dvh-130px)] sm:w-[clamp(360px,27vw,430px)]`}
              style={{ transformOrigin: 'bottom right' }}
              variants={panelVariants}
              initial="hidden"
              animate={chatState === 'closing' ? 'closing' : 'visible'}
              exit="hidden"
              custom={chatState === 'closing'}
            >
              {!reducedMotion && (
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 z-30 h-px bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]"
                  initial={{ top: '0%', opacity: 0 }}
                  animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 0.7, delay: 0.34, ease: 'easeInOut' }}
                />
              )}
              {!reducedMotion && <div aria-hidden="true" className="travel-ai-border-sweep" />}
              {!reducedMotion && <div aria-hidden="true" className="travel-ai-pull-beam" />}
              
              <ChatHeader 
                chatState={chatState} robotMood={robotMood} workingMode={workingMode}
                isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen}
                minimizeChat={minimizeChat} closeChat={closeChat}
                headerRobotVariants={headerRobotVariants} revealVariants={revealVariants}
              />

              <ChatMessages chatState={chatState} revealVariants={revealVariants} messagesEndRef={messagesEndRef} isDragging={isDragging} pendingResponseKind={pendingResponseKind} isLoading={isLoading} user={user || undefined}>
                <QuickActions 
                  workingMode={workingMode} chatState={chatState} revealVariants={revealVariants}
                  sendQuickAction={sendQuickAction} travelQuickActions={travelQuickActions} workQuickActions={workQuickActions}
                  user={user || undefined}
                />

                <div className="min-w-0 space-y-4">
                  {messages.slice(1).map((message) => (
                    <TravelMessage
                      key={message.id}
                      message={message}
                      onSaveDraft={saveTripDraft}
                      savingDraftId={savingDraftId}
                    />
                  ))}
                  {isLoading && pendingResponseKind && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-blue-100">
                        <span className="flex gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-blue-200 [animation-delay:-120ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-blue-200 [animation-delay:-60ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-blue-200" />
                        </span>
                        {pendingResponseKind === 'LISTING_RECOMMENDATIONS' ? 'Searching marketplace data...' : 'Building your response...'}
                      </div>
                    </div>
                  )}
                </div>
              </ChatMessages>

              <ChatInput 
                chatState={chatState} revealVariants={revealVariants} workingMode={workingMode}
                textareaRef={textareaRef} input={input} setInput={setInput}
                attachments={attachments} addFiles={(files: FileList) => validateFiles(Array.from(files))} removeAttachment={removeAttachment}
                isLoading={isLoading} sendMessage={sendMessage} handleKeyDown={handleKeyDown}
                suggestionChips={suggestionChips} fileInputRef={fileInputRef} resizeComposer={resizeComposer}
                canSend={canSend} MAX_IMAGES={MAX_IMAGES} uploadError={uploadError}
                isDragging={isDragging}
              />
              
              <AiSettingsModal 
                isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
                workingMode={workingMode} onApplyWorkingMode={applyWorkingMode}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        ref={launcherButtonRef}
        type="button"
        onClick={openChat}
        className={`travel-ai-launcher pointer-events-auto fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[max(12px,env(safe-area-inset-right))] z-[1001] flex h-14 w-14 max-w-[calc(100%_-_24px)] items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-white shadow-2xl shadow-blue-950/40 ring-4 ring-blue-400/20 sm:right-4 md:h-16 md:w-16 lg:bottom-5 lg:right-5 ${launcherPortalActive ? 'travel-ai-launcher--portal' : ''} ${launcherCompress ? 'travel-ai-launcher--compress' : ''}`}
        aria-label="Open Travel AI Concierge"
        aria-expanded={isVisible}
        initial={false}
        animate={chatState === 'open' || chatState === 'closing' ? { scale: 0.96 } : { scale: 1 }}
        whileHover={reducedMotion ? undefined : { scale: chatState === 'closed' ? 1.05 : 1 }}
        whileTap={reducedMotion ? undefined : { scale: 0.92 }}
        transition={{ duration: 0.18 }}
      >
        <span className="absolute inset-0 rounded-full bg-blue-400/30 motion-safe:animate-pulse" />
        <span aria-hidden="true" className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
        {unreadCount > 0 && (
          <span className="absolute -left-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-black text-white">
            {unreadCount}
          </span>
        )}
        <AnimatePresence mode="popLayout">
          {(chatState === 'closed' || chatState === 'closing') && (
            <motion.div
              key="launcher-robot"
              className="travel-ai-launcher-robot-wrap relative"
              variants={robotVariants}
              initial={chatState === 'closing' && !reducedMotion ? { opacity: 0, x: -8, y: -4, rotate: -3, scale: 0.94 } : false}
              animate={chatState === 'closing' ? 'return' : launcherPortalActive ? 'activate' : 'idle'}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -10, y: -6, rotate: -3, scale: 0.96 }}
              transition={{ layout: reducedMotion ? { duration: 0 } : { duration: 0.42, ease: smoothEase } }}
            >
              <TravelLauncherRobot mood={robotMood} hasUnread={unreadCount > 0 && chatState === 'closed'} pressed={launcherCompress} portalActive={launcherPortalActive} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Premium Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, scale: 0.97, filter: 'blur(0px)' }}
            transition={{ duration: 0.45, type: 'spring', bounce: 0.3 }}
            className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex items-start gap-4 rounded-2xl border border-purple-500/30 bg-slate-900/95 px-6 py-5 shadow-2xl backdrop-blur-md"
          >
            <div className="text-[22px] leading-none mt-0.5">✨</div>
            <div className="flex flex-col gap-1.5">
              <h4 className="text-[15px] font-bold tracking-wide text-white">Working Mode Activated</h4>
              <p className="max-w-[260px] text-[13.5px] leading-relaxed text-slate-300/90">
                Your AI assistant is now focused on optimizing listings only.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
