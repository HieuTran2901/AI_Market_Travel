import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X,
  ShieldCheck,
  Zap,
  Gift,
  Tag,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Landmark,
  Loader2,
  Apple,
  ExternalLink,
  RefreshCw,
  Headset,
  Wallet,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthenticationGate } from "@/context/AuthenticationGateContext";
import { cn } from "@/lib/utils";
import coinGoldImage from "@/assets/images/coin-gold.png";
import failedImage from "@/assets/images/failed.png";
import {
  starterPackImage,
  explorerPackImage,
  travelerPackImage,
  adventurePackImage,
  proPackImage,
} from "@/pages/public/ai-coins/coinPackageAssets";
import { PaymentMethod } from "@/types/payment";
import {
  paymentService,
  AiCoinPaymentStatusResponse,
} from "@/services/paymentService";

export interface AiCoinPackage {
  id: string;
  packageCode: string;
  coinAmount: number;
  bonusCoins: number;
  price: number;
  discountPercentage?: number;
  bestValue?: boolean;
  imageUrl?: string;
}

const mockPackages: AiCoinPackage[] = [
  {
    id: "pack_1",
    packageCode: "STARTER",
    coinAmount: 200,
    bonusCoins: 20,
    price: 29000,
    imageUrl: starterPackImage,
  },
  {
    id: "pack_2",
    packageCode: "EXPLORER",
    coinAmount: 500,
    bonusCoins: 75,
    price: 59000,
    discountPercentage: 15,
    imageUrl: explorerPackImage,
  },
  {
    id: "pack_3",
    packageCode: "TRAVELER",
    coinAmount: 1000,
    bonusCoins: 200,
    price: 99000,
    imageUrl: travelerPackImage,
  },
  {
    id: "pack_4",
    packageCode: "ADVENTURE",
    coinAmount: 2500,
    bonusCoins: 500,
    price: 249000,
    bestValue: true,
    imageUrl: adventurePackImage,
  },
  {
    id: "pack_5",
    packageCode: "PRO",
    coinAmount: 5000,
    bonusCoins: 1250,
    price: 449000,
    discountPercentage: 25,
    imageUrl: proPackImage,
  },
];

interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    value: PaymentMethod.VNPAY,
    label: "VNPay",
    description: "Pay through your banking app",
    icon: <Landmark className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
  },
  {
    value: PaymentMethod.MOMO,
    label: "MoMo",
    description: "Fast payment with MoMo",
    icon: (
      <div className="w-6 h-6 rounded bg-[#A50064] flex items-center justify-center font-bold text-white text-[10px]">
        MoMo
      </div>
    ),
  },
  {
    value: PaymentMethod.ZALOPAY,
    label: "ZaloPay",
    description: "Pay securely with ZaloPay",
    icon: (
      <div className="w-6 h-6 rounded bg-[#0052CC] flex items-center justify-center font-bold text-white text-[10px]">
        Zalo
      </div>
    ),
    disabled: true,
  },
  {
    value: PaymentMethod.STRIPE,
    label: "Visa / Mastercard",
    description: "International cards",
    icon: (
      <CreditCard className="w-6 h-6 text-orange-600 dark:text-orange-400" />
    ),
  },
  {
    value: PaymentMethod.MOCK,
    label: "Apple Pay",
    description: "Pay with Apple Pay",
    icon: <Apple className="w-6 h-6" />,
  },
  {
    value: PaymentMethod.COD,
    label: "Bank Transfer",
    description: "Transfer from your bank",
    icon: <Landmark className="w-6 h-6 text-slate-600 dark:text-slate-400" />,
  },
];

type AiCoinPurchaseStep =
  | "package-selection"
  | "payment"
  | "momo-pending"
  | "checking-payment"
  | "payment-success"
  | "payment-cancelled"
  | "payment-failed";

interface MomoPaymentSession {
  paymentId: number;
  purchaseId: number;
  paymentUrl: string | null;
  deeplink: string | null;
  qrCodeUrl: string | null;
  amount: number;
  currency: string;
  status: string;
}

interface AiCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

