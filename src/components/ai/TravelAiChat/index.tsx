import React, { useEffect, useRef, useState } from "react";
import {
  FileText,
  Wand2,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Send,
  X,
  MapPin,
  MessageSquare,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  Variants,
} from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { AiSettingsModal } from "./modals/ChatSettingsModal";
import {
  getChatStorageKey,
  getChatSessionsIndexKey,
  MAX_IMAGES,
  MAX_IMAGE_SIZE,
  travelQuickActions,
  workQuickActions,
} from "./utils/chatConstants";
import { suggestionChips } from "./utils/messageFormatter";
import { HistoryPanel } from "./components/HistoryPanel";
import { createNewSession, deleteSession, saveSessionsIndex } from "./utils/sessionManager";
import { ChatHeader } from "./components/ChatHeader";
import { ChatMessages } from "./components/ChatMessages";
import { QuickActions } from "./components/QuickActions";
import { ChatInput } from "./components/ChatInput";
import { useChatState } from "./hooks/useChatState";
import { useWorkingMode } from "./hooks/useWorkingMode";
import { useMessageActions } from "./hooks/useMessageActions";
import { useAutoScroll } from "./hooks/useAutoScroll";
import { TravelMessage } from "./components/MessageBubble";
import {
  TravelLauncherRobot,
  useRobotMood,
} from "./components/FloatingButtons";
import { ChatTransitionState } from "./types/chat.types";

const smoothEase = [0.16, 1, 0.3, 1] as const;
const exitEase = [0.4, 0, 0.2, 1] as const;
const handoffEase = [0.22, 1, 0.36, 1] as const;

