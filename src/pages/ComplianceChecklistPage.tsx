import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  CheckCircle, AlertTriangle, AlertCircle, Shield, Mail, ChevronDown, ChevronUp,
  Package, FlaskConical, Globe, ChevronRight,
} from 'lucide-react';
import {
  RULEPACK_DATA,
  getExportableCountries,
  computeDynamicRulePack,
  type ComplianceCheckItem,
} from '@/data/complianceRulePacks';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';

const RULEPACK_COUNTRIES = ['US', 'EU', 'JP', 'CN', 'TH', 'VN', 'ID', 'MY', 'TW', 'AU', 'HK'];

// ─────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────
function StatusIcon({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  if (status === 'pass') return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />;
  if (status === 'warn') return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />;
  return <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
}

function StatusBadge({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  const map = {
    pass: { label: '🟢 Pass', cls: 'bg-green-500/10 text-green-700 border-green-500/30' },
    warn: { label: '🟡 Warn', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/30' },
    fail: { label: '🔴 Fail', cls: 'bg-red-500/10 text-red-700 border-red-500/30' },
  };
  const { label, cls } = map[status];
  return <Badge variant="outline" className={`text-xs ${cls}`}>{label}</Badge>;
}

// ─────────────────────────────────────────────
// Email Draft Modal
// ─────────────────────────────────────────────
function EmailDraftModal({ item, onClose }: { item: ComplianceCheckItem; onClose: () => void }) {
  const draft = `Subject: [Compliance Request] ${item.title}

Dear Manufacturing Partner,

We are preparing to export our cosmetic products to international markets and conducting compliance checks based on local regulations.

During our review, we identified the following issue requiring your assistance:

Issue: ${item.title}
Detail: ${item.detail}

Action Required: ${item.actionItem}

Could you please provide the necessary documentation or confirmation at your earliest convenience?

We appreciate your prompt response to help us meet the compliance requirements.

Best regards,
K-Beauty Export Team`;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            이메일 초안 생성
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-2 mb-2">
              <StatusIcon status={item.status} />
              <span className="text-sm font-medium text-foreground">{item.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">{item.detail}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">생성된 이메일 초안</p>
            <textarea
              readOnly
              value={draft}
              className="w-full h-64 text-xs font-mono p-3 rounded-lg border border-border bg-muted/30 resize-none focus:outline-none"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>닫기</Button>
          <Button onClick={() => { navigator.clipboard.writeText(draft); toast.success('클립보드에 복사되었습니다!'); }}>
            📋 클립보드 복사
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Product Selector Step
// ─────────────────────────────────────────────
function ProductSelectorStep({ onSelect }: { onSelect: (productId: string) => void }) {
  const { productEntries } = useAppStore();

  if (productEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">등록된 제품이 없습니다</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          규제 체크리스트를 이용하려면 먼저 <strong>마이 데이터 &gt; 제품 관리</strong>에서 제품을 등록하고 INCI 성분을 입력해주세요.
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/my-data?tab=products'}>
          제품 등록하러 가기
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">규제 체크할 제품을 선택하세요</h2>
          <p className="text-sm text-muted-foreground mt-0.5">제품의 INCI 성분을 기반으로 11개국 규제 현황을 분석합니다.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {productEntries.map(p => {
            const exportable = getExportableCountries(p.inciText || '');
            const hasInci = !!p.inciText?.trim();
            return (
              <Card
                key={p.id}
                className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                onClick={() => onSelect(p.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{p.productName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.skuCode}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1 transition-colors" />
                  </div>

                  {hasInci ? (
                    <>
                      <div className="flex items-center gap-1.5 text-xs text-primary/80 bg-primary/5 rounded-md px-2 py-1 mb-3">
                        <FlaskConical className="h-3 w-3 flex-shrink-0" />
                        <span>INCI {p.inciText!.split(',').length}종 등록됨</span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          수출 가능 국가 ({exportable.length}개국)
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {exportable.length > 0 ? exportable.map(cc => (
                            <Badge key={cc} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-700 border border-green-500/20">
                              {RULEPACK_DATA[cc]?.countryName || cc}
                            </Badge>
                          )) : (
                            <span className="text-xs text-muted-foreground">모든 국가 검토 필요</span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/5 rounded-md px-2 py-1.5">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                      <span>INCI 미등록 — 성분 기반 분석 불가</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Compliance Checklist Page
// ─────────────────────────────────────────────
export default function ComplianceChecklistPage() {
  const { productEntries } = useAppStore();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [emailDraftItem, setEmailDraftItem] = useState<ComplianceCheckItem | null>(null);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set(['US', 'EU', 'JP']));

  const selectedProduct = productEntries.find(p => p.id === selectedProductId) || null;
  const inciText = selectedProduct?.inciText || '';

  const toggleCountry = (cc: string) => {
    setExpandedCountries(prev => {
      const next = new Set(prev);
      next.has(cc) ? next.delete(cc) : next.add(cc);
      return next;
    });
  };

  const toggleComplete = (id: string) => {
    setCompletedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Build dynamic packs based on selected product's INCI
  const dynamicPacks = RULEPACK_COUNTRIES.map(cc => computeDynamicRulePack(cc, inciText)).filter(Boolean);
  const allItems = dynamicPacks.flatMap(rp => rp!.items);
  const failCount = allItems.filter(i => i.status === 'fail').length;
  const warnCount = allItems.filter(i => i.status === 'warn').length;
  const passCount = allItems.filter(i => i.status === 'pass').length;
  const completedCount = completedItems.size;
  const actionableItems = allItems.filter(i => i.status !== 'pass');

  // Exportable countries for selected product
  const exportableCountries = selectedProduct ? getExportableCountries(inciText) : [];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">규제/인증 체크리스트</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {selectedProduct
                ? `${selectedProduct.productName} · INCI 성분 기반 11개국 동적 규제 분석`
                : '제품을 선택하여 국가별 규제 체크를 시작하세요'}
            </p>
          </div>
          {selectedProduct && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary truncate max-w-32">{selectedProduct.productName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setSelectedProductId(null); setCompletedItems(new Set()); }}>
                제품 변경
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Step 1: Product Selection */}
      {!selectedProductId ? (
        <ScrollArea className="flex-1">
          <ProductSelectorStep onSelect={(id) => {
            setSelectedProductId(id);
            setCompletedItems(new Set());
          }} />
        </ScrollArea>
      ) : (
        /* Step 2: Dynamic Checklist */
        <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="max-w-5xl mx-auto space-y-6">

              {/* Export readiness banner */}
              {exportableCountries.length > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">✈️ 이 제품으로 즉시 수출 가능한 국가</p>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-2">등록된 INCI 성분 기반으로 Fail 항목이 없는 국가입니다.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {exportableCountries.map(cc => (
                        <Badge key={cc} className="bg-green-500/15 text-green-700 border-green-500/30 text-xs">
                          {RULEPACK_DATA[cc]?.countryName || cc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* INCI-driven changes notice */}
              {inciText && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-400/20">
                  <FlaskConical className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-orange-700">🧪 INCI 성분 기반 동적 분석 적용 중</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      아래 체크리스트는 등록된 INCI 성분({inciText.split(',').filter(s => s.trim()).length}종)을 분석하여
                      <span className="text-orange-600 font-medium"> 🧪 성분 감지</span> 표시 항목의 상태를 실시간으로 변경했습니다.
                    </p>
                  </div>
                </div>
              )}

              {/* KPI Summary */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: '🔴 조치 필요', value: failCount, cls: 'border-red-500/30 bg-red-500/5 text-red-700' },
                  { label: '🟡 검토 필요', value: warnCount, cls: 'border-amber-500/30 bg-amber-500/5 text-amber-700' },
                  { label: '🟢 이상 없음', value: passCount, cls: 'border-green-500/30 bg-green-500/5 text-green-700' },
                  { label: '✅ 완료 처리됨', value: completedCount, cls: 'border-primary/30 bg-primary/5 text-primary' },
                ].map(({ label, value, cls }) => (
                  <Card key={label} className={`border ${cls}`}>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{value}</div>
                      <div className="text-xs mt-0.5 opacity-80">{label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>전체 진행도</span>
                  <span>{completedCount} / {actionableItems.length} 조치 완료</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: actionableItems.length > 0 ? `${(completedCount / actionableItems.length) * 100}%` : '0%' }}
                  />
                </div>
                {completedCount > 0 && (
                  <p className="text-xs text-primary text-right">
                    {Math.round((completedCount / actionableItems.length) * 100)}% 완료
                  </p>
                )}
              </div>

              {/* Country Sections */}
              <div className="space-y-3">
                {RULEPACK_COUNTRIES.map(cc => {
                  const rp = computeDynamicRulePack(cc, inciText);
                  if (!rp) return null;
                  const staticRp = RULEPACK_DATA[cc];
                  const hasFailure = rp.items.some(i => i.status === 'fail');
                  const hasWarn = rp.items.some(i => i.status === 'warn');
                  const overallStatus: 'pass' | 'warn' | 'fail' = hasFailure ? 'fail' : hasWarn ? 'warn' : 'pass';
                  const isExpanded = expandedCountries.has(cc);
                  const nonPassItems = rp.items.filter(i => i.status !== 'pass');
                  const countryCompleted = nonPassItems.filter(i => completedItems.has(i.id)).length;
                  const isExportable = exportableCountries.includes(cc);
                  const hasInciDrivenChange = inciText && staticRp && rp.items.some((item, idx) =>
                    item.status !== staticRp.items[idx]?.status
                  );

                  return (
                    <Card
                      key={cc}
                      className={`border transition-all ${
                        overallStatus === 'fail'
                          ? 'border-red-500/40'
                          : overallStatus === 'warn'
                          ? 'border-amber-500/30'
                          : 'border-green-500/20'
                      }`}
                    >
                      {/* Country Header */}
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg"
                        onClick={() => toggleCountry(cc)}
                      >
                        <StatusIcon status={overallStatus} />
                        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{rp.countryName}</span>
                          <span className="text-xs text-muted-foreground">{rp.regulation}</span>
                          <StatusBadge status={overallStatus} />
                          {isExportable && (
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-green-500/15 text-green-700 border border-green-500/30">
                              ✈️ 수출 가능
                            </Badge>
                          )}
                          {hasInciDrivenChange && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-orange-400/60 text-orange-600 bg-orange-500/5">
                              🧪 성분 감지
                            </Badge>
                          )}
                          {nonPassItems.length > 0 && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              {countryCompleted}/{nonPassItems.length} 완료
                            </span>
                          )}
                        </div>
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      </div>

                      {/* Action Table */}
                      {isExpanded && (
                        <div className="border-t border-border">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-muted/30 text-muted-foreground">
                                <th className="text-left px-4 py-2 w-24">상태</th>
                                <th className="text-left px-4 py-2">진단 항목</th>
                                <th className="text-left px-4 py-2">AI 실행 제안 (Action Item)</th>
                                <th className="text-center px-4 py-2 w-16">완료</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rp.items.map((item, idx) => {
                                const isCompleted = completedItems.has(item.id);
                                const staticItem = staticRp?.items[idx];
                                const isInciDriven = !!(inciText && staticItem && item.status !== staticItem.status);
                                return (
                                  <tr
                                    key={item.id}
                                    className={`border-t border-border/50 transition-colors ${
                                      isCompleted
                                        ? 'opacity-60'
                                        : isInciDriven
                                        ? 'bg-orange-500/3'
                                        : 'hover:bg-muted/20'
                                    }`}
                                  >
                                    <td className="px-4 py-3">
                                      <div className="flex flex-col gap-0.5">
                                        <StatusBadge status={item.status} />
                                        {isInciDriven && (
                                          <span className="text-[9px] text-orange-600 font-medium">🧪 INCI 감지</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <p className={`font-medium text-foreground ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                        {item.title}
                                      </p>
                                      <p className={`mt-0.5 text-[11px] leading-relaxed whitespace-pre-line ${
                                        isInciDriven ? 'text-orange-700' : 'text-muted-foreground'
                                      }`}>
                                        {item.detail}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3">
                                      {item.status !== 'pass' ? (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className={`text-foreground/80 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                            {item.actionItem}
                                          </span>
                                          {item.actionType === 'email' && !isCompleted && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-6 text-[10px] px-2 py-0 border-primary/40 text-primary hover:bg-primary/10 flex-shrink-0"
                                              onClick={() => setEmailDraftItem(item)}
                                            >
                                              <Mail className="h-3 w-3 mr-1" />
                                              이메일 초안 생성
                                            </Button>
                                          )}
                                          {item.actionType === 'doc' && !isCompleted && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-amber-400/50 text-amber-600">
                                              📄 문서 필요
                                            </Badge>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <Checkbox
                                        checked={isCompleted}
                                        onCheckedChange={() => toggleComplete(item.id)}
                                        className="mx-auto"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      )}

      {emailDraftItem && (
        <EmailDraftModal item={emailDraftItem} onClose={() => setEmailDraftItem(null)} />
      )}
    </div>
  );
}
