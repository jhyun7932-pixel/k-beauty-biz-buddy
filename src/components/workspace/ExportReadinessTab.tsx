import React from 'react';
import { Globe, CheckCircle2, AlertTriangle, XCircle, ArrowRight, FileText, Tag, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface CountryStatus {
  country: string;
  code: string;
  status: 'green' | 'yellow' | 'red';
  issues: string[];
}

interface TodoItem {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface RiskItem {
  id: string;
  text: string;
  severity: 'high' | 'medium' | 'low';
}

interface ExportReadinessTabProps {
  onNavigate?: (tab: string) => void;
}

// Mock data
const countryStatuses: CountryStatus[] = [
  { country: '홍콩', code: 'HK', status: 'green', issues: [] },
  { country: '일본', code: 'JP', status: 'yellow', issues: ['성분 규제 확인 필요'] },
  { country: '미국', code: 'US', status: 'red', issues: ['FDA 등록 미완료', '라벨 규정 검토 필요'] },
];

const todoItems: TodoItem[] = [
  { id: '1', text: '홍콩 바이어 첫 제안 패키지 발송', priority: 'high', category: '바이어' },
  { id: '2', text: '일본향 성분표 규제 체크', priority: 'high', category: '규제' },
  { id: '3', text: '비타민C 세럼 라벨 초안 생성', priority: 'medium', category: '라벨' },
  { id: '4', text: 'Company Deck 영문 버전 업데이트', priority: 'medium', category: '문서' },
  { id: '5', text: 'PI #2024-002 최종 확정', priority: 'low', category: '거래' },
];

const risks: RiskItem[] = [
  { id: '1', text: '레티놀 함량 일본 규제 초과 가능성', severity: 'high' },
  { id: '2', text: '미국 FDA 등록 3개월 소요 예상', severity: 'medium' },
  { id: '3', text: 'MOQ 조정 필요 (현재: 1000, 바이어 요청: 500)', severity: 'low' },
];

export function ExportReadinessTab({ onNavigate }: ExportReadinessTabProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'yellow':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'red':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return '';
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Country Status Cards */}
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            국가별 수출 준비 현황
          </h3>
          <div className="grid gap-3">
            {countryStatuses.map((country) => (
              <Card 
                key={country.code}
                className={cn(
                  "border-l-4",
                  country.status === 'green' && "border-l-green-500",
                  country.status === 'yellow' && "border-l-amber-500",
                  country.status === 'red' && "border-l-red-500"
                )}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(country.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{country.country}</span>
                        <Badge variant="outline" className="text-[10px] h-4">{country.code}</Badge>
                      </div>
                      {country.issues.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {country.issues.map((issue, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">• {issue}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      상세
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Top 5 Todo */}
        <section>
          <h3 className="text-sm font-semibold mb-3">해야 할 일 Top 5</h3>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {todoItems.map((item, index) => (
                  <li key={item.id} className="p-3 flex items-center gap-3 hover:bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground w-5">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.text}</p>
                    </div>
                    <Badge className={cn("text-[10px] h-5", getPriorityColor(item.priority))}>
                      {item.category}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Risk Box */}
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            주요 리스크
          </h3>
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10">
            <CardContent className="p-3">
              <ul className="space-y-2">
                {risks.map((risk) => (
                  <li key={risk.id} className="flex items-start gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0",
                      risk.severity === 'high' && "bg-red-500",
                      risk.severity === 'medium' && "bg-amber-500",
                      risk.severity === 'low' && "bg-blue-400"
                    )} />
                    <span className="text-sm">{risk.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* CTA Buttons */}
        <section className="flex flex-wrap gap-2">
          <Button onClick={() => onNavigate?.('buyer-package')} className="flex-1 min-w-[140px]">
            <FileText className="h-4 w-4 mr-2" />
            바이어 패키지
          </Button>
          <Button variant="outline" onClick={() => onNavigate?.('label')} className="flex-1 min-w-[140px]">
            <Tag className="h-4 w-4 mr-2" />
            라벨 초안
          </Button>
          <Button variant="outline" onClick={() => onNavigate?.('trade-docs')} className="flex-1 min-w-[140px]">
            <Receipt className="h-4 w-4 mr-2" />
            PI/계약서
          </Button>
        </section>
      </div>
    </ScrollArea>
  );
}
