import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Crown, Target, Link2, UserCheck, ArrowRight, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const BENEFITS = [
{
  icon: Target,
  title: '타겟 바이어 발굴',
  description: '고객사 타겟 국가 및 제품 핏(Fit)에 맞는 현지 진성 바이어 리드'
},
{
  icon: Link2,
  title: 'OS 다이렉트 등록',
  description: '발굴된 바이어 정보를 FLONIX CRM 파이프라인에 즉시 등록'
},
{
  icon: UserCheck,
  title: '전담 매니저 배정',
  description: '글로벌 진출 전략 맞춤 컨설팅부터 바이어 발굴 지원까지 플로닉스 무역팀의 밀착 컨설팅'
}];


export function SalesProjectSection() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    company: '',
    name: '',
    contact: '',
    brandLink: '',
    targetCountry: ''
  });
  const [submitting, setSubmitting] = useState(false);
  // Honeypot field - bots will fill this, humans won't see it
  const [honeypot, setHoneypot] = useState('');

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check - if filled, silently ignore (bot detected)
    if (honeypot) return;

    // Client-side rate limiting (5 minute cooldown)
    const lastSubmit = localStorage.getItem('last_inquiry_submit');
    if (lastSubmit) {
      const minutesSince = (Date.now() - parseInt(lastSubmit)) / 60000;
      if (minutesSince < 5) {
        toast.error('잠시 후 다시 시도해주세요. (5분 쿨다운)');
        return;
      }
    }

    if (!form.company.trim() || !form.name.trim() || !form.contact.trim()) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    // Basic contact format validation
    const contact = form.contact.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const isPhone = /^[\d\s\-\+\(\)]{7,20}$/.test(contact);
    if (!isEmail && !isPhone) {
      toast.error('유효한 이메일 또는 전화번호를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('sales_inquiries').insert({
        company_name: form.company.trim().slice(0, 100),
        contact_name: form.name.trim().slice(0, 50),
        contact_info: contact.slice(0, 100),
        brand_link: form.brandLink.trim().slice(0, 300) || null,
        target_countries: form.targetCountry.trim().slice(0, 300) || null
      });
      if (error) throw error;
      localStorage.setItem('last_inquiry_submit', Date.now().toString());
      setOpen(false);
      setForm({ company: '', name: '', contact: '', brandLink: '', targetCountry: '' });
      setHoneypot('');
      toast.success('상담 신청이 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.');
    } catch (err) {
      toast.error('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section data-sales-project className="relative py-20 lg:py-28 overflow-hidden">
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,50%,12%)] via-[hsl(225,45%,16%)] to-[hsl(35,60%,18%)]" />
        {/* Gold accent glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[hsl(40,70%,50%)]/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[hsl(40,80%,60%)]/6 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[hsl(40,70%,50%)]/15 border border-[hsl(40,70%,50%)]/30">
              <Crown className="h-4 w-4 text-[hsl(40,70%,55%)]" />
              <span className="text-sm font-semibold text-[hsl(40,70%,65%)] tracking-wide">Premium Service</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-snug mb-6">
              소프트웨어를 넘어,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(40,80%,65%)] to-[hsl(30,70%,55%)]">
                '진짜 바이어'를 연결합니다.
              </span>
              <br />
              플로닉스 세일즈 프로젝트
            </h2>
            <p className="text-base sm:text-lg text-white/60 leading-relaxed">해외 진출이 처음이신가요? 플로닉스의 글로벌 무역 전문가팀이 타겟 국가의 진성 바이어 리드를 직접 발굴 지원하여 고객사의 FLONIX OS에 등록해 드립니다. 바이어 매칭부터 첫 수출의 완성까지, 가장 빠르고 확실한 성공 궤도에 올라타세요.



            </p>
          </div>

          {/* 3 Benefits */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-14">
            {BENEFITS.map((b, i) =>
            <div
              key={i}
              className="group relative rounded-2xl p-8 bg-white/[0.04] border border-white/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.07] hover:border-[hsl(40,70%,50%)]/30">

                <div className="w-12 h-12 rounded-xl bg-[hsl(40,70%,50%)]/15 flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110">
                  <b.icon className="h-6 w-6 text-[hsl(40,70%,60%)]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{b.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{b.description}</p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={() => setOpen(true)}
              className="gap-2 rounded-xl text-base px-10 h-14 bg-gradient-to-r from-[hsl(40,70%,50%)] to-[hsl(30,60%,45%)] text-white hover:from-[hsl(40,70%,55%)] hover:to-[hsl(30,60%,50%)] shadow-xl shadow-[hsl(40,70%,50%)]/20 border-0">

              세일즈 프로젝트 도입 문의하기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">세일즈 프로젝트 상담 신청</DialogTitle>
            <DialogDescription>
              아래 정보를 입력해 주시면, 전문 매니저가 빠르게 연락드립니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Honeypot field - hidden from humans, bots will fill this */}
            <input
              type="text"
              name="website_url"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true" />

            <div className="space-y-2">
              <Label htmlFor="sp-company">회사명 *</Label>
              <Input id="sp-company" placeholder="예) 플로닉스코스메틱" value={form.company} onChange={(e) => handleChange('company', e.target.value)} maxLength={100} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-name">담당자 성함 *</Label>
              <Input id="sp-name" placeholder="홍길동" value={form.name} onChange={(e) => handleChange('name', e.target.value)} maxLength={50} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-contact">연락처 (이메일 또는 전화번호) *</Label>
              <Input id="sp-contact" placeholder="email@company.com / 010-0000-0000" value={form.contact} onChange={(e) => handleChange('contact', e.target.value)} maxLength={100} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-brand">브랜드/제품 소개 링크</Label>
              <Input id="sp-brand" placeholder="https://brand.com" value={form.brandLink} onChange={(e) => handleChange('brandLink', e.target.value)} maxLength={300} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-country">수출 희망 국가</Label>
              <Textarea id="sp-country" placeholder="예) 미국, 일본, 동남아" value={form.targetCountry} onChange={(e) => handleChange('targetCountry', e.target.value)} maxLength={300} className="min-h-[60px]" />
            </div>
            <Button type="submit" className="w-full gap-2" size="lg" disabled={submitting}>
              {submitting ? '제출 중...' : '상담 신청서 제출'}
              {!submitting && <Send className="h-4 w-4" />}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>);

}