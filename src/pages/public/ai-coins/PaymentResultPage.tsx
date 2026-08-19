import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAiCoinsModal } from '@/context/AiCoinsModalContext';

export function PaymentResultPage() {
  const navigate = useNavigate();
  const { openAiCoinsModal } = useAiCoinsModal();
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    // Preserve MoMo / Payment Gateway return query parameters so AiCoinsModal can parse them
    if (window.location.search) {
      sessionStorage.setItem("aiCoinMomoReturnQuery", window.location.search);
    }

    openAiCoinsModal();

    let originPath = '/ai-coins';
    const saved = sessionStorage.getItem("aiCoinMomoPaymentSession");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.originPath && parsed.originPath.startsWith("/") && !parsed.originPath.startsWith("//")) {
          originPath = parsed.originPath;
        }
      } catch (e) {
        // ignore parsing errors
      }
    }

    // Only navigate if we aren't already on the exact origin path
    const currentFullPath = window.location.pathname + window.location.search + window.location.hash;
    if (currentFullPath !== originPath) {
      navigate(originPath, { replace: true });
    }
  }, [navigate, openAiCoinsModal]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--ai-coins-surface)' }} />
  );
}
