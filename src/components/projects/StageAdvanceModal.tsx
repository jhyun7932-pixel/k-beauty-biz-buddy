import React from 'react';
import { FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface StageAdvanceModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: () => void;
  projectName: string;
}

export function StageAdvanceModal({ open, onClose, onGenerate, projectName }: StageAdvanceModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            본 오더 단계 진입
          </DialogTitle>
          <DialogDescription>
            <strong>"{projectName}"</strong> 프로젝트가 본 오더 단계로 진입하셨습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="py-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            기존 바이어와 제품 데이터를 바탕으로{' '}
            <strong className="text-foreground">PI(견적서)</strong> 및{' '}
            <strong className="text-foreground">판매 계약서</strong> 초안을 생성할까요?
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            나중에
          </Button>
          <Button onClick={onGenerate} className="gap-2">
            <FileText className="h-4 w-4" />
            생성하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
