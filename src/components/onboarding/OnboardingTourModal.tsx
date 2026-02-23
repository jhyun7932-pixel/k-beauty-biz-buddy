import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Play, 
  FolderKanban,
  FileText,
  Eye,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface OnboardingTourModalProps {
  open: boolean;
  onClose: () => void;
  onStartSample: () => void;
}

const TOUR_STEPS = [
  {
    icon: <FolderKanban className="h-6 w-6" />,
    title: '프로젝트 만들기',
    description: '바이어와 타겟 국가를 설정합니다.',
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: '프리셋 선택',
    description: '첫 제안 / 샘플 / 본오더 중 선택합니다.',
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: '문서 타일 클릭',
    description: '필요한 문서를 클릭하면 자동 생성됩니다.',
  },
  {
    icon: <Eye className="h-6 w-6" />,
    title: 'Preview 확인',
    description: '오른쪽에서 생성된 문서를 확인합니다.',
  },
  {
    icon: <CheckCircle2 className="h-6 w-6" />,
    title: '최종 확정',
    description: 'Finalize 후 PDF/이메일로 내보냅니다.',
  },
];

export function OnboardingTourModal({ open, onClose, onStartSample }: OnboardingTourModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            K-뷰티 AI 무역비서에 오신 것을 환영합니다!
          </DialogTitle>
          <DialogDescription>
            60초 안에, 바이어에게 보낼 서류가 자동으로 준비돼요.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">사용 방법 (5단계)</h4>
          <div className="space-y-3">
            {TOUR_STEPS.map((step, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onStartSample} className="w-full gap-2">
            <Play className="h-4 w-4" />
            샘플 프로젝트로 체험하기
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full gap-2">
            <ArrowRight className="h-4 w-4" />
            직접 시작하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
