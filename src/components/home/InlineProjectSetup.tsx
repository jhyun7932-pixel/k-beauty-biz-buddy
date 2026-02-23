import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/sessionStore';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';

const COUNTRIES = [
  { code: 'US', name: '미국', flag: '🇺🇸' },
  { code: 'JP', name: '일본', flag: '🇯🇵' },
  { code: 'EU', name: 'EU', flag: '🇪🇺' },
  { code: 'HK', name: '홍콩', flag: '🇭🇰' },
  { code: 'TW', name: '대만', flag: '🇹🇼' },
  { code: 'CN', name: '중국', flag: '🇨🇳' },
];

const PRESETS = [
  { id: 'FIRST_PROPOSAL', name: '첫 제안' },
  { id: 'SAMPLE', name: '샘플' },
  { id: 'PURCHASE_ORDER', name: '본오더' },
];

const CHANNELS = [
  { id: '도매', name: '도매' },
  { id: '리테일', name: '리테일' },
  { id: '온라인', name: '온라인' },
  { id: '기타', name: '기타' },
];

export function InlineProjectSetup() {
  const { 
    closeInlineSetup, 
    activeSessionId, 
    appendAction,
    updateContextSnapshot,
    linkProjectToSession,
  } = useSessionStore();
  
  const { setProjectConfig, setPreset } = useAppStore();
  
  const [expanded, setExpanded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    countries: [] as string[],
    preset: 'FIRST_PROPOSAL',
    channel: '도매',
    // Expanded fields
    buyerType: '',
    language: 'KO',
    currency: 'USD',
    incoterms: 'FOB',
    paymentTerms: 'T/T 30/70',
    moq: '',
    leadTime: '',
  });
  
  const toggleCountry = (code: string) => {
    setFormData(prev => ({
      ...prev,
      countries: prev.countries.includes(code)
        ? prev.countries.filter(c => c !== code)
        : prev.countries.length >= 3
        ? [...prev.countries.slice(1), code]
        : [...prev.countries, code],
    }));
  };
  
  const handleSubmit = () => {
    if (!activeSessionId) return;
    
    // Generate project name if empty
    const projectName = formData.name || 
      `${formData.countries.map(c => COUNTRIES.find(co => co.code === c)?.name || c).join('/')} ${PRESETS.find(p => p.id === formData.preset)?.name || ''} 프로젝트`;
    
    // Update app store
    setProjectConfig({
      name: projectName,
      targetCountries: formData.countries as any,
      channel: formData.channel as any,
      stagePreset: formData.preset as any,
    });
    
    setPreset(formData.preset as any);
    
    // Update session
    updateContextSnapshot(activeSessionId, {
      targetCountries: formData.countries,
      channel: formData.channel as any,
      preset: formData.preset === 'FIRST_PROPOSAL' ? '첫제안' : 
              formData.preset === 'SAMPLE' ? '샘플' : '본오더',
    });
    
    const projectId = `proj_${Date.now()}`;
    linkProjectToSession(activeSessionId, projectId);
    
    appendAction(activeSessionId, {
      type: 'start_project',
      payload: { projectName, countries: formData.countries, preset: formData.preset },
      status: 'ok',
    });
    
    closeInlineSetup();
    toast.success(`${projectName} 프로젝트가 생성되었습니다!`);
  };
  
  return (
    <div className="border-b border-border bg-card/50 animate-in slide-in-from-top duration-300">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            새 프로젝트 만들기
          </h3>
          <Button variant="ghost" size="icon" onClick={closeInlineSetup}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Required Fields */}
        <div className="space-y-4">
          {/* Project Name */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">프로젝트 이름 (선택)</Label>
            <Input
              placeholder="자동 생성됩니다"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="h-9"
            />
          </div>
          
          {/* Countries */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">보낼 나라 (최대 3개)</Label>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  onClick={() => toggleCountry(country.code)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all",
                    formData.countries.includes(country.code)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Preset & Channel */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">거래 단계</Label>
              <div className="flex gap-1">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setFormData(prev => ({ ...prev, preset: preset.id }))}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                      formData.preset === preset.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">판매 채널</Label>
              <div className="flex gap-1">
                {CHANNELS.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setFormData(prev => ({ ...prev, channel: channel.id }))}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-medium border transition-all",
                      formData.channel === channel.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    {channel.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Expand Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 py-2 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? '접기' : '상세 설정 펼치기'}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {/* Expanded Fields */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t border-border mt-2 animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">바이어 유형</Label>
                <Input
                  placeholder="예: 수입사, 유통사"
                  value={formData.buyerType}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyerType: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">통화</Label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="JPY">JPY</option>
                  <option value="CNY">CNY</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Incoterms</Label>
                <select
                  value={formData.incoterms}
                  onChange={(e) => setFormData(prev => ({ ...prev, incoterms: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-sm"
                >
                  <option value="FOB">FOB</option>
                  <option value="CIF">CIF</option>
                  <option value="DDP">DDP</option>
                  <option value="EXW">EXW</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">MOQ</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={formData.moq}
                  onChange={(e) => setFormData(prev => ({ ...prev, moq: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">납기(일)</Label>
                <Input
                  type="number"
                  placeholder="14"
                  value={formData.leadTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, leadTime: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
          <Button variant="ghost" onClick={closeInlineSetup}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={formData.countries.length === 0}>
            프로젝트 생성
          </Button>
        </div>
      </div>
    </div>
  );
}
