import React, { useState } from 'react';
import { useProjectStore, COUNTRY_NAMES, TargetCountry } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  FileText,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface RulepackItem {
  id: string;
  category: string;
  item: string;
  status: 'ok' | 'pending' | 'warning' | 'blocked';
  evidence: string;
  evidenceLink?: string;
  action: string;
  confirmed: boolean;
}

interface Rulepack {
  country: TargetCountry;
  summary: string;
  overallStatus: 'ok' | 'caution' | 'stop';
  items: RulepackItem[];
}

// Sample RulePacks
const SAMPLE_RULEPACKS: Record<TargetCountry, Rulepack> = {
  'US': {
    country: 'US',
    summary: 'FDA MoCRA 규정에 따른 화장품 등록 및 라벨 요건 확인 필요',
    overallStatus: 'caution',
    items: [
      {
        id: 'us-1',
        category: '등록/신고',
        item: 'FDA 시설 등록 (MoCRA)',
        status: 'pending',
        evidence: '2023년 12월부터 시행된 MoCRA에 따라 미국에 화장품을 수출하는 모든 시설은 FDA에 등록해야 합니다.',
        evidenceLink: 'https://www.fda.gov/cosmetics/cosmetics-laws-regulations/modernization-cosmetics-regulation-act-2022-mocra',
        action: 'FDA 시설 등록 완료 여부 확인. 미등록 시 등록 절차 진행.',
        confirmed: false,
      },
      {
        id: 'us-2',
        category: '등록/신고',
        item: '제품 리스팅 (Product Listing)',
        status: 'pending',
        evidence: 'MoCRA에 따라 개별 화장품 제품도 FDA에 리스팅해야 합니다.',
        evidenceLink: 'https://www.fda.gov/cosmetics/cosmetics-laws-regulations/modernization-cosmetics-regulation-act-2022-mocra',
        action: '수출 예정 제품의 FDA 리스팅 완료 확인.',
        confirmed: false,
      },
      {
        id: 'us-3',
        category: '라벨',
        item: '영문 성분표 (INCI 명칭)',
        status: 'ok',
        evidence: 'FDA는 모든 성분을 INCI 명칭으로 영문 라벨에 표기할 것을 요구합니다.',
        action: '성분표가 INCI 명칭으로 올바르게 표기되었는지 확인.',
        confirmed: true,
      },
      {
        id: 'us-4',
        category: '성분',
        item: 'Drug vs Cosmetic 분류',
        status: 'warning',
        evidence: '미백, 자외선 차단, 여드름 치료 등의 효능을 표방하면 Drug으로 분류되어 FDA 승인이 필요합니다.',
        evidenceLink: 'https://www.fda.gov/cosmetics/cosmetics-guidance-documents/is-it-cosmetic-drug-or-both-or-it-soap',
        action: '제품의 효능 표현 검토. Drug 해당 시 별도 승인 절차 필요.',
        confirmed: false,
      },
    ],
  },
  'JP': {
    country: 'JP',
    summary: '후생노동성 화장품 수입판매업 허가 및 일본어 라벨 요건 확인 필요',
    overallStatus: 'caution',
    items: [
      {
        id: 'jp-1',
        category: '등록/신고',
        item: '화장품 수입판매업 허가',
        status: 'pending',
        evidence: '일본에 화장품을 수입하려면 현지 수입판매업자가 후생노동성에 허가를 받아야 합니다.',
        action: '일본 파트너(수입자)의 수입판매업 허가 보유 여부 확인.',
        confirmed: false,
      },
      {
        id: 'jp-2',
        category: '라벨',
        item: '일본어 전성분 표기',
        status: 'pending',
        evidence: '일본 약사법에 따라 모든 성분을 일본어로 표기해야 합니다.',
        action: '일본어 라벨 시안 준비 및 검토.',
        confirmed: false,
      },
      {
        id: 'jp-3',
        category: '라벨',
        item: '제조판매원 표기',
        status: 'pending',
        evidence: '일본 내 책임자(제조판매원) 정보가 라벨에 표기되어야 합니다.',
        action: '일본 파트너 정보 확인 및 라벨 반영.',
        confirmed: false,
      },
    ],
  },
  'EU': {
    country: 'EU',
    summary: 'CPNP 등록 및 EU 책임자 지정 필수, PIF 문서 준비 권장',
    overallStatus: 'stop',
    items: [
      {
        id: 'eu-1',
        category: '등록/신고',
        item: 'CPNP 등록',
        status: 'blocked',
        evidence: 'EU에 화장품을 출시하기 전 CPNP(Cosmetic Products Notification Portal)에 제품을 등록해야 합니다.',
        evidenceLink: 'https://ec.europa.eu/growth/sectors/cosmetics/cpnp_en',
        action: 'CPNP 등록 절차 시작. EU 책임자 지정 필수.',
        confirmed: false,
      },
      {
        id: 'eu-2',
        category: '등록/신고',
        item: 'EU 책임자 (Responsible Person)',
        status: 'blocked',
        evidence: 'EU 내에 위치한 책임자(RP)를 지정해야 하며, RP가 CPNP 등록을 수행합니다.',
        action: 'EU 책임자 서비스 또는 현지 파트너 계약.',
        confirmed: false,
      },
      {
        id: 'eu-3',
        category: '문서',
        item: 'PIF (Product Information File)',
        status: 'pending',
        evidence: '제품 정보 파일(PIF)을 작성하여 EU 책임자가 보관해야 합니다.',
        action: 'PIF 문서 초안 작성 및 검토.',
        confirmed: false,
      },
    ],
  },
  'HK': {
    country: 'HK',
    summary: '홍콩은 별도의 화장품 사전 등록이 필요 없으나, 라벨 요건 준수 필요',
    overallStatus: 'ok',
    items: [
      {
        id: 'hk-1',
        category: '라벨',
        item: '영문/중문 라벨',
        status: 'ok',
        evidence: '홍콩에서는 영어 또는 중국어 라벨이 허용됩니다.',
        action: '영문 라벨 준비 완료 확인.',
        confirmed: true,
      },
    ],
  },
  'TW': {
    country: 'TW',
    summary: '대만 TFDA 화장품 등록 필요, 중문 라벨 요건',
    overallStatus: 'caution',
    items: [
      {
        id: 'tw-1',
        category: '등록/신고',
        item: 'TFDA 화장품 등록',
        status: 'pending',
        evidence: '대만에 화장품을 수입하려면 TFDA에 제품 등록이 필요합니다.',
        action: '대만 수입자를 통한 TFDA 등록 절차 확인.',
        confirmed: false,
      },
    ],
  },
  'CN': {
    country: 'CN',
    summary: 'NMPA 등록 필수, 비특수용도/특수용도 분류에 따른 절차 상이',
    overallStatus: 'stop',
    items: [
      {
        id: 'cn-1',
        category: '등록/신고',
        item: 'NMPA 비안/등록',
        status: 'blocked',
        evidence: '중국 수입 화장품은 NMPA(국가약품감독관리국)에 비안(일반) 또는 등록(특수) 절차를 거쳐야 합니다.',
        action: '제품 분류 확인 후 NMPA 절차 시작.',
        confirmed: false,
      },
      {
        id: 'cn-2',
        category: '성분',
        item: '동물실험 대체 서류',
        status: 'pending',
        evidence: '2021년부터 일부 일반 화장품은 동물실험 없이 수입 가능하나, 대체 서류 준비 필요.',
        action: '동물실험 대체 자료 확보 여부 확인.',
        confirmed: false,
      },
    ],
  },
  'VN': {
    country: 'VN',
    summary: '베트남 화장품 신고 절차 필요',
    overallStatus: 'caution',
    items: [
      {
        id: 'vn-1',
        category: '등록/신고',
        item: '화장품 신고',
        status: 'pending',
        evidence: '베트남에 화장품을 수입하려면 현지 수입자가 신고 절차를 진행해야 합니다.',
        action: '베트남 파트너와 신고 절차 협의.',
        confirmed: false,
      },
    ],
  },
  'ID': {
    country: 'ID',
    summary: 'BPOM 등록 필수, 할랄 인증 권장',
    overallStatus: 'caution',
    items: [
      {
        id: 'id-1',
        category: '등록/신고',
        item: 'BPOM 등록',
        status: 'pending',
        evidence: '인도네시아 수입 화장품은 BPOM(식약청)에 등록해야 합니다.',
        action: 'BPOM 등록 절차 및 현지 수입자 확인.',
        confirmed: false,
      },
      {
        id: 'id-2',
        category: '인증',
        item: '할랄 인증',
        status: 'pending',
        evidence: '무슬림 소비자를 위해 할랄 인증이 권장됩니다.',
        action: '할랄 인증 취득 여부 검토.',
        confirmed: false,
      },
    ],
  },
  'MY': {
    country: 'MY',
    summary: 'NPRA 신고 필요, 할랄 인증 권장',
    overallStatus: 'caution',
    items: [
      {
        id: 'my-1',
        category: '등록/신고',
        item: 'NPRA 신고',
        status: 'pending',
        evidence: '말레이시아 화장품은 NPRA에 신고해야 합니다.',
        action: 'NPRA 신고 절차 확인.',
        confirmed: false,
      },
    ],
  },
  'TH': {
    country: 'TH',
    summary: 'Thai FDA 신고 필요',
    overallStatus: 'caution',
    items: [
      {
        id: 'th-1',
        category: '등록/신고',
        item: 'Thai FDA 신고',
        status: 'pending',
        evidence: '태국 수입 화장품은 Thai FDA에 신고해야 합니다.',
        action: 'Thai FDA 신고 절차 확인.',
        confirmed: false,
      },
    ],
  },
  'AU': {
    country: 'AU',
    summary: '호주는 화장품 사전 등록 불필요, NICNAS 성분 규제 확인 필요',
    overallStatus: 'ok',
    items: [
      {
        id: 'au-1',
        category: '성분',
        item: 'NICNAS 성분 확인',
        status: 'ok',
        evidence: '호주에서 금지/제한된 성분이 포함되어 있는지 확인 필요.',
        action: '성분표 검토 완료.',
        confirmed: true,
      },
    ],
  },
};

