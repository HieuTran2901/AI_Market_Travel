import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAiCoinsModal } from '@/context/AiCoinsModalContext';

export function PaymentResultPage() {
  const navigate = useNavigate();
  const { openAiCoinsModal } = useAiCoinsModal();
  const location = useLocation();

  useEffect(() => {
    openAiCoinsModal();
    navigate('/ai-coins' + location.search, { replace: true });
  }, [navigate, openAiCoinsModal, location.search]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--ai-coins-surface)' }} />
  );
}
