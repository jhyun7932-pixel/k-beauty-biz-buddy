import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTradeStore } from '@/stores/tradeStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Shield, AlertTriangle, CheckCircle2, Circle,
  ChevronDown, ChevronUp, ExternalLink,
  FileText, Bot, Mail, BookOpen, Globe,
  ArrowRight, Sparkles, Package
} from 'lucide-react';

// ── 타입 ──────────────────────────────────────────────
type CountryCode = 'US'|'EU'|'JP'|'CN'|'AU'|'CA'|'GB'|'SG'|'TW'|'HK'|'VN';
type ItemStatus = 'fail'|'warn'|'pass'|'na';

interface CheckItem {
  id: string;
  status: ItemStatus;
  title: string;
  detail: string;
  regulation: string;
  regulationUrl?: string;
  flonixGuide: string;
  actionType: 'ai_ask' | 'doc_gen' | 'link' | 'none';
  actionLabel?: string;
  actionPayload?: string;
}

interface CountryRulepack {
  code: CountryCode;
  name: string;
  flag: string;
  law: string;
  items: CheckItem[];
}

// ── 상수: 국가 목록 ────────────────────────────────────
const COUNTRIES: { code: CountryCode; name: string; flag: string; law: string }[] = [
  { code: 'US', name: '미국',     flag: '🇺🇸', law: 'FDA MoCRA (2022)' },
  { code: 'EU', name: 'EU',       flag: '🇪🇺', law: 'EU Cosmetics Regulation 1223/2009' },
  { code: 'JP', name: '일본',     flag: '🇯🇵', law: '약기법 (薬機法)' },
  { code: 'CN', name: '중국',     flag: '🇨🇳', law: 'NMPA 화장품 감독관리조례' },
  { code: 'AU', name: '호주',     flag: '🇦🇺', law: 'AICIS / TGA' },
  { code: 'CA', name: '캐나다',   flag: '🇨🇦', law: 'Health Canada CPA' },
  { code: 'GB', name: '영국',     flag: '🇬🇧', law: 'UK Cosmetics Regulation' },
  { code: 'SG', name: '싱가포르', flag: '🇸🇬', law: 'HSA ASEAN Cosmetics Directive' },
  { code: 'TW', name: '대만',     flag: '🇹🇼', law: 'TFDA 화장품위생안전관리법' },
  { code: 'HK', name: '홍콩',     flag: '🇭🇰', law: 'COSOS / Pharmacy & Poisons Ordinance' },
  { code: 'VN', name: '베트남',   flag: '🇻🇳', law: 'MOH ASEAN Cosmetics Directive' },
];

