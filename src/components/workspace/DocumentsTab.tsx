import React, { useState } from 'react';
import { FileText, AlertTriangle, Edit2, Download, FileType, Loader2, Eye, Save, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Document, ValidationWarning, BuyerGoal } from '@/types';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface DocumentsTabProps {
  documents: Document[];
  warnings: ValidationWarning[];
  onFixWarning: (warningId: string) => void;
  onUpdateDocument?: (docId: string, content: string) => void;
  goal?: BuyerGoal | null;
}

export function DocumentsTab({ documents, warnings, onFixWarning, onUpdateDocument, goal }: DocumentsTabProps) {
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const { toast } = useToast();

  // 편집 시작
  const startEditing = (doc: Document) => {
    setEditingDocId(doc.id);
    setEditContent(doc.content);
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingDocId(null);
    setEditContent('');
  };

  // 편집 저장
  const saveEditing = (docId: string) => {
    if (onUpdateDocument) {
      onUpdateDocument(docId, editContent);
      toast({
        title: '문서가 저장되었습니다',
        description: '수정 내용이 반영되었습니다.',
      });
    }
    setEditingDocId(null);
    setEditContent('');
  };

  // PDF 다운로드
  const downloadPDF = async (doc: Document) => {
    setDownloading(`${doc.id}-pdf`);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '794px';
      container.style.padding = '40px';
      container.style.fontFamily = 'sans-serif';
      container.style.backgroundColor = '#ffffff';
      container.innerHTML = `
        <div style="border-bottom: 2px solid #2F6BFF; padding-bottom: 20px; margin-bottom: 20px;">
          <div style="font-size: 24px; font-weight: bold; color: #0F172A;">${doc.title}</div>
          <div style="background: #FEF3C7; color: #92400E; padding: 4px 12px; border-radius: 4px; font-size: 12px; display: inline-block; margin-top: 10px;">⚠️ 초안 - 최종 제출 전 확인 필요</div>
        </div>
        <div style="white-space: pre-wrap; font-family: monospace; line-height: 1.8;">${doc.content}</div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; font-size: 12px; color: #64748B; text-align: center;">
          <p>K-Beauty AI 무역비서로 생성됨</p>
        </div>
      `;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${doc.title}.pdf`);
      document.body.removeChild(container);

      toast({
        title: 'PDF 다운로드 완료!',
        description: `${doc.title}이(가) 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: '다운로드 실패',
        description: '파일 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };

  // Word 다운로드
  const downloadWord = async (doc: Document) => {
    setDownloading(`${doc.id}-word`);
    try {
      const wordDoc = new DocxDocument({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: '⚠️ 초안 - 최종 제출 전 확인 필요', color: '92400E', size: 20 })],
            }),
            new Paragraph({
              text: doc.title,
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({ text: '' }),
            ...doc.content.split('\n').map(line => 
              new Paragraph({ text: line })
            ),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [new TextRun({ text: 'K-Beauty AI 무역비서로 생성됨', color: '64748B', size: 20 })],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(wordDoc);
      saveAs(blob, `${doc.title}.docx`);

      toast({
        title: 'Word 다운로드 완료!',
        description: `${doc.title}이(가) 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error('Word download error:', error);
      toast({
        title: '다운로드 실패',
        description: '파일 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="p-4 rounded-full bg-muted/20 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          아직 서류가 없어요
        </h3>
        <p className="text-sm text-muted-foreground max-w-[300px]">
          거래 조건을 말해주시면 PI/계약서 초안을 만들게요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <StatusBanner 
        status={warnings.length > 0 ? 'confirm' : 'draft'} 
        message={warnings.length > 0 ? `경고 ${warnings.length}개가 발견되었습니다.` : undefined}
      />

      {/* Warnings Panel */}
      {warnings.length > 0 && (
        <div className="p-4 border-b border-border bg-warning/5">
          <div className="space-y-2">
            {warnings.map((warning) => (
              <div 
                key={warning.id}
                className="warning-shake flex items-start gap-3 p-3 rounded-lg bg-card border border-warning/30"
              >
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{warning.message}</p>
                  {warning.suggestedFix && (
                    <p className="text-xs text-muted-foreground mt-1">
                      권장: {warning.suggestedFix}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => onFixWarning(warning.id)}
                >
                  수정하기
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            ⓘ 실수 체크는 '딜 지연/클레임' 리스크를 줄여줘요.
          </p>
        </div>
      )}

      {/* Documents Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {documents.map((doc) => {
            const isEditing = editingDocId === doc.id;
            
            return (
              <div key={doc.id} className="document-preview flex flex-col">
                {/* Document Header */}
                <div className="document-header">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">{doc.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge-draft">초안</span>
                      {/* Download Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0"
                            disabled={downloading?.startsWith(doc.id)}
                          >
                            {downloading?.startsWith(doc.id) ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => downloadPDF(doc)}>
                            <FileText className="h-4 w-4 mr-2" />
                            PDF 다운로드
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadWord(doc)}>
                            <FileType className="h-4 w-4 mr-2" />
                            Word 다운로드
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                
                {/* Document Content */}
                <div className="flex-1 p-4 bg-white">
                  {isEditing ? (
                    <Textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[300px] text-xs font-mono leading-relaxed resize-none"
                    />
                  ) : (
                    <pre 
                      className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-[300px] overflow-auto cursor-pointer hover:bg-muted/10 transition-colors p-2 rounded"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      {doc.content}
                    </pre>
                  )}
                </div>

                {/* Document Footer */}
                <div className="p-3 border-t border-border bg-muted/10 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {isEditing ? '수정 중...' : '클릭하여 미리보기'}
                  </span>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs gap-1 h-7"
                          onClick={cancelEditing}
                        >
                          <X className="h-3 w-3" />
                          취소
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="text-xs gap-1 h-7"
                          onClick={() => saveEditing(doc.id)}
                        >
                          <Check className="h-3 w-3" />
                          저장
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs gap-1 h-7"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <Eye className="h-3 w-3" />
                          미리보기
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs gap-1 h-7"
                          onClick={() => startEditing(doc)}
                        >
                          <Edit2 className="h-3 w-3" />
                          수정
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-3 rounded-lg bg-primary/5 text-center">
          <p className="text-sm text-muted-foreground">
            수정하면 관련 문서에도 자동 반영돼요.
          </p>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewDoc !== null} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {previewDoc?.title || '문서 미리보기'}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => previewDoc && downloadPDF(previewDoc)}
                  disabled={downloading !== null}
                >
                  {downloading?.endsWith('-pdf') ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => previewDoc && downloadWord(previewDoc)}
                  disabled={downloading !== null}
                >
                  {downloading?.endsWith('-word') ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileType className="h-4 w-4" />
                  )}
                  Word
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    if (previewDoc) {
                      startEditing(previewDoc);
                      setPreviewDoc(null);
                    }
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                  수정
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-6 bg-muted/30">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-[700px] mx-auto">
              <div className="mb-4 pb-4 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">{previewDoc?.title}</h2>
                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-warning/20 text-warning-foreground rounded">
                  ⚠️ 초안 - 최종 제출 전 확인 필요
                </span>
              </div>
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {previewDoc?.content}
              </pre>
              <div className="mt-8 pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">K-Beauty AI 무역비서로 생성됨</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 border-t border-border bg-muted/20 text-center flex-shrink-0">
            <p className="text-xs text-muted-foreground">
              ⓘ 이 문서는 초안입니다. 최종 제출 전 내용을 반드시 확인해 주세요.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
