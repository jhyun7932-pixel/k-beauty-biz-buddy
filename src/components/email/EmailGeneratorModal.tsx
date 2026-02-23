import React, { useState } from 'react';
import { Mail, Copy, ExternalLink, Loader2, Check, Send, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  type EmailType,
  type EmailContext,
  type GeneratedEmail,
  generateEmail,
  getEmailTypeLabel,
  getEmailTypeIcon,
  copyEmailToClipboard,
  createGmailLink,
  createOutlookLink,
  createMailtoLink,
} from '@/lib/api/emailGenerator';

interface EmailGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: EmailContext;
  defaultEmailType?: EmailType;
}

const EMAIL_TYPES: EmailType[] = ['first_proposal', 'sample_followup', 'closing'];

export function EmailGeneratorModal({
  open,
  onOpenChange,
  context = {},
  defaultEmailType = 'first_proposal',
}: EmailGeneratorModalProps) {
  const [selectedType, setSelectedType] = useState<EmailType>(defaultEmailType);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [editedBody, setEditedBody] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedEmail(null);
    
    try {
      const result = await generateEmail(selectedType, context);
      
      if (result.success && result.email) {
        setGeneratedEmail(result.email);
        setEditedBody(result.email.body);
        toast.success('이메일이 생성되었습니다!');
      } else {
        toast.error(result.error || '이메일 생성에 실패했습니다.');
      }
    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedEmail) return;
    
    const emailToCopy = { ...generatedEmail, body: editedBody };
    const success = await copyEmailToClipboard(emailToCopy);
    
    if (success) {
      setCopied(true);
      toast.success('클립보드에 복사되었습니다!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleOpenGmail = () => {
    if (!generatedEmail) return;
    const emailToSend = { ...generatedEmail, body: editedBody };
    window.open(createGmailLink(emailToSend, context.buyerCompany), '_blank');
  };

  const handleOpenOutlook = () => {
    if (!generatedEmail) return;
    const emailToSend = { ...generatedEmail, body: editedBody };
    window.open(createOutlookLink(emailToSend), '_blank');
  };

  const handleOpenMailto = () => {
    if (!generatedEmail) return;
    const emailToSend = { ...generatedEmail, body: editedBody };
    window.location.href = createMailtoLink(emailToSend);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            이메일 자동 생성
          </DialogTitle>
          <DialogDescription>
            거래 단계에 맞는 전문 이메일을 AI가 자동으로 작성합니다
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Email Type Selection */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              이메일 유형 선택
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EMAIL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedType === type
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-lg">{getEmailTypeIcon(type)}</span>
                  <p className="text-sm font-medium mt-1">{getEmailTypeLabel(type)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Context Preview */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">사용될 정보</p>
            <div className="flex flex-wrap gap-1.5">
              {context.companyName && (
                <Badge variant="secondary" className="text-xs">
                  회사: {context.companyName}
                </Badge>
              )}
              {context.buyerCompany && (
                <Badge variant="secondary" className="text-xs">
                  바이어: {context.buyerCompany}
                </Badge>
              )}
              {context.buyerCountry && (
                <Badge variant="secondary" className="text-xs">
                  국가: {context.buyerCountry}
                </Badge>
              )}
              {context.products && context.products.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  제품: {context.products.length}개
                </Badge>
              )}
              {context.language && (
                <Badge variant="outline" className="text-xs">
                  언어: {context.language}
                </Badge>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI가 이메일을 작성 중...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {getEmailTypeLabel(selectedType)} 생성하기
              </>
            )}
          </Button>

          {/* Generated Email Preview */}
          {generatedEmail && (
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">생성된 이메일</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-1"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 mr-1 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    복사
                  </Button>
                </div>
              </div>

              {/* Subject */}
              <div className="p-3 rounded-lg bg-card border border-border">
                <p className="text-xs text-muted-foreground mb-1">제목</p>
                <p className="text-sm font-medium">{generatedEmail.subject}</p>
              </div>

              {/* Body (Editable) */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">본문 (편집 가능)</p>
                <Textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="min-h-[200px] text-sm"
                  placeholder="이메일 본문..."
                />
              </div>

              {/* Send Options */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenGmail}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Gmail에서 열기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenOutlook}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Outlook에서 열기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenMailto}
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  기본 메일 앱
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
