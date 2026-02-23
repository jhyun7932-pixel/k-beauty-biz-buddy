import React from 'react';
import { FileText, ShieldCheck, Kanban, ArrowRight, Check } from 'lucide-react';
import featureTradeDocs from '@/assets/feature-trade-docs.png';
import featureRulepack from '@/assets/feature-rulepack.png';
import featureCrm from '@/assets/feature-crm.png';

const FEATURE_IMAGES = [featureTradeDocs, featureRulepack, featureCrm];
const CORE_FEATURES = [
  {
    icon: FileText,
    tag: 'Trade Docs',
    title: '수량만 넣으세요. 계산은 AI가 합니다.',
    description:
      '첫 단계부터 PI, CI, PL까지. 제품 무게와 단가를 바탕으로 무역 표준 서식의 PDF를 클릭 한 번에 완성합니다. 오타로 인한 세관 억류 위험을 0%로 만듭니다.',
    bullets: ['PI · CI · PL 자동 생성', '무역 표준 서식 PDF', '세관 리스크 제로'],
    accentColor: 'primary',
  },
  {
    icon: ShieldCheck,
    tag: 'RulePack Engine',
    title: '11개국 화장품 규제, 성분표 사진 한 장으로 진단.',
    description:
      '미국 MoCRA, 유럽 CPNP 등 타겟 국가의 배합 금지 성분을 실시간으로 스크리닝하고, 통관을 위해 지금 당장 \'무엇을 해야 하는지\' 실행 가능한 체크리스트를 제공합니다.',
    bullets: ['실시간 성분 스크리닝', '국가별 금지/제한 매칭', '실행형 체크리스트'],
    accentColor: 'success',
  },
  {
    icon: Kanban,
    tag: 'Visual CRM',
    title: '바이어 컨택부터 선적까지, 한눈에 보는 칸반 보드.',
    description:
      '흩어진 이메일과 엑셀을 버리세요. 바이어와의 협상 단계를 시각화하고, 다음 단계에 필요한 서류를 AI가 먼저 제안합니다.',
    bullets: ['딜 파이프라인 시각화', 'AI 서류 제안', '후속 액션 자동 알림'],
    accentColor: 'accent-violet',
  },
];

const colorMap: Record<string, { bg: string; text: string; tagBg: string; border: string }> = {
  primary: {
    bg: 'bg-primary/5',
    text: 'text-primary',
    tagBg: 'bg-primary/10',
    border: 'border-primary/10',
  },
  success: {
    bg: 'bg-success/5',
    text: 'text-success',
    tagBg: 'bg-success/10',
    border: 'border-success/10',
  },
  'accent-violet': {
    bg: 'bg-accent-violet/5',
    text: 'text-accent-violet',
    tagBg: 'bg-accent-violet/10',
    border: 'border-accent-violet/10',
  },
};

export function CoreFeaturesSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-20">
          <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-3">
            Core Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            왜 FLONIX인가요?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            수출 실무의 가장 큰 병목 3가지를 정면으로 해결합니다.
          </p>
        </div>

        {/* Zig-zag Features */}
        <div className="space-y-20 lg:space-y-28">
          {CORE_FEATURES.map((feature, i) => {
            const colors = colorMap[feature.accentColor];
            const isReversed = i % 2 === 1;

            return (
              <div
                key={i}
                className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                  isReversed ? 'lg:direction-rtl' : ''
                }`}
              >
                {/* Text Side */}
                <div className={`space-y-6 ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${colors.tagBg} ${colors.text}`}
                  >
                    <feature.icon className="h-3.5 w-3.5" />
                    {feature.tag}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed text-base">
                    {feature.description}
                  </p>

                  <div className="space-y-2.5 pt-1">
                    {feature.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-center gap-2.5">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full ${colors.tagBg} flex items-center justify-center`}>
                          <Check className={`h-3 w-3 ${colors.text}`} />
                        </div>
                        <span className="text-sm text-foreground/80">{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Side */}
                <div className={`${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div
                    className={`relative rounded-2xl border ${colors.border} overflow-hidden shadow-lg`}
                  >
                    <img
                      src={FEATURE_IMAGES[i]}
                      alt={feature.tag}
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