const formatVnd = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const AiCoinsModal: React.FC<AiCoinsModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
}) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const abortControllerRef = useRef<AbortController | null>(null);
  const { refreshUser } = useAuth();
  const { isOpen: isAuthModalOpen } = useAuthenticationGate();

  const [purchaseStep, setPurchaseStep] =
    useState<AiCoinPurchaseStep>("package-selection");
  const [direction, setDirection] = useState<number>(0);

  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>(PaymentMethod.VNPAY);
  const [promoCode, setPromoCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [momoSession, setMomoSession] = useState<MomoPaymentSession | null>(
    null,
  );
  const [paymentResult, setPaymentResult] =
    useState<AiCoinPaymentStatusResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedPack = mockPackages.find((p) => p.id === selectedPackId);

  // Restore session from redirect
  useEffect(() => {
    if (isOpen) {
      const saved = sessionStorage.getItem("aiCoinMomoPaymentSession");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.modalStep === "momo-pending" && parsed.paymentId) {
            setSelectedPackId(parsed.selectedPackageId);
            const sessionData = {
              paymentId: parsed.paymentId,
              purchaseId: parsed.purchaseId,
              paymentUrl: null,
              deeplink: null,
              qrCodeUrl: null,
              amount: parsed.amount,
              currency: parsed.currency || "VND",
              status: parsed.status || "PENDING",
            };
            setMomoSession(sessionData);

            // Read MoMo return params
            const params = new URLSearchParams(window.location.search);
            const momoResultCode = params.get("resultCode");
            const momoMessage = params.get("message") ?? "";

            if (momoResultCode) {
              // Clean up URL
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname,
              );

              const isCancelledReturn =
                momoResultCode === "1006" ||
                momoResultCode === "1005" ||
                /cancel|reject|decline/i.test(momoMessage);

              const isFailedReturn =
                !isCancelledReturn && momoResultCode !== "0";

              if (isCancelledReturn || isFailedReturn) {
                setPurchaseStep(
                  isCancelledReturn ? "payment-cancelled" : "payment-failed",
                );
                setDirection(1);

                setPaymentResult({
                  paymentId: parsed.paymentId,
                  purchaseId: parsed.purchaseId,
                  status: isCancelledReturn ? "CANCELLED" : "FAILED",
                  purchaseStatus: isCancelledReturn ? "CANCELLED" : "FAILED",
                  credited: false,
                  amount: parsed.amount,
                  currency: parsed.currency || "VND",
                  gatewayResultCode: parseInt(momoResultCode, 10),
                  baseCoins: 0,
                  bonusCoins: 0,
                  totalCoins: 0,
                  updatedAt: new Date().toISOString(),
                });

                paymentService
                  .processMoMoReturn({
                    paymentId: parsed.paymentId,
                    orderId: params.get("orderId") || undefined,
                    requestId: params.get("requestId") || undefined,
                    resultCode: parseInt(momoResultCode, 10),
                    message: momoMessage,
                    transId: params.get("transId")
                      ? parseInt(params.get("transId")!, 10)
                      : undefined,
                    amount: params.get("amount")
                      ? parseInt(params.get("amount")!, 10)
                      : undefined,
                    extraData: params.get("extraData") || undefined,
                  })
                  .catch((e) =>
                    console.error("Failed to reconcile MoMo return", e),
                  );

                return;
              } else {
                setPurchaseStep("checking-payment");
                setDirection(1);
                return;
              }
            }

            setPurchaseStep("momo-pending");
            setDirection(1);
          }
        } catch (e) {
          console.error("Failed to parse aiCoinMomoPaymentSession", e);
        }
      }
    }
  }, [isOpen]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Poll payment status while on momo-pending step
  useEffect(() => {
    if (
      purchaseStep !== "momo-pending" &&
      purchaseStep !== "checking-payment"
    ) {
      return;
    }

    if (!momoSession?.paymentId) {
      return;
    }

    let isChecking = false;
    const controller = new AbortController();

    const checkPaymentStatus = async () => {
      if (isChecking) {
        return;
      }

      isChecking = true;

      try {
        const res = await paymentService.getAiCoinPaymentStatus(
          momoSession.paymentId,
          controller.signal,
        );
        const status = res.data;

        if (status.status === "SUCCESS" && status.credited) {
          setPaymentResult(status);
          setDirection(1);
          setPurchaseStep("payment-success");
          refreshUser?.();
          sessionStorage.removeItem("aiCoinMomoPaymentSession");
        } else if (status.status === "CANCELLED") {
          setPaymentResult(status);
          setDirection(1);
          setPurchaseStep("payment-cancelled");
          sessionStorage.removeItem("aiCoinMomoPaymentSession");
        } else if (status.status === "FAILED" || status.status === "EXPIRED") {
          setPaymentResult(status);
          setDirection(1);
          setPurchaseStep("payment-failed");
          sessionStorage.removeItem("aiCoinMomoPaymentSession");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Unable to check MoMo payment status", error);
        }
      } finally {
        isChecking = false;
      }
    };

    void checkPaymentStatus();

    const intervalId = window.setInterval(() => {
      void checkPaymentStatus();
    }, 2500);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [purchaseStep, momoSession?.paymentId, refreshUser]);

  // Listen for MoMo popup results
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;

      if (data?.type === "AI_COIN_MOMO_RESULT" && momoSession?.paymentId) {
        // Always confirm with backend before deciding
        try {
          const res = await paymentService.getAiCoinPaymentStatus(
            momoSession.paymentId,
          );
          if (res.data.status === "SUCCESS" && res.data.credited) {
            setPaymentResult(res.data);
            setDirection(1);
            setPurchaseStep("payment-success");
            refreshUser?.();
            sessionStorage.removeItem("aiCoinMomoPaymentSession");
          } else {
            setPaymentResult(res.data);
            setDirection(1);
            setPurchaseStep("payment-failed");
            sessionStorage.removeItem("aiCoinMomoPaymentSession");
          }
        } catch (e) {
          setDirection(1);
          setPurchaseStep("payment-failed");
          sessionStorage.removeItem("aiCoinMomoPaymentSession");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [momoSession?.paymentId, refreshUser]);

  const handleClose = () => {
    abortControllerRef.current?.abort();
    sessionStorage.removeItem("aiCoinMomoPaymentSession");
    setPurchaseStep("package-selection");
    setPaymentError(null);
    setMomoSession(null);
    setPaymentResult(null);
    setStatusMessage(null);
    setDirection(0);
    onClose();
  };

  const handleBuyMoreEntry = () => {
    handleClose();
    navigate("/ai-coins");
  };

  const handleContinueToPayment = () => {
    if (!selectedPack) return;
    setDirection(1);
    setPurchaseStep("payment");
    setPaymentError(null);
  };

  const handleBackToPackages = () => {
    setDirection(-1);
    setPurchaseStep("package-selection");
    setPaymentError(null);
  };

  const handleManualStatusCheck = useCallback(async () => {
    if (!momoSession?.paymentId) return;
    setStatusMessage(null);
    try {
      const res = await paymentService.getAiCoinPaymentStatus(
        momoSession.paymentId,
      );
      if (res.data.status === "SUCCESS" && res.data.credited) {
        setPaymentResult(res.data);
        setDirection(1);
        setPurchaseStep("payment-success");
        refreshUser?.();
        sessionStorage.removeItem("aiCoinMomoPaymentSession");
      } else {
        setStatusMessage(
          "Your payment has not been confirmed yet. Please wait a moment.",
        );
      }
    } catch {
      setStatusMessage("Unable to check payment status. Please try again.");
    }
  }, [momoSession?.paymentId, refreshUser]);

  const handleRetryPayment = () => {
    sessionStorage.removeItem("aiCoinMomoPaymentSession");
    setMomoSession(null);
    setPaymentResult(null);
    setPaymentError(null);
    setStatusMessage(null);
    setDirection(-1);
    setPurchaseStep("payment");
  };

  const handleSubmitPayment = async () => {
    if (!selectedPack || !selectedPaymentMethod || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setPaymentError(null);

      const response = await paymentService.purchaseAiCoins({
        packageId: selectedPack.id,
        packageCode: selectedPack.packageCode,
        coinAmount: selectedPack.coinAmount,
        bonusCoins: selectedPack.bonusCoins,
        amount: selectedPack.price,
        paymentMethod: selectedPaymentMethod,
        promoCode: promoCode || null,
        purpose: "AI_COIN_PURCHASE",
      });

      const data = response.data;

      const sessionData = {
        paymentId: data.paymentId,
        purchaseId: data.purchaseId,
        amount: data.amount,
        currency: data.currency || "VND",
        status: data.status || "PENDING",
        selectedPackageId: selectedPack.id,
        modalStep: "momo-pending",
      };

      if (data.paymentUrl) {
        sessionStorage.setItem(
          "aiCoinMomoPaymentSession",
          JSON.stringify(sessionData),
        );
        window.location.assign(data.paymentUrl);
      } else {
        // Fallback if no paymentUrl is returned (only QR)
        setMomoSession({
          ...sessionData,
          paymentUrl: data.paymentUrl || null,
          deeplink: data.deeplink || null,
          qrCodeUrl: data.qrCodeUrl || null,
        });
        setDirection(1);
        setPurchaseStep("momo-pending");
      }
    } catch (err: any) {
      setPaymentError(
        err?.response?.data?.message ||
          err.message ||
          "Unable to create the payment. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.25,
        ease: [0.22, 1, 0.36, 1] as const,
        staggerChildren: 0.04,
      },
    },
    exit: {
      opacity: 0,
      y: 10,
      scale: 0.98,
      transition: { duration: 0.15 },
    },
  };

  const stepVariants = {
    enter: (direction: number) => ({
      opacity: 0,
      x: shouldReduceMotion ? 0 : direction > 0 ? 32 : -32,
      scale: shouldReduceMotion ? 1 : 0.99,
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: shouldReduceMotion ? 0 : direction > 0 ? -32 : 32,
      scale: shouldReduceMotion ? 1 : 0.99,
    }),
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 lg:p-8"
          role="dialog"
          aria-modal="true"
          aria-hidden={isAuthModalOpen}
          aria-labelledby="ai-coins-modal-title"
          style={{ pointerEvents: isAuthModalOpen ? "none" : "auto" }}
        >
          {/* Backdrop */}
          <motion.div
            variants={shouldReduceMotion ? undefined : backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            variants={shouldReduceMotion ? undefined : modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-[1100px] max-h-[calc(100vh-40px)] rounded-[28px] flex flex-col overflow-hidden"
            style={{
              background: "var(--ai-coins-surface)",
              color: "var(--ai-coins-text-primary)",
              border: "1px solid var(--ai-coins-border-strong)",
              boxShadow: "var(--ai-coins-shadow)",
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 z-[100] w-8 h-8 flex items-center justify-center rounded-full bg-slate-500/10 hover:bg-slate-500/20 text-[var(--ai-coins-text-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Close AI Coins dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <motion.div
              layout
              className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
            >
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={purchaseStep}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    duration: 0.24,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="w-full h-full p-6 md:p-8 overflow-y-auto overscroll-contain ai-coins-result-body"
                >
                  {purchaseStep === "package-selection" && (
                    <AiCoinPackageSelectionStep
                      currentBalance={currentBalance}
                      mockPackages={mockPackages}
                      selectedPackId={selectedPackId}
                      setSelectedPackId={setSelectedPackId}
                      onBuyMoreEntry={handleBuyMoreEntry}
                      onContinueToPayment={handleContinueToPayment}
                    />
                  )}
                  {purchaseStep === "payment" && (
                    <AiCoinPaymentStep
                      selectedPack={selectedPack}
                      onBack={handleBackToPackages}
                      selectedPaymentMethod={selectedPaymentMethod}
                      setSelectedPaymentMethod={setSelectedPaymentMethod}
                      promoCode={promoCode}
                      setPromoCode={setPromoCode}
                      isSubmitting={isSubmitting}
                      onSubmit={handleSubmitPayment}
                      paymentError={paymentError}
                    />
                  )}
                  {(purchaseStep === "momo-pending" ||
                    purchaseStep === "checking-payment") &&
                    momoSession && (
                      <MomoPendingStep
                        session={momoSession}
                        statusMessage={statusMessage}
                        onManualCheck={handleManualStatusCheck}
                        onCancel={handleRetryPayment}
                      />
                    )}
                  {purchaseStep === "payment-success" && paymentResult && (
                    <PaymentSuccessStep
                      result={paymentResult}
                      selectedPack={selectedPack!}
                      onClose={handleClose}
                    />
                  )}
                  {(purchaseStep === "payment-failed" ||
                    purchaseStep === "payment-cancelled") && (
                    <PaymentFailedStep
                      result={paymentResult}
                      selectedPack={selectedPack!}
                      onRetry={handleRetryPayment}
                      onChooseAnotherMethod={() => {
                        setDirection(-1);
                        setPurchaseStep("payment");
                      }}
                      onBackToPackages={() => {
                        setDirection(-1);
                        setPurchaseStep("package-selection");
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

// -------------------------------------------------------------------------------------------------
// PACKAGE SELECTION STEP
// -------------------------------------------------------------------------------------------------

interface AiCoinPackageSelectionStepProps {
  currentBalance: number;
  mockPackages: AiCoinPackage[];
  selectedPackId: string | null;
  setSelectedPackId: (id: string) => void;
  onBuyMoreEntry: () => void;
  onContinueToPayment: () => void;
}

const AiCoinPackageSelectionStep: React.FC<AiCoinPackageSelectionStepProps> = ({
  currentBalance,
  mockPackages,
  selectedPackId,
  setSelectedPackId,
  onBuyMoreEntry,
  onContinueToPayment,
}) => {
  const selectedPack = mockPackages.find((p) => p.id === selectedPackId);

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-10">
        <div className="flex items-center gap-5 md:gap-6 flex-1">
          <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-300/10 shadow-inner flex items-center justify-center p-2 border border-amber-500/30">
            <img
              src={coinGoldImage}
              alt="AI Coin Emblem"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>
          <div>
            <h2
              id="ai-coins-modal-title"
              className="text-2xl md:text-3xl font-black tracking-tight"
              style={{ color: "var(--ai-coins-text-primary)" }}
            >
              AI Coins
            </h2>
            <p
              className="text-sm md:text-base font-medium mt-1 max-w-[320px] leading-snug"
              style={{ color: "var(--ai-coins-text-secondary)" }}
            >
              Use AI Coins to pay for services across the AI Marketplace.
            </p>
          </div>
        </div>

        <div
          className="hidden md:block w-px h-16 shrink-0"
          style={{ background: "var(--ai-coins-divider)" }}
        ></div>

        <div className="flex items-center gap-6 w-full md:w-auto shrink-0 p-4 md:p-0 rounded-2xl md:rounded-none bg-[var(--ai-coins-surface-secondary)] md:bg-transparent">
          <div>
            <span
              className="block text-xs font-bold uppercase tracking-wider mb-1"
              style={{ color: "var(--ai-coins-text-secondary)" }}
            >
              Current balance
            </span>
            <div className="flex items-center gap-2">
              <img
                src={coinGoldImage}
                alt=""
                className="w-5 h-5 object-contain"
              />
              <span
                className="text-2xl md:text-3xl font-black tabular-nums tracking-tight"
                style={{ color: "var(--ai-coins-text-primary)" }}
              >
                {currentBalance.toLocaleString("en-US")}
              </span>
              <span className="text-sm font-bold text-amber-500 mt-1.5">
                AI Coins
              </span>
            </div>
          </div>

          <button
            onClick={onBuyMoreEntry}
            className="ml-auto md:ml-4 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-black rounded-xl shadow-[0_8px_20px_rgba(79,70,229,0.25)] hover:shadow-[0_12px_24px_rgba(79,70,229,0.35)] transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Buy More AI Coins
          </button>
        </div>
      </div>

      {/* Package Selection Panel */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3
            className="text-lg font-black flex items-center gap-2"
            style={{ color: "var(--ai-coins-text-primary)" }}
          >
            Choose an AI Coins package
          </h3>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-black shadow-sm">
            <Tag className="w-3.5 h-3.5" />
            Save up to 25%
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {mockPackages.map((pack) => {
            const isSelected = selectedPackId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => setSelectedPackId(pack.id)}
                className={cn(
                  "relative group flex flex-col items-center rounded-2xl p-4 pt-8 md:pt-10 transition-all duration-200 text-center w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                  isSelected
                    ? "border-2 border-purple-500 shadow-[0_0_0_1px_rgba(147,77,255,0.3),0_16px_40px_rgba(119,67,255,0.18)] bg-purple-500/5 -translate-y-1"
                    : "border border-[var(--ai-coins-border)] hover:border-[var(--ai-coins-border-strong)] hover:shadow-lg hover:-translate-y-0.5",
                )}
                style={{
                  background: isSelected
                    ? "var(--ai-coins-surface-secondary)"
                    : "var(--ai-coins-surface-muted)",
                }}
                role="radio"
                aria-checked={isSelected}
              >
                {pack.bestValue && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap z-10">
                    <ShieldCheck className="w-3 h-3" /> BEST VALUE
                  </div>
                )}
                {!pack.bestValue && pack.discountPercentage && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md whitespace-nowrap z-10">
                    Save {pack.discountPercentage}%
                  </div>
                )}
                <div className="h-24 w-24 mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  {pack.imageUrl ? (
                    <img
                      src={pack.imageUrl}
                      alt=""
                      className="max-w-full max-h-full object-contain drop-shadow-md"
                      draggable={false}
                    />
                  ) : (
                    <img
                      src={coinGoldImage}
                      alt=""
                      className="w-16 h-16 object-contain drop-shadow-md"
                      draggable={false}
                    />
                  )}
                </div>
                <div
                  className="text-2xl md:text-3xl font-black tabular-nums leading-none"
                  style={{ color: "var(--ai-coins-text-primary)" }}
                >
                  {pack.coinAmount.toLocaleString("en-US")}
                </div>
                <div
                  className="text-xs font-bold mt-1 mb-3"
                  style={{ color: "var(--ai-coins-text-secondary)" }}
                >
                  AI Coins
                </div>
                <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-black px-2.5 py-1 rounded-md mb-4 inline-block">
                  +{pack.bonusCoins.toLocaleString("en-US")} Bonus
                </div>
                <div
                  className="w-full h-px mb-4 mt-auto"
                  style={{ background: "var(--ai-coins-divider)" }}
                ></div>
                <div
                  className="text-base md:text-lg font-black"
                  style={{ color: "var(--ai-coins-text-primary)" }}
                >
                  {formatVnd(pack.price)}
                </div>
                {isSelected && (
                  <div className="absolute top-3 right-3 text-purple-500 flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded-md">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase">
                      Selected
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Purchase Summary Section */}
      <div
        className="mb-8 p-6 rounded-[24px] border border-[var(--ai-coins-border-strong)]"
        style={{ background: "var(--ai-coins-summary-bg)" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_auto] gap-6 items-center">
          <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-[var(--ai-coins-divider)] pb-4 md:pb-0 pr-0 md:pr-4">
            {selectedPack ? (
              <>
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <img
                    src={selectedPack.imageUrl || coinGoldImage}
                    className="w-10 h-10 object-contain"
                    alt=""
                  />
                </div>
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-wider mb-0.5"
                    style={{ color: "var(--ai-coins-text-secondary)" }}
                  >
                    Selected package
                  </p>
                  <p
                    className="text-base font-black tabular-nums leading-tight"
                    style={{ color: "var(--ai-coins-text-primary)" }}
                  >
                    {selectedPack.coinAmount.toLocaleString("en-US")} AI Coins
                  </p>
                  <p className="text-xs font-black text-purple-500 mt-0.5">
                    +{selectedPack.bonusCoins.toLocaleString("en-US")} Bonus
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4 opacity-50">
                <div className="w-14 h-14 bg-slate-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <img
                    src={coinGoldImage}
                    className="w-8 h-8 object-contain grayscale opacity-50"
                    alt=""
                  />
                </div>
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-wider mb-0.5"
                    style={{ color: "var(--ai-coins-text-secondary)" }}
                  >
                    Choose package
                  </p>
                  <p
                    className="text-sm font-bold"
                    style={{ color: "var(--ai-coins-text-primary)" }}
                  >
                    No package selected
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="border-b md:border-b-0 md:border-r border-[var(--ai-coins-divider)] pb-4 md:pb-0 pr-0 md:pr-4">
            <p
              className="text-xs font-bold uppercase tracking-wider mb-1"
              style={{ color: "var(--ai-coins-text-secondary)" }}
            >
              Total received
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums leading-none">
                {selectedPack
                  ? (
                      selectedPack.coinAmount + selectedPack.bonusCoins
                    ).toLocaleString("en-US")
                  : "0"}
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: "var(--ai-coins-text-primary)" }}
              >
                AI Coins
              </span>
            </div>
            {selectedPack && (
              <p
                className="text-xs font-medium mt-1"
                style={{ color: "var(--ai-coins-text-secondary)" }}
              >
                ({selectedPack.coinAmount.toLocaleString("en-US")} +{" "}
                {selectedPack.bonusCoins.toLocaleString("en-US")} Bonus)
              </p>
            )}
          </div>
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-1"
              style={{ color: "var(--ai-coins-text-secondary)" }}
            >
              Total payment
            </p>
            <p className="text-2xl md:text-3xl font-black text-purple-600 dark:text-purple-400 tabular-nums leading-none">
              {selectedPack ? formatVnd(selectedPack.price) : "0 ₫"}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onContinueToPayment}
              disabled={!selectedPack}
              className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-500 disabled:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-black rounded-xl shadow-[0_8px_20px_rgba(147,77,255,0.25)] transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              Continue to payment
              <ArrowRight className="w-5 h-5" />
            </button>
            <div
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--ai-coins-text-secondary)" }}
            >
              <Lock className="w-3 h-3" />
              Secure payment
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--ai-coins-divider)] pt-6 md:pt-8 mt-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 lg:gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4
                className="text-sm font-black"
                style={{ color: "var(--ai-coins-text-primary)" }}
              >
                Safe payment
              </h4>
              <p
                className="text-[13px] font-medium mt-1 leading-relaxed"
                style={{ color: "var(--ai-coins-text-secondary)" }}
              >
                Your transaction is fully protected.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4
                className="text-sm font-black"
                style={{ color: "var(--ai-coins-text-primary)" }}
              >
                Instant delivery
              </h4>
              <p
                className="text-[13px] font-medium mt-1 leading-relaxed"
                style={{ color: "var(--ai-coins-text-secondary)" }}
              >
                AI Coins are added to your account immediately.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h4
                className="text-sm font-black"
                style={{ color: "var(--ai-coins-text-primary)" }}
              >
                Easy to use
              </h4>
              <p
                className="text-[13px] font-medium mt-1 leading-relaxed"
                style={{ color: "var(--ai-coins-text-secondary)" }}
              >
                Use them across eligible services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------------------------------
// PAYMENT STEP
// -------------------------------------------------------------------------------------------------

interface AiCoinPaymentStepProps {
  selectedPack?: AiCoinPackage;
  onBack: () => void;
  selectedPaymentMethod: PaymentMethod;
  setSelectedPaymentMethod: (method: PaymentMethod) => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  paymentError: string | null;
}

const AiCoinPaymentStep: React.FC<AiCoinPaymentStepProps> = ({
  selectedPack,
  onBack,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  promoCode,
  setPromoCode,
  isSubmitting,
  onSubmit,
  paymentError,
}) => {
  if (!selectedPack) return null;

  const totalReceived = selectedPack.coinAmount + selectedPack.bonusCoins;
  const totalPayment = selectedPack.price;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-[var(--ai-coins-divider)]">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-[var(--ai-coins-border)] hover:bg-[var(--ai-coins-surface-muted)] transition-colors disabled:opacity-50"
          aria-label="Back to package selection"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--ai-coins-text-primary)]" />
        </button>
        <div>
          <h2
            className="text-xl md:text-2xl font-black"
            style={{ color: "var(--ai-coins-text-primary)" }}
          >
            AI Coins Payment
          </h2>
          <div
            className="flex items-center gap-1.5 mt-1 text-[13px] font-medium"
            style={{ color: "var(--ai-coins-text-secondary)" }}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Your transaction is encrypted and fully protected.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-8 lg:gap-12">
        {/* Left Column: Summary */}
        <div className="flex flex-col gap-6 lg:border-r border-[var(--ai-coins-divider)] lg:pr-10">
          {/* Package Card Copy */}
          <div className="relative flex flex-col items-center rounded-[24px] p-6 pt-10 border-2 border-purple-500 shadow-[0_16px_40px_rgba(119,67,255,0.12)] bg-[var(--ai-coins-surface-secondary)] text-center">
            {selectedPack.bestValue && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap z-10">
                <ShieldCheck className="w-3 h-3" /> BEST VALUE
              </div>
            )}
            <div className="h-28 w-28 mb-4 flex items-center justify-center">
              <img
                src={selectedPack.imageUrl || coinGoldImage}
                alt=""
                className="max-w-full max-h-full object-contain drop-shadow-md"
                draggable={false}
              />
            </div>
            <div
              className="text-3xl font-black tabular-nums leading-none"
              style={{ color: "var(--ai-coins-text-primary)" }}
            >
              {selectedPack.coinAmount.toLocaleString("en-US")}{" "}
              <span
                className="text-base font-bold"
                style={{ color: "var(--ai-coins-text-secondary)" }}
              >
                AI Coins
              </span>
            </div>
            <div className="flex items-center gap-1 mt-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-black px-3 py-1.5 rounded-lg">
              <Gift className="w-4 h-4" />+
              {selectedPack.bonusCoins.toLocaleString("en-US")} Bonus Coins
            </div>
            <div
              className="w-full h-px mb-4 mt-6"
              style={{ background: "var(--ai-coins-divider)" }}
            ></div>
            <div
              className="text-xl font-black"
              style={{ color: "var(--ai-coins-text-primary)" }}
            >
              {formatVnd(selectedPack.price)}
            </div>
          </div>

          {/* Received Summary */}
          <div className="rounded-2xl p-5 border border-[var(--ai-coins-border-strong)] bg-[var(--ai-coins-surface-muted)]">
            <h4
              className="text-sm font-bold uppercase tracking-wider mb-4"
              style={{ color: "var(--ai-coins-text-primary)" }}
            >
              You will receive
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-2 text-[14px] font-medium"
                  style={{ color: "var(--ai-coins-text-secondary)" }}
                >
                  <img
                    src={coinGoldImage}
                    className="w-4 h-4 object-contain"
                    alt=""
                  />
                  AI Coins
                </div>
                <div
                  className="font-bold tabular-nums"
                  style={{ color: "var(--ai-coins-text-primary)" }}
                >
                  {selectedPack.coinAmount.toLocaleString("en-US")}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-2 text-[14px] font-medium"
                  style={{ color: "var(--ai-coins-text-secondary)" }}
                >
                  <Gift className="w-4 h-4 text-purple-500" />
                  Bonus Coins
                </div>
                <div
                  className="font-bold tabular-nums"
                  style={{ color: "var(--ai-coins-text-primary)" }}
                >
                  {selectedPack.bonusCoins.toLocaleString("en-US")}
                </div>
              </div>
              <div
                className="w-full h-px my-2"
                style={{ background: "var(--ai-coins-divider)" }}
              ></div>
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                <div className="flex items-center gap-2 text-[15px] font-black">
                  <Zap className="w-4 h-4" />
                  Total
                </div>
                <div className="text-lg font-black tabular-nums">
                  {totalReceived.toLocaleString("en-US")}
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium leading-relaxed flex items-start gap-2">
              <div className="shrink-0 mt-0.5">ℹ️</div>
              <p>
                AI Coins can be used to pay for eligible services across AI
                Marketplace Traveler.
              </p>
            </div>
          </div>

          {/* Support Panel */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--ai-coins-border)]">
            <div className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center text-[var(--ai-coins-text-secondary)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p
                className="text-[13px] font-bold"
                style={{ color: "var(--ai-coins-text-primary)" }}
              >
                Need help?
              </p>
              <p
                className="text-[12px]"
                style={{ color: "var(--ai-coins-text-secondary)" }}
              >
                Contact our 24/7 support team.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Form */}
        <div className="flex flex-col gap-8">
          {/* Payment Methods */}
          <section>
            <h3
              className="text-base font-black mb-4 flex items-center gap-2"
              style={{ color: "var(--ai-coins-text-primary)" }}
            >
              1. Choose a payment method
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  disabled={method.disabled || isSubmitting}
                  onClick={() => setSelectedPaymentMethod(method.value)}
                  className={cn(
                    "relative flex flex-col items-start text-left p-4 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500",
                    selectedPaymentMethod === method.value
                      ? "border-blue-500 bg-blue-500/5 shadow-[0_4px_12px_rgba(59,130,246,0.1)]"
                      : "border-[var(--ai-coins-border)] hover:border-[var(--ai-coins-border-strong)] bg-[var(--ai-coins-surface)]",
                    method.disabled && "opacity-50 cursor-not-allowed",
                  )}
                  role="radio"
                  aria-checked={selectedPaymentMethod === method.value}
                >
                  <div className="mb-3">{method.icon}</div>
                  <div
                    className="font-bold text-[14px] mb-0.5"
                    style={{ color: "var(--ai-coins-text-primary)" }}
                  >
                    {method.label}
                  </div>
                  <div
                    className="text-[11px] font-medium leading-tight"
                    style={{ color: "var(--ai-coins-text-secondary)" }}
                  >
                    {method.description}
                  </div>

                  {selectedPaymentMethod === method.value && (
                    <div className="absolute top-3 right-3 text-blue-500">
                      <CheckCircle2 className="w-5 h-5 fill-blue-100" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Promo Code */}
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <h3
                className="text-base font-black"
                style={{ color: "var(--ai-coins-text-primary)" }}
              >
                2. Promo code{" "}
                <span className="text-[11px] font-medium opacity-60 ml-1">
                  (Optional)
                </span>
              </h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter your promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-[var(--ai-coins-surface-muted)] border border-[var(--ai-coins-border)] rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                style={{ color: "var(--ai-coins-text-primary)" }}
              />
              <button
                type="button"
                disabled={!promoCode || isSubmitting}
                className="px-6 py-3 bg-[var(--ai-coins-surface-muted)] border border-[var(--ai-coins-border-strong)] rounded-xl font-bold text-[14px] transition-colors hover:bg-[var(--ai-coins-border)] disabled:opacity-50"
                style={{ color: "var(--ai-coins-text-primary)" }}
              >
                Apply
              </button>
            </div>
          </section>

          {/* Payment Details */}
          <section className="bg-[var(--ai-coins-surface-secondary)] rounded-[20px] border border-[var(--ai-coins-border)] p-5 md:p-6 mt-auto">
            <h3
              className="text-base font-black mb-4"
              style={{ color: "var(--ai-coins-text-primary)" }}
            >
              3. Payment details
            </h3>

            <div className="space-y-3 text-[14px]">
              <div
                className="flex items-center justify-between"
                style={{ color: "var(--ai-coins-text-secondary)" }}
              >
                <span className="font-bold">Subtotal</span>
                <span className="font-bold text-[var(--ai-coins-text-primary)]">
                  {formatVnd(totalPayment)}
                </span>
              </div>
              <div
                className="flex items-center justify-between"
                style={{ color: "var(--ai-coins-text-secondary)" }}
              >
                <span className="font-bold">Discount</span>
                <span className="font-bold text-emerald-500">- 0 ₫</span>
              </div>
              <div
                className="w-full h-px my-2"
                style={{ background: "var(--ai-coins-divider)" }}
              ></div>
              <div className="flex items-center justify-between">
                <span
                  className="text-base font-black"
                  style={{ color: "var(--ai-coins-text-primary)" }}
                >
                  Total
                </span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                  {formatVnd(totalPayment)}
                </span>
              </div>
            </div>

            {paymentError && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[13px] font-bold">
                {paymentError}
              </div>
            )}

            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="mt-6 w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-500 disabled:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[15px] font-black rounded-[14px] shadow-[0_8px_20px_rgba(79,70,229,0.25)] flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Pay {formatVnd(totalPayment)}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div
              className="mt-4 flex flex-wrap justify-center gap-3 md:gap-4 text-[10px] md:text-[11px] font-medium"
              style={{ color: "var(--ai-coins-text-secondary)" }}
            >
              <span className="flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Secure 256-bit SSL
              </span>
              <span className="w-1 h-1 rounded-full bg-[var(--ai-coins-border-strong)] hidden md:block"></span>
              <span>PCI DSS Compliant</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------------------------------
// MOMO PENDING STEP
// -------------------------------------------------------------------------------------------------

interface MomoPendingStepProps {
  session: MomoPaymentSession;
  statusMessage: string | null;
  onManualCheck: () => void;
  onCancel: () => void;
}

const MomoPendingStep: React.FC<MomoPendingStepProps> = ({
  session,
  statusMessage,
  onManualCheck,
  onCancel,
}) => {
  const isRestored =
    !session.qrCodeUrl && !session.paymentUrl && !session.deeplink;

  return (
    <div className="flex flex-col h-full items-center justify-center py-8">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-[#A50064] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-500/20">
          <span className="text-white font-black text-xl">MoMo</span>
        </div>

        <h2
          className="text-2xl font-black mb-2"
          style={{ color: "var(--ai-coins-text-primary)" }}
        >
          {isRestored ? "Checking payment status" : "Complete your payment"}
        </h2>

        {!isRestored && (
          <p
            className="text-[14px] font-medium mb-8"
            style={{ color: "var(--ai-coins-text-secondary)" }}
          >
            Scan the QR code below or open the MoMo app to confirm the payment
            of{" "}
            <strong className="text-[var(--ai-coins-text-primary)]">
              {formatVnd(session.amount)}
            </strong>
            .
          </p>
        )}

        {session.qrCodeUrl && (
          <div className="bg-white p-4 rounded-2xl mx-auto w-fit mb-6 shadow-md border border-[var(--ai-coins-border)]">
            <img
              src={session.qrCodeUrl}
              alt="MoMo QR Code"
              className="w-48 h-48 object-contain"
            />
          </div>
        )}

        {!isRestored && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {session.deeplink && (
              <a
                href={session.deeplink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-[#A50064] text-white rounded-xl font-bold text-[14px] hover:bg-[#8e0056] transition-colors shadow-md w-full sm:w-auto justify-center"
              >
                Open MoMo App <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {session.paymentUrl && (
              <button
                onClick={() => {
                  window.location.assign(session.paymentUrl!);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-[14px] hover:bg-blue-700 transition-colors shadow-md w-full sm:w-auto justify-center"
              >
                Pay via Web <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="bg-[var(--ai-coins-surface-secondary)] border border-[var(--ai-coins-border-strong)] rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 overflow-hidden">
            <motion.div
              className="h-full bg-white/50 w-1/3"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </div>

          <div className="flex items-center justify-center gap-3 mb-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span
              className="font-bold text-[15px]"
              style={{ color: "var(--ai-coins-text-primary)" }}
            >
              {isRestored
                ? "Verifying transaction with MoMo..."
                : "Waiting for payment confirmation..."}
            </span>
          </div>
          <p
            className="text-[13px] font-medium text-center"
            style={{ color: "var(--ai-coins-text-secondary)" }}
          >
            This screen will update automatically once MoMo processes your
            payment.
          </p>

          {statusMessage && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[13px] font-bold text-center">
              {statusMessage}
            </div>
          )}

          <button
            onClick={onManualCheck}
            className="mt-5 text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Check status manually
          </button>
        </div>

        <button
          onClick={onCancel}
          className="mt-6 text-[14px] font-bold text-[var(--ai-coins-text-secondary)] hover:text-[var(--ai-coins-text-primary)] transition-colors"
        >
          Cancel and try a different method
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------------------------------
// PAYMENT SUCCESS STEP
// -------------------------------------------------------------------------------------------------

interface PaymentSuccessStepProps {
  result: AiCoinPaymentStatusResponse;
  selectedPack: AiCoinPackage;
  onClose: () => void;
}

const PaymentSuccessStep: React.FC<PaymentSuccessStepProps> = ({
  result,
  selectedPack,
  onClose,
}) => {
  return (
    <div className="flex flex-col h-full items-center justify-center py-8 text-center">
      <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            damping: 15,
            stiffness: 200,
            delay: 0.1,
          }}
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <motion.div
          className="absolute inset-0 border-2 border-emerald-500 rounded-full"
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
        />
      </div>

      <h2
        className="text-3xl font-black mb-3"
        style={{ color: "var(--ai-coins-text-primary)" }}
      >
        Payment Successful!
      </h2>
      <p
        className="text-[15px] font-medium mb-8 max-w-sm mx-auto"
        style={{ color: "var(--ai-coins-text-secondary)" }}
      >
        Your transaction was completed successfully. The AI Coins have been
        added to your account.
      </p>

      <div className="bg-[var(--ai-coins-surface-secondary)] border border-[var(--ai-coins-border)] rounded-[24px] p-6 w-full max-w-md mx-auto mb-8 shadow-sm">
        <div className="flex items-center justify-center gap-3 mb-6 pb-6 border-b border-[var(--ai-coins-divider)]">
          <img
            src={selectedPack.imageUrl || coinGoldImage}
            alt=""
            className="w-16 h-16 object-contain"
          />
          <div className="text-left">
            <div
              className="text-3xl font-black tabular-nums leading-none"
              style={{ color: "var(--ai-coins-text-primary)" }}
            >
              {result.totalCoins.toLocaleString("en-US")}
            </div>
            <div className="text-[13px] font-bold text-[var(--ai-coins-text-secondary)] mt-1">
              AI Coins Received
            </div>
          </div>
        </div>

        <div className="space-y-3 text-[14px] text-left">
          <div className="flex justify-between">
            <span
              className="font-medium"
              style={{ color: "var(--ai-coins-text-secondary)" }}
            >
              Base Coins
            </span>
            <span
              className="font-bold tabular-nums"
              style={{ color: "var(--ai-coins-text-primary)" }}
            >
              {result.baseCoins.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between">
            <span
              className="font-medium"
              style={{ color: "var(--ai-coins-text-secondary)" }}
            >
              Bonus Coins
            </span>
            <span className="font-bold tabular-nums text-purple-500">
              +{result.bonusCoins.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between">
            <span
              className="font-medium"
              style={{ color: "var(--ai-coins-text-secondary)" }}
            >
              Amount Paid
            </span>
            <span
              className="font-bold tabular-nums"
              style={{ color: "var(--ai-coins-text-primary)" }}
            >
              {formatVnd(result.amount)}
            </span>
          </div>
          <div className="flex justify-between pt-2 mt-2 border-t border-[var(--ai-coins-divider)]">
            <span
              className="font-medium"
              style={{ color: "var(--ai-coins-text-secondary)" }}
            >
              Transaction ID
            </span>
            <span
              className="font-bold tabular-nums text-[12px] opacity-70"
              style={{ color: "var(--ai-coins-text-primary)" }}
            >
              {result.paymentId}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[15px] font-black rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        Done
      </button>
    </div>
  );
};

// -------------------------------------------------------------------------------------------------
// PAYMENT FAILED STEP
// -------------------------------------------------------------------------------------------------

interface PaymentFailedStepProps {
  result: AiCoinPaymentStatusResponse | null;
  selectedPack: AiCoinPackage;
  onRetry: () => void;
  onChooseAnotherMethod: () => void;
  onBackToPackages: () => void;
}

const PaymentFailedStep: React.FC<PaymentFailedStepProps> = ({
  result,
  selectedPack,
  onRetry,
  onChooseAnotherMethod,
  onBackToPackages,
}) => {
  const isCancelled =
    result?.status === "CANCELLED" || result?.purchaseStatus === "CANCELLED";

  const headingText = isCancelled ? "Payment cancelled" : "Payment failed";
  const subText = isCancelled
    ? "Your MoMo payment was not completed.\nNo AI Coins were added to your account."
    : "Your MoMo payment could not be processed.\nNo AI Coins were added to your account.";

  const formatDate = (isoString?: string) => {
    const d = isoString ? new Date(isoString) : new Date();
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${month} ${day}, ${year} • ${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full items-center justify-center gap-10 lg:gap-16 py-4 w-full max-w-5xl mx-auto">
      {/* Left Column */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
        className="flex-1 flex flex-col items-center lg:items-start lg:text-left w-full max-w-[400px]"
      >
        <motion.div
          initial={{ y: -15, opacity: 0, rotate: -5 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{
            type: "spring",
            damping: 15,
            stiffness: 100,
            duration: 0.3,
          }}
          className="mb-6 w-full flex items-center justify-center lg:justify-start"
        >
          <img
            src={failedImage}
            alt={headingText}
            className="w-full max-w-[240px] md:max-w-[280px] h-auto object-contain mix-blend-multiply dark:mix-blend-normal"
          />
        </motion.div>

        <h2
          className="text-[26px] md:text-[30px] font-black mb-3 text-center lg:text-left"
          style={{ color: "var(--ai-coins-text-primary)" }}
        >
          {headingText}
        </h2>
        <p
          className="text-[14px] md:text-[15px] font-medium mb-8 text-center lg:text-left whitespace-pre-line leading-relaxed"
          style={{ color: "var(--ai-coins-text-secondary)" }}
        >
          {subText}
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 px-6 py-[18px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[15px] font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]"
          >
            <RefreshCw className="w-[18px] h-[18px]" />
            Try again
          </button>

          <button
            onClick={onChooseAnotherMethod}
            className="w-full flex items-center justify-center gap-2 px-6 py-[18px] bg-transparent border border-[var(--ai-coins-border-strong)] hover:border-[var(--ai-coins-text-secondary)] text-[var(--ai-coins-text-primary)] text-[15px] font-bold rounded-xl transition-all"
          >
            <CreditCard className="w-[18px] h-[18px]" />
            Choose another payment method
          </button>

          <button
            onClick={onBackToPackages}
            className="w-full flex items-center justify-center gap-2 mt-4 text-[14px] font-bold text-[var(--ai-coins-text-secondary)] hover:text-[var(--ai-coins-text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to packages
          </button>
        </div>
      </motion.div>

      {/* Right Column */}
      <motion.div
        initial={{ x: 15, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.2 }}
        className="flex-1 w-full max-w-[460px]"
      >
        <div className="bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm text-left">
          <div className="flex items-center justify-between mb-8">
            <h3
              className="text-[16px] font-bold"
              style={{ color: "var(--ai-coins-text-primary)" }}
            >
              Payment details
            </h3>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-[12px] font-bold",
                isCancelled
                  ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
                  : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
              )}
            >
              {isCancelled ? "Cancelled" : "Failed"}
            </span>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <span
                  className="text-[14px] font-medium"
                  style={{ color: "var(--ai-coins-text-secondary)" }}
                >
                  Amount
                </span>
              </div>
              <span
                className="font-bold text-[15px]"
                style={{ color: "var(--ai-coins-text-primary)" }}
              >
                {formatVnd(result?.amount || selectedPack.price)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-sm bg-[#A50064] flex items-center justify-center font-bold text-white text-[6px]">
                    MoMo
                  </div>
                </div>
                <span
                  className="text-[14px] font-medium"
                  style={{ color: "var(--ai-coins-text-secondary)" }}
                >
                  Payment method
                </span>
              </div>
              <span
                className="font-bold text-[15px]"
                style={{ color: "var(--ai-coins-text-primary)" }}
              >
                MoMo Wallet
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <span
                  className="text-[14px] font-medium"
                  style={{ color: "var(--ai-coins-text-secondary)" }}
                >
                  Reference
                </span>
              </div>
              <span
                className="font-bold text-[15px]"
                style={{ color: "var(--ai-coins-text-primary)" }}
              >
                {result?.paymentId ? `#${result.paymentId}` : "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <span
                  className="text-[14px] font-medium"
                  style={{ color: "var(--ai-coins-text-secondary)" }}
                >
                  Date & time
                </span>
              </div>
              <span
                className="font-bold text-[14px]"
                style={{ color: "var(--ai-coins-text-primary)" }}
              >
                {formatDate(result?.updatedAt)}
              </span>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Headset className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4
                  className="text-[14px] font-bold"
                  style={{ color: "var(--ai-coins-text-primary)" }}
                >
                  Need help?
                </h4>
                <p
                  className="text-[12px] font-medium mt-0.5"
                  style={{ color: "var(--ai-coins-text-secondary)" }}
                >
                  Our support team is here for you.
                </p>
              </div>
            </div>
            <button className="flex items-center gap-1 text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
              Contact support <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
