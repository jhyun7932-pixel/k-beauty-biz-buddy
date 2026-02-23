import React from 'react';
import { Target, Upload, Package, FileText, AlertTriangle } from 'lucide-react';

type EmptyStateType = 'no_goal' | 'no_upload' | 'no_package' | 'no_documents' | 'no_warnings';

interface EmptyStateCardProps {
  type: EmptyStateType;
  className?: string;
}

const EMPTY_STATES = {
  no_goal: {
    icon: Target,
    title: '아직 목표가 없어요',
    description: '먼저 보낼 나라/채널을 선택해 주세요.\n그 기준으로 패키지가 맞춤 생성돼요.',
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  no_upload: {
    icon: Upload,
    title: '자료를 업로드해 주세요',
    description: '회사소개서와 제품자료를 올려주세요.\nAI가 초안을 만들어드릴게요.',
    iconColor: 'text-accent-mint',
    bgColor: 'bg-accent-mint/10',
  },
  no_package: {
    icon: Package,
    title: '패키지가 준비되지 않았어요',
    description: '목표와 자료가 준비되면,\n바이어에게 보낼 파일 묶음을 만들어드려요.',
    iconColor: 'text-accent-violet',
    bgColor: 'bg-accent-violet/10',
  },
  no_documents: {
    icon: FileText,
    title: '아직 서류가 없어요',
    description: '거래 조건을 말해주시면\nPI/계약서 초안을 만들게요.',
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  no_warnings: {
    icon: AlertTriangle,
    title: '실수 체크 완료!',
    description: '발견된 문제가 없어요.\n안심하고 진행하세요.',
    iconColor: 'text-success',
    bgColor: 'bg-success/10',
  },
};

export function EmptyStateCard({ type, className = '' }: EmptyStateCardProps) {
  const state = EMPTY_STATES[type];
  const Icon = state.icon;

  return (
    <div className={`flex flex-col items-center justify-center h-full p-8 text-center ${className}`}>
      <div className={`p-4 rounded-full ${state.bgColor} mb-4`}>
        <Icon className={`h-8 w-8 ${state.iconColor}`} />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        {state.title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-[280px] whitespace-pre-line">
        {state.description}
      </p>
    </div>
  );
}
