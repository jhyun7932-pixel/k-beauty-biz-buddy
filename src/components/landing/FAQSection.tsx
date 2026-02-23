import React, { useState, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const FAQ_CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'product', label: '제품' },
  { key: 'compliance', label: '규제/컴플라이언스' },
  { key: 'security', label: '보안/데이터' },
  { key: 'pricing', label: '요금/지원' },
];

const FAQ_ITEMS = [
  {
    q: 'FLONIX는 어떤 서비스인가요?',
    a: 'FLONIX는 K-뷰티 SME의 수출 오퍼레이션을 자동화하는 B2B SaaS입니다. 무역 서류 자동 생성, 11개국 규제 체크, 바이어 CRM을 하나의 플랫폼에서 제공합니다.',
    category: 'product',
  },
  {
    q: '어떤 나라를 지원하나요?',
    a: '현재 미국, 일본, EU, 홍콩, 대만, 중국, 베트남, 인도네시아, 말레이시아, 태국, 호주 등 11개국을 지원합니다. 국가별 RulePack(근거/확인/조치)과 금지·제한 성분 DB가 포함되어 있으며, 지원 국가는 계속 확대됩니다.',
    category: 'compliance',
  },
  {
    q: 'ChatGPT 같은 일반 AI와 뭐가 다른가요?',
    a: '일반 LLM은 대화는 잘하지만 조건이 바뀌면 문서 간 일관성이 깨지고, 표/수치 같은 필드 업데이트가 어렵습니다. FLONIX는 프로젝트 DB와 템플릿 엔진으로 문서 간 연결을 유지하고, 조건 변경 시 연관 서류를 자동 업데이트합니다.',
    category: 'product',
  },
  {
    q: '어떤 서류를 자동 생성할 수 있나요?',
    a: '거래 단계별로 필요한 서류를 자동 생성합니다: Company/Brand Deck, Product Catalog, Compliance Snapshot(RulePack), Proforma Invoice(PI), Contract, 단계별 영업/후속 메일 초안까지 포함됩니다.',
    category: 'product',
  },
  {
    q: '컴플라이언스 체크는 어떻게 작동하나요?',
    a: '성분표 라벨 사진을 업로드하면 AI OCR로 INCI 성분을 추출하고, 타겟 국가의 금지/제한 성분 DB와 실시간 비교합니다. 단순 Pass/Fail이 아니라 RulePack(근거/확인/조치) 형태로 실무에서 바로 실행할 수 있는 체크리스트를 제공합니다.',
    category: 'compliance',
  },
  {
    q: '컴플라이언스 결과가 틀리면 책임은요?',
    a: 'FLONIX는 법률 자문이 아닌 실무 준비용 도구입니다. RulePack에 관련 법령 출처를 명시하고, 버전 히스토리를 남겨 리스크를 줄입니다. 추후 전문가 검토(관세사/무역사) 유료 옵션이 추가될 예정입니다.',
    category: 'compliance',
  },
  {
    q: '우리 회사 자료(소개서/성분표/라벨)는 안전한가요?',
    a: '워크스페이스 단위로 데이터가 분리 저장되며, 프로젝트별 파일/히스토리가 독립적으로 관리됩니다. 추후 삭제 정책 및 접근 로그 옵션을 제공할 예정입니다.',
    category: 'security',
  },
  {
    q: '누가 쓰면 가장 효과가 크나요?',
    a: '타겟 국가가 2개 이상이거나, 바이어별 요구가 달라 서류 수정이 반복되는 K-뷰티 수출팀(브랜드/제조/유통)에게 효과가 가장 큽니다. 1인 수출 담당자도 10건 이상의 프로젝트를 동시에 관리할 수 있게 됩니다.',
    category: 'product',
  },
  {
    q: '요금은 어떻게 되나요?',
    a: '현재 무료 체험이 가능합니다. 정식 요금제는 준비 중이며, 출시 시 사전 가입자에게 특별 혜택이 제공됩니다.',
    category: 'pricing',
  },
  {
    q: '지금 바로 체험하면 뭘 먼저 해보면 좋나요?',
    a: '1) 목표 국가 선택 → 2) 성분표/라벨 이미지 업로드 → 3) \'첫 제안\' 프리셋 선택 → 4) Company Deck 또는 Compliance Snapshot 초안 생성 → 대화로 수정 → 최종 확정의 흐름을 경험해보세요.',
    category: 'product',
  },
];

export function FAQSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredFaqs = useMemo(() => {
    let items = FAQ_ITEMS;
    if (activeCategory !== 'all') {
      items = items.filter((faq) => faq.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (faq) => faq.q.toLowerCase().includes(query) || faq.a.toLowerCase().includes(query)
      );
    }
    return items;
  }, [searchQuery, activeCategory]);

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            자주 묻는 질문
          </h2>
          <p className="text-muted-foreground mb-8">
            FLONIX 도입 전 궁금한 점을 확인해보세요.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="질문 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => { setActiveCategory(cat.key); setOpenFaq(null); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              검색 결과가 없습니다
            </div>
          ) : (
            filteredFaqs.map((item) => {
              const originalIndex = FAQ_ITEMS.indexOf(item);
              return (
                <div
                  key={originalIndex}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === originalIndex ? null : originalIndex)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <span className="font-medium text-foreground pr-4">{item.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${
                        openFaq === originalIndex ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === originalIndex && (
                    <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {searchQuery && filteredFaqs.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            {filteredFaqs.length}개의 FAQ가 검색되었습니다
          </p>
        )}
      </div>
    </section>
  );
}
