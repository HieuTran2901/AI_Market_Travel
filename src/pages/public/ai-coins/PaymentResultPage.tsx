import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiCoinsModal } from '@/components/payment/AiCoinsModal';

export function PaymentResultPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
    navigate('/ai-coins', { replace: true });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--ai-coins-surface)' }}>
      <AiCoinsModal
        isOpen={isModalOpen}
        onClose={handleClose}
        currentBalance={0}
      />
    </div>
  );
}
