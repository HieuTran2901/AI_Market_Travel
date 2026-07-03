import React from 'react';
import { Badge } from './Badge';

type StatusKind = 'listing' | 'booking' | 'payment' | 'refund' | 'settlement' | 'provider';

interface StatusBadgeProps {
  status: string;
  kind?: StatusKind;
}

const success = new Set(['ACTIVE', 'CONFIRMED', 'SUCCESS', 'COMPLETED', 'APPROVED', 'VERIFIED']);
const warning = new Set(['PENDING', 'PENDING_REVIEW', 'REQUESTED', 'UNDER_REVIEW', 'PROCESSING']);
const danger = new Set(['FAILED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'SUSPENDED']);
const neutral = new Set(['DRAFT', 'INACTIVE', 'ARCHIVED', 'REFUNDED']);

function label(status: string) {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (success.has(status)) return <Badge variant="success">{label(status)}</Badge>;
  if (warning.has(status)) return <Badge variant="warning">{label(status)}</Badge>;
  if (danger.has(status)) return <Badge variant="destructive">{label(status)}</Badge>;
  if (neutral.has(status)) return <Badge variant="secondary">{label(status)}</Badge>;
  return <Badge variant="outline">{label(status)}</Badge>;
};
