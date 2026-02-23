import React from 'react';
import { ScanEye, BrainCircuit, FileOutput } from 'lucide-react';

const AI_TECHS = [
{
  icon: ScanEye,
  phase: '인지',
  title: 'Vision AI',
  subtitle: '성분 자동 추출',
  description:
  '제품 라벨 사진 한 장만 업로드하세요. FLONIX AI가 이미지 속 전성분(INCI)을 100%의 정확도로 인식하고 디지털 데이터로 변환합니다.',
  accent: 'from-blue-400 to-cyan-400',
  glow: 'bg-blue-500/20'
},
{
  icon: BrainCircuit,
  phase: '추론',
  title: 'Hybrid RAG',
  subtitle: '실시간 규제 매칭',
  description:
  '추출된 성분 데이터를 미국, 유럽 등 11개국 최신 화장품 규제 DB와 실시간으로 대조하여 통관 리스크를 사전에 차단합니다.',
  accent: 'from-violet-400 to-purple-400',
  glow: 'bg-violet-500/20'
},
{
  icon: FileOutput,
  phase: '생성',
  title: 'Trade Docu-Gen',
  subtitle: '무역 서류 자동화',
  description:
  '단순한 텍스트 답변이 아닙니다. 바이어 정보와 제품 스펙을 결합하여, 세관에 즉시 제출 가능한 국제 표준 포맷의 PI, CI, PL을 그려냅니다.',
  accent: 'from-emerald-400 to-teal-400',
  glow: 'bg-emerald-500/20'
}];


export function AIEngineSection() {
  return (
    <section className="relative py-24 lg:py-32 bg-[hsl(222,47%,8%)] overflow-hidden">
      {/* Neural network background pattern */}
      <div className="absolute inset-0 opacity-[0.06]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="neural-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neural-grid)" />
          {/* Connection lines */}
          <line x1="0" y1="0" x2="100%" y2="100%" stroke="white" strokeWidth="0.5" opacity="0.3" />
          <line x1="100%" y1="0" x2="0" y2="100%" stroke="white" strokeWidth="0.5" opacity="0.3" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="0.5" opacity="0.2" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="white" strokeWidth="0.5" opacity="0.2" />
        </svg>
      </div>

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/6 w-[300px] h-[300px] bg-blue-500/8 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/6 w-[300px] h-[300px] bg-violet-500/8 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-sm font-semibold tracking-wider uppercase mb-4 bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
            The AI Behind FLONIX
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold text-white leading-snug max-w-3xl mx-auto">
            무역 전문가의 두뇌를 그대로 이식한
            <br />
            K-Beauty 특화 AI 엔진
          </h2>
        </div>

        {/* 3 columns */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          {AI_TECHS.map((tech, i) =>
          <div
            key={tech.title}
            className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-8 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.05] hover:-translate-y-1">

              {/* Glow behind icon */}
              <div className={`absolute top-6 left-6 w-16 h-16 ${tech.glow} rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              {/* Phase badge */}
              <div className="flex items-center gap-2 mb-6">
                <span className={`text-xs font-bold uppercase tracking-widest bg-gradient-to-r ${tech.accent} bg-clip-text text-transparent`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-white/10" />
                <span className={`text-xs font-semibold bg-gradient-to-r ${tech.accent} bg-clip-text text-transparent`}>
                  {tech.phase}
                </span>
              </div>

              {/* Icon */}
              <div className="relative mb-6">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tech.accent} bg-opacity-10 flex items-center justify-center`}
              style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))` }}>

                  <tech.icon className="h-7 w-7 text-white/90" />
                </div>
              </div>

              {/* Title */}
              <h3 className={`text-xl font-bold mb-1 bg-gradient-to-r ${tech.accent} bg-clip-text text-transparent`}>
                {tech.title}
              </h3>
              <p className="text-sm font-medium text-white/60 mb-4">{tech.subtitle}</p>

              {/* Description */}
              <p className="text-sm text-white/50 leading-relaxed">
                {tech.description}
              </p>

              {/* Bottom accent line */}
              <div className={`absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r ${tech.accent} opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
            </div>
          )}
        </div>

        {/* Flow arrows between cards (desktop only) */}
        <div className="hidden md:flex items-center justify-center mt-10">
          <span className="text-xs text-white/30 font-medium">인지 → 추론 → 생성</span>
        </div>
      </div>
    </section>);

}