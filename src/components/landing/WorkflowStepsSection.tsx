import React, { useState, useEffect, useRef } from 'react';
import { Camera, FolderPlus, Download } from 'lucide-react';
import stepInputImg from '@/assets/step-input.png';
import stepActionImg from '@/assets/step-action.png';
import stepResultImg from '@/assets/step-result.png';

const STEP_IMAGES: Record<string, string> = {
  input: stepInputImg,
  action: stepActionImg,
  result: stepResultImg,
};

const STEPS = [
  {
    id: 'input',
    step: 'Step 1',
    label: 'Input',
    title: '마이 데이터 준비',
    description:
      '제품 전성분표를 찍어 올리고, 바이어 정보를 한 번만 등록하세요. OCR 기술로 성분을 자동 추출합니다.',
    icon: Camera,
    color: 'text-primary',
    bg: 'bg-primary/15',
    ring: 'ring-primary/30',
  },
  {
    id: 'action',
    step: 'Step 2',
    label: 'Action',
    title: '수출 프로젝트 생성',
    description:
      '바이어를 선택하고 수량만 입력하면 끝입니다. AI가 관세와 중량을 자동 계산하고, 국가별 규제(RulePack)에 맞춘 필수 서류를 먼저 제안합니다.',
    icon: FolderPlus,
    color: 'text-accent-violet',
    bg: 'bg-accent-violet/15',
    ring: 'ring-accent-violet/30',
  },
  {
    id: 'result',
    step: 'Step 3',
    label: 'Result',
    title: '최종 서류 다운로드 및 발송',
    description:
      '완성된 인보이스와 패킹리스트를 국제 표준 PDF로 다운로드하거나, 에이전트를 통해 바이어에게 즉시 이메일로 발송하세요.',
    icon: Download,
    color: 'text-success',
    bg: 'bg-success/15',
    ring: 'ring-success/30',
  },
];

function MockupImage({ step }: { step: typeof STEPS[number] }) {
  const titles: Record<string, string> = {
    input: '성분표 업로드 & 바이어 등록',
    action: '프로젝트 생성 & AI 서류 제안',
    result: '서류 다운로드 & 이메일 발송',
  };

  return (
    <div className="w-full rounded-2xl border border-border overflow-hidden bg-card shadow-lg">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/40">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-danger/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
        </div>
        <span className="text-xs text-muted-foreground ml-2">FLONIX — {titles[step.id]}</span>
      </div>
      <img
        src={STEP_IMAGES[step.id]}
        alt={titles[step.id]}
        className="w-full h-auto"
        loading="lazy"
      />
    </div>
  );
}

export function WorkflowStepsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [animKey, setAnimKey] = useState(0);

  // Auto-cycle
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % STEPS.length;
        setAnimKey((k) => k + 1);
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [isVisible]);

  // Intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.2 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleStepClick = (index: number) => {
    setActiveIndex(index);
    setAnimKey((k) => k + 1);
  };

  return (
    <section ref={sectionRef} className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-3">
            How to Use
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            단 3단계로, 수출 서류 완성.
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Steps */}
          <div className="space-y-4">
            {STEPS.map((step, i) => {
              const isActive = activeIndex === i;
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(i)}
                  className={`w-full text-left rounded-2xl border-2 p-6 transition-all duration-300 ${
                    isActive
                      ? 'border-primary/40 bg-primary/[0.03] shadow-lg shadow-primary/5'
                      : 'border-border bg-card hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors duration-300 ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold uppercase tracking-wide ${isActive ? step.color : 'text-muted-foreground'}`}>
                          {step.step} · {step.label}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-1.5">{step.title}</h3>
                      <p
                        className={`text-sm leading-relaxed transition-all duration-300 ${
                          isActive ? 'text-muted-foreground max-h-40 opacity-100' : 'text-muted-foreground/60 max-h-0 opacity-0 overflow-hidden'
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="mt-4 ml-14 h-0.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-[progress_6s_linear]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Mockup */}
          <div className="lg:sticky lg:top-24">
            <div key={animKey} className="animate-fade-in">
              <MockupImage step={STEPS[activeIndex]} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