// ── RulePack 데이터 빌더 ──────────────────────────────
const buildRulepack = (
  countryCode: CountryCode,
  productName: string,
  inciList: string[]
): CountryRulepack | null => {
  const country = COUNTRIES.find(c => c.code === countryCode);
  if (!country) return null;

  const hasHydroquinone = inciList.some(i => i.toLowerCase().includes('hydroquinone'));
  const hasFragrance = inciList.some(i => i.toLowerCase().includes('fragrance') || i.toLowerCase().includes('parfum'));
  const hasRetinol = inciList.some(i => i.toLowerCase().includes('retinol'));
  const hasTEA = inciList.some(i => i.toLowerCase().includes('triethanolamine'));

  if (countryCode === 'US') {
    return {
      ...country,
      items: [
        {
          id: 'us-hydroquinone',
          status: hasHydroquinone ? 'fail' : 'pass',
          title: 'Hydroquinone 사용 제한',
          detail: hasHydroquinone
            ? '등록 성분에 Hydroquinone 감지됨. 미국 화장품에서 2% 초과 사용 금지 (OTC Drug 제외).'
            : 'Hydroquinone 미검출 — 이상 없음',
          regulation: 'FDA OTC Drug 분류 기준 (21 CFR Part 358)',
          regulationUrl: 'https://www.fda.gov/cosmetics',
          flonixGuide: hasHydroquinone
            ? '허용 기준: 화장품으로는 사용 불가 (OTC Drug 허가 별도 필요)\n참고 대안 성분: Arbutin (미백 유사 효과, 화장품 허용), Niacinamide\n※ 최종 성분 결정은 제조사·ODM과 협의 필요'
            : '',
          actionType: hasHydroquinone ? 'ai_ask' : 'none',
          actionLabel: 'AI에게 대응 방법 묻기',
          actionPayload: `[규제 대응 문의]\n제품: ${productName}\n국가: 미국 (FDA MoCRA)\n위반 항목: Hydroquinone 화장품 사용 금지\n\n이 제품의 미국 수출을 위한 규제 대응 방법과 허용 기준 내 대안 성분(Arbutin, Niacinamide 등)의 함량 기준을 안내해줘.`,
        },
        {
          id: 'us-fragrance',
          status: hasFragrance ? 'warn' : 'pass',
          title: 'Fragrance 알레르겐 개별 표기',
          detail: hasFragrance
            ? 'INCI에 Fragrance/Parfum 감지. MoCRA Section 604에 따라 26종 알레르겐 개별 공개 권장.'
            : 'Fragrance 성분 미검출',
          regulation: 'MoCRA Section 604 (향료 성분 공개)',
          regulationUrl: 'https://www.fda.gov/cosmetics/cosmetics-laws-regulations/modernization-cosmetics-regulation-act-2022-mocra',
          flonixGuide: hasFragrance
            ? '조치 사항: Fragrance 구성 성분 중 알레르겐 26종 해당 여부 제조사 확인 후 개별 표기\n라벨 표기 형식: "Fragrance (Linalool, Limonene 등)" 방식 권장'
            : '',
          actionType: hasFragrance ? 'doc_gen' : 'none',
          actionLabel: 'MoCRA 기준 라벨 초안 생성',
          actionPayload: `[라벨 초안 생성]\n제품: ${productName}\n국가: 미국 (MoCRA Section 604)\n요청: Fragrance 알레르겐 개별 표기를 포함한 미국향 라벨 초안을 작성해줘.`,
        },
        {
          id: 'us-mocra-facility',
          status: 'warn',
          title: 'FDA 시설 등록 (MoCRA)',
          detail: '제조시설의 FDA 등록 여부 확인 필요. 2023년 12월 29일부터 의무.',
          regulation: 'MoCRA Section 607',
          regulationUrl: 'https://www.fda.gov/cosmetics',
          flonixGuide: '등록 주체: 제품 제조시설 (ODM/OEM 공장)\n확인 사항: 제조사에 FDA 시설 등록 번호(FEI) 요청\n등록 포털: FDA Cosmetics Direct',
          actionType: 'link',
          actionLabel: 'FDA 등록 포털 바로가기',
          actionPayload: 'https://www.fda.gov/cosmetics/cosmetics-laws-regulations/registration-and-product-listing-cosmetic-facilities-and-products',
        },
        {
          id: 'us-product-listing',
          status: 'warn',
          title: '제품 등록 (Product Listing)',
          detail: 'MoCRA에 따라 미국 내 유통 전 제품 등록 의무.',
          regulation: 'MoCRA Section 607',
          flonixGuide: '등록 주체: 책임자 (Responsible Person, 통상 미국 수입자)\n제출 정보: 제품명, INCI 목록, 제조시설 정보\n처리 기간: 즉시 (온라인)',
          actionType: 'ai_ask',
          actionLabel: 'AI에게 등록 절차 안내 받기',
          actionPayload: `[FDA 제품 등록 절차 안내]\n제품: ${productName}\n미국 MoCRA Product Listing 등록 절차를 단계별로 안내해줘.`,
        },
        {
          id: 'us-retinol',
          status: hasRetinol ? 'warn' : 'pass',
          title: 'Retinol 함량 기준',
          detail: hasRetinol
            ? 'INCI에 Retinol 감지. 얼굴용 0.3%, 바디용 0.5% 이하 권고 (EU SCCS 기준 참고).'
            : 'Retinol 미검출',
          regulation: 'EU SCCS Opinion (2022) — 미국은 FDA 자율 기준 참고',
          flonixGuide: hasRetinol
            ? '권고 함량: 얼굴용 0.3% 이하, 바디용 0.5% 이하\n※ 미국은 현재 법적 상한 없으나 SCCS 기준 준용 권장\n최종 함량 결정은 제조사·ODM과 협의 필요'
            : '',
          actionType: hasRetinol ? 'ai_ask' : 'none',
          actionLabel: 'AI에게 함량 기준 안내 받기',
          actionPayload: `[Retinol 함량 기준 안내]\n제품: ${productName}\n미국·EU 기준 Retinol 허용 함량 기준과 라벨 표기 방법을 안내해줘.`,
        },
        {
          id: 'us-inci-label',
          status: 'pass',
          title: '영문 전성분 표기 (INCI)',
          detail: 'INCI 기준 영문 전성분 등록 완료.',
          regulation: 'FDA 21 CFR Part 701.3',
          flonixGuide: '',
          actionType: 'none',
        },
        {
          id: 'us-net-weight',
          status: 'pass',
          title: '순중량 / 용량 표기',
          detail: '미국 도량형 기준(oz/fl.oz) 표기 확인 필요.',
          regulation: 'FDA 21 CFR Part 701',
          flonixGuide: '미국은 ml 병기 가능하나 oz 주표기 필요',
          actionType: 'none',
        },
      ],
    };
  }

  if (countryCode === 'EU') {
    return {
      ...country,
      items: [
        {
          id: 'eu-cpnp',
          status: 'fail',
          title: 'CPNP 제품 등록',
          detail: 'EU 내 유통 전 CPNP(Cosmetic Products Notification Portal) 등록 의무.',
          regulation: 'EU Regulation 1223/2009 Article 13',
          regulationUrl: 'https://ec.europa.eu/growth/sectors/cosmetics/cpnp_en',
          flonixGuide: '등록 주체: EU 내 Responsible Person (RP)\n처리 기간: 즉시 (온라인 신청)\nRP 없을 시: EU 현지 에이전트 선임 필요',
          actionType: 'ai_ask',
          actionLabel: 'AI에게 CPNP 등록 절차 묻기',
          actionPayload: `[CPNP 등록 절차 안내]\n제품: ${productName}\nEU CPNP 등록 절차와 Responsible Person 선임 방법을 안내해줘.`,
        },
        {
          id: 'eu-rp',
          status: 'fail',
          title: 'Responsible Person (RP) 지정',
          detail: 'EU 내 법적 책임자 지정 필수. RP가 CPNP 등록 진행.',
          regulation: 'EU Regulation 1223/2009 Article 4',
          flonixGuide: 'RP 역할: EU 내 제품 안전 책임, 당국 소통 창구\n선임 방법: EU 현지 에이전트 계약 또는 바이어가 RP 역할 수행 협의',
          actionType: 'ai_ask',
          actionLabel: 'AI에게 RP 선임 방법 묻기',
          actionPayload: `[EU RP 선임 안내]\n제품: ${productName}\nEU Responsible Person 선임 방법과 비용, 절차를 안내해줘.`,
        },
        {
          id: 'eu-retinol',
          status: hasRetinol ? 'fail' : 'pass',
          title: 'Retinol 함량 제한 (SCCS)',
          detail: hasRetinol
            ? '얼굴용 0.3% 초과 금지 (2025년 시행). INCI에서 Retinol 감지됨.'
            : 'Retinol 미검출',
          regulation: 'EU SCCS/1642/22 Opinion on Vitamin A',
          flonixGuide: hasRetinol
            ? '허용 기준: 얼굴용 0.3%, 바디용 0.5%, 핸드크림 0.05% 이하\n시행일: 2025년 5월\n※ 함량 조정은 제조사·ODM과 협의 필요'
            : '',
          actionType: hasRetinol ? 'ai_ask' : 'none',
          actionLabel: 'AI에게 함량 기준 안내 받기',
          actionPayload: `EU SCCS 기준 Retinol 허용 함량과 ${productName}의 EU 수출 시 라벨 표기 방법을 안내해줘.`,
        },
        {
          id: 'eu-fragrance-26',
          status: hasFragrance ? 'warn' : 'pass',
          title: 'Fragrance 26종 알레르겐 표기',
          detail: hasFragrance ? 'Fragrance 감지. Annex III 기준 26종 개별 표기 의무.' : 'Fragrance 미검출',
          regulation: 'EU Regulation 1223/2009 Annex III',
          flonixGuide: hasFragrance ? '표기 방법: Fragrance 구성 성분 중 농도 0.001%(린스오프) / 0.01%(리브온) 초과 시 개별 표기\n제조사에 Fragrance breakdown sheet 요청 필요' : '',
          actionType: hasFragrance ? 'doc_gen' : 'none',
          actionLabel: 'EU 라벨 초안 생성',
          actionPayload: `EU Annex III 기준 ${productName}의 Fragrance 알레르겐 개별 표기 라벨 초안을 작성해줘.`,
        },
        {
          id: 'eu-pif',
          status: hasTEA ? 'warn' : 'pass',
          title: 'PIF (Product Information File) 준비',
          detail: 'EU 내 유통 기간 동안 PIF 보관 의무. 8가지 필수 서류 포함.',
          regulation: 'EU Regulation 1223/2009 Article 11',
          flonixGuide: 'PIF 필수 구성: 제품 설명서, CPSR, 제조 방법, GMP 적합성 선언, 효능 입증 자료 등 8종',
          actionType: 'ai_ask',
          actionLabel: 'PIF 체크리스트 확인하기',
          actionPayload: `EU PIF 8가지 필수 구성 서류 체크리스트와 ${productName}의 준비 현황을 안내해줘.`,
        },
      ],
    };
  }

  if (countryCode === 'JP') {
    return {
      ...country,
      items: [
        {
          id: 'jp-classification',
          status: 'warn',
          title: '화장품/의약외품 분류 확인',
          detail: '기능성 클레임에 따라 의약외품으로 분류 시 후생노동성 허가 필요.',
          regulation: '약기법 제2조',
          flonixGuide: '화장품: 성분 기준 내 자유 판매\n의약외품: 미백·모발 관련 효능 클레임 시 해당, 후생노동성 허가 필요\n※ 클레임 문구 결정은 바이어·현지 에이전트와 협의',
          actionType: 'ai_ask',
          actionLabel: 'AI에게 분류 기준 묻기',
          actionPayload: `[일본 화장품/의약외품 분류 안내]\n제품: ${productName}\n일본 약기법 기준 화장품과 의약외품 분류 기준과 ${productName}의 해당 여부를 안내해줘.`,
        },
        {
          id: 'jp-label',
          status: 'warn',
          title: '일본어 라벨 표기 의무',
          detail: '전성분, 제조소/수입자, 용도 등 일본어 표기 필수.',
          regulation: '약기법 제61조',
          flonixGuide: '필수 표기 항목: 제품명, 전성분(INCI → 일본어), 내용량, 제조판매업자, 로트번호\n현지 수입자(바이어)가 라벨 부착 대행 가능',
          actionType: 'doc_gen',
          actionLabel: '일본어 라벨 초안 생성',
          actionPayload: `일본 약기법 기준 ${productName}의 일본어 라벨 필수 기재사항 초안을 작성해줘.`,
        },
        {
          id: 'jp-hydroquinone',
          status: hasHydroquinone ? 'fail' : 'pass',
          title: 'Hydroquinone 화장품 사용 금지',
          detail: hasHydroquinone ? 'Hydroquinone은 일본 화장품 배합 금지 성분입니다.' : 'Hydroquinone 미검출',
          regulation: '약기법 화장품 배합 금지 성분 고시',
          flonixGuide: hasHydroquinone ? '참고 대안 성분: Tranexamic Acid, Arbutin (의약외품 허가 시 사용 가능)\n※ 최종 성분 결정은 제조사·ODM과 협의 필요' : '',
          actionType: hasHydroquinone ? 'ai_ask' : 'none',
          actionLabel: 'AI에게 대응 방법 묻기',
          actionPayload: `일본 화장품 Hydroquinone 금지 기준과 ${productName}의 대응 방법을 안내해줘.`,
        },
        {
          id: 'jp-importer',
          status: 'warn',
          title: '제조판매업 허가 / 수입 대행',
          detail: '일본 수입 판매 시 제조판매업 허가 보유 업체 필요.',
          regulation: '약기법 제12조',
          flonixGuide: '일반적으로 현지 바이어(수입자)가 제조판매업 허가 보유\n바이어에게 제조판매업 허가 번호 확인 요청',
          actionType: 'ai_ask',
          actionLabel: 'AI에게 수입 절차 묻기',
          actionPayload: `일본 화장품 수입 절차와 제조판매업 허가 확인 방법을 안내해줘.`,
        },
      ],
    };
  }

  // 나머지 국가는 기본 템플릿
  return {
    ...country,
    items: [
      {
        id: `${countryCode}-basic`,
        status: 'warn',
        title: `${country.name} 수출 규제 확인`,
        detail: `${country.name} 수출을 위한 현지 규제 확인이 필요합니다.`,
        regulation: country.law,
        flonixGuide: 'AI 에이전트에게 상세 규제 안내를 요청하세요.',
        actionType: 'ai_ask',
        actionLabel: 'AI에게 규제 안내 받기',
        actionPayload: `[${country.name} 수출 규제 안내]\n제품: ${productName}\n${country.name} (${country.law}) 수출 시 주요 규제 요건과 준비 사항을 안내해줘.`,
      },
    ],
  };
};

