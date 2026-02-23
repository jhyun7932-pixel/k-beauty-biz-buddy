import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface StatusBannerProps {
  status: 'draft' | 'confirm' | 'complete';
  message?: string;
}

export function StatusBanner({ status, message }: StatusBannerProps) {
  const statusConfig = {
    draft: {
      className: 'status-banner-draft',
      badge: '초안',
      defaultMessage: '초안입니다. 최종 제출 전 확인이 필요합니다.',
    },
    confirm: {
      className: 'status-banner-confirm',
      badge: '확인 필요',
      defaultMessage: '확인이 필요한 항목이 있습니다.',
    },
    complete: {
      className: 'bg-success/10 text-success border border-success/20',
      badge: '완성',
      defaultMessage: '완성! 지금 바로 바이어에게 보낼 수 있어요.',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`status-banner ${config.className}`}>
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span className="badge-draft">{config.badge}</span>
      <span className="text-sm">{message || config.defaultMessage}</span>
    </div>
  );
}