const STATUS_COLORS = {
  ok: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  warning: 'bg-orange-100 text-orange-700 border-orange-200',
  blocked: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_ICONS = {
  ok: <CheckCircle2 className="h-4 w-4" />,
  pending: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  blocked: <Shield className="h-4 w-4" />,
};

export default function CompliancePage() {
  const { projectContext } = useProjectStore();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [confirmedItems, setConfirmedItems] = useState<Record<string, boolean>>({});
  
  const targetCountries = projectContext.targetCountries.length > 0 
    ? projectContext.targetCountries 
    : ['US', 'JP', 'EU'] as TargetCountry[];
  
  const rulepacks = targetCountries
    .filter((c) => SAMPLE_RULEPACKS[c])
    .map((c) => SAMPLE_RULEPACKS[c]);
  
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const toggleConfirm = (id: string) => {
    setConfirmedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          컴플라이언스 체크
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          타겟 국가별 규제 요건을 확인하고 준비 상태를 점검하세요.
        </p>
        
        {/* Overall Status Summary */}
        <div className="flex gap-2 mt-4">
          {rulepacks.map((rp) => (
            <Badge 
              key={rp.country}
              className={`${
                rp.overallStatus === 'ok' 
                  ? 'bg-green-100 text-green-700' 
                  : rp.overallStatus === 'caution'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {COUNTRY_NAMES[rp.country]}: {
                rp.overallStatus === 'ok' ? '준비 완료' :
                rp.overallStatus === 'caution' ? '확인 필요' : '진행 불가'
              }
            </Badge>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <Tabs defaultValue={rulepacks[0]?.country || 'US'}>
          <TabsList className="mb-4">
            {rulepacks.map((rp) => (
              <TabsTrigger key={rp.country} value={rp.country} className="gap-1.5">
                {STATUS_ICONS[rp.overallStatus === 'ok' ? 'ok' : rp.overallStatus === 'caution' ? 'pending' : 'blocked']}
                {COUNTRY_NAMES[rp.country]}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {rulepacks.map((rp) => (
            <TabsContent key={rp.country} value={rp.country} className="space-y-4">
              {/* Summary Card */}
              <Card className={`border-2 ${
                rp.overallStatus === 'ok' 
                  ? 'border-green-200 bg-green-50/50' 
                  : rp.overallStatus === 'caution'
                  ? 'border-yellow-200 bg-yellow-50/50'
                  : 'border-red-200 bg-red-50/50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      rp.overallStatus === 'ok' 
                        ? 'bg-green-100' 
                        : rp.overallStatus === 'caution'
                        ? 'bg-yellow-100'
                        : 'bg-red-100'
                    }`}>
                      {rp.overallStatus === 'ok' 
                        ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                        : rp.overallStatus === 'caution'
                        ? <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        : <Shield className="h-5 w-5 text-red-600" />
                      }
                    </div>
                    <div>
                      <h3 className="font-medium">{COUNTRY_NAMES[rp.country]} 수출 준비 요약</h3>
                      <p className="text-sm text-muted-foreground mt-1">{rp.summary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* RulePack Items */}
              <div className="space-y-3">
                {rp.items.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <Collapsible open={expandedItems[item.id]} onOpenChange={() => toggleExpand(item.id)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge className={`${STATUS_COLORS[item.status]} border`}>
                              {STATUS_ICONS[item.status]}
                              <span className="ml-1">
                                {item.status === 'ok' ? 'OK' : 
                                 item.status === 'pending' ? '확인필요' :
                                 item.status === 'warning' ? '주의' : '차단'}
                              </span>
                            </Badge>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.item}</p>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                            {expandedItems[item.id] 
                              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            }
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4 px-4 space-y-4">
                          {/* Evidence */}
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" />
                              근거 (Evidence)
                            </h4>
                            <p className="text-sm">{item.evidence}</p>
                            {item.evidenceLink && (
                              <a 
                                href={item.evidenceLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline"
                              >
                                출처 확인 <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          
                          {/* Action */}
                          <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                            <h4 className="text-xs font-medium text-primary mb-1">권장 조치 (Action)</h4>
                            <p className="text-sm">{item.action}</p>
                          </div>
                          
                          {/* Confirm */}
                          <div className="flex items-center gap-2 pt-2">
                            <Checkbox 
                              id={`confirm-${item.id}`}
                              checked={confirmedItems[item.id] || item.confirmed}
                              onCheckedChange={() => toggleConfirm(item.id)}
                            />
                            <label 
                              htmlFor={`confirm-${item.id}`}
                              className="text-sm cursor-pointer"
                            >
                              이 항목을 확인했습니다
                            </label>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </ScrollArea>
      
      {/* Disclaimer */}
      <div className="p-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <p className="flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          이 정보는 참고용이며 법적 효력이 없습니다. 최종 수출 전 전문가 확인을 권장합니다.
        </p>
      </div>
    </div>
  );
}