// ── 스코어카드 ─────────────────────────────────────────
const ScoreCard = ({
  items,
  countryName,
  countryFlag,
  onExpertContact,
}: {
  items: CheckItem[];
  countryName: string;
  countryFlag: string;
  onExpertContact: (type: 'customs'|'forwarder') => void;
}) => {
  const fail = items.filter(i => i.status === 'fail').length;
  const warn = items.filter(i => i.status === 'warn').length;
  const pass = items.filter(i => i.status === 'pass').length;
  const total = fail + warn + pass;
  const score = total > 0 ? Math.round((pass / total) * 100) : 0;

  const estimatedWeeks = fail > 0
    ? `Fail 해결: ${fail * 1}~${fail * 2}주`
    : warn > 0 ? '준비 기간: 약 1주' : '수출 준비 완료!';

  return (
    <div className="sticky top-4 w-64 shrink-0">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="text-center">
          <div className="text-3xl mb-1">{countryFlag}</div>
          <div className="font-semibold text-gray-800">{countryName} 수출 준비도</div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">진행률</span>
            <span className="font-bold text-purple-600">{score}%</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        <div className="space-y-2">
          {fail > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" /> 즉시 해결 필요
              </span>
              <span className="font-bold text-red-600">{fail}건</span>
            </div>
          )}
          {warn > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-amber-600">
                <Circle className="h-3.5 w-3.5" /> 검토 필요
              </span>
              <span className="font-bold text-amber-600">{warn}건</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> 완료
            </span>
            <span className="font-bold text-green-600">{pass}건</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 text-center">
          {estimatedWeeks}
        </div>

        <div className="space-y-2 pt-1 border-t border-gray-100">
          <div className="text-xs text-gray-400 font-medium">전문가 연결</div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => onExpertContact('customs')}
          >
            🏛️ 관세사 문의
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => onExpertContact('forwarder')}
          >
            🚢 포워더 견적
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── 체크 아이템 카드 ───────────────────────────────────
const CheckItemCard = ({
  item,
  productName,
  onAiAsk,
  onDocGen,
  checked,
  onCheck,
}: {
  item: CheckItem;
  productName: string;
  onAiAsk: (payload: string) => void;
  onDocGen: (payload: string) => void;
  checked: boolean;
  onCheck: () => void;
}) => {
  const [expanded, setExpanded] = useState(item.status === 'fail' || item.status === 'warn');

  const statusConfig = {
    fail: {
      bg: 'bg-red-50 border-red-200',
      badge: 'bg-red-100 text-red-700 border-red-300',
      label: 'Fail',
      dot: 'bg-red-500',
    },
    warn: {
      bg: 'bg-amber-50 border-amber-200',
      badge: 'bg-amber-100 text-amber-700 border-amber-300',
      label: 'Warn',
      dot: 'bg-amber-400',
    },
    pass: {
      bg: 'bg-white border-gray-200',
      badge: 'bg-green-100 text-green-700 border-green-300',
      label: 'Pass',
      dot: 'bg-green-500',
    },
    na: {
      bg: 'bg-gray-50 border-gray-200',
      badge: 'bg-gray-100 text-gray-500 border-gray-300',
      label: 'N/A',
      dot: 'bg-gray-300',
    },
  }[item.status];

  return (
    <div className={`rounded-xl border ${statusConfig.bg} overflow-hidden`}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-black/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dot}`} />
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusConfig.badge} shrink-0`}>
          {statusConfig.label}
        </span>
        <span className="flex-1 font-medium text-sm text-gray-800">{item.title}</span>
        <div className="flex items-center gap-2 shrink-0">
          {item.status !== 'pass' && item.status !== 'na' && !expanded && (
            <span className="text-xs text-gray-400">클릭해서 자세히 보기</span>
          )}
          {expanded
            ? <ChevronUp className="h-4 w-4 text-gray-400" />
            : <ChevronDown className="h-4 w-4 text-gray-400" />
          }
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-current/10">
          <div className="pt-3">
            <div className="text-xs text-gray-500 font-medium mb-1">📋 현황</div>
            <p className="text-sm text-gray-700">{item.detail}</p>
          </div>

          <div className="bg-white/80 rounded-lg p-3">
            <div className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" /> 규제 근거
            </div>
            <p className="text-xs text-gray-600">{item.regulation}</p>
            {item.regulationUrl && (
              <a
                href={item.regulationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 flex items-center gap-1 mt-1 hover:underline"
              >
                원문 확인 <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {item.flonixGuide && (
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <div className="text-xs text-purple-600 font-semibold mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> FLONIX 가이드
              </div>
              <p className="text-xs text-purple-800 whitespace-pre-line leading-relaxed">
                {item.flonixGuide}
              </p>
              {item.status === 'fail' && (
                <p className="text-xs text-gray-400 mt-2 italic">
                  💡 성분 함량 최종 결정은 제조사·ODM과 협의 필요
                </p>
              )}
            </div>
          )}

          {item.actionType !== 'none' && (
            <div className="flex gap-2 pt-1">
              {item.actionType === 'ai_ask' && (
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
                  onClick={() => onAiAsk(item.actionPayload || '')}
                >
                  <Bot className="h-3.5 w-3.5" />
                  {item.actionLabel || 'AI에게 묻기'}
                </Button>
              )}
              {item.actionType === 'doc_gen' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-purple-300 text-purple-700 text-xs gap-1.5"
                  onClick={() => onDocGen(item.actionPayload || '')}
                >
                  <FileText className="h-3.5 w-3.5" />
                  {item.actionLabel || '문서 생성'}
                </Button>
              )}
              {item.actionType === 'link' && (
                <a
                  href={item.actionPayload}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline" className="text-xs gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {item.actionLabel}
                  </Button>
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-current/10">
            <Checkbox
              id={`check-${item.id}`}
              checked={checked}
              onCheckedChange={onCheck}
            />
            <label htmlFor={`check-${item.id}`} className="text-xs text-gray-500 cursor-pointer">
              조치 완료 확인
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

// ── 완료 시 액션 배너 ──────────────────────────────────
const CompletionBanner = ({
  countryName,
  countryFlag,
  productName,
  onEmailDraft,
  onProposalGen,
  onDealRoomLink,
}: {
  countryName: string;
  countryFlag: string;
  productName: string;
  onEmailDraft: () => void;
  onProposalGen: () => void;
  onDealRoomLink: () => void;
}) => (
  <div className="rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="text-3xl">{countryFlag}</div>
      <div>
        <h3 className="font-bold text-green-800 text-lg">
          🎉 {countryName} 수출 준비 완료!
        </h3>
        <p className="text-sm text-green-600">{productName} — 주요 규제 기준 통과</p>
      </div>
    </div>
    <p className="text-sm text-green-700 mb-4 font-medium">지금 바로 할 수 있는 것:</p>
    <div className="grid grid-cols-1 gap-3">
      <Button
        className="bg-green-600 hover:bg-green-700 text-white justify-start gap-3 h-12"
        onClick={onEmailDraft}
      >
        <Mail className="h-4 w-4 shrink-0" />
        <div className="text-left">
          <div className="text-sm font-semibold">바이어에게 보낼 수출 준비 완료 이메일 초안 작성</div>
          <div className="text-xs opacity-80">딜룸 바이어 선택 → AI 초안 자동 생성</div>
        </div>
      </Button>
      <Button
        variant="outline"
        className="border-green-300 text-green-700 justify-start gap-3 h-12 bg-white"
        onClick={onProposalGen}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <div className="text-left">
          <div className="text-sm font-semibold">{countryName}향 제품 제안서(B2B Proposal) 생성</div>
          <div className="text-xs opacity-60">규제 통과 내용 포함 자동 생성</div>
        </div>
      </Button>
      <Button
        variant="outline"
        className="border-green-300 text-green-700 justify-start gap-3 h-12 bg-white"
        onClick={onDealRoomLink}
      >
        <ArrowRight className="h-4 w-4 shrink-0" />
        <div className="text-left">
          <div className="text-sm font-semibold">딜룸에서 본오더 단계로 이동</div>
          <div className="text-xs opacity-60">해당 바이어 딜룸 카드 단계 업그레이드</div>
        </div>
      </Button>
    </div>
  </div>
);

// ── 메인 페이지 ────────────────────────────────────────
export default function CompliancePage() {
  const navigate = useNavigate();
  const setPendingAutoMessage = useTradeStore(s => s.setPendingAutoMessage);

  const [step, setStep] = useState<'select' | 'result'>('select');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const PRODUCTS = [
    {
      id: 'CCS-001',
      name: 'Centella Calming Serum',
      inci: ['Water', 'Centella Asiatica Extract', 'Niacinamide', 'Hydroquinone', 'Fragrance', 'Glycerin'],
    },
    {
      id: 'HS-002',
      name: 'Centella Calming Serum 2',
      inci: ['Water', 'Centella Asiatica Extract', 'Niacinamide', 'Glycerin', 'Panthenol'],
    },
    {
      id: 'HS-001',
      name: 'EGF ALLANTENOL',
      inci: ['Water', 'EGF', 'Allantoin', 'Retinol', 'Triethanolamine', 'Fragrance'],
    },
  ];

  const selectedProductData = PRODUCTS.find(p => p.id === selectedProduct);

  const rulepack = useMemo(() => {
    if (!selectedCountry || !selectedProductData) return null;
    return buildRulepack(selectedCountry, selectedProductData.name, selectedProductData.inci);
  }, [selectedCountry, selectedProductData]);

  const sortedItems = useMemo(() => {
    if (!rulepack) return [];
    const order = { fail: 0, warn: 1, pass: 2, na: 3 };
    return [...rulepack.items].sort((a, b) => order[a.status] - order[b.status]);
  }, [rulepack]);

  const failCount = sortedItems.filter(i => i.status === 'fail').length;
  const warnCount = sortedItems.filter(i => i.status === 'warn').length;
  const isClearForExport = failCount === 0;

  const handleAiAsk = (payload: string) => {
    setPendingAutoMessage(payload);
    navigate('/home');
  };

  const handleDocGen = (payload: string) => {
    setPendingAutoMessage(payload);
    navigate('/home');
  };

  const handleEmailDraft = () => {
    const country = COUNTRIES.find(c => c.code === selectedCountry);
    setPendingAutoMessage(
      `[수출 준비 완료 이메일 초안]\n제품: ${selectedProductData?.name}\n수출 국가: ${country?.name}\n\n이 제품의 ${country?.name} 수출 준비가 완료되었습니다. 바이어에게 보낼 수출 준비 완료 안내 이메일 초안을 영문으로 작성해줘.`
    );
    navigate('/home');
  };

  const handleProposalGen = () => {
    const country = COUNTRIES.find(c => c.code === selectedCountry);
    setPendingAutoMessage(
      `[B2B Proposal 생성]\n제품: ${selectedProductData?.name}\n수출 국가: ${country?.name} (${country?.law} 규제 통과)\n\n${country?.name}향 B2B 제품 제안서를 작성해줘. 규제 통과 내용과 제품 주요 성분 강점을 포함해줘.`
    );
    navigate('/home');
  };

  const handleExpertContact = (type: 'customs' | 'forwarder') => {
    navigate('/network');
  };

  // ── STEP 1: 국가 + 제품 선택 ──
  if (step === 'select') {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">규제 체크리스트</h1>
              <p className="text-sm text-gray-500">INCI 성분 기반 11개국 실행형 규제 분석</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 max-w-3xl mx-auto w-full space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">1</div>
              <h2 className="font-semibold text-gray-800">수출 목표 국가 선택</h2>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {COUNTRIES.map(country => (
                <button
                  key={country.code}
                  onClick={() => setSelectedCountry(country.code)}
                  className={`p-3 rounded-xl border-2 text-center transition-all hover:shadow-md ${
                    selectedCountry === country.code
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{country.flag}</div>
                  <div className="text-xs font-semibold text-gray-700">{country.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-tight">{country.law.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${selectedCountry ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
              <h2 className={`font-semibold ${selectedCountry ? 'text-gray-800' : 'text-gray-400'}`}>분석할 제품 선택</h2>
            </div>
            <div className="space-y-3">
              {PRODUCTS.map(product => (
                <button
                  key={product.id}
                  onClick={() => selectedCountry && setSelectedProduct(product.id)}
                  disabled={!selectedCountry}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    !selectedCountry
                      ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      : selectedProduct === product.id
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-purple-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{product.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{product.id} · INCI {product.inci.length}종 등록</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full h-14 text-base font-semibold bg-purple-600 hover:bg-purple-700 gap-2"
            disabled={!selectedCountry || !selectedProduct}
            onClick={() => setStep('result')}
          >
            <Globe className="h-5 w-5" />
            규제 분석 시작
            <ArrowRight className="h-5 w-5" />
          </Button>

          <p className="text-xs text-gray-400 text-center">
            💡 FLONIX는 규제 기준 안내와 문서 자동화를 제공합니다.
            성분 함량 조정 및 포뮬라 변경은 제조사·ODM과 협의하세요.
          </p>
        </div>
      </div>
    );
  }

  // ── STEP 2: 결과 화면 ──
  const country = COUNTRIES.find(c => c.code === selectedCountry)!;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep('select')}
            className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1"
          >
            ← 다시 선택
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div className="text-2xl">{country.flag}</div>
          <div>
            <h1 className="font-bold text-gray-900">
              {country.name} — {selectedProductData?.name}
            </h1>
            <p className="text-xs text-gray-400">{country.law}</p>
          </div>
          <div className="ml-auto flex gap-2">
            {failCount > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200">
                ❌ Fail {failCount}건
              </Badge>
            )}
            {warnCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                ⚠️ Warn {warnCount}건
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex gap-6 p-6 max-w-5xl mx-auto">
          <div className="flex-1 space-y-3">
            {isClearForExport && selectedProductData && (
              <CompletionBanner
                countryName={country.name}
                countryFlag={country.flag}
                productName={selectedProductData.name}
                onEmailDraft={handleEmailDraft}
                onProposalGen={handleProposalGen}
                onDealRoomLink={() => navigate('/export-projects')}
              />
            )}

            {failCount > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-bold text-red-600">즉시 해결 필요 ({failCount}건)</span>
                  <span className="text-xs text-red-400">— 수출 불가 원인</span>
                </div>
                <div className="space-y-2">
                  {sortedItems.filter(i => i.status === 'fail').map(item => (
                    <CheckItemCard
                      key={item.id}
                      item={item}
                      productName={selectedProductData?.name || ''}
                      onAiAsk={handleAiAsk}
                      onDocGen={handleDocGen}
                      checked={checkedItems[item.id] || false}
                      onCheck={() => setCheckedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    />
                  ))}
                </div>
              </div>
            )}

            {warnCount > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 mt-4">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-bold text-amber-600">검토 및 준비 필요 ({warnCount}건)</span>
                </div>
                <div className="space-y-2">
                  {sortedItems.filter(i => i.status === 'warn').map(item => (
                    <CheckItemCard
                      key={item.id}
                      item={item}
                      productName={selectedProductData?.name || ''}
                      onAiAsk={handleAiAsk}
                      onDocGen={handleDocGen}
                      checked={checkedItems[item.id] || false}
                      onCheck={() => setCheckedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    />
                  ))}
                </div>
              </div>
            )}

            {sortedItems.filter(i => i.status === 'pass').length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 mt-4">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold text-green-600">
                    이상 없음 ({sortedItems.filter(i => i.status === 'pass').length}건)
                  </span>
                </div>
                <div className="space-y-2">
                  {sortedItems.filter(i => i.status === 'pass').map(item => (
                    <CheckItemCard
                      key={item.id}
                      item={item}
                      productName={selectedProductData?.name || ''}
                      onAiAsk={handleAiAsk}
                      onDocGen={handleDocGen}
                      checked={checkedItems[item.id] || false}
                      onCheck={() => setCheckedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                본 정보는 참고용이며 법적 효력이 없습니다.
                최종 수출 전 관세사·법률 전문가 확인을 권장합니다.
              </p>
            </div>
          </div>

          <ScoreCard
            items={sortedItems}
            countryName={country.name}
            countryFlag={country.flag}
            onExpertContact={handleExpertContact}
          />
        </div>
      </div>
    </div>
  );
}
