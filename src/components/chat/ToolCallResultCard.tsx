import React from 'react';
import { ArrowRight, FileText, PenLine, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ToolCall } from '@/lib/api/tradeAssistant';

interface ToolCallResultCardProps {
  toolCall: ToolCall;
  beforeValue?: string;
  success: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  moq: 'MOQ (최소주문수량)',
  incoterms: '인코텀즈',
  paymentTerms: '결제조건',
  leadTime: '납기 (일)',
  validityDays: '유효기간 (일)',
  shippingCost: '배송비',
  portOfLoading: '선적항',
  portOfDischarge: '도착항',
  unitPrice: '단가',
  qty: '수량',
};

const TEMPLATE_LABELS: Record<string, string> = {
  PI_SAMPLE: '샘플 PI',
  PI_FINAL: '최종 PI',
  CONTRACT_SALES: '판매 계약서',
  INVOICE_COMMERCIAL: '상업 송장',
  CATALOG_15P: '제품 카탈로그',
  DECK_COMPANY_BRAND_15P: '브랜드 소개서',
  COMPLIANCE_SNAPSHOT_15P: '수출 준비 요약',
  EMAIL_FIRST_OUTREACH: '첫 제안 이메일',
  EMAIL_FOLLOW_UP: '후속 이메일',
  EMAIL_SAMPLE: '샘플 이메일',
  PL_SAMPLE: '샘플 포장명세서',
  PL_FINAL: '포장명세서',
  MEMO_LABEL_CHECK: '라벨 체크 메모',
  SHIPPING_INSTRUCTION: '선적 지시서',
  GATE_CROSSCHECK_PO: 'Cross-check Gate',
};

function getFieldLabel(path: string): string {
  // Handle array paths like 'items[0].unitPrice'
  const arrayMatch = path.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
  if (arrayMatch) {
    const [, , index, prop] = arrayMatch;
    return `품목 #${parseInt(index) + 1} ${FIELD_LABELS[prop] || prop}`;
  }
  // Handle all_items paths
  const allMatch = path.match(/^all_items\.(\w+)$/);
  if (allMatch) {
    return `전체 품목 ${FIELD_LABELS[allMatch[1]] || allMatch[1]}`;
  }
  return FIELD_LABELS[path] || path;
}

export function ToolCallResultCard({ toolCall, beforeValue, success }: ToolCallResultCardProps) {
  const isFieldUpdate = toolCall.name === 'update_document_field';
  const isDocGenerate = toolCall.name === 'generate_document';

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden my-2 max-w-[340px]",
      success ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 text-xs font-medium",
        success ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
      )}>
        {success ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5" />
        )}
        {isFieldUpdate && <span>필드 수정</span>}
        {isDocGenerate && <span>문서 생성</span>}
        <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1.5">
          {success ? '완료' : '실패'}
        </Badge>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5">
        {isFieldUpdate && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <PenLine className="h-3 w-3" />
              <span className="font-medium">{getFieldLabel(toolCall.arguments.field_path || '')}</span>
            </div>
            <div className="flex items-center gap-2">
              {beforeValue !== undefined && (
                <>
                  <span className="text-sm text-muted-foreground line-through bg-muted/50 px-2 py-0.5 rounded">
                    {beforeValue}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                </>
              )}
              <span className="text-sm font-semibold text-foreground bg-primary/10 px-2 py-0.5 rounded">
                {toolCall.arguments.new_value}
              </span>
            </div>
          </div>
        )}

        {isDocGenerate && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {TEMPLATE_LABELS[toolCall.arguments.template_key || ''] || toolCall.arguments.template_key}
              </p>
              <p className="text-xs text-muted-foreground">
                {toolCall.arguments.preset === 'FIRST_PROPOSAL' ? '첫 제안' :
                 toolCall.arguments.preset === 'SAMPLE' ? '샘플' : '본오더'} 단계
              </p>
            </div>
          </div>
        )}

        {/* Reason */}
        <p className="text-xs text-muted-foreground mt-2 italic">
          💡 {toolCall.arguments.reason}
        </p>
      </div>
    </div>
  );
}
