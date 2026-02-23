 import React, { useState } from 'react';
 import { FileText, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 
 const SAMPLES = [
   {
     id: 'deck',
     title: 'Company/Brand Deck',
     subtitle: '≤15p',
     description: '브랜드 소개, 제품 라인업, 인증/수출 실적을 한눈에',
     pages: [
       { title: '표지', content: 'K-Beauty Brand\nCompany Introduction 2025' },
       { title: '브랜드 스토리', content: '• 설립: 2018년\n• 미션: K-뷰티의 글로벌화\n• 핵심 가치: 혁신, 품질, 지속가능성' },
       { title: '제품 라인업', content: '• 스킨케어 (12 SKUs)\n• 메이크업 (8 SKUs)\n• 헤어케어 (5 SKUs)' },
       { title: '인증 현황', content: '• FDA 등록 완료\n• CPNP 등록 완료\n• ISO 22716 인증' },
     ],
   },
   {
     id: 'compliance',
     title: 'Compliance Snapshot',
     subtitle: 'RulePack 포함',
     description: '국가별 규제 근거, 확인 체크리스트, 조치 가이드',
     pages: [
       { title: '요약', content: '미국 시장 컴플라이언스\n준비 상태: 🟢 가능 (3) | 🟡 주의 (1) | 🔴 추가확인 (0)' },
       { title: 'MoCRA 요구사항', content: '✅ 시설 등록\n✅ 제품 등록\n✅ 성분 공개\n⚠️ 안전성 입증 자료' },
       { title: 'RulePack: 라벨링', content: '📋 근거: 21 CFR 701.3\n✔️ 확인: 전성분 영문 표기\n🔧 조치: INCI 순서 정렬 필요' },
       { title: '다음 단계', content: '1. 안전성 테스트 리포트 준비\n2. 영문 라벨 최종 검토\n3. FDA 등록 완료 확인' },
     ],
   },
   {
     id: 'pi',
     title: 'PI (견적서)',
     subtitle: '거래 조건 초안',
     description: 'MOQ, 단가, 결제조건, 인코텀즈가 포함된 견적서',
     pages: [
       { title: 'Proforma Invoice', content: 'PI No: PI-2025-001\nDate: 2025-01-15\nBuyer: ABC Trading Co.' },
       { title: '거래 조건', content: '• MOQ: 1,000 units/SKU\n• Unit Price: $8.50 FOB\n• Payment: T/T 30% deposit\n• Lead Time: 45 days' },
     ],
   },
 ];
 
 interface SampleModalProps {
   sample: typeof SAMPLES[0] | null;
   open: boolean;
   onClose: () => void;
 }
 
 function SampleModal({ sample, open, onClose }: SampleModalProps) {
   const [currentPage, setCurrentPage] = useState(0);
 
   if (!sample) return null;
 
   const pages = sample.pages;
 
   return (
     <Dialog open={open} onOpenChange={onClose}>
       <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <FileText className="h-5 w-5 text-primary" />
             {sample.title}
             <span className="text-sm font-normal text-muted-foreground ml-2">
               (샘플 미리보기)
             </span>
           </DialogTitle>
         </DialogHeader>
 
         <div className="flex-1 min-h-0 flex flex-col">
           {/* PDF-like viewer */}
           <div className="flex-1 bg-muted/30 rounded-lg border border-border p-8 overflow-auto">
             <div className="bg-white rounded-lg shadow-lg p-8 min-h-[400px] max-w-2xl mx-auto">
               <div className="border-b border-border pb-4 mb-6">
                 <p className="text-xs text-muted-foreground uppercase tracking-wider">
                   {sample.title} • 페이지 {currentPage + 1}/{pages.length}
                 </p>
                 <h3 className="text-xl font-semibold text-foreground mt-2">
                   {pages[currentPage].title}
                 </h3>
               </div>
               <div className="whitespace-pre-line text-foreground/80 font-mono text-sm leading-relaxed">
                 {pages[currentPage].content}
               </div>
             </div>
           </div>
 
           {/* Navigation */}
           <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
             <Button
               variant="outline"
               size="sm"
               onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
               disabled={currentPage === 0}
             >
               <ChevronLeft className="h-4 w-4 mr-1" />
               이전
             </Button>
 
             <div className="flex gap-1">
               {pages.map((_, i) => (
                 <button
                   key={i}
                   onClick={() => setCurrentPage(i)}
                   className={`w-2 h-2 rounded-full transition-colors ${
                     i === currentPage ? 'bg-primary' : 'bg-muted-foreground/30'
                   }`}
                 />
               ))}
             </div>
 
             <Button
               variant="outline"
               size="sm"
               onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
               disabled={currentPage === pages.length - 1}
             >
               다음
               <ChevronRight className="h-4 w-4 ml-1" />
             </Button>
           </div>
         </div>
 
         <div className="text-center pt-4 border-t border-border">
           <p className="text-xs text-muted-foreground">
             💡 실제 서비스에서는 프로젝트 컨텍스트 기반으로 내용이 자동 생성됩니다
           </p>
         </div>
       </DialogContent>
     </Dialog>
   );
 }
 
 export function SamplePreviewSection() {
   const [selectedSample, setSelectedSample] = useState<typeof SAMPLES[0] | null>(null);
 
   return (
     <section className="py-20">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center mb-16">
           <h2 className="text-3xl font-bold text-foreground mb-4">
             산출물 미리보기
           </h2>
           <p className="text-muted-foreground">
             실제로 생성되는 문서 샘플을 확인해보세요
           </p>
         </div>
 
         <div className="grid md:grid-cols-3 gap-6">
           {SAMPLES.map((sample) => (
             <div
               key={sample.id}
               className="group bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer"
               onClick={() => setSelectedSample(sample)}
             >
               {/* Thumbnail placeholder */}
               <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,transparent_calc(100%_-_1px),hsl(var(--border))_calc(100%_-_1px))] bg-[length:100%_24px]" />
                 <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,transparent_calc(100%_-_1px),hsl(var(--border))_calc(100%_-_1px))] bg-[length:24px_100%]" />
                 <FileText className="h-12 w-12 text-muted-foreground/50 relative z-10" />
                 
                 {/* Hover overlay */}
                 <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <div className="bg-primary text-primary-foreground rounded-full p-3">
                     <Eye className="h-5 w-5" />
                   </div>
                 </div>
               </div>
 
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <h3 className="font-semibold text-foreground">{sample.title}</h3>
                   <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                     {sample.subtitle}
                   </span>
                 </div>
                 <p className="text-sm text-muted-foreground">{sample.description}</p>
               </div>
 
               <Button
                 variant="ghost"
                 size="sm"
                 className="w-full mt-4 text-primary hover:text-primary hover:bg-primary/10"
               >
                 <Eye className="h-4 w-4 mr-2" />
                 샘플 보기
               </Button>
             </div>
           ))}
         </div>
       </div>
 
       <SampleModal
         sample={selectedSample}
         open={!!selectedSample}
         onClose={() => setSelectedSample(null)}
       />
     </section>
   );
 }