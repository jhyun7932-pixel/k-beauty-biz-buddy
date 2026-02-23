import React, { useState } from 'react';
import { sanitizeHTML } from '@/lib/sanitize';
import {
  Mail, Copy, ExternalLink, FileText, FileType, Presentation,
  Download, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// ===================== Shared Download Utils =====================

async function downloadAsPDF(html: string, title: string) {
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;width:800px;padding:40px;background:white;font-family:sans-serif;color:#111;';
  container.innerHTML = html;
  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297;
    while (heightLeft > 0) {
      position -= 297;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }
    pdf.save(`${title}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

async function downloadAsWord(html: string, title: string) {
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

// ===================== Email Preview Card =====================

interface EmailPreviewCardProps {
  subject: string;
  to: string;
  from?: string;
  body: string;
  htmlBody?: string;
  signature?: string;
}

export function EmailPreviewCard({ subject, to, from, body, htmlBody, signature }: EmailPreviewCardProps) {
  const [expanded, setExpanded] = useState(true);

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\nTo: ${to}\n\n${body}${signature ? `\n\n${signature}` : ''}`;
    navigator.clipboard.writeText(fullText);
    toast.success('이메일 내용이 복사되었습니다.');
  };

  const handleOpenMailApp = () => {
    const mailtoBody = encodeURIComponent(body + (signature ? `\n\n${signature}` : ''));
    const mailtoSubject = encodeURIComponent(subject);
    window.open(`mailto:${to}?subject=${mailtoSubject}&body=${mailtoBody}`, '_blank');
  };

  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-sm">
      {/* Email header bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/50">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Mail className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground flex-1">이메일 초안</span>
        <Badge variant="secondary" className="text-[10px]">Draft</Badge>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {expanded && (
        <>
          {/* Email meta fields */}
          <div className="px-4 py-3 space-y-1.5 border-b border-border/30 bg-card">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-12 shrink-0">To:</span>
              <span className="font-medium text-foreground">{to}</span>
            </div>
            {from && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-12 shrink-0">From:</span>
                <span className="text-foreground">{from}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-12 shrink-0">Subject:</span>
              <span className="font-semibold text-foreground">{subject}</span>
            </div>
          </div>

          {/* Email body */}
          <div className="px-4 py-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
            {body}
            {signature && (
              <div className="mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground whitespace-pre-wrap">
                {signature}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50 bg-muted/20">
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleOpenMailApp}>
              <ExternalLink className="h-3.5 w-3.5" />
              이메일 앱 열기
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5" />
              복사하기
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

// ===================== Document Preview Card =====================

interface DocumentPreviewCardProps {
  title: string;
  html: string;
  docType?: string;
}

export function DocumentPreviewCard({ title, html, docType }: DocumentPreviewCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (format: 'pdf' | 'word') => {
    setDownloading(format);
    try {
      if (format === 'pdf') await downloadAsPDF(html, title);
      else await downloadAsWord(html, title);
      toast.success(`${format.toUpperCase()} 다운로드 완료!`);
    } catch (e) {
      console.error(e);
      toast.error('다운로드 실패');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/50">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground flex-1 truncate">{title}</span>
        {docType && <Badge variant="secondary" className="text-[10px]">{docType}</Badge>}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {expanded && (
        <>
          {/* Download buttons */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-muted/10">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={downloading !== null}
              onClick={() => handleDownload('word')}
            >
              {downloading === 'word' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileType className="h-3.5 w-3.5" />}
              📄 Word로 다운로드
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={downloading !== null}
              onClick={() => handleDownload('pdf')}
            >
              {downloading === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              📥 PDF로 다운로드
            </Button>
          </div>

          {/* A4 Ratio Document Preview */}
          <div className="px-4 py-4">
            <div
              className="bg-white border border-border/40 rounded-lg shadow-inner overflow-hidden"
              style={{ aspectRatio: '210/297', maxHeight: '500px' }}
            >
              <div
                className="w-full h-full overflow-y-auto p-6 text-sm prose prose-sm dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(html) }}
              />
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

// ===================== Slide Preview Card =====================

interface SlidePreviewCardProps {
  title: string;
  html: string;
}

export function SlidePreviewCard({ title, html }: SlidePreviewCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const container = document.createElement('div');
      container.style.cssText = 'position:absolute;left:-9999px;width:960px;padding:40px;background:white;font-family:sans-serif;color:#111;';
      container.innerHTML = html;
      document.body.appendChild(container);
      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      document.body.removeChild(container);
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 210));
      pdf.save(`${title}.pdf`);
      toast.success('PDF 다운로드 완료!');
    } catch (e) {
      console.error(e);
      toast.error('다운로드 실패');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/50">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Presentation className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground flex-1 truncate">{title}</span>
        <Badge variant="secondary" className="text-[10px]">Slides</Badge>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {expanded && (
        <>
          {/* Download button */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-muted/10">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={downloading}
              onClick={handleDownloadPDF}
            >
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              📥 PDF로 다운로드
            </Button>
          </div>

          {/* 16:9 Slide Preview */}
          <div className="px-4 py-4">
            <div
              className="bg-white border border-border/40 rounded-lg shadow-inner overflow-hidden"
              style={{ aspectRatio: '16/9', maxHeight: '400px' }}
            >
              <div
                className="w-full h-full overflow-y-auto p-6 text-sm prose prose-sm dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(html) }}
              />
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
