import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/appStore';
import { useDocumentVersioning } from '@/hooks/useDocumentVersioning';
import { toast } from 'sonner';
import { DollarSign, Package, Ship, Clock, FileText, CreditCard, Hash } from 'lucide-react';

interface FieldEditorProps {
  docId: string;
  fields: Record<string, any>;
  locked: boolean;
}

const INCOTERMS_OPTIONS = ['FOB', 'CIF', 'DDP', 'EXW', 'CFR', 'DAP', 'FCA'];
const PAYMENT_OPTIONS = ['T/T 30/70', 'T/T 100%', 'L/C', 'Escrow', 'D/A', 'D/P'];
const CURRENCY_OPTIONS = ['USD', 'JPY', 'EUR', 'CNY', 'HKD', 'TWD'];

interface FieldGroupProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function FieldGroup({ icon, title, children }: FieldGroupProps) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
}

export function FieldEditor({ docId, fields, locked }: FieldEditorProps) {
  const { applyFieldPatch } = useAppStore();
  const { saveVersion } = useDocumentVersioning();

  const update = (field: string, value: any, label: string) => {
    saveVersion(docId, `${label} 변경`);
    applyFieldPatch({ docId, patch: { [field]: value } });
    toast.success(`${label} 변경 완료`);
  };

  const updateNumber = (field: string, rawValue: string, label: string) => {
    const num = parseFloat(rawValue);
    if (!isNaN(num)) {
      update(field, num, label);
    }
  };

  // Recalculate items total when price/qty changes
  const updateItemField = (itemIndex: number, itemField: string, rawValue: string, label: string) => {
    const num = parseFloat(rawValue);
    if (isNaN(num)) return;

    const items = [...(fields.items || [])];
    if (!items[itemIndex]) return;

    items[itemIndex] = { ...items[itemIndex], [itemField]: num };
    if (itemField === 'qty' || itemField === 'unitPrice') {
      items[itemIndex].amount = items[itemIndex].qty * items[itemIndex].unitPrice;
    }

    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    const grandTotal = totalAmount + (fields.shippingCost || 0);

    applyFieldPatch({ docId, patch: { items, totalAmount, grandTotal } });
    toast.success(`${label} 변경 완료`);
  };

  const hasField = (key: string) => fields[key] !== undefined;

  return (
    <div className="space-y-4">
      {/* Trade Terms */}
      {(hasField('incoterms') || hasField('paymentTerms') || hasField('currency')) && (
        <FieldGroup icon={<Ship className="h-4 w-4 text-primary" />} title="거래 조건">
          {hasField('incoterms') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">인코텀즈</Label>
              <Select
                value={fields.incoterms || 'FOB'}
                onValueChange={(v) => update('incoterms', v, '인코텀즈')}
                disabled={locked}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOTERMS_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {hasField('paymentTerms') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">결제 조건</Label>
              <Select
                value={fields.paymentTerms || 'T/T 30/70'}
                onValueChange={(v) => update('paymentTerms', v, '결제 조건')}
                disabled={locked}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {hasField('currency') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">통화</Label>
              <Select
                value={fields.currency || 'USD'}
                onValueChange={(v) => update('currency', v, '통화')}
                disabled={locked}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </FieldGroup>
      )}

      {/* Quantity & Pricing */}
      {(hasField('moq') || hasField('unitPrice') || hasField('totalAmount') || hasField('shippingCost')) && (
        <FieldGroup icon={<DollarSign className="h-4 w-4 text-primary" />} title="수량 및 가격">
          {hasField('moq') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">MOQ (최소주문수량)</Label>
              <Input
                type="number"
                className="h-9 text-sm"
                defaultValue={fields.moq}
                disabled={locked}
                onBlur={(e) => updateNumber('moq', e.target.value, 'MOQ')}
              />
            </div>
          )}
          {hasField('unitPrice') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">단가 ($)</Label>
              <Input
                type="number"
                step="0.01"
                className="h-9 text-sm"
                defaultValue={fields.unitPrice}
                disabled={locked}
                onBlur={(e) => updateNumber('unitPrice', e.target.value, '단가')}
              />
            </div>
          )}
          {hasField('shippingCost') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">배송비 ($)</Label>
              <Input
                type="number"
                step="0.01"
                className="h-9 text-sm"
                defaultValue={fields.shippingCost}
                disabled={locked}
                onBlur={(e) => updateNumber('shippingCost', e.target.value, '배송비')}
              />
            </div>
          )}
          {hasField('totalAmount') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">총액</Label>
              <div className="h-9 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-medium">
                ${(fields.totalAmount || 0).toLocaleString()}
              </div>
            </div>
          )}
          {hasField('grandTotal') && (
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Grand Total (배송비 포함)</Label>
              <div className="h-9 flex items-center px-3 rounded-md border bg-primary/5 text-sm font-bold text-primary">
                ${(fields.grandTotal || 0).toLocaleString()}
              </div>
            </div>
          )}
        </FieldGroup>
      )}

      {/* Delivery */}
      {(hasField('leadTime') || hasField('validityDays')) && (
        <FieldGroup icon={<Clock className="h-4 w-4 text-primary" />} title="납기 및 유효기간">
          {hasField('leadTime') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">납기 (일)</Label>
              <Input
                type="number"
                className="h-9 text-sm"
                defaultValue={fields.leadTime}
                disabled={locked}
                onBlur={(e) => updateNumber('leadTime', e.target.value, '납기')}
              />
            </div>
          )}
          {hasField('validityDays') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">견적 유효기간 (일)</Label>
              <Input
                type="number"
                className="h-9 text-sm"
                defaultValue={fields.validityDays}
                disabled={locked}
                onBlur={(e) => updateNumber('validityDays', e.target.value, '유효기간')}
              />
            </div>
          )}
        </FieldGroup>
      )}

      {/* Line Items */}
      {fields.items && fields.items.length > 0 && (
        <FieldGroup icon={<Package className="h-4 w-4 text-primary" />} title="품목 상세">
          <div className="col-span-2 space-y-3">
            {fields.items.map((item: any, idx: number) => (
              <div key={idx} className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">#{idx + 1}</Badge>
                  <span className="text-xs font-medium truncate">{item.name || item.sku || `Item ${idx + 1}`}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">수량</Label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      defaultValue={item.qty}
                      disabled={locked}
                      onBlur={(e) => updateItemField(idx, 'qty', e.target.value, `#${idx + 1} 수량`)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">단가 ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-8 text-xs"
                      defaultValue={item.unitPrice}
                      disabled={locked}
                      onBlur={(e) => updateItemField(idx, 'unitPrice', e.target.value, `#${idx + 1} 단가`)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">소계</Label>
                    <div className="h-8 flex items-center px-2 rounded-md border bg-muted/50 text-xs">
                      ${(item.amount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FieldGroup>
      )}

      {/* Document Info (read-only fields) */}
      {(hasField('sellerName') || hasField('buyerName') || hasField('piNumber') || hasField('issuedDate')) && (
        <FieldGroup icon={<FileText className="h-4 w-4 text-primary" />} title="문서 정보">
          {hasField('piNumber') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">PI 번호</Label>
              <Input
                className="h-9 text-sm"
                defaultValue={fields.piNumber}
                disabled={locked}
                onBlur={(e) => update('piNumber', e.target.value, 'PI 번호')}
              />
            </div>
          )}
          {hasField('issuedDate') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">발행일</Label>
              <Input
                type="date"
                className="h-9 text-sm"
                defaultValue={fields.issuedDate}
                disabled={locked}
                onBlur={(e) => update('issuedDate', e.target.value, '발행일')}
              />
            </div>
          )}
          {hasField('sellerName') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">셀러명</Label>
              <Input
                className="h-9 text-sm"
                defaultValue={fields.sellerName}
                disabled={locked}
                onBlur={(e) => update('sellerName', e.target.value, '셀러명')}
              />
            </div>
          )}
          {hasField('buyerName') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">바이어명</Label>
              <Input
                className="h-9 text-sm"
                defaultValue={fields.buyerName}
                disabled={locked}
                onBlur={(e) => update('buyerName', e.target.value, '바이어명')}
              />
            </div>
          )}
        </FieldGroup>
      )}

      {/* Fallback: show any remaining fields not covered */}
      {renderRemainingFields(fields, locked, docId, applyFieldPatch)}
    </div>
  );
}

const KNOWN_FIELDS = new Set([
  'incoterms', 'paymentTerms', 'currency', 'moq', 'unitPrice', 'totalAmount',
  'shippingCost', 'grandTotal', 'leadTime', 'validityDays', 'items',
  'sellerName', 'buyerName', 'piNumber', 'issuedDate',
]);

function renderRemainingFields(
  fields: Record<string, any>,
  locked: boolean,
  docId: string,
  applyFieldPatch: any
) {
  const remaining = Object.entries(fields).filter(
    ([key, val]) => !KNOWN_FIELDS.has(key) && typeof val !== 'object'
  );

  if (remaining.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Hash className="h-4 w-4 text-muted-foreground" />
        기타 필드
      </div>
      <div className="grid grid-cols-2 gap-3">
        {remaining.map(([key, val]) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{key}</Label>
            <Input
              className="h-9 text-sm"
              defaultValue={String(val)}
              disabled={locked}
              onBlur={(e) => {
                const newVal = typeof val === 'number' ? parseFloat(e.target.value) : e.target.value;
                applyFieldPatch({ docId, patch: { [key]: newVal } });
                toast.success(`${key} 변경 완료`);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
