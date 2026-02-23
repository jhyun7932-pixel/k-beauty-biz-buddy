import React, { useState } from 'react';
import { Link2, Check, Copy, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ShareModal({ open, onClose, onConfirm }: ShareModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // 모의 링크 생성
  const shareLink = 'https://k-beauty.ai/share/pkg-2026-01-28-abc123';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmAndShare = () => {
    if (confirmed) {
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            링크로 공유하기
          </DialogTitle>
          <DialogDescription>
            바이어에게 보낼 패키지 링크를 생성합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 안전 확인 */}
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">공유 전 확인사항</p>
                <p className="text-muted-foreground text-xs">
                  이 패키지는 초안이며, 최종 제출 전 반드시 내용을 검토해야 합니다.
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="confirm-share" 
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <Label 
                htmlFor="confirm-share" 
                className="text-sm font-medium cursor-pointer"
              >
                초안/확인 필요 항목을 확인했습니다
              </Label>
            </div>
          </div>

          {/* 링크 표시 */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">공유 링크</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareLink}
                className="text-xs bg-muted/20"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!confirmed}
                className="flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-success" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    복사
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ZIP 구성 안내 */}
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">포함된 파일:</p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground/80">
              <li>One-page.pdf (브랜드 1장 소개서)</li>
              <li>Catalog.pdf (제품 카탈로그)</li>
              <li>Readiness_Summary.pdf (수출 준비 요약)</li>
              <li>Deal_Sheet.pdf (거래 조건 요약표)</li>
              <li>Email_Templates.pdf (이메일 문구 세트)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button 
            onClick={handleConfirmAndShare}
            disabled={!confirmed}
          >
            {confirmed ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                링크 생성 완료
              </>
            ) : (
              '확인 필요'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