export const TravelAiChat: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const accountOwnerId = user?.id ?? null;
  const accountOwnerKey = getChatStorageKey(accountOwnerId);
  const accountOwnerRef = useRef(accountOwnerKey);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const launcherButtonRef = useRef<HTMLButtonElement>(null);

  const reducedMotion = useReducedMotion();
  const [chatState, setChatState] = useState<ChatTransitionState>("closed");

  const [isVisible, setIsVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConversationPanelOpen, setIsConversationPanelOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    console.log("Settings:", isSettingsOpen);
  }, [isSettingsOpen]);
  const [isDragging, setIsDragging] = useState(false);
  const [launcherCompress, setLauncherCompress] = useState(false);
  const [launcherPortalActive, setLauncherPortalActive] = useState(false);

  const {
    messages,
    setMessages,
    input,
    setInput,
    attachments,
    setAttachments,
    isLoading,
    setIsLoading,
    savingDraftId,
    setSavingDraftId,
    requestError,
    setRequestError,
    uploadError,
    setUploadError,
    setPendingResponseKind,
    travelContext,
    setTravelContext,
    setSuggestedActions,
    lastCompletedMessageId,
    setLastCompletedMessageId,
    setUnreadCount,
    clearSensitiveAiQueries,
    unreadCount,
    pendingResponseKind,
    sessions,
    setSessions,
    currentSessionId,
    switchSession,
  } = useChatState(accountOwnerId, user?.fullName);

  const { workingMode, showToast, applyWorkingMode } = useWorkingMode();
  // Handle working mode switch: pick the latest session of the corresponding type, or create one.
  useEffect(() => {
    if (authLoading) return;
    const activeType = workingMode ? 'WORKING_MODE' : 'NORMAL_CHAT';
    const typeSessions = sessions.filter(s => s.type === activeType).sort((a, b) => b.updatedAt - a.updatedAt);
    
    if (typeSessions.length > 0) {
      if (currentSessionId !== typeSessions[0].id) {
        switchSession(typeSessions[0].id);
      }
    } else {
      const newSess = createNewSession(activeType);
      setSessions([...sessions, newSess]);
      switchSession(newSess.id);
    }
  }, [workingMode, authLoading]); // Only listen to workingMode changes, to switch sessions.

  const handleNewSession = () => {
    const activeType = workingMode ? 'WORKING_MODE' : 'NORMAL_CHAT';
    const newSess = createNewSession(activeType);
    setSessions([...sessions, newSess]);
    switchSession(newSess.id);
    setIsHistoryOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id, accountOwnerId);
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    if (currentSessionId === id) {
      const activeType = workingMode ? 'WORKING_MODE' : 'NORMAL_CHAT';
      const typeSessions = updatedSessions.filter(s => s.type === activeType).sort((a, b) => b.updatedAt - a.updatedAt);
      if (typeSessions.length > 0) {
        switchSession(typeSessions[0].id);
      } else {
        const newSess = createNewSession(activeType);
        setSessions([...updatedSessions, newSess]);
        switchSession(newSess.id);
      }
    }
  };

  const handleSelectSession = (id: string) => {
    switchSession(id);
    setIsHistoryOpen(false);
  };

  const actions = {
    setSavingDraftId,
    setRequestError,
    setMessages,
    setSuggestedActions,
    setUploadError,
    setAttachments,
    setInput,
    setPendingResponseKind,
    setLastCompletedMessageId,
    setTravelContext,
    clearSensitiveAiQueries,
    setIsLoading,
    setUnreadCount,
  };

  const {
    saveTripDraft,
    validateFiles,
    removeAttachment,
    sendMessage,
    sendQuickAction,
  } = useMessageActions(
    actions,
    queryClient,
    accountOwnerRef,
    accountOwnerId,
    MAX_IMAGES,
    MAX_IMAGE_SIZE,
    workingMode,
    messages,
    travelContext,
    textareaRef,
    suggestionChips,
    requestControllerRef,
    savingDraftId,
    input,
    attachments,
    isLoading,
    setUnreadCount,
    chatState === "open",
  );

  const robotMood = useRobotMood({
    isSending: isLoading,
    error: requestError,
    lastCompletedMessageId,
  });

  const canSend = input.trim().length > 0 || attachments.length > 0;
  const resizeComposer = (node: HTMLTextAreaElement) => {
    node.style.height = "42px";
    node.style.height = `${Math.min(node.scrollHeight, 104)}px`;
  };

  useAutoScroll(messagesEndRef, messages, isLoading, isVisible);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLauncherCompress = () => {
    if (reducedMotion) return;
    setLauncherCompress(true);
    setTimeout(() => {
      setLauncherCompress(false);
    }, 130);
  };

  const runPortalPulse = () => {
    if (reducedMotion) return;
    setLauncherPortalActive(true);
    setTimeout(() => {
      setLauncherPortalActive(false);
    }, 720);
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
    if (typeof window === "undefined" || authLoading || !currentSessionId) return;
    const serializable = messages.map((message) => ({
      ...message,
      itineraryCard: undefined,
      savedTrip: undefined,
      attachments: message.attachments?.map((a) => ({
        id: a.id,
        previewUrl: a.previewUrl,
        uploadedUrl: a.uploadedUrl,
      })),
    }));
    const storageKey = getChatSessionsIndexKey(accountOwnerId) + ':session:' + currentSessionId;
    localStorage.setItem(storageKey, JSON.stringify(serializable));
    
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === currentSessionId);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        messageCount: messages.length,
        updatedAt: Date.now(),
        title: prev[idx].messageCount <= 1 && messages.length > 1 ? messages[1].content.trim().split('\n')[0].substring(0, 30) + '...' : prev[idx].title
      };
      saveSessionsIndex(updated, accountOwnerId);
      return updated;
    });
  }, [messages, currentSessionId, authLoading, accountOwnerId]);

  useEffect(() => {
    if (!isVisible) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isVisible]);

  useEffect(() => {
    return () => attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
  }, [attachments]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
      clearFocusTimer();
      requestControllerRef.current?.abort();
    };
  }, []);

  const openChat = () => {
    if (chatState === "opening" || chatState === "closing") return;
    if (isVisible) {
      closeChat();
      return;
    }
    startLauncherCompress();
    runPortalPulse();
    clearCloseTimer();
    clearFocusTimer();
    setChatState("opening");
    setIsVisible(true);
    setUnreadCount(0);
    setIsConversationPanelOpen(false);
    focusTimerRef.current = setTimeout(
      () => {
        panelRef.current?.focus({ preventScroll: true });
        focusTimerRef.current = null;
      },
      reducedMotion ? 90 : 520,
    );
    closeTimerRef.current = setTimeout(
      () => {
        setChatState("open");
        closeTimerRef.current = null;
      },
      reducedMotion ? 90 : 720,
    );
  };

  const closeChat = () => {
    if (
      chatState === "closed" ||
      chatState === "opening" ||
      chatState === "closing"
    )
      return;
    clearCloseTimer();
    clearFocusTimer();
    setChatState("closing");
    closeTimerRef.current = setTimeout(
      () => {
        setIsVisible(false);
        setChatState("closed");
        closeTimerRef.current = null;
        setTimeout(() => launcherButtonRef.current?.focus(), 0);
      },
      reducedMotion ? 90 : 620,
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  };

  const handleQuickAction = (action: string) => {
    setIsConversationPanelOpen(true);
    sendQuickAction(action);
  };

  const panelVariants: Variants = {
    hidden: reducedMotion
      ? { opacity: 0 }
      : { opacity: 0.7, y: 12, clipPath: "inset(92% 0 0 92% round 999px)" },
    visible: {
      opacity: 1,
      y: 0,
      clipPath: "inset(0% 0% 0% 0% round 28px)",
      transition: reducedMotion
        ? { duration: 0.08 }
        : { duration: 0.46, delay: 0.08, ease: handoffEase },
    },
    closing: (delayCollapse = false) =>
      reducedMotion
        ? { opacity: 0, transition: { duration: 0.08 } }
        : {
            opacity: 0.65,
            y: 22,
            clipPath: "inset(92% 0 0 92% round 999px)",
            transition: {
              duration: 0.34,
              delay: delayCollapse ? 0.16 : 0,
              ease: exitEase,
            },
          },
  };

  const headerRobotVariants: Variants = {
    hidden: reducedMotion
      ? { opacity: 1, scale: 1 }
      : { opacity: 0, scale: 0.75, y: 4 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: reducedMotion
        ? { duration: 0 }
        : { duration: 0.18, delay: 0.28, ease: handoffEase },
    },
    closing: reducedMotion
      ? { opacity: 0 }
      : {
          opacity: 0,
          scale: 0.78,
          rotate: [0, -4, 3, 0],
          transition: {
            opacity: { duration: 0.12, delay: 0.18 },
            scale: { duration: 0.16, delay: 0.18 },
            rotate: { duration: 0.2, ease: exitEase },
          },
        },
  };

  const revealVariants: Variants = {
    hidden: reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: reducedMotion
        ? { duration: 0 }
        : { duration: 0.28, delay, ease: smoothEase },
    }),
    closing: reducedMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 10, transition: { duration: 0.14 } },
  };

  const robotVariants: Variants = {
    idle: { y: 0, rotate: 0, scale: 1 },
    activate: reducedMotion
      ? { y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 }
      : {
          x: -10,
          y: -6,
          rotate: -3,
          scale: [1, 0.94, 1.03],
          opacity: [1, 1, 0],
          transition: { duration: 0.28, ease: handoffEase },
        },
    return: reducedMotion
      ? { y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 }
      : {
          opacity: [0, 1],
          x: [-8, 0],
          y: [-4, 0],
          rotate: [-3, 0],
          scale: [0.94, 1],
          transition: { duration: 0.22, delay: 0.38, ease: handoffEase },
        },
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[1000]">
        <AnimatePresence mode="popLayout">
          {chatState !== "closed" && (
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
              style={{ transformOrigin: "bottom right" }}
              variants={panelVariants}
              initial="hidden"
              animate={chatState === "closing" ? "closing" : "visible"}
              exit="hidden"
              custom={chatState === "closing"}
            >
              {!reducedMotion && (
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 z-30 h-px bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]"
                  initial={{ top: "0%", opacity: 0 }}
                  animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 0.7, delay: 0.34, ease: "easeInOut" }}
                />
              )}
              {!reducedMotion && (
                <div aria-hidden="true" className="travel-ai-border-sweep" />
              )}
              {!reducedMotion && (
                <div aria-hidden="true" className="travel-ai-pull-beam" />
              )}

              
              <ChatHeader
                chatState={chatState}
                robotMood={robotMood}
                workingMode={workingMode}
                isSettingsOpen={isSettingsOpen}
                setIsSettingsOpen={setIsSettingsOpen}
                closeChat={closeChat}
                onHistoryClick={() => setIsHistoryOpen(!isHistoryOpen)}
                headerRobotVariants={headerRobotVariants}
                revealVariants={revealVariants}
              />

              <HistoryPanel
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                sessions={sessions}
                currentSessionId={currentSessionId}
                activeType={workingMode ? 'WORKING_MODE' : 'NORMAL_CHAT'}
                onSelectSession={handleSelectSession}
                onNewSession={handleNewSession}
                onDeleteSession={handleDeleteSession}
              />

              {!workingMode ? (
                <>
                  <ChatMessages
                    chatState={chatState}
                    revealVariants={revealVariants}
                    messagesEndRef={messagesEndRef}
                    isDragging={isDragging}
                    pendingResponseKind={pendingResponseKind}
                    isLoading={isLoading}
                    user={user || undefined}
                  >
                    <QuickActions
                      workingMode={workingMode}
                      chatState={chatState}
                      revealVariants={revealVariants}
                      sendQuickAction={sendQuickAction}
                      travelQuickActions={travelQuickActions}
                      workQuickActions={workQuickActions}
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
                            {pendingResponseKind === "LISTING_RECOMMENDATIONS"
                              ? "Analyzing marketplace data..."
                              : "Building response..."}
                          </div>
                        </div>
                      )}
                    </div>
                  </ChatMessages>

                  <ChatInput
                    chatState={chatState}
                    revealVariants={revealVariants}
                    workingMode={workingMode}
                    textareaRef={textareaRef}
                    input={input}
                    setInput={setInput}
                    attachments={attachments}
                    addFiles={(files: FileList) =>
                      validateFiles(Array.from(files))
                    }
                    removeAttachment={removeAttachment}
                    isLoading={isLoading}
                    sendMessage={sendMessage}
                    handleKeyDown={handleKeyDown}
                    suggestionChips={suggestionChips}
                    fileInputRef={fileInputRef}
                    resizeComposer={resizeComposer}
                    canSend={canSend}
                    MAX_IMAGES={MAX_IMAGES}
                    uploadError={uploadError}
                    isDragging={isDragging}
                  />
                </>
              ) : (
                <>
                  <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#071633] px-4 py-4 pb-8 [scrollbar-width:thin] relative flex flex-col gap-5">
                    {/* LISTING PROGRESS */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-slate-300">Listing Progress</span>
                        <span className="text-[11px] font-semibold text-purple-400">Step 3 of 5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center gap-1.5 w-1/5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[9px] font-semibold text-emerald-400 text-center leading-tight">Basic Info</span>
                        </div>
                        <div className="h-[1px] flex-1 bg-emerald-500/30 mx-1" />
                        {/* Step 2 */}
                        <div className="flex flex-col items-center gap-1.5 w-1/5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[9px] font-semibold text-emerald-400 text-center leading-tight">Location</span>
                        </div>
                        <div className="h-[1px] flex-1 bg-purple-500/50 mx-1" />
                        {/* Step 3 (Current) */}
                        <div className="flex flex-col items-center gap-1.5 w-1/5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 border border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)] text-white">
                            <span className="text-[12px] font-bold">3</span>
                          </div>
                          <span className="text-[9px] font-bold text-white text-center leading-tight">Details</span>
                        </div>
                        <div className="h-[1px] flex-1 bg-white/10 mx-1" />
                        {/* Step 4 */}
                        <div className="flex flex-col items-center gap-1.5 w-1/5 opacity-50">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 border border-white/20 text-slate-400">
                            <span className="text-[11px] font-medium">4</span>
                          </div>
                          <span className="text-[9px] font-medium text-slate-400 text-center leading-tight">Images</span>
                        </div>
                        <div className="h-[1px] flex-1 bg-white/10 mx-1" />
                        {/* Step 5 */}
                        <div className="flex flex-col items-center gap-1.5 w-1/5 opacity-50">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 border border-white/20 text-slate-400">
                            <span className="text-[11px] font-medium">5</span>
                          </div>
                          <span className="text-[9px] font-medium text-slate-400 text-center leading-tight">Review</span>
                        </div>
                      </div>
                    </div>

                    {/* LISTING QUALITY */}
                    <div className="rounded-[20px] border border-blue-500/20 bg-gradient-to-br from-[#121b3d] to-[#0a1024] p-4 shadow-lg flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Current Quality</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-white">82%</span>
                          <span className="text-[13px] font-bold text-emerald-400">Excellent</span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5"><strong className="text-purple-400">+8%</strong> to publish-ready</span>
                      </div>
                      <div className="h-12 w-12 shrink-0">
                        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                          <path className="text-white/5" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <motion.path className="text-purple-500" strokeWidth="4" strokeDasharray="82, 100" stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" initial={{ strokeDasharray: "0, 100" }} animate={{ strokeDasharray: "82, 100" }} transition={{ duration: 1.5, ease: "easeOut" }} />
                        </svg>
                      </div>
                    </div>

                    {/* TOP 3 AI SUGGESTIONS */}
                    <div className="flex flex-col gap-2.5">
                      <h4 className="flex items-center gap-1.5 text-[12px] font-bold text-slate-300 uppercase tracking-wider">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" /> Top AI Suggestions
                      </h4>
                      <div className="flex flex-col gap-2">
                        {/* Suggestion 1 */}
                        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:bg-white/[0.04]">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="flex flex-1 flex-col overflow-hidden">
                            <span className="truncate text-[13px] font-bold text-white">Improve description</span>
                            <span className="truncate text-[11px] text-slate-400">Missing key highlights</span>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] font-bold text-emerald-400">+12% Quality</span>
                            <button onClick={() => handleQuickAction("Improve Description")} className="rounded-md bg-purple-600/20 px-2 py-1 text-[10px] font-bold text-purple-300 transition hover:bg-purple-600/40">Apply</button>
                          </div>
                        </div>
                        {/* Suggestion 2 */}
                        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:bg-white/[0.04]">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div className="flex flex-1 flex-col overflow-hidden">
                            <span className="truncate text-[13px] font-bold text-white">Add more amenities</span>
                            <span className="truncate text-[11px] text-slate-400">4 popular missing</span>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] font-bold text-emerald-400">+8% Quality</span>
                            <button onClick={() => handleQuickAction("Suggest Amenities")} className="rounded-md bg-purple-600/20 px-2 py-1 text-[10px] font-bold text-purple-300 transition hover:bg-purple-600/40">Apply</button>
                          </div>
                        </div>
                        {/* Suggestion 3 */}
                        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:bg-white/[0.04]">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div className="flex flex-1 flex-col overflow-hidden">
                            <span className="truncate text-[13px] font-bold text-white">Add local tips</span>
                            <span className="truncate text-[11px] text-slate-400">Attracts more views</span>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] font-bold text-emerald-400">+5% Quality</span>
                            <button onClick={() => handleQuickAction("Add local tips")} className="rounded-md bg-purple-600/20 px-2 py-1 text-[10px] font-bold text-purple-300 transition hover:bg-purple-600/40">Apply</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* LATEST AI ACTION */}
                    <div className="flex flex-col gap-2">
                      <h4 className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Latest Action
                      </h4>
                      <div className="flex items-center justify-between rounded-lg bg-emerald-950/30 px-3 py-2 border border-emerald-500/20">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="text-[11px] text-emerald-200 truncate font-medium">Description improved</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-emerald-400/70">2 mins ago</span>
                          <span className="text-[10px] font-bold text-emerald-400">+8% Quality</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI COMMAND (Triggers Panel) */}
                  <div className="border-t border-white/10 bg-[#040d21] p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">AI Command — Not a chat</span>
                    </div>
                    <div
                      className="cursor-text flex items-center gap-2 rounded-xl border border-purple-500/30 bg-[#0b1229] p-2 transition hover:border-purple-400/50 hover:bg-[#0f1733] shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                      onClick={() => setIsConversationPanelOpen(true)}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-purple-400">
                        <Wand2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 text-[13px] text-slate-400 px-1">
                        Tell AI what to improve...
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white shadow-lg">
                        <Send className="h-3.5 w-3.5 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM NAVIGATION */}
                  <div className="flex items-center justify-around border-t border-white/5 bg-[#030917] px-2 py-2.5">
                    <button className="flex flex-col items-center gap-1 w-16 text-purple-400">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-[9px] font-bold">Overview</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 w-16 text-slate-500 hover:text-slate-300 transition">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-[9px] font-medium">Suggestions</span>
                    </button>
                    <button 
                      onClick={() => setIsConversationPanelOpen(true)}
                      className="flex flex-col items-center gap-1 w-16 text-slate-500 hover:text-slate-300 transition"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-[9px] font-medium">Chat</span>
                    </button>
                  </div>

                  {/* Bottom Sheet Conversation Panel */}
                  <AnimatePresence>
                    {isConversationPanelOpen && (
                      <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{
                          type: "spring",
                          damping: 25,
                          stiffness: 200,
                        }}
                        className="absolute inset-x-0 bottom-0 z-50 flex h-[75%] flex-col rounded-t-[28px] border-t border-white/15 bg-gradient-to-b from-[#1c153b] to-[#071633] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                      >
                        {/* Panel Header */}
                        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3 bg-white/5">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            <span className="text-[13px] font-bold text-white">
                              Conversation
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsConversationPanelOpen(false);
                            }}
                            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                          >
                            Close <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Messages */}
                        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 pb-8 [scrollbar-width:thin]">
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
                                  {pendingResponseKind ===
                                  "LISTING_RECOMMENDATIONS"
                                    ? "Analyzing marketplace data..."
                                    : "Building response..."}
                                </div>
                              </div>
                            )}
                          </div>
                          <div ref={messagesEndRef} className="h-4" />
                        </div>

                        {/* Active Input inside Panel */}
                        <ChatInput
                          chatState={chatState}
                          revealVariants={revealVariants}
                          workingMode={workingMode}
                          textareaRef={textareaRef}
                          input={input}
                          setInput={setInput}
                          attachments={attachments}
                          addFiles={(files: FileList) =>
                            validateFiles(Array.from(files))
                          }
                          removeAttachment={removeAttachment}
                          isLoading={isLoading}
                          sendMessage={sendMessage}
                          handleKeyDown={handleKeyDown}
                          suggestionChips={suggestionChips}
                          fileInputRef={fileInputRef}
                          resizeComposer={resizeComposer}
                          canSend={canSend}
                          MAX_IMAGES={MAX_IMAGES}
                          uploadError={uploadError}
                          isDragging={isDragging}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              <AiSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                workingMode={workingMode}
                onApplyWorkingMode={applyWorkingMode}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        ref={launcherButtonRef}
        type="button"
        onClick={openChat}
        className={`travel-ai-launcher pointer-events-auto fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[max(12px,env(safe-area-inset-right))] z-[1001] flex h-14 w-14 max-w-[calc(100%_-_24px)] items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-white shadow-2xl shadow-blue-950/40 ring-4 ring-blue-400/20 sm:right-4 md:h-16 md:w-16 lg:bottom-5 lg:right-5 ${launcherPortalActive ? "travel-ai-launcher--portal" : ""} ${launcherCompress ? "travel-ai-launcher--compress" : ""}`}
        aria-label="Open Travel AI Concierge"
        aria-expanded={isVisible}
        initial={false}
        animate={
          chatState === "open" || chatState === "closing"
            ? { scale: 0.96 }
            : { scale: 1 }
        }
        whileHover={
          reducedMotion
            ? undefined
            : { scale: chatState === "closed" ? 1.05 : 1 }
        }
        whileTap={reducedMotion ? undefined : { scale: 0.92 }}
        transition={{ duration: 0.18 }}
      >
        <span className="absolute inset-0 rounded-full bg-blue-400/30 motion-safe:animate-pulse" />
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]"
        />
        {unreadCount > 0 && (
          <span className="absolute -left-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-black text-white">
            {unreadCount}
          </span>
        )}
        <AnimatePresence mode="popLayout">
          {(chatState === "closed" || chatState === "closing") && (
            <motion.div
              key="launcher-robot"
              className="travel-ai-launcher-robot-wrap relative"
              variants={robotVariants}
              initial={
                chatState === "closing" && !reducedMotion
                  ? { opacity: 0, x: -8, y: -4, rotate: -3, scale: 0.94 }
                  : false
              }
              animate={
                chatState === "closing"
                  ? "return"
                  : launcherPortalActive
                    ? "activate"
                    : "idle"
              }
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: -10, y: -6, rotate: -3, scale: 0.96 }
              }
              transition={{
                layout: reducedMotion
                  ? { duration: 0 }
                  : { duration: 0.42, ease: smoothEase },
              }}
            >
              <TravelLauncherRobot
                mood={robotMood}
                hasUnread={unreadCount > 0 && chatState === "closed"}
                pressed={launcherCompress}
                portalActive={launcherPortalActive}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Premium Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, scale: 0.97, filter: "blur(0px)" }}
            transition={{ duration: 0.45, type: "spring", bounce: 0.3 }}
            className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex items-start gap-4 rounded-2xl border border-purple-500/30 bg-slate-900/95 px-6 py-5 shadow-2xl backdrop-blur-md"
          >
            <div className="text-[22px] leading-none mt-0.5">✨</div>
            <div className="flex flex-col gap-1.5">
              <h4 className="text-[15px] font-bold tracking-wide text-white">
                Working Mode Activated
              </h4>
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



