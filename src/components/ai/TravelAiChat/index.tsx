import React, { useEffect, useRef, useState } from "react";
import {
  FileText,
  Wand2,
  CheckCircle2,
  Paperclip,
  Sparkles,
  Image as ImageIcon,
  BookOpen,
  TrendingUp,
  Send,
  X,
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
  MAX_IMAGES,
  MAX_IMAGE_SIZE,
  travelQuickActions,
  workQuickActions,
} from "./utils/chatConstants";
import { suggestionChips } from "./utils/messageFormatter";
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
  const previousOwnerKeyRef = useRef<string | null>(null);

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

  useEffect(() => {
    console.log("Settings:", isSettingsOpen);
  }, [isSettingsOpen]);
  const [messagesOwnerKey, setMessagesOwnerKey] =
    useState<string>(accountOwnerKey);
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
  } = useChatState(accountOwnerKey, user?.fullName);

  const { workingMode, showToast, applyWorkingMode } = useWorkingMode();

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
    if (authLoading) return;
    const previousOwnerKey = previousOwnerKeyRef.current;
    if (previousOwnerKey === accountOwnerKey) return;

    if (typeof window !== "undefined") {
      const savedMessages = localStorage.getItem(accountOwnerKey);
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          setMessages(
            parsed.map((msg: any) => ({
              ...msg,
              createdAt: new Date(msg.createdAt),
            })),
          );
        } catch (e) {
          console.error("Failed to parse saved chat messages:", e);
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
    if (
      typeof window === "undefined" ||
      authLoading ||
      messagesOwnerKey !== accountOwnerKey
    )
      return;
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
    localStorage.setItem(accountOwnerKey, JSON.stringify(serializable));
  }, [messages, accountOwnerKey, authLoading, messagesOwnerKey]);

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

  const minimizeChat = () => {
    closeChat();
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
                minimizeChat={minimizeChat}
                closeChat={closeChat}
                headerRobotVariants={headerRobotVariants}
                revealVariants={revealVariants}
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
                  <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#071633] px-4 py-4 pb-8 [scrollbar-width:thin] relative">
                    {/* Badge & Quality Ring */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1.5 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-[11px] font-semibold tracking-wider text-purple-300">
                          WORKING MODE: LISTING EXPERT
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          Listing Quality
                        </span>
                        <div className="relative flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#160f2e] shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                          <svg
                            className="h-[30px] w-[30px] -rotate-90 transform"
                            viewBox="0 0 36 36"
                          >
                            <path
                              className="text-white/10"
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <motion.path
                              className="text-emerald-400"
                              strokeWidth="3"
                              strokeDasharray="82, 100"
                              stroke="currentColor"
                              fill="none"
                              strokeLinecap="round"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              initial={{ strokeDasharray: "0, 100" }}
                              animate={{ strokeDasharray: "82, 100" }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                          </svg>
                          <span className="absolute text-[9px] font-bold text-white">
                            82%
                          </span>
                          <Sparkles className="absolute -bottom-1 -right-1 h-2.5 w-2.5 text-emerald-400" />
                        </div>
                      </div>
                    </div>

                    {/* BIG Recommendation Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="relative mb-5 overflow-hidden rounded-[20px] border border-[#2e265c] bg-gradient-to-b from-[#1c153b] to-[#120c26] p-5 shadow-2xl"
                    >
                      <div className="absolute top-[20%] right-[-10px] text-purple-400/20 pointer-events-none">
                        <FileText className="h-20 w-20 rotate-12 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
                      </div>
                      <div className="absolute bottom-4 right-4 z-0 pointer-events-none">
                        <Wand2 className="h-8 w-8 -rotate-12 text-blue-400/50 drop-shadow-[0_0_10px_rgba(96,165,250,0.6)]" />
                      </div>

                      <div className="relative z-10 flex flex-col gap-3">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-purple-400 drop-shadow-[0_0_4px_rgba(192,132,252,0.8)]" />
                          <span className="text-[13px] font-bold tracking-wide text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]">
                            AI Recommendation
                          </span>
                        </div>
                        <div className="max-w-[75%]">
                          <h3 className="mb-2 text-[17px] font-bold leading-tight text-white">
                            Improve your description
                          </h3>
                          <p className="text-[12px] leading-relaxed text-slate-300">
                            Your description is too short and missing key
                            highlights that guests care about.
                          </p>
                        </div>
                        <div className="mt-2 flex items-center gap-2 w-full pr-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickAction("Improve Description")
                            }
                            className="flex flex-1 h-[40px] items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-3 shadow-[0_4px_15px_rgba(124,58,237,0.3)] transition hover:from-blue-400 hover:to-purple-500"
                          >
                            <span className="text-[13px] font-bold text-white">
                              Improve Now
                            </span>
                          </button>
                          <button
                            type="button"
                            className="flex h-[40px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 shrink-0 transition hover:bg-white/10"
                          >
                            <span className="text-[12px] font-medium text-slate-300">
                              Why this?
                            </span>
                          </button>
                        </div>
                      </div>
                    </motion.div>

                    {/* AI Roadmap */}
                    <div className="flex flex-col gap-3 mb-5">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-1.5 text-[13px] font-bold text-white">
                          <BookOpen className="h-4 w-4 text-purple-400" /> AI
                          Roadmap
                        </h4>
                        <span className="text-[11px] font-medium text-slate-400">
                          5 steps • 2 in progress
                        </span>
                      </div>

                      <div className="relative flex gap-4 overflow-x-auto pb-2 pt-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full items-start">
                        {/* Connecting Line */}
                        <div className="absolute left-[36px] top-[16px] h-[1px] border-t border-dashed border-white/20 z-0 min-w-[344px]" />

                        {/* Step 1: Title (Completed) */}
                        <div className="relative z-10 flex w-[72px] shrink-0 flex-col items-center text-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1c153b] border border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                            <span className="text-[12px] font-bold">1</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[11px] font-bold text-white">
                              Improve Description
                            </span>
                            <span className="mt-1 rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-purple-300">
                              In Progress
                            </span>
                          </div>
                        </div>

                        {/* Step 2: Description (Next) */}
                        <div className="relative z-10 flex w-[72px] shrink-0 flex-col items-center text-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a0a14] border border-white/10 text-slate-400">
                            <span className="text-[12px] font-bold">2</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[11px] font-medium text-slate-300">
                              Enhance Photos
                            </span>
                            <span className="mt-1 rounded bg-white/5 px-1.5 py-0.5 text-[8px] font-medium text-slate-500">
                              Pending
                            </span>
                          </div>
                        </div>

                        {/* Step 3: Optimize Tags */}
                        <div className="relative z-10 flex w-[72px] shrink-0 flex-col items-center text-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a0a14] border border-white/10 text-slate-400">
                            <span className="text-[12px] font-bold">3</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[11px] font-medium text-slate-300">
                              Optimize Tags
                            </span>
                            <span className="mt-1 rounded bg-white/5 px-1.5 py-0.5 text-[8px] font-medium text-slate-500">
                              Pending
                            </span>
                          </div>
                        </div>

                        {/* Step 4: Pricing */}
                        <div className="relative z-10 flex w-[72px] shrink-0 flex-col items-center text-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a0a14] border border-white/10 text-slate-400">
                            <span className="text-[12px] font-bold">4</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[11px] font-medium text-slate-300">
                              Set Pricing
                            </span>
                            <span className="mt-1 rounded bg-white/5 px-1.5 py-0.5 text-[8px] font-medium text-slate-500">
                              Pending
                            </span>
                          </div>
                        </div>

                        {/* Step 5: Publish */}
                        <div className="relative z-10 flex w-[72px] shrink-0 flex-col items-center text-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a0a14] border border-white/10 text-slate-400">
                            <span className="text-[12px] font-bold">5</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[11px] font-medium text-slate-300">
                              Review & Publish
                            </span>
                            <span className="mt-1 rounded bg-white/5 px-1.5 py-0.5 text-[8px] font-medium text-slate-500">
                              Pending
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Activity Timeline */}
                    <div className="flex flex-col gap-3 mb-5">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-1.5 text-[13px] font-bold text-white">
                          <Sparkles className="h-4 w-4 text-purple-400" />{" "}
                          Recent AI Activity
                        </h4>
                        <button className="text-[11px] font-medium text-slate-400 hover:text-white transition">
                          View all
                        </button>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-3 bg-[#0d152a]/40 rounded-xl px-3 py-2 border border-white/5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="text-[11px] text-slate-400 shrink-0">
                            10:31 AM
                          </span>
                          <span className="text-[12px] text-slate-200 flex-1 truncate">
                            Description improved successfully
                          </span>
                          <span className="text-[11px] font-semibold text-purple-400">
                            +12% Quality
                          </span>
                        </div>
                        <div className="flex items-center gap-3 bg-[#0d152a]/40 rounded-xl px-3 py-2 border border-white/5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="text-[11px] text-slate-400 shrink-0">
                            10:28 AM
                          </span>
                          <span className="text-[12px] text-slate-200 flex-1 truncate">
                            Title optimized
                          </span>
                          <span className="text-[11px] font-semibold text-purple-400">
                            +5% Quality
                          </span>
                        </div>
                        <div className="flex items-center gap-3 bg-[#0d152a]/40 rounded-xl px-3 py-2 border border-white/5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="text-[11px] text-slate-400 shrink-0">
                            10:25 AM
                          </span>
                          <span className="text-[12px] text-slate-200 flex-1 truncate">
                            SEO keywords generated
                          </span>
                          <span className="text-[11px] font-semibold text-purple-400">
                            +8% Quality
                          </span>
                        </div>
                        <div className="flex items-center gap-3 bg-[#0d152a]/40 rounded-xl px-3 py-2 border border-white/5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="text-[11px] text-slate-400 shrink-0">
                            10:20 AM
                          </span>
                          <span className="text-[12px] text-slate-200 flex-1 truncate">
                            Amenities suggestions added
                          </span>
                          <span className="text-[11px] font-semibold text-purple-400">
                            +6% Quality
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <span className="text-[12px] font-bold text-white shrink-0 mr-1 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />{" "}
                        Quick Actions
                      </span>
                      <button
                        onClick={() => handleQuickAction("Improve Title")}
                        className="flex items-center gap-1.5 shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-200 transition hover:bg-white/10 hover:border-white/20"
                      >
                        <FileText className="h-3 w-3 text-slate-400" /> Improve
                        Title
                      </button>
                      <button
                        onClick={() => handleQuickAction("Enhance Photos")}
                        className="flex items-center gap-1.5 shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-200 transition hover:bg-white/10 hover:border-white/20"
                      >
                        <ImageIcon className="h-3 w-3 text-slate-400" /> Enhance
                        Photos
                      </button>
                      <button
                        onClick={() => handleQuickAction("Optimize Tags")}
                        className="flex items-center gap-1.5 shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-200 transition hover:bg-white/10 hover:border-white/20"
                      >
                        <TrendingUp className="h-3 w-3 text-slate-400" />{" "}
                        Optimize Tags
                      </button>
                      <button
                        onClick={() => handleQuickAction("Suggest Amenities")}
                        className="flex items-center gap-1.5 shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-200 transition hover:bg-white/10 hover:border-white/20"
                      >
                        <Sparkles className="h-3 w-3 text-slate-400" /> Suggest
                        Amenities
                      </button>
                    </div>
                  </div>

                  {/* Pinned Input (Triggers Panel) */}
                  <div
                    className="border-t border-white/10 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-3 cursor-text"
                    onClick={() => setIsConversationPanelOpen(true)}
                  >
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 p-2 transition hover:border-blue-300/50">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-blue-100 transition hover:bg-white/10">
                        <Paperclip className="h-4 w-4" />
                      </div>
                      <div className="flex-1 text-sm text-blue-100/55 px-2">
                        Ask AI to improve your listing...
                        <br />
                        <span className="text-[10px]">Press Enter to send</span>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-purple-300 transition hover:bg-white/10">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-white shadow-lg shadow-violet-950/30">
                        <Send className="h-5 w-5" />
                      </div>
                    </div>
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
