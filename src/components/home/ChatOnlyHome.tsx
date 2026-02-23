import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sanitizeHTML } from '@/lib/sanitize';
import { streamTradeAssistant } from '@/lib/api/tradeAssistant';
import { useToolCallHandler } from '@/hooks/useToolCallHandler';
import { Send, Sparkles, Plus, BarChart3, Paperclip, FolderOpen, Save, FileText, X, Download, FileType, Presentation, Loader2, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { EmailPreviewCard, DocumentPreviewCard, SlidePreviewCard } from '@/components/chat/RichOutputCards';
import { Input } from '@/components/ui/input';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuickActionBar } from '@/components/chat/QuickActionBar';
import { cn } from '@/lib/utils';
import { useSessionStore, type SessionMessage } from '@/stores/sessionStore';
import { useAppStore } from '@/stores/appStore';
import { useProjectStore, type DocumentInstance } from '@/stores/projectStore';
import { toast } from 'sonner';

const EXAMPLE_PROMPTS = [
  '미국 바이어에게 첫 제안 패키지 만들어줘',
  'MOQ를 1000으로 변경해줘',
  '일본 시장 규제 요건 확인해줘',
  '샘플 발송용 PI 작성해줘',
];

const PACKAGE_ACTIONS = [
  { id: 'first_proposal', label: '첫 제안 패키지', icon: '📦', description: '바이어 설득용 소개/카탈로그/규제 요약', preset: 'FIRST_PROPOSAL' },
  { id: 'sample', label: '샘플 패키지', icon: '🧪', description: '샘플 PI/포장명세/안내문', preset: 'SAMPLE' },
  { id: 'bulk', label: '본오더 패키지', icon: '🚢', description: 'PI/계약서/인보이스/실수 체크', preset: 'PURCHASE_ORDER' },
];

const ADHOC_DOC_TYPES = [
  { id: 'price_increase_notice', label: '단가 인상 공문', icon: '📈' },
  { id: 'origin_certificate', label: '원산지 증명서', icon: '🌍' },
  { id: 'quality_certificate', label: '품질 보증서', icon: '✅' },
  { id: 'free_form', label: '자유 양식 문서', icon: '📝' },
];

// Document generation progress steps
const GENERATION_STEPS = [
  { label: '요청 분석 중...', icon: '🔍' },
  { label: '문서 구조 설계 중...', icon: '📐' },
  { label: '내용 생성 중...', icon: '✍️' },
  { label: '서식 적용 중...', icon: '🎨' },
  { label: '최종 검토 중...', icon: '✅' },
];

