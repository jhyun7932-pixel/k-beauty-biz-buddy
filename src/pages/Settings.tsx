import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Store, Users, Briefcase, Languages, DollarSign, FileText, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAgentMemory } from '@/hooks/useAgentMemory';
import { toast } from 'sonner';
import type { OnboardingSalesChannel, OnboardingTradeStage, OnboardingBuyerType } from '@/types/onboarding';

const COUNTRIES = [
  { code: 'US', label: '미국', flag: '🇺🇸' },
  { code: 'CN', label: '중국', flag: '🇨🇳' },
  { code: 'JP', label: '일본', flag: '🇯🇵' },
  { code: 'VN', label: '베트남', flag: '🇻🇳' },
  { code: 'ID', label: '인도네시아', flag: '🇮🇩' },
  { code: 'MY', label: '말레이시아', flag: '🇲🇾' },
  { code: 'TH', label: '태국', flag: '🇹🇭' },
  { code: 'HK', label: '홍콩', flag: '🇭🇰' },
  { code: 'TW', label: '대만', flag: '🇹🇼' },
  { code: 'AU', label: '호주', flag: '🇦🇺' },
  { code: 'EU', label: 'EU', flag: '🇪🇺' },
];

const CHANNELS: { value: OnboardingSalesChannel; label: string }[] = [
  { value: 'wholesale', label: '유통/도매(수입사)' },
  { value: 'offline_retail', label: '오프라인 리테일' },
  { value: 'online_marketplace', label: '온라인 마켓(마켓셀러)' },
  { value: 'd2c', label: 'D2C' },
];

const TRADE_STAGES: { value: OnboardingTradeStage; label: string }[] = [
  { value: 'first_proposal', label: '첫 제안' },
  { value: 'sample', label: '샘플' },
  { value: 'main_order', label: '본오더' },
  { value: 'reorder', label: '재주문' },
];

const BUYER_TYPES: { value: OnboardingBuyerType; label: string }[] = [
  { value: 'importer', label: '수입사' },
  { value: 'distributor', label: '유통사' },
  { value: 'retailer', label: '리테일러' },
  { value: 'market_seller', label: '마켓 셀러' },
];

const LANGUAGES = [
  { value: 'en', label: '영어' },
  { value: 'ja', label: '일본어' },
  { value: 'zh', label: '중국어' },
  { value: 'de', label: '독일어' },
  { value: 'ko', label: '한국어' },
];

const CURRENCIES = ['USD', 'JPY', 'CNY', 'EUR', 'AUD', 'HKD', 'KRW'];

const INCOTERMS = ['FOB', 'CIF', 'DDP', 'EXW', 'CFR', 'DAP'];

const PAYMENT_TERMS = [
  'T/T 30/70',
  'T/T 50/50',
  'T/T 100% in advance',
  'L/C at sight',
  'D/P',
  'D/A',
];

