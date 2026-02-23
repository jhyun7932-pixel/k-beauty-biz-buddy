 import React from 'react';
 import { MessageSquare, FileText, Workflow, X, Check, Minus } from 'lucide-react';
 
 const COMPARISON_DATA = [
   {
     type: 'llm',
     title: '일반 LLM',
     subtitle: 'ChatGPT, Claude 등',
     icon: MessageSquare,
     color: 'text-muted-foreground',
     bgColor: 'bg-muted/30',
     borderColor: 'border-border',
     features: [
       { text: '대화 중심 응답', status: 'partial' },
       { text: '문서 일관성 유지', status: 'no' },
       { text: '조건 변경 시 전체 업데이트', status: 'no' },
       { text: '근거/확인/조치 연결', status: 'no' },
       { text: '바이어 CRM 연동', status: 'no' },
     ],
   },
   {
     type: 'template',
     title: '템플릿 툴',
     subtitle: 'Canva, Notion 등',
     icon: FileText,
     color: 'text-muted-foreground',
     bgColor: 'bg-muted/30',
     borderColor: 'border-border',
     features: [
       { text: '디자인 자동화', status: 'yes' },
       { text: '수출 운영 워크플로우', status: 'no' },
       { text: '조건 변경 시 전체 업데이트', status: 'no' },
       { text: '근거/확인/조치 연결', status: 'no' },
       { text: '바이어 CRM 연동', status: 'no' },
     ],
   },
   {
     type: 'ours',
     title: 'K-뷰티 AI 무역비서',
     subtitle: 'Export Ops 워크플로우',
     icon: Workflow,
     color: 'text-primary',
     bgColor: 'bg-primary/5',
     borderColor: 'border-primary/30',
     highlighted: true,
     features: [
       { text: 'Export Ops 워크플로우', status: 'yes' },
       { text: '필드 기반 문서 업데이트', status: 'yes' },
       { text: 'RulePack 컴플라이언스', status: 'yes' },
       { text: '프로젝트 DB 기반 일관성', status: 'yes' },
       { text: '바이어 CRM + 히스토리', status: 'yes' },
     ],
   },
 ];
 
 const StatusIcon = ({ status }: { status: string }) => {
   if (status === 'yes') {
     return (
       <div className="flex-shrink-0 w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
         <Check className="h-3 w-3 text-success" />
       </div>
     );
   }
   if (status === 'no') {
     return (
       <div className="flex-shrink-0 w-5 h-5 rounded-full bg-danger/20 flex items-center justify-center">
         <X className="h-3 w-3 text-danger" />
       </div>
     );
   }
   return (
     <div className="flex-shrink-0 w-5 h-5 rounded-full bg-warning/20 flex items-center justify-center">
       <Minus className="h-3 w-3 text-warning" />
     </div>
   );
 };
 
 export function PaidValueSection() {
   return (
     <section className="py-20 bg-gradient-to-b from-background to-card">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center mb-16">
           <h2 className="text-3xl font-bold text-foreground mb-4">
             왜 돈을 내고 쓰나요?
           </h2>
           <p className="text-muted-foreground max-w-2xl mx-auto">
             일반 LLM이나 템플릿 툴로도 문서는 만들 수 있습니다.<br />
             하지만 <span className="text-primary font-medium">수출 운영의 반복 수정과 불일치 문제</span>는 해결되지 않습니다.
           </p>
         </div>
 
         <div className="grid md:grid-cols-3 gap-6">
           {COMPARISON_DATA.map((item, i) => (
             <div
               key={i}
               className={`rounded-2xl border p-6 transition-all ${item.bgColor} ${item.borderColor} ${
                 item.highlighted ? 'ring-2 ring-primary/20 shadow-lg scale-[1.02]' : ''
               }`}
             >
               <div className="flex items-center gap-3 mb-4">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                   item.highlighted ? 'bg-primary/10' : 'bg-muted'
                 }`}>
                   <item.icon className={`h-5 w-5 ${item.color}`} />
                 </div>
                 <div>
                   <h3 className={`font-semibold ${item.highlighted ? 'text-primary' : 'text-foreground'}`}>
                     {item.title}
                   </h3>
                   <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                 </div>
               </div>
 
               <div className="space-y-3">
                 {item.features.map((feature, j) => (
                   <div key={j} className="flex items-center gap-2">
                     <StatusIcon status={feature.status} />
                     <span className="text-sm text-foreground/80">{feature.text}</span>
                   </div>
                 ))}
               </div>
 
               {item.highlighted && (
                 <div className="mt-6 pt-4 border-t border-primary/20">
                   <p className="text-xs text-primary font-medium">
                     ✨ 조건이 바뀌어도 문서 간 일관성이 유지됩니다
                   </p>
                 </div>
               )}
             </div>
           ))}
         </div>
       </div>
     </section>
   );
 }