function GenerationProgress({ startTime }: { startTime: number }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, GENERATION_STEPS.length - 1));
    }, 600);
    const timerInterval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => { clearInterval(stepInterval); clearInterval(timerInterval); };
  }, [startTime]);

  return (
    <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md space-y-2 min-w-[240px]">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        <span>문서 생성 중... ({elapsed}초)</span>
      </div>
      <div className="space-y-1">
        {GENERATION_STEPS.map((step, idx) => (
          <div key={idx} className={`flex items-center gap-2 text-xs transition-all duration-300 ${
            idx < currentStep ? 'text-primary' : idx === currentStep ? 'text-foreground font-medium' : 'text-muted-foreground/40'
          }`}>
            {idx < currentStep ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            ) : idx === currentStep ? (
              <span className="text-sm">{step.icon}</span>
            ) : (
              <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/20 inline-block" />
            )}
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Download utilities
async function downloadAsPDF(html: string, title: string) {
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;width:800px;padding:40px;background:white;font-family:sans-serif;';
  container.innerHTML = html;
  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`${title}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

async function downloadAsWord(html: string, title: string) {
  // Parse HTML to extract text content
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const paragraphs: Paragraph[] = [];
  
  doc.body.querySelectorAll('h1,h2,h3,p,li,td,th').forEach(el => {
    const tag = el.tagName.toLowerCase();
    const text = el.textContent?.trim() || '';
    if (!text) return;
    if (tag === 'h1' || tag === 'h2') {
      paragraphs.push(new Paragraph({ text, heading: tag === 'h1' ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2 }));
    } else if (tag === 'h3') {
      paragraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_3 }));
    } else {
      paragraphs.push(new Paragraph({ children: [new TextRun(text)] }));
    }
  });

  const wordDoc = new Document({ sections: [{ children: paragraphs }] });
  const blob = await Packer.toBlob(wordDoc);
  saveAs(blob, `${title}.docx`);
}

async function downloadAsPPT(html: string, title: string) {
  // Simple PPT-like export as HTML file with .pptx extension workaround
  // Use actual HTML download since pptxgenjs is heavy
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const sections: string[] = [];
  let currentSlide = '';
  
  doc.body.querySelectorAll('h1,h2,h3,p,li,table').forEach(el => {
    const tag = el.tagName.toLowerCase();
    if (['h1','h2','h3'].includes(tag)) {
      if (currentSlide) sections.push(currentSlide);
      currentSlide = `<div style="page-break-after:always;padding:60px;min-height:500px;"><h1 style="font-size:28px;color:#2F6BFF;margin-bottom:20px;">${el.textContent}</h1>`;
    } else {
      currentSlide += el.outerHTML;
    }
  });
  if (currentSlide) sections.push(currentSlide + '</div>');
  
  const pptHtml = `<html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;margin:0;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ddd;padding:8px;}</style></head><body>${sections.join('')}</body></html>`;
  const blob = new Blob([pptHtml], { type: 'application/vnd.ms-powerpoint' });
  saveAs(blob, `${title}.ppt`);
}

// Download toolbar for generated documents
function DocDownloadBar({ html, title }: { html: string; title: string }) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (format: 'pdf' | 'word' | 'ppt') => {
    setDownloading(format);
    try {
      if (format === 'pdf') await downloadAsPDF(html, title);
      else if (format === 'word') await downloadAsWord(html, title);
      else await downloadAsPPT(html, title);
      toast.success(`${format.toUpperCase()} 다운로드 완료!`);
    } catch (e) {
      console.error(e);
      toast.error('다운로드 실패');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
      <span className="text-xs text-muted-foreground mr-1">📥 다운로드:</span>
      {[
        { key: 'pdf' as const, label: 'PDF', icon: <FileText className="h-3 w-3" /> },
        { key: 'word' as const, label: 'Word', icon: <FileType className="h-3 w-3" /> },
        { key: 'ppt' as const, label: 'PPT', icon: <Presentation className="h-3 w-3" /> },
      ].map(item => (
        <Button
          key={item.key}
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          disabled={downloading !== null}
          onClick={() => handleDownload(item.key)}
        >
          {downloading === item.key ? <Loader2 className="h-3 w-3 animate-spin" /> : item.icon}
          {item.label}
        </Button>
      ))}
    </div>
  );
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
  { value: 'CUSTOM', label: '직접 입력 (Custom)' },
];

// Ad-hoc document editor panel
function AdHocDocEditor({ 
  docHtml, 
  docTitle,
  onSaveToProject, 
  onClose,
  projects,
}: {
  docHtml: string;
  docTitle: string;
  onSaveToProject: (projectId: string, docType: string, customTitle?: string) => void;
  onClose: () => void;
  projects: Array<{ id: string; name: string }>;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [customDocTitle, setCustomDocTitle] = useState<string>('');

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{docTitle}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      {/* Document Preview Card (A4 ratio) */}
      <DocumentPreviewCard title={docTitle} html={docHtml} />
      
      {/* Project Linking */}
      <div className="border-t border-border px-4 py-3 bg-muted/20 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FolderOpen className="h-3.5 w-3.5" />
          <span>📁 수출 프로젝트에 저장</span>
        </div>
        
        {/* Project Select */}
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="프로젝트를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {projects.length === 0 ? (
              <SelectItem value="__none" disabled>프로젝트가 없습니다</SelectItem>
            ) : (
              projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {/* Document Type Select */}
        <Select value={selectedDocType} onValueChange={setSelectedDocType}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="문서 유형을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {EXPORT_DOC_TYPES.map((dt) => (
              <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Custom title input */}
        {selectedDocType === 'CUSTOM' && (
          <Input
            value={customDocTitle}
            onChange={(e) => setCustomDocTitle(e.target.value)}
            placeholder="문서 이름을 직접 입력하세요"
            className="h-9 text-sm"
          />
        )}

        <Button 
          size="sm" 
          className="w-full h-9"
          disabled={!selectedProjectId || !selectedDocType || (selectedDocType === 'CUSTOM' && !customDocTitle.trim())}
          onClick={() => onSaveToProject(
            selectedProjectId,
            selectedDocType,
            selectedDocType === 'CUSTOM' ? customDocTitle.trim() : undefined
          )}
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          프로젝트에 저장
        </Button>
      </div>
    </div>
  );
}

export function ChatOnlyHome() {
  const {
    activeSessionId,
    getActiveSession,
    appendMessage,
    appendAction,
    createNewSession,
    setLayoutMode,
    updateContextSnapshot,
    linkDocToSession,
    incrementMetric,
  } = useSessionStore();
  
  const {
    project,
    setPreset,
    createDocFromTemplate,
    applyFieldPatch,
    getActiveDoc,
    setWorkbenchTab,
    navigate,
  } = useAppStore();

  const { projects, addDocumentToProject } = useProjectStore();
  const { handleToolCalls } = useToolCallHandler();
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState(0);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [adHocDoc, setAdHocDoc] = useState<{ html: string; title: string; outputType?: 'email' | 'document' | 'slide' } | null>(null);
  const [docMessageMap, setDocMessageMap] = useState<Record<number, { html: string; title: string; outputType?: 'email' | 'document' | 'slide'; emailData?: { subject: string; to: string; from?: string; body: string; signature?: string } }>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const activeSession = getActiveSession();
  const messages = activeSession?.messages || [];
  const projectCount = projects.length;
  
  useEffect(() => {
    if (!activeSessionId) {
      createNewSession();
    }
  }, [activeSessionId, createNewSession]);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Typewriter effect
  useEffect(() => {
    const currentPrompt = EXAMPLE_PROMPTS[currentPromptIndex];
    if (isTyping) {
      if (displayedText.length < currentPrompt.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentPrompt.slice(0, displayedText.length + 1));
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setIsTyping(false), 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayedText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, 30);
        return () => clearTimeout(timeout);
      } else {
        setCurrentPromptIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
        setIsTyping(true);
      }
    }
  }, [displayedText, isTyping, currentPromptIndex]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const COUNTRY_KEYWORDS: Record<string, string> = {
    '미국': 'US', '일본': 'JP', '유럽': 'EU', 'eu': 'EU', '홍콩': 'HK',
    '대만': 'TW', '중국': 'CN', '베트남': 'VN', '인도네시아': 'ID',
    '말레이시아': 'MY', '태국': 'TH', '호주': 'AU',
    'us': 'US', 'usa': 'US', 'jp': 'JP', 'japan': 'JP', 'cn': 'CN', 'china': 'CN',
    'vietnam': 'VN', 'indonesia': 'ID', 'malaysia': 'MY', 'thailand': 'TH', 'australia': 'AU',
  };

  const detectIntent = (message: string): { intent: string; entities: Record<string, any> } => {
    const lowerMsg = message.toLowerCase();

    // Email, slide, ad-hoc docs → all go to AI streaming (intent: 'help' → null from processLocalIntent)
    // No special local handling needed
    
    if (lowerMsg.includes('moq') || lowerMsg.includes('최소주문')) {
      const match = message.match(/(\d+)/);
      if (match) return { intent: 'update_fields', entities: { field: 'moq', value: parseInt(match[1]) } };
    }
    if (lowerMsg.includes('단가') || lowerMsg.includes('가격') || lowerMsg.includes('price')) {
      const match = message.match(/(\d+\.?\d*)/);
      if (match) return { intent: 'update_fields', entities: { field: 'unitPrice', value: parseFloat(match[1]) } };
    }
    if ((lowerMsg.includes('견적서') || lowerMsg.includes('pi')) && (lowerMsg.includes('보여') || lowerMsg.includes('확인') || lowerMsg.includes('열어'))) {
      return { intent: 'show_preview', entities: {} };
    }
    if (lowerMsg.includes('pi 만들') || lowerMsg.includes('견적서 만들') || lowerMsg.includes('견적서 작성')) {
      return { intent: 'create_doc', entities: { templateKey: project.stagePreset === 'SAMPLE' ? 'PI_SAMPLE' : 'PI_FINAL' } };
    }
    if (lowerMsg.includes('카탈로그')) return { intent: 'create_doc', entities: { templateKey: 'CATALOG_15P' } };
    if (lowerMsg.includes('소개') || lowerMsg.includes('덱') || lowerMsg.includes('deck')) {
      return { intent: 'create_doc', entities: { templateKey: 'DECK_COMPANY_BRAND_15P' } };
    }
    if (lowerMsg.includes('계약서')) return { intent: 'create_doc', entities: { templateKey: 'CONTRACT_SALES' } };

    if (lowerMsg.includes('팔 수 있') || lowerMsg.includes('수출 가능') || lowerMsg.includes('규제 확인') || lowerMsg.includes('규제 체크') || lowerMsg.includes('컴플라이언스')) {
      const detectedCountry = Object.entries(COUNTRY_KEYWORDS).find(([kw]) => lowerMsg.includes(kw));
      if (detectedCountry) {
        return { intent: 'run_compliance_country', entities: { countryCode: detectedCountry[1], countryKeyword: detectedCountry[0] } };
      }
      return { intent: 'run_compliance', entities: {} };
    }

    if (lowerMsg.includes('게이트') || lowerMsg.includes('체크') || lowerMsg.includes('검사')) return { intent: 'run_gate', entities: {} };
    if (lowerMsg.includes('첫 제안') || lowerMsg.includes('첫제안')) return { intent: 'select_preset', entities: { preset: 'FIRST_PROPOSAL' } };
    if (lowerMsg.includes('샘플')) return { intent: 'select_preset', entities: { preset: 'SAMPLE' } };
    if (lowerMsg.includes('본오더') || lowerMsg.includes('본 오더')) return { intent: 'select_preset', entities: { preset: 'PURCHASE_ORDER' } };
    
    return { intent: 'help', entities: {} };
  };



  // Local-only intents that don't need AI
  const processLocalIntent = async (intent: string, entities: Record<string, any>): Promise<string | null> => {
    if (!activeSessionId) return '세션이 없습니다.';
    const activeDoc = getActiveDoc();
    
    switch (intent) {
      case 'show_preview': {
        if (!activeDoc) return '표시할 문서가 없습니다. 먼저 문서를 생성해주세요.';
        setLayoutMode('SPLIT_WORKBENCH');
        setWorkbenchTab('PREVIEW');
        return `📄 "${activeDoc.title}" 미리보기를 우측 패널에 표시했습니다.`;
      }
      case 'update_fields': {
        if (!activeDoc) return '먼저 문서를 선택해주세요. Files 탭에서 문서를 클릭하세요.';
        const { field, value } = entities;
        let patch: Record<string, any> = {};
        let description = '';
        
        if (field === 'moq') {
          patch = { moq: value };
          const updatedItems = activeDoc.fields.items?.map((item: any) => ({
            ...item, qty: value, amount: value * item.unitPrice,
          }));
          if (updatedItems) {
            patch.items = updatedItems;
            patch.totalAmount = updatedItems.reduce((sum: number, i: any) => sum + i.amount, 0);
          }
          description = `MOQ를 ${value}으로 변경했습니다.`;
        } else if (field === 'unitPrice') {
          const updatedItems = activeDoc.fields.items?.map((item: any) => ({
            ...item, unitPrice: value, amount: item.qty * value,
          }));
          if (updatedItems) {
            patch.items = updatedItems;
            patch.totalAmount = updatedItems.reduce((sum: number, i: any) => sum + i.amount, 0);
          }
          description = `단가를 $${value}로 변경했습니다.`;
        }
        
        if (Object.keys(patch).length > 0) {
          applyFieldPatch({ docId: activeDoc.docId, patch });
          appendAction(activeSessionId, { type: 'update_fields', payload: { field, value }, status: 'ok' });
          incrementMetric(activeSessionId, 'fieldsUpdated');
          setWorkbenchTab('PREVIEW');
          return `✅ ${description}\n\n미리보기가 업데이트되었습니다.`;
        }
        return '변경할 내용을 찾지 못했습니다.';
      }
      case 'create_doc': {
        const { templateKey } = entities;
        const docId = createDocFromTemplate({ templateKey, preset: project.stagePreset });
        if (docId) {
          appendAction(activeSessionId, { type: 'create_doc', payload: { templateKey }, status: 'ok' });
          linkDocToSession(activeSessionId, docId);
          incrementMetric(activeSessionId, 'docsCreated');
          setLayoutMode('SPLIT_WORKBENCH');
          setWorkbenchTab('PREVIEW');
          return `✅ 문서가 생성되었습니다!\n\n우측 Preview에서 확인하세요.`;
        }
        appendAction(activeSessionId, { type: 'create_doc', payload: { templateKey }, status: 'fail' });
        return '문서 생성에 실패했습니다.';
      }
      case 'run_compliance_country': {
        const { countryCode } = entities;
        appendAction(activeSessionId, { type: 'run_compliance', payload: { country: countryCode }, status: 'ok' });
        incrementMetric(activeSessionId, 'complianceChecks');
        setLayoutMode('SPLIT_WORKBENCH');
        setWorkbenchTab('GATE');
        const names: Record<string, string> = {
          US: '미국', JP: '일본', EU: 'EU', HK: '홍콩', TW: '대만',
          CN: '중국', VN: '베트남', ID: '인도네시아', MY: '말레이시아', TH: '태국', AU: '호주',
        };
        const countryName = names[countryCode] || countryCode;
        return `🔍 ${countryName}(${countryCode}) 규제 진단을 실행합니다.\n\n우측 [규제 진단] 탭에서 Traffic Light 결과를 확인하세요.`;
      }
      case 'run_compliance':
        appendAction(activeSessionId, { type: 'run_compliance', payload: {}, status: 'ok' });
        incrementMetric(activeSessionId, 'complianceChecks');
        setLayoutMode('SPLIT_WORKBENCH');
        setWorkbenchTab('GATE');
        return '📋 우측 [규제 진단] 탭에서 모든 타겟 국가의 규제 결과를 확인하세요.';
      case 'run_gate':
        if (project.stagePreset !== 'PURCHASE_ORDER') return '⚠️ Gate 점검은 본오더 단계에서만 가능합니다.';
        appendAction(activeSessionId, { type: 'run_gate', payload: {}, status: 'ok' });
        setWorkbenchTab('GATE');
        return '🔍 Gate 탭에서 문서 간 불일치를 확인하세요.';
      case 'select_preset': {
        const preset = entities.preset;
        setPreset(preset);
        appendAction(activeSessionId, { type: 'select_preset', payload: { preset }, status: 'ok' });
        const presetNames: Record<string, string> = { 'FIRST_PROPOSAL': '첫 제안', 'SAMPLE': '샘플', 'PURCHASE_ORDER': '본오더' };
        setLayoutMode('SPLIT_WORKBENCH');
        setWorkbenchTab('FILES');
        return `✅ ${presetNames[preset]} 단계로 전환했습니다.\n\n우측 Files 탭에서 문서를 선택하세요.`;
      }
      default:
        return null; // null means "use AI streaming"
    }
  };

  // Build context for AI calls
  const buildAIContext = useCallback(() => {
    const activeDoc = getActiveDoc();
    const cs = useProjectStore.getState().companySettings;
    const ctx: Record<string, any> = {};
    
    if (project.targetCountries?.length) {
      ctx.targetCountry = project.targetCountries[0];
    }
    if (activeDoc) {
      ctx.activeDoc = {
        docId: activeDoc.docId,
        templateKey: activeDoc.templateKey,
        status: activeDoc.status,
        fields: activeDoc.fields,
      };
    }
    // Add company info for email/doc context
    ctx.companyInfo = {
      name: cs.companyName,
      contactName: cs.contactName,
      contactEmail: cs.contactEmail,
      contactPhone: cs.contactPhone,
    };
    return ctx;
  }, [getActiveDoc, project]);

  // Parse AI response to detect rich output type
  const parseAIResponse = (text: string): { outputType: 'email' | 'document' | 'slide' | 'text'; title: string; html: string; emailData?: any } => {
    // Check if response contains Subject: pattern (email)
    const subjectMatch = text.match(/Subject:\s*(.+?)(?:\n|$)/i);
    if (subjectMatch) {
      const subject = subjectMatch[1].trim();
      const body = text.replace(/Subject:\s*.+?(?:\n|$)/i, '').trim();
      const cs = useProjectStore.getState().companySettings;
      const emailHtml = `<h2>${sanitizeHTML(subject)}</h2><hr/><div style="white-space:pre-wrap;">${sanitizeHTML(body)}</div>`;
      return {
        outputType: 'email',
        title: subject,
        html: emailHtml,
        emailData: {
          subject,
          to: '[buyer@company.com]',
          from: cs.contactEmail || 'export@company.com',
          body,
          signature: '',
        },
      };
    }

    // Check for document-like structure (tables, headers with formal content)
    const hasTable = /<table|┌|┃|│|No\.|Item\s+Description/i.test(text);
    const hasDocHeader = /Certificate|Invoice|Proforma|Contract|증명서|견적서|계약서|인보이스/i.test(text);
    if (hasTable || hasDocHeader) {
      const title = text.split('\n')[0]?.replace(/^#+\s*/, '').trim().slice(0, 80) || '생성된 문서';
      // Convert markdown-style content to simple HTML
      const html = `<div style="font-family:sans-serif;padding:20px;">${sanitizeHTML(
        text.replace(/\n/g, '<br/>')
      )}</div>`;
      return { outputType: 'document', title, html };
    }

    return { outputType: 'text', title: '', html: '' };
  };
  
  // Stream AI response and render as rich cards or text
  const streamAIResponse = useCallback(async (userText: string) => {
    if (!activeSessionId) return;

    const historyMessages = messages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.text,
    }));

    // Add placeholder assistant message
    let assistantSoFar = '';
    const assistantMsgIdx = messages.length + 1; // user msg at length, assistant at length+1

    appendMessage(activeSessionId, { role: 'agent', text: '...' });

    const updateAssistantMsg = (text: string) => {
      const session = useSessionStore.getState().sessions[activeSessionId];
      if (!session) return;
      const msgs = [...session.messages];
      const lastIdx = msgs.length - 1;
      if (lastIdx >= 0 && msgs[lastIdx].role === 'agent') {
        msgs[lastIdx] = { ...msgs[lastIdx], text };
        useSessionStore.setState(state => ({
          sessions: { ...state.sessions, [activeSessionId]: { ...session, messages: msgs } },
        }));
      }
    };

    try {
      await streamTradeAssistant({
        messages: [...historyMessages, { role: 'user', content: userText }],
        context: buildAIContext(),
        onDelta: (delta) => {
          assistantSoFar += delta;
          updateAssistantMsg(assistantSoFar);
        },
        onToolCalls: (toolCalls) => {
          handleToolCalls(toolCalls);
        },
        onDone: () => {
          // Check if the final response should be rendered as rich card
          const parsed = parseAIResponse(assistantSoFar);
          if (parsed.outputType === 'email') {
            updateAssistantMsg('__RICH_EMAIL__');
            const emailHtml = parsed.html;
            setAdHocDoc({ html: emailHtml, title: parsed.title, outputType: 'email' });
            setDocMessageMap(prev => ({
              ...prev,
              [assistantMsgIdx]: {
                html: emailHtml,
                title: parsed.title,
                outputType: 'email',
                emailData: parsed.emailData,
              },
            }));
          } else if (parsed.outputType === 'document') {
            updateAssistantMsg('__RICH_DOCUMENT__');
            setAdHocDoc({ html: parsed.html, title: parsed.title, outputType: 'document' });
            setDocMessageMap(prev => ({
              ...prev,
              [assistantMsgIdx]: { html: parsed.html, title: parsed.title, outputType: 'document' },
            }));
          }
          setIsProcessing(false);
        },
        onError: (error) => {
          updateAssistantMsg(`⚠️ ${error}`);
          setIsProcessing(false);
        },
      });
    } catch (e) {
      console.error('AI stream error:', e);
      updateAssistantMsg('⚠️ AI 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      setIsProcessing(false);
    }
  }, [activeSessionId, messages, buildAIContext, appendMessage, handleToolCalls]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || !activeSessionId) return;
    
    const userText = input.trim();
    appendMessage(activeSessionId, { role: 'user', text: userText });
    setInput('');
    setIsProcessing(true);
    setProcessingStartTime(Date.now());
    
    const { intent, entities } = detectIntent(userText);
    
    // Try local processing first
    const localResult = await processLocalIntent(intent, entities);
    if (localResult !== null) {
      // Local intent handled — show result immediately
      const isDocIntent = ['adhoc_doc', 'create_doc'].includes(intent);
      setTimeout(() => {
        appendMessage(activeSessionId, { role: 'agent', text: localResult });
        if (isDocIntent && adHocDoc) {
          const msgIdx = messages.length + 1;
          setDocMessageMap(prev => ({ ...prev, [msgIdx]: { html: adHocDoc.html, title: adHocDoc.title } }));
        }
        setIsProcessing(false);
      }, 300);
      return;
    }
    
    // AI-powered response via streaming
    await streamAIResponse(userText);
  };
  
  const handlePackageAction = async (actionId: string) => {
    if (!activeSessionId) return;
    
    let intent = '';
    let entities: Record<string, any> = {};
    let userMessage = '';
    
    switch (actionId) {
      case 'first_proposal':
        intent = 'select_preset'; entities = { preset: 'FIRST_PROPOSAL' };
        userMessage = '첫 제안 패키지를 시작할게요';
        break;
      case 'sample':
        intent = 'select_preset'; entities = { preset: 'SAMPLE' };
        userMessage = '샘플 발송 서류를 준비할게요';
        break;
      case 'bulk':
        intent = 'select_preset'; entities = { preset: 'PURCHASE_ORDER' };
        userMessage = '본오더 패키지를 준비할게요';
        break;
      case 'compliance':
        intent = 'run_compliance'; entities = {};
        userMessage = '규제 요건을 확인할게요';
        break;
      default:
        return;
    }
    
    appendMessage(activeSessionId, { role: 'user', text: userMessage });
    setIsProcessing(true);
    setProcessingStartTime(Date.now());
    const response = await processLocalIntent(intent, entities);
    setTimeout(() => {
      appendMessage(activeSessionId, { role: 'agent', text: response || '처리할 수 없습니다.' });
      setIsProcessing(false);
    }, 300);
  };

  const handleAdHocDocAction = async (docType: typeof ADHOC_DOC_TYPES[0]) => {
    if (!activeSessionId) return;
    const userText = `${docType.label} 작성해줘`;
    appendMessage(activeSessionId, { role: 'user', text: userText });
    setIsProcessing(true);
    setProcessingStartTime(Date.now());
    
    // Use AI to generate the document
    await streamAIResponse(userText);
  };

  const handleSaveToProject = (projectId: string, docType: string, customTitle?: string) => {
    if (!adHocDoc) return;
    const docTypeLabel = docType === 'CUSTOM' 
      ? customTitle || adHocDoc.title
      : EXPORT_DOC_TYPES.find(d => d.value === docType)?.label || adHocDoc.title;
    const doc: Omit<DocumentInstance, 'projectId'> = {
      id: `doc_${Date.now()}`,
      docKey: docType === 'CUSTOM' ? 'ADHOC' : docType,
      title: docTypeLabel,
      status: 'draft',
      fields: {},
      html: adHocDoc.html,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addDocumentToProject(projectId, doc);
    const proj = projects.find(p => p.id === projectId);
    toast.success(`"${docTypeLabel}"이(가) "${proj?.name}" 프로젝트에 저장되었습니다.`);
    setAdHocDoc(null);
  };
  
  const hasMessages = messages.length > 0;
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Messages Area */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col min-h-full px-6 py-8">
          {!hasMessages ? (
            /* Empty state - centered greeting with project briefing */
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* AI Avatar & Greeting */}
                <div className="flex flex-col items-center mb-10">
                  <div className="relative mb-6">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-lg">
                      <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-background" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
                    환영합니다!
                  </h1>
                  {/* Project Briefing */}
                  <p className="text-muted-foreground text-center text-sm md:text-base max-w-md">
                    {projectCount > 0
                      ? `현재 ${projectCount}개의 수출 프로젝트가 진행 중입니다.`
                      : 'K-뷰티 수출 문서 작성부터 규제 확인까지, AI가 함께합니다'}
                  </p>
                </div>
                
                {/* Package Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                  {PACKAGE_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handlePackageAction(action.id)}
                      className={cn(
                        "flex flex-col items-start p-4 rounded-xl border border-border",
                        "bg-card hover:bg-muted/50 hover:border-primary/30",
                        "transition-all duration-200 hover:shadow-sm text-left"
                      )}
                    >
                      <span className="text-2xl mb-2">{action.icon}</span>
                      <span className="text-sm font-medium text-foreground">{action.label}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">{action.description}</span>
                    </button>
                  ))}
                </div>

                {/* Ad-hoc Document Actions */}
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground text-center mb-3">자유 양식 서류 생성</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {ADHOC_DOC_TYPES.map((docType) => (
                      <button
                        key={docType.id}
                        onClick={() => handleAdHocDocAction(docType)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                          "bg-secondary/50 hover:bg-secondary border border-border/50",
                          "text-xs text-foreground/80 hover:text-foreground",
                          "transition-all duration-200 hover:shadow-sm hover:border-primary/30"
                        )}
                      >
                        <span>{docType.icon}</span>
                        <span>{docType.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Example prompts */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center mb-3">이런 것들을 시도해 보세요</p>
                  <div className="grid grid-cols-2 gap-2">
                    {EXAMPLE_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(prompt)}
                        className={cn(
                          "text-left px-3 py-2 rounded-lg text-xs",
                          "bg-card/50 hover:bg-card border border-border/50 hover:border-border",
                          "text-muted-foreground hover:text-foreground",
                          "transition-all duration-200 truncate"
                        )}
                      >
                        "{prompt}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <div className="w-full max-w-2xl mx-auto space-y-4 pb-4">
              {messages.map((msg, idx) => {
                const docInfo = msg.role === 'agent' ? docMessageMap[idx] : null;
                const isRichOutput = msg.role === 'agent' && docInfo && (
                  msg.text === '__RICH_EMAIL__' || msg.text === '__RICH_DOCUMENT__' || msg.text === '__RICH_SLIDE__'
                );

                // Render rich output cards instead of plain text
                if (isRichOutput && docInfo) {
                  return (
                    <div key={idx} className="flex justify-start">
                      <div className="max-w-[90%] w-full">
                        {docInfo.outputType === 'email' && docInfo.emailData ? (
                          <EmailPreviewCard
                            subject={docInfo.emailData.subject}
                            to={docInfo.emailData.to}
                            from={docInfo.emailData.from}
                            body={docInfo.emailData.body}
                            signature={docInfo.emailData.signature}
                          />
                        ) : docInfo.outputType === 'slide' ? (
                          <SlidePreviewCard title={docInfo.title} html={docInfo.html} />
                        ) : (
                          <DocumentPreviewCard title={docInfo.title} html={docInfo.html} />
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] px-4 py-3 rounded-2xl text-sm",
                        msg.role === 'user'
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
              
              {/* Ad-hoc document editor inline */}
              {adHocDoc && (
                <div className="w-full">
                  <AdHocDocEditor
                    docHtml={adHocDoc.html}
                    docTitle={adHocDoc.title}
                    onSaveToProject={handleSaveToProject}
                    onClose={() => setAdHocDoc(null)}
                    projects={projects.map(p => ({ id: p.id, name: p.name }))}
                  />
                </div>
              )}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <GenerationProgress startTime={processingStartTime} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Bottom Input Bar */}
      <div className="border-t border-border/50 bg-background px-4 py-3">
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Quick Action Bar */}
          <QuickActionBar 
            onAction={(actionId, prompt) => {
              if (actionId === 'attach') return;
              if (prompt) handlePackageAction(actionId);
            }}
          />
          <form onSubmit={handleSubmit}>
            <div className="relative bg-muted/40 rounded-2xl border border-border shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={displayedText || 'K-뷰티 AI 무역비서에게 물어보세요...'}
                disabled={isProcessing}
                rows={1}
                className={cn(
                  "w-full px-4 pt-3 pb-10 bg-transparent resize-none",
                  "text-sm text-foreground placeholder:text-muted-foreground/50",
                  "focus:outline-none disabled:opacity-50",
                  "min-h-[48px] max-h-[200px]"
                )}
              />
              
              {/* Bottom toolbar */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={() => { /* file upload placeholder */ }}>
                      <Paperclip className="h-4 w-4 mr-2" />
                      파일 첨부
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {PACKAGE_ACTIONS.map((action) => (
                      <DropdownMenuItem 
                        key={action.id}
                        onClick={() => handlePackageAction(action.id)}
                      >
                        <span className="mr-2">{action.icon}</span>
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    {ADHOC_DOC_TYPES.map((docType) => (
                      <DropdownMenuItem
                        key={docType.id}
                        onClick={() => handleAdHocDocAction(docType)}
                      >
                        <span className="mr-2">{docType.icon}</span>
                        {docType.label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handlePackageAction('compliance')}>
                      <span className="mr-2">✅</span>
                      규제 체크
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={() => setInput('현재 프로젝트의 다음 단계를 계획해줘')}
                  >
                    Plan
                  </Button>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isProcessing}
                    className={cn(
                      "h-7 w-7 rounded-full",
                      "bg-foreground hover:bg-foreground/90 text-background",
                      "transition-all duration-200",
                      !input.trim() && "opacity-50"
                    )}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
