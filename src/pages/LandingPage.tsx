import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Check,
  Shield,
  Users,
  Package,
  ClipboardCheck,
  Play,
  ArrowRight,
  Globe,
  Zap,
  MessageSquare } from
'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SampleExperienceModal } from '@/components/landing/SampleExperienceModal';
import { WorkflowStepsSection } from '@/components/landing/WorkflowStepsSection';
import { CoreFeaturesSection } from '@/components/landing/CoreFeaturesSection';
import { AIEngineSection } from '@/components/landing/AIEngineSection';
import { SalesProjectSection } from '@/components/landing/SalesProjectSection';
import dashboardMockup from '@/assets/dashboard-mockup.png';

const KEY_FEATURES = [
{
  icon: FileText,
  secondaryIcon: ClipboardCheck,
  title: '1-Click 무역 서류 자동화',
  description: '엑셀 수식은 이제 그만. 바이어와 제품만 선택하면 각 단계별 필요한 수출 서류가 정확한 계산으로 자동 완성됩니다.',
  gradient: 'from-primary/10 to-primary/5',
  iconBg: 'bg-primary/15',
  iconColor: 'text-primary'
},
{
  icon: Shield,
  secondaryIcon: Check,
  title: '실행형 규제 체크 엔진',
  description: '성분 사진 한 장으로 11개국 수출 규제(MoCRA, CPNP 등)를 스크리닝하고, 즉시 실행 가능한 솔루션 체크리스트를 제공합니다.',
  gradient: 'from-success/10 to-success/5',
  iconBg: 'bg-success/15',
  iconColor: 'text-success'
},
{
  icon: Users,
  secondaryIcon: Package,
  title: '수출 CRM 파이프라인',
  description: '바이어 발굴부터 첫 제안, 본 오더, 선적까지. 프로젝트별 진행 상황을 칸반 보드에서 시각적으로 관리하세요.',
  gradient: 'from-accent-violet/10 to-accent-violet/5',
  iconBg: 'bg-accent-violet/15',
  iconColor: 'text-accent-violet'
}];