const Settings = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const onboarding = useOnboarding();
  const agentMemory = useAgentMemory();
  
  const [saving, setSaving] = useState(false);
  const [localContext, setLocalContext] = useState(onboarding.context);
  const [memoryValues, setMemoryValues] = useState({
    defaultIncoterms: '',
    defaultPaymentTerms: '',
    defaultMoq: '',
    defaultLeadTime: '',
    toneStyle: 'professional',
    bannedPhrases: '',
  });

  // Load onboarding context
  useEffect(() => {
    setLocalContext(onboarding.context);
  }, [onboarding.context]);

  // Load agent memory values
  useEffect(() => {
    if (agentMemory.memories.length > 0) {
      const incoterms = agentMemory.getMemory('default_incoterms');
      const paymentTerms = agentMemory.getMemory('default_payment_terms');
      const moq = agentMemory.getMemory('default_moq');
      const leadTime = agentMemory.getMemory('default_lead_time');
      const tone = agentMemory.getMemory('tone_style');
      const banned = agentMemory.getMemory('banned_claim_phrases');
      
      setMemoryValues({
        defaultIncoterms: incoterms?.value?.value || '',
        defaultPaymentTerms: paymentTerms?.value?.value || '',
        defaultMoq: moq?.value?.value?.toString() || '',
        defaultLeadTime: leadTime?.value?.value?.toString() || '',
        toneStyle: tone?.value?.value || 'professional',
        bannedPhrases: banned?.value?.value?.join(', ') || '',
      });
    }
  }, [agentMemory.memories]);

  const handleCountryToggle = (countryCode: string) => {
    setLocalContext(prev => {
      const countries = prev.targetCountries;
      const isSelected = countries.includes(countryCode);
      
      if (isSelected) {
        return { ...prev, targetCountries: countries.filter(c => c !== countryCode) };
      } else if (countries.length < 3) {
        return { ...prev, targetCountries: [...countries, countryCode] };
      }
      return prev;
    });
  };

  const handleSaveContext = async () => {
    setSaving(true);
    try {
      // Update onboarding context
      onboarding.updateContext(localContext);
      await onboarding.saveContext();
      
      // Save agent memory values
      if (memoryValues.defaultIncoterms) {
        await agentMemory.setMemory('default_incoterms', 'preference', { value: memoryValues.defaultIncoterms });
      }
      if (memoryValues.defaultPaymentTerms) {
        await agentMemory.setMemory('default_payment_terms', 'preference', { value: memoryValues.defaultPaymentTerms });
      }
      if (memoryValues.defaultMoq) {
        await agentMemory.setMemory('default_moq', 'template_param', { value: parseInt(memoryValues.defaultMoq) || 500 });
      }
      if (memoryValues.defaultLeadTime) {
        await agentMemory.setMemory('default_lead_time', 'template_param', { value: parseInt(memoryValues.defaultLeadTime) || 20 });
      }
      if (memoryValues.toneStyle) {
        await agentMemory.setMemory('tone_style', 'tone_rule', { value: memoryValues.toneStyle });
      }
      if (memoryValues.bannedPhrases) {
        const phrases = memoryValues.bannedPhrases.split(',').map(p => p.trim()).filter(Boolean);
        await agentMemory.setMemory('banned_claim_phrases', 'risk_policy', { value: phrases });
      }
      
      toast.success('설정이 저장되었습니다.');
    } catch (error) {
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background p-4">
        <p className="text-muted-foreground mb-4">로그인이 필요합니다.</p>
        <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">설정</h1>
          </div>
          <Button onClick={handleSaveContext} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            저장
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">기본 거래 설정</TabsTrigger>
            <TabsTrigger value="defaults">거래 기본값</TabsTrigger>
            <TabsTrigger value="templates">문서 템플릿</TabsTrigger>
            <TabsTrigger value="tone">톤/문구 가이드</TabsTrigger>
          </TabsList>

          {/* 기본 거래 설정 */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  타겟 국가
                </CardTitle>
                <CardDescription>
                  최대 3개 국가를 선택하세요. 규제 검토와 문서 생성에 반영됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map(country => (
                    <Badge
                      key={country.code}
                      variant={localContext.targetCountries.includes(country.code) ? 'default' : 'outline'}
                      className="cursor-pointer px-3 py-1.5 text-sm"
                      onClick={() => handleCountryToggle(country.code)}
                    >
                      {country.flag} {country.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  판매 채널
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={localContext.targetChannel || ''}
                  onValueChange={(value) => setLocalContext(prev => ({ 
                    ...prev, 
                    targetChannel: value as OnboardingSalesChannel 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="채널 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(ch => (
                      <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  바이어 유형
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={localContext.buyerType}
                  onValueChange={(value) => setLocalContext(prev => ({ 
                    ...prev, 
                    buyerType: value as OnboardingBuyerType 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="바이어 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUYER_TYPES.map(bt => (
                      <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  거래 단계
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={localContext.tradeStage}
                  onValueChange={(value) => setLocalContext(prev => ({ 
                    ...prev, 
                    tradeStage: value as OnboardingTradeStage 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="거래 단계 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADE_STAGES.map(ts => (
                      <SelectItem key={ts.value} value={ts.value}>{ts.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    언어
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localContext.language}
                    onValueChange={(value) => setLocalContext(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="언어 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    통화
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localContext.currency}
                    onValueChange={(value) => setLocalContext(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="통화 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(cur => (
                        <SelectItem key={cur} value={cur}>{cur}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 거래 기본값 */}
          <TabsContent value="defaults" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>인코텀즈 (Incoterms)</CardTitle>
                <CardDescription>기본 인코텀즈를 설정하면 문서 생성 시 자동으로 적용됩니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={memoryValues.defaultIncoterms}
                  onValueChange={(value) => setMemoryValues(prev => ({ ...prev, defaultIncoterms: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="인코텀즈 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOTERMS.map(term => (
                      <SelectItem key={term} value={term}>{term}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>결제 조건 (Payment Terms)</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={memoryValues.defaultPaymentTerms}
                  onValueChange={(value) => setMemoryValues(prev => ({ ...prev, defaultPaymentTerms: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="결제 조건 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS.map(term => (
                      <SelectItem key={term} value={term}>{term}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>기본 MOQ</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="number"
                    placeholder="500"
                    value={memoryValues.defaultMoq}
                    onChange={(e) => setMemoryValues(prev => ({ ...prev, defaultMoq: e.target.value }))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>기본 리드타임 (일)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="number"
                    placeholder="20"
                    value={memoryValues.defaultLeadTime}
                    onChange={(e) => setMemoryValues(prev => ({ ...prev, defaultLeadTime: e.target.value }))}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 문서 템플릿 */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  문서 템플릿 설정
                </CardTitle>
                <CardDescription>
                  PI, Contract, Email 등 문서 생성 시 적용될 기본 설정입니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <p className="text-muted-foreground text-sm">
                    문서 템플릿 커스터마이징 기능은 준비 중입니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 톤/문구 가이드 */}
          <TabsContent value="tone" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>톤 스타일</CardTitle>
                <CardDescription>AI가 생성하는 문서와 이메일의 톤을 설정합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={memoryValues.toneStyle}
                  onValueChange={(value) => setMemoryValues(prev => ({ ...prev, toneStyle: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="톤 스타일 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">프로페셔널 (정중하고 격식있는)</SelectItem>
                    <SelectItem value="friendly">프렌들리 (친근하고 편안한)</SelectItem>
                    <SelectItem value="concise">간결 (짧고 핵심만)</SelectItem>
                    <SelectItem value="premium">프리미엄 (고급스럽고 세련된)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>금지 표현</CardTitle>
                <CardDescription>
                  규제/법적 이슈가 있는 표현을 입력하면 AI가 자동으로 회피합니다. 쉼표로 구분하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="예: 치료, 효능, 의약품, 피부병 치료..."
                  value={memoryValues.bannedPhrases}
                  onChange={(e) => setMemoryValues(prev => ({ ...prev, bannedPhrases: e.target.value }))}
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>데이터 및 보안</CardTitle>
                <CardDescription>
                  내 자료는 내 워크스페이스에서만 참고됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  ⓘ 업로드한 자료와 AI 학습 데이터는 다른 사용자와 공유되지 않습니다.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    내 데이터 내보내기
                  </Button>
                  <Button variant="destructive" size="sm" disabled>
                    내 데이터 삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
