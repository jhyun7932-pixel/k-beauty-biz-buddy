import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Sparkles, UserPlus, FolderPlus, ArrowRight, FileText,
  Bot, Loader2, Copy, Download, CheckCheck, RefreshCw, Save,
  ChevronRight, FileType, Mail, ExternalLink, Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/stores/projectStore';
import { streamTradeAssistant } from '@/lib/api/tradeAssistant';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type MessageRole = 'user' | 'assistant';
type DocOutputType = 'email' | 'document' | null;

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
  /** When true, the raw content is hidden and a summary + button is shown */
  isDocOutput?: boolean;
  docSummary?: string;
}

interface RightPanelData {
  type: DocOutputType;
  title: string;
  markdown: string; // raw markdown from AI
  // Email-specific parsed fields
  emailSubject?: string;
  emailTo?: string;
  emailFrom?: string;
  emailBody?: string;
  emailSignature?: string;
}

// Full list of export document types for save modal
const EXPORT_DOC_TYPES = [
  { value: 'PI', label: 'Proforma Invoice (PI)' },
  { value: 'CI', label: 'Commercial Invoice (CI)' },
  { value: 'PL', label: 'Packing List (PL)' },
  { value: 'SALES_CONTRACT', label: 'Sales Contract (계약서)' },
  { value: 'ORIGIN_CERT', label: '원산지 증명서' },
  { value: 'INGREDIENTS', label: '성분표 (INCI)' },
  { value: 'EMAIL_DRAFT', label: '이메일 초안' },
  { value: 'BRAND_DECK', label: '브랜드 소개서' },
  { value: 'CATALOG', label: '제품 카탈로그' },
  { value: 'COMPLIANCE', label: '수출 규제 요약' },
  { value: 'QUALITY_CERT', label: '품질 보증서' },
  { value: 'SHIPPING_NOTE', label: '선적 안내문' },
  { value: 'PRICE_NOTICE', label: '단가 인상 공문' },
  { value: 'NDA', label: 'NDA (비밀유지계약서)' },
  { value: 'CUSTOM', label: '+ 직접 입력 (Custom)' },
];

const SUGGESTION_CHIPS = [
  { id: 'first_proposal', label: '첫 제안 패키지 만들기' },
  { id: 'sample_package', label: '샘플 발송 서류 준비' },
  { id: 'bulk_order', label: '본오더 PI/계약서 작성' },
  { id: 'compliance_check', label: '수출 규제 확인' },
];

const EXAMPLE_PROMPTS = [
  '미국 바이어에게 첫 제안 이메일 써줘',
  'PI (견적서) 작성해줘',
  '비밀유지계약서(NDA) 만들어줘',
  '단가 인상 공문 작성해줘',
];

// ─── Detect output type from user prompt ───
function detectOutputType(prompt: string): DocOutputType {
  if (/메일|이메일|email|mail|편지/i.test(prompt)) return 'email';
  if (/계약서|PI|CI|PL|문서|견적서|인보이스|패킹|증명서|보증서|공문|서류|contract|invoice|NDA|nda|작성|만들어|생성|준비|카탈로그|소개서/i.test(prompt)) return 'document';
  return null;
}

// ─── Extract document title from AI markdown ───
function extractDocTitle(md: string, userPrompt: string): string {
  // Try first heading
  const h1 = md.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].replace(/\*\*/g, '').trim();
  const h2 = md.match(/^##\s+(.+)$/m);
  if (h2) return h2[1].replace(/\*\*/g, '').trim();
  // Fallback from prompt
  if (/PI|견적서|proforma/i.test(userPrompt)) return 'Proforma Invoice';
  if (/NDA|비밀유지/i.test(userPrompt)) return 'Non-Disclosure Agreement';
  if (/CI|commercial/i.test(userPrompt)) return 'Commercial Invoice';
  if (/계약서|contract/i.test(userPrompt)) return 'Sales Contract';
  if (/메일|이메일|email/i.test(userPrompt)) return 'Email Draft';
  return '생성된 문서';
}

// ─── Parse email fields from AI markdown ───
function parseEmailFromMarkdown(md: string): Partial<RightPanelData> {
  const subjectMatch = md.match(/Subject:\s*(.+?)(?:\n|$)/i);
  const toMatch = md.match(/To:\s*(.+?)(?:\n|$)/i);
  const fromMatch = md.match(/From:\s*(.+?)(?:\n|$)/i);

  if (!subjectMatch) return {};

  let body = md
    .replace(/Subject:\s*.+?\n?/i, '')
    .replace(/To:\s*.+?\n?/i, '')
    .replace(/From:\s*.+?\n?/i, '')
    .replace(/^---+\s*$/gm, '')
    .trim();

  // Split signature
  const sigMatch = body.match(/(Best regards|Sincerely|Kind regards|Warm regards|감사합니다|경의를 표하며|Thanks|Thank you)[\s\S]*/i);
  const emailBody = sigMatch ? body.slice(0, sigMatch.index).trim() : body;
  const emailSignature = sigMatch ? sigMatch[0].trim() : '';

  return {
    emailSubject: subjectMatch[1].trim(),
    emailTo: toMatch?.[1]?.trim() || '[buyer@company.com]',
    emailFrom: fromMatch?.[1]?.trim() || '',
    emailBody,
    emailSignature,
  };
}

// ─── Generate summary for chat bubble ───
function generateChatSummary(type: DocOutputType, title: string): string {
  if (type === 'email') {
    return `📧 이메일 초안 작성을 완료했습니다. 우측 패널에서 내용을 확인하고 바로 전송하거나 Word/PDF로 다운로드하실 수 있습니다.`;
  }
  return `📄 "${title}" 작성을 완료했습니다. 우측 문서 뷰어에서 내용을 확인하고 Word/PDF로 다운로드하실 수 있습니다.`;
}

// ─────────────────────────────────────────────
// Chat Bubble
// ─────────────────────────────────────────────
function ChatBubble({
  message,
  onViewDoc,
}: {
  message: ChatMessage;
  onViewDoc?: () => void;
}) {
  const isUser = message.role === 'user';

  // Document output: show summary + button
  if (!isUser && message.isDocOutput && message.docSummary) {
    return (
      <div className="flex gap-2.5 justify-start">
        <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <Bot className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <div className="max-w-[90%] space-y-2">
          <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-muted text-foreground text-sm leading-relaxed">
            <p className="whitespace-pre-wrap">{message.docSummary}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
            onClick={onViewDoc}
          >
            <Eye className="h-3.5 w-3.5" />
            문서 확인하기
          </Button>
        </div>
      </div>
    );
  }

  // Default text bubble
  return (
    <div className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <Bot className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.isStreaming && (
          <span className="inline-block w-1 h-3.5 bg-current animate-pulse ml-0.5 align-text-bottom opacity-70" />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Save to Project Dialog
// ─────────────────────────────────────────────
function SaveToProjectDialog({
  open,
  onClose,
  docContent,
}: {
  open: boolean;
  onClose: () => void;
  docContent: string;
}) {
  const { projects, addDocumentToProject } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('');
  const [customDocTitle, setCustomDocTitle] = useState('');

  const handleSave = () => {
    if (!selectedProjectId) { toast.error('프로젝트를 선택해주세요.'); return; }
    if (!selectedDocType) { toast.error('문서 유형을 선택해주세요.'); return; }
    if (selectedDocType === 'CUSTOM' && !customDocTitle.trim()) { toast.error('문서 이름을 입력해주세요.'); return; }

    const docTypeLabel = selectedDocType === 'CUSTOM'
      ? customDocTitle.trim()
      : EXPORT_DOC_TYPES.find(d => d.value === selectedDocType)?.label || '문서';

    addDocumentToProject(selectedProjectId, {
      id: `doc_${Date.now()}`,
      docKey: selectedDocType === 'CUSTOM' ? 'ADHOC' : selectedDocType,
      title: docTypeLabel,
      status: 'draft',
      fields: {},
      html: `<pre style="white-space:pre-wrap;font-family:sans-serif;padding:16px">${docContent}</pre>`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    toast.success(`"${docTypeLabel}"이(가) 프로젝트에 저장되었습니다!`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-4 w-4 text-primary" />
            수출 프로젝트에 저장
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">저장할 프로젝트</p>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="프로젝트 선택..." />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <SelectItem value="none" disabled>프로젝트가 없습니다</SelectItem>
                ) : (
                  projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">문서 유형</p>
            <Select value={selectedDocType} onValueChange={setSelectedDocType}>
              <SelectTrigger>
                <SelectValue placeholder="문서 유형 선택..." />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_DOC_TYPES.map(dt => (
                  <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedDocType === 'CUSTOM' && (
            <div className="space-y-1.5 animate-fade-in">
              <p className="text-xs font-medium text-muted-foreground">문서 이름</p>
              <Input
                value={customDocTitle}
                onChange={e => setCustomDocTitle(e.target.value)}
                placeholder="문서 이름을 직접 입력하세요"
              />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button
            onClick={handleSave}
            disabled={!selectedProjectId || !selectedDocType || (selectedDocType === 'CUSTOM' && !customDocTitle.trim())}
          >
            저장하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Dynamic Document Preview Panel (Right)
// ─────────────────────────────────────────────
function DocPreviewPanel({
  panelData,
  isGenerating,
  streamingMarkdown,
  onSaveToProject,
}: {
  panelData: RightPanelData | null;
  isGenerating: boolean;
  streamingMarkdown: string;
  onSaveToProject: () => void;
}) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  // ── Download PDF from rendered HTML ──
  const handleDownloadPDF = async () => {
    setDownloading('pdf');
    try {
      const el = docRef.current;
      if (!el) throw new Error('No content');
      const container = document.createElement('div');
      container.style.cssText = 'position:absolute;left:-9999px;width:794px;padding:40px;background:white;font-family:sans-serif;color:#111;';
      container.innerHTML = el.innerHTML;
      document.body.appendChild(container);
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      document.body.removeChild(container);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgW = 210;
      const imgH = (canvas.height * imgW) / canvas.width;
      let hLeft = imgH, pos = 0;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, imgW, imgH);
      hLeft -= 297;
      while (hLeft > 0) { pos -= 297; pdf.addPage(); pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, imgW, imgH); hLeft -= 297; }
      pdf.save(`${panelData?.title || 'document'}.pdf`);
      toast.success('PDF 다운로드 완료!');
    } catch (e) { console.error(e); toast.error('PDF 생성 실패'); }
    finally { setDownloading(null); }
  };

  // ── Download Word from markdown ──
  const handleDownloadWord = async () => {
    setDownloading('word');
    try {
      const md = panelData?.markdown || streamingMarkdown;
      const paragraphs: Paragraph[] = [];
      md.split('\n').forEach(line => {
        if (line.startsWith('### ')) {
          paragraphs.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }));
        } else if (line.startsWith('## ')) {
          paragraphs.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 }));
        } else if (line.startsWith('# ')) {
          paragraphs.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 }));
        } else if (line.startsWith('|') || line.startsWith('---')) {
          // Table rows — render as plain text in Word
          paragraphs.push(new Paragraph({ children: [new TextRun(line.replace(/\|/g, '  ').trim())] }));
        } else if (line.trim()) {
          const cleaned = line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
          paragraphs.push(new Paragraph({ children: [new TextRun(cleaned)] }));
        } else {
          paragraphs.push(new Paragraph({ text: '' }));
        }
      });
      const doc = new Document({ sections: [{ children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${panelData?.title || 'document'}.docx`);
      toast.success('Word 다운로드 완료!');
    } catch (e) { console.error(e); toast.error('Word 생성 실패'); }
    finally { setDownloading(null); }
  };

  // ── Empty state ──
  if (!panelData && !isGenerating && !streamingMarkdown) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <FileText className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">문서 생성 대기 중</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            좌측 채팅창에서 AI에게 문서 작성을 요청하면<br />여기에 결과물이 실시간으로 표시됩니다.
          </p>
        </div>
        <div className="mt-2 space-y-2 w-full max-w-xs">
          {['PI (견적서) 작성', 'NDA 작성해줘', '바이어에게 이메일 작성'].map(ex => (
            <div key={ex} className="px-3 py-2 rounded-lg bg-muted/30 text-xs text-muted-foreground text-left border border-border/30">
              예: "{ex}"
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentMarkdown = panelData?.markdown || streamingMarkdown;
  const isEmail = panelData?.type === 'email';
  const title = panelData?.title || (isGenerating ? 'AI가 문서를 생성하고 있습니다...' : '문서');

  // ── Email Preview ──
  if (isEmail && panelData) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center justify-between bg-card/50">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">이메일 초안</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10" onClick={onSaveToProject}>
              <Save className="h-3.5 w-3.5" /> 프로젝트 저장
            </Button>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" disabled={downloading === 'word'} onClick={handleDownloadWord}>
              {downloading === 'word' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileType className="h-3.5 w-3.5" />}
              📄 Word
            </Button>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" disabled={downloading === 'pdf'} onClick={handleDownloadPDF}>
              {downloading === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              📥 PDF
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-6">
            <div ref={docRef} className="max-w-2xl mx-auto bg-white rounded-xl border border-border shadow-lg overflow-hidden">
              <div className="bg-muted/50 px-6 py-4 space-y-2.5 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground w-14 shrink-0">받는 사람</span>
                  <div className="flex-1 px-3 py-1.5 bg-background rounded-md border border-border/60 text-sm text-foreground">{panelData.emailTo}</div>
                </div>
                {panelData.emailFrom && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-muted-foreground w-14 shrink-0">보내는 사람</span>
                    <div className="flex-1 px-3 py-1.5 bg-background rounded-md border border-border/60 text-sm text-foreground">{panelData.emailFrom}</div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground w-14 shrink-0">제목</span>
                  <div className="flex-1 px-3 py-1.5 bg-background rounded-md border border-border/60 text-sm font-semibold text-foreground">{panelData.emailSubject}</div>
                </div>
              </div>
              <div className="px-6 py-5 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {panelData.emailBody}
              </div>
              {panelData.emailSignature && (
                <div className="px-6 py-4 border-t border-border/40 text-xs text-muted-foreground whitespace-pre-wrap bg-muted/20">
                  {panelData.emailSignature}
                </div>
              )}
              <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center gap-2">
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => {
                  const mailto = `mailto:${panelData.emailTo || ''}?subject=${encodeURIComponent(panelData.emailSubject || '')}&body=${encodeURIComponent((panelData.emailBody || '') + '\n\n' + (panelData.emailSignature || ''))}`;
                  window.open(mailto);
                }}>
                  <ExternalLink className="h-3.5 w-3.5" /> 이메일 앱 열기
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => {
                  navigator.clipboard.writeText(`Subject: ${panelData.emailSubject}\nTo: ${panelData.emailTo}\n\n${panelData.emailBody}\n\n${panelData.emailSignature || ''}`);
                  toast.success('이메일 내용이 복사되었습니다.');
                }}>
                  <Copy className="h-3.5 w-3.5" /> 복사하기
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // ── Document Preview (A4 Card with react-markdown) ──
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">{title}</span>
          {isGenerating && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>생성 중...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10" onClick={onSaveToProject}>
            <Save className="h-3.5 w-3.5" /> 프로젝트 저장
          </Button>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" disabled={downloading === 'word'} onClick={handleDownloadWord}>
            {downloading === 'word' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileType className="h-3.5 w-3.5" />}
            📄 Word
          </Button>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" disabled={downloading === 'pdf'} onClick={handleDownloadPDF}>
            {downloading === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            📥 PDF
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-6 flex justify-center">
          <div
            ref={docRef}
            className="bg-white rounded-lg border border-border shadow-lg p-8 w-full max-w-[700px] min-h-[800px]"
          >
            <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-td:border prose-td:border-border/60 prose-td:px-3 prose-td:py-2 prose-td:text-xs">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentMarkdown}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const { projects } = useProjectStore();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Right panel state
  const [panelData, setPanelData] = useState<RightPanelData | null>(null);
  const [isDocGenerating, setIsDocGenerating] = useState(false);
  const [streamingMarkdown, setStreamingMarkdown] = useState('');

  // Typewriter placeholder
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const ongoingProjects = projects.filter(p => p.pipelineStage !== '수출 완료').length;

  // ── DB: 메시지 저장 헬퍼 ──────────────────────────────────
  const saveMessageToDB = useCallback(async (
    role: MessageRole,
    content: string,
    isDocOutput = false,
    docSummary?: string,
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('ai_chat_messages').insert({
        user_id: user.id,
        role,
        content,
        is_doc_output: isDocOutput,
        doc_summary: docSummary ?? null,
      });
    } catch (err) {
      console.error('[HomePage] saveMessageToDB 실패:', err);
    }
  }, []);

  // ── DB: 채팅 히스토리 로드 (마운트 시 1회) ─────────────────
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setHistoryLoading(false); return; }

        const { data, error } = await supabase
          .from('ai_chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) throw error;

        if (data && data.length > 0) {
          setMessages(data.map(row => ({
            id: row.id,
            role: row.role as MessageRole,
            content: row.content,
            isDocOutput: row.is_doc_output ?? false,
            docSummary: row.doc_summary ?? undefined,
          })));
          setHasStartedChat(true);
        }
      } catch (err) {
        console.error('[HomePage] loadHistory 실패:', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (hasStartedChat) return;
    const currentPrompt = EXAMPLE_PROMPTS[currentPromptIndex];
    if (isTyping) {
      if (displayedText.length < currentPrompt.length) {
        const t = setTimeout(() => setDisplayedText(currentPrompt.slice(0, displayedText.length + 1)), 60);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setIsTyping(false), 2200);
        return () => clearTimeout(t);
      }
    } else {
      if (displayedText.length > 0) {
        const t = setTimeout(() => setDisplayedText(displayedText.slice(0, -1)), 25);
        return () => clearTimeout(t);
      } else {
        setCurrentPromptIndex(prev => (prev + 1) % EXAMPLE_PROMPTS.length);
        setIsTyping(true);
      }
    }
  }, [displayedText, isTyping, currentPromptIndex, hasStartedChat]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleViewDoc = () => {
    rightPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSend = async (textOverride?: string) => {
    const userText = (textOverride ?? input).trim();
    if (!userText || isProcessing) return;

    setInput('');
    setHasStartedChat(true);
    setIsProcessing(true);

    const outputType = detectOutputType(userText);
    const isDocRequest = outputType !== null;

    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: userText }]);
    saveMessageToDB('user', userText);

    if (isDocRequest) {
      // Show progress message
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: outputType === 'email'
          ? '📧 요청하신 이메일 초안 작성을 진행합니다...'
          : '📄 요청하신 문서 작성을 진행합니다...',
        isStreaming: true,
      }]);
      setIsDocGenerating(true);
      setStreamingMarkdown('');
      setPanelData(null);
    } else {
      setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }]);
    }

    const apiMessages = [
      ...messages.filter(m => !m.isStreaming).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: userText },
    ];

    let assistantText = '';

    try {
      await streamTradeAssistant({
        messages: apiMessages,
        onDelta: (delta) => {
          assistantText += delta;
          if (isDocRequest) {
            // Stream to right panel, keep chat as progress
            setStreamingMarkdown(assistantText);
          } else {
            // Normal chat — stream to chat bubble
            setMessages(prev => prev.map(m =>
              m.id === assistantMsgId ? { ...m, content: assistantText, isStreaming: true } : m
            ));
          }
        },
        onToolCalls: () => {
          setIsDocGenerating(true);
        },
        onDone: () => {
          if (isDocRequest) {
            const title = extractDocTitle(assistantText, userText);
            const newPanelData: RightPanelData = {
              type: outputType,
              title,
              markdown: assistantText,
            };

            // Parse email fields if email type
            if (outputType === 'email') {
              const emailFields = parseEmailFromMarkdown(assistantText);
              Object.assign(newPanelData, emailFields);
            }

            setPanelData(newPanelData);
            setStreamingMarkdown('');
            setIsDocGenerating(false);

            // Update chat bubble with summary + button
            const summary = generateChatSummary(outputType, title);
            setMessages(prev => prev.map(m =>
              m.id === assistantMsgId
                ? { ...m, content: '', isStreaming: false, isDocOutput: true, docSummary: summary }
                : m
            ));
            // DB 저장: 문서 출력 메시지
            saveMessageToDB('assistant', '', true, summary);
          } else {
            const finalText = assistantText || '답변을 생성했습니다.';
            setMessages(prev => prev.map(m =>
              m.id === assistantMsgId
                ? { ...m, content: finalText, isStreaming: false }
                : m
            ));
            // DB 저장: 일반 답변 메시지
            saveMessageToDB('assistant', finalText);
          }
          setIsProcessing(false);
        },
        onError: (err) => {
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: `❌ 오류: ${err}`, isStreaming: false } : m
          ));
          setIsDocGenerating(false);
          setIsProcessing(false);
          toast.error(err);
        },
      });
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId ? { ...m, content: '❌ 네트워크 오류가 발생했습니다.', isStreaming: false } : m
      ));
      setIsDocGenerating(false);
      setIsProcessing(false);
      toast.error('네트워크 오류가 발생했습니다.');
    }
  };

  const handleChipClick = (chipId: string) => {
    const msgs: Record<string, string> = {
      first_proposal: '미국 바이어에게 첫 제안 이메일 써줘',
      sample_package: '샘플 발송 서류를 준비해줘',
      bulk_order: '본오더 PI와 계약서를 작성해줘',
      compliance_check: '현재 제품의 수출 규제 사항을 확인해줘',
    };
    const text = msgs[chipId] || '';
    setInput(text);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">

      {/* ── LEFT: Chat Panel ── */}
      <div
        className={cn(
          "flex flex-col border-r border-border bg-background transition-all duration-300",
          hasStartedChat ? "flex-shrink-0" : "flex-1"
        )}
        style={hasStartedChat ? { width: '420px', minWidth: '320px', maxWidth: '500px' } : undefined}
      >
        {/* Chat Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">FLONIX AI 무역비서</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                  Gemini 3 Flash 연결됨
                </p>
              </div>
            </div>
            {hasStartedChat && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground"
                onClick={async () => {
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      await supabase.from('ai_chat_messages').delete().eq('user_id', user.id);
                    }
                  } catch (err) {
                    console.error('[HomePage] 히스토리 삭제 실패:', err);
                  }
                  setMessages([]);
                  setHasStartedChat(false);
                  setPanelData(null);
                  setStreamingMarkdown('');
                }}
              >
                <RefreshCw className="h-3 w-3" />
                초기화
              </Button>
            )}
          </div>
        </div>

        {/* Ongoing Projects Briefing */}
        {ongoingProjects > 0 && (
          <div className="flex-shrink-0 mx-3 mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/15 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <p className="text-xs text-foreground flex-1">
              진행 중인 프로젝트 <span className="text-primary font-bold">{ongoingProjects}건</span>
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-primary px-2 flex-shrink-0"
              onClick={() => navigate('/export-projects')}
            >
              바로가기 <ArrowRight className="h-2.5 w-2.5 ml-0.5" />
            </Button>
          </div>
        )}

        {/* Messages OR Welcome OR Loading */}
        {historyLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : hasStartedChat ? (
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-4">
              {messages.map(msg => (
                <ChatBubble key={msg.id} message={msg} onViewDoc={handleViewDoc} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 text-center overflow-auto">
            <div className="relative mb-5">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-purple-500 flex items-center justify-center shadow-lg p-4">
                <Bot className="h-12 w-12 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">무엇을 도와드릴까요?</h1>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              K-뷰티 수출 문서 작성부터 규제 확인까지,<br />Gemini AI가 실시간으로 함께합니다
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {SUGGESTION_CHIPS.map(chip => (
                <button
                  key={chip.id}
                  onClick={() => handleChipClick(chip.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-4 py-2 rounded-full',
                    'bg-secondary/50 hover:bg-secondary border border-border/50',
                    'text-sm text-foreground/80 hover:text-foreground',
                    'transition-all duration-200 hover:shadow-sm hover:border-primary/30'
                  )}
                >
                  <span>{chip.label}</span>
                  <ArrowRight className="h-3 w-3 opacity-50" />
                </button>
              ))}
            </div>
            <div className="w-full max-w-sm space-y-2">
              <p className="text-xs text-muted-foreground/60 mb-2">예시 프롬프트</p>
              {EXAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(p); textareaRef.current?.focus(); }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 rounded-xl text-sm',
                    'bg-card/50 hover:bg-card border border-border/40 hover:border-border',
                    'text-muted-foreground hover:text-foreground transition-all'
                  )}
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 p-3 border-t border-border bg-card/30">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-purple-500/30 to-primary/30 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-300" />
            <div className="relative bg-card rounded-xl border border-border shadow-sm">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  !hasStartedChat
                    ? (input ? '' : (displayedText || '메시지를 입력하세요...'))
                    : '계속 대화하기...'
                }
                disabled={isProcessing}
                rows={2}
                className={cn(
                  'w-full px-4 py-3 pr-12 bg-transparent resize-none',
                  'text-sm text-foreground placeholder:text-muted-foreground/40',
                  'focus:outline-none disabled:opacity-50',
                  'min-h-[56px] max-h-[150px]'
                )}
              />
              <Button
                type="button"
                size="icon"
                disabled={!input.trim() || isProcessing}
                onClick={() => handleSend()}
                className={cn(
                  'absolute right-2 bottom-2 h-8 w-8 rounded-lg',
                  'bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200',
                  (!input.trim() || isProcessing) && 'opacity-50'
                )}
              >
                {isProcessing
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1" onClick={() => navigate('/my-data?tab=buyers')}>
              <UserPlus className="h-3 w-3" /> 새 바이어
            </Button>
            <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1" onClick={() => navigate('/export-projects')}>
              <FolderPlus className="h-3 w-3" /> 새 프로젝트
            </Button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Dynamic Document Preview Panel ── */}
      {hasStartedChat && (
        <div ref={rightPanelRef} className="flex-1 flex flex-col min-w-0 bg-muted/10">
          <DocPreviewPanel
            panelData={panelData}
            isGenerating={isDocGenerating}
            streamingMarkdown={streamingMarkdown}
            onSaveToProject={() => setSaveDialogOpen(true)}
          />
        </div>
      )}

      {/* Save to Project Dialog */}
      <SaveToProjectDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        docContent={panelData?.markdown || streamingMarkdown}
      />
    </div>
  );
}