const NAV_ITEMS = ['기능', '사용법', 'ROI', 'FAQ'];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const handlePrimaryCTA = () => {
    if (isAuthenticated) {
      navigate('/home');
    } else {
      navigate('/signup');
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Top Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <Globe className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-foreground">FLONIX</span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {NAV_ITEMS.map((item, i) =>
              <button
                key={item}
                onClick={() => scrollToSection(['features', 'how-it-works', 'roi', 'faq'][i])}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors">

                  {item}
                </button>
              )}
            </nav>

            <div className="flex items-center gap-2">
              {isAuthenticated ?
              <Button size="sm" onClick={() => navigate('/home')}>
                  대시보드
                </Button> :

              <>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                    로그인
                  </Button>
                  <Button size="sm" onClick={handlePrimaryCTA} className="gap-1.5">
                    무료로 시작하기
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </>
              }
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-background to-accent-mint/4" />
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-violet/6 rounded-full blur-[100px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium">
                <Zap className="h-3.5 w-3.5" />
                K-뷰티 수출 오퍼레이션 OS
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-foreground leading-[1.3] tracking-tight">
                K-뷰티 수출 서류부터
                <br />
                11개국 규제 체크까지.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-violet">
                  엑셀 없이 끝내는 AI 무역팀
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                단 1명의 인력으로 10배의 수출 업무를 처리하세요.
                <br className="hidden sm:block" />
                K-뷰티 SME를 위한 완벽한 수출 오퍼레이션 OS, <strong className="text-foreground">플로닉스</strong>.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Button size="lg" onClick={handlePrimaryCTA} className="gap-2 rounded-xl text-base px-8 h-13 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  FLONIX 무료로 체험하기
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowSampleModal(true)}
                  className="gap-2 rounded-xl text-base">

                  <Play className="h-4 w-4" />
                  샘플 미리보기
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
                {['AI 에이전트와 함께 하는 수출 프로젝트, 바이어/제품 관리', '11개국 규제 DB', '즉시 시작'].map((text) =>
                <div key={text} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-success" />
                    <span>{text}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative lg:pl-4">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/50 bg-card">
                <img
                  src={dashboardMockup}
                  alt="FLONIX 수출 프로젝트 워크스페이스 대시보드"
                  className="w-full h-auto"
                  loading="eager" />

              </div>
              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl border border-border shadow-lg px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">11개국 규제 커버</p>
                  <p className="text-xs text-muted-foreground">실시간 성분 분석</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1) Key Features */}
      <section id="features" className="py-20 lg:py-28 bg-gradient-to-b from-background to-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-3">
              Key Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              수출에 필요한 모든 것, 플로닉스 하나로.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {KEY_FEATURES.map((feature, i) =>
            <div
              key={i}
              className="group relative bg-card rounded-2xl border border-border p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/30">

                {/* Icon cluster */}
                <div className="relative mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                    <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg ${feature.iconBg} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    <feature.secondaryIcon className={`h-3.5 w-3.5 ${feature.iconColor}`} />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>

                {/* Bottom gradient line on hover */}
                <div className={`absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r ${feature.gradient} rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Core Features - Zig-zag detail */}
      <CoreFeaturesSection />

      {/* 2) How it Works */}
      <div id="how-it-works">
        <WorkflowStepsSection />
      </div>

      {/* AI Engine */}
      <AIEngineSection />

      {/* 3) ROI Section */}
      <section id="roi" className="py-20 lg:py-28 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-3">
              Expected ROI
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              도입 효과, 숫자로 증명합니다.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
            { number: '10X', label: '업무 처리량 증가', desc: '동일 인력 대비 업무 처리량 10배 증가. 1인 1건에서 1인 10건으로.', color: 'text-primary' },
            { number: 'Zero', label: '휴먼 에러', desc: '인보이스 및 서류 작성 시 휴먼 에러를 원천 차단합니다.', color: 'text-success' },
            { number: '3 Min', label: '서류 세팅 완료', desc: '건당 수십 시간 걸리던 무역 서류 세팅을 단 3분 만에 완성.', color: 'text-accent-violet' }].
            map((item, i) =>
            <div key={i} className="text-center space-y-4 p-8 rounded-2xl bg-background border border-border">
                <p className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight ${item.color}`}>
                  {item.number}
                </p>
                <p className="text-lg font-semibold text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sales Project Premium Service */}
      <SalesProjectSection />

      {/* Final CTA - Split View */}
      <section className="py-20 lg:py-28 bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 leading-snug text-center">
            준비된 글로벌 브랜드의 시작,
            <br />
            플로닉스와 함께하세요.
          </h2>
          <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
            {/* Left - Software */}
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl border border-primary-foreground/20 p-8 text-center flex flex-col items-center">
              <p className="text-sm font-medium text-primary-foreground/60 mb-3">바이어가 있다면?</p>
              <h3 className="text-xl font-bold mb-3">소프트웨어 바로 시작하기</h3>
              <p className="text-sm text-primary-foreground/60 mb-8 max-w-xs">
                K-뷰티 수출 서류부터 규제 체크까지, 지금 바로 무료로 시작하세요.
              </p>
              <Button
                size="lg"
                onClick={handlePrimaryCTA}
                className="gap-2 rounded-xl text-base px-8 h-13 bg-background text-foreground hover:bg-background/90 shadow-xl mt-auto">

                무료 가입하기
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            {/* Right - Consultation */}
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl border border-primary-foreground/20 p-8 text-center flex flex-col items-center">
              <p className="text-sm font-medium text-primary-foreground/60 mb-3">바이어가 필요하다면?</p>
              <h3 className="text-xl font-bold mb-3">전문가에게 상담받기</h3>
              <p className="text-sm text-primary-foreground/60 mb-8 max-w-xs">
                글로벌 무역 전문가가 진성 바이어를 직접 발굴해 드립니다.
              </p>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  const section = document.querySelector('[data-sales-project]');
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => {
                      const btn = section.querySelector('button');
                      btn?.click();
                    }, 600);
                  }
                }}
                className="gap-2 rounded-xl text-base px-8 h-13 border-primary-foreground/40 text-primary hover:bg-primary-foreground/20 bg-primary-foreground mt-auto">

                문의 남기기
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Globe className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-base font-bold text-foreground">FLONIX</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                K-뷰티 SME를 위한
                <br />
                AI 수출 오퍼레이션 OS
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Product</p>
              <div className="space-y-2">
                {['서류 자동화', '규제 체크', 'CRM 파이프라인', '요금제 (준비중)'].map((item) =>
                <p key={item} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{item}</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Support</p>
              <div className="space-y-2">
                {['고객센터', 'FAQ', '도입 문의'].map((item) =>
                <p key={item} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{item}</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Legal</p>
              <div className="space-y-2">
                {['이용약관', '개인정보처리방침', '데이터 처리 정책'].map((item) =>
                <p key={item} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{item}</p>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} FLONIX. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">대표: 김진현 | 서울특별시 서울 동대문구 경희대로 26 216호</p>
          </div>
        </div>
      </footer>

      <SampleExperienceModal
        open={showSampleModal}
        onClose={() => setShowSampleModal(false)} />

    </div>);

}