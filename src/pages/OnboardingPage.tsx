import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AIPrecisionMeter } from '@/components/onboarding/AIPrecisionMeter';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Building2, Globe, Upload, FileText, ArrowRight,
  ArrowLeft, Sparkles, Check, X, Loader2, SkipForward,
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const POPULAR_COUNTRIES = [
  { code: 'US', label: '🇺🇸 미국' },
  { code: 'JP', label: '🇯🇵 일본' },
  { code: 'CN', label: '🇨🇳 중국' },
  { code: 'VN', label: '🇻🇳 베트남' },
  { code: 'TH', label: '🇹🇭 태국' },
  { code: 'ID', label: '🇮🇩 인도네시아' },
  { code: 'SG', label: '🇸🇬 싱가포르' },
  { code: 'MY', label: '🇲🇾 말레이시아' },
  { code: 'PH', label: '🇵🇭 필리핀' },
  { code: 'AU', label: '🇦🇺 호주' },
  { code: 'CA', label: '🇨🇦 캐나다' },
  { code: 'DE', label: '🇩🇪 독일' },
  { code: 'GB', label: '🇬🇧 영국' },
  { code: 'FR', label: '🇫🇷 프랑스' },
  { code: 'AE', label: '🇦🇪 UAE' },
  { code: 'SA', label: '🇸🇦 사우디' },
  { code: 'RU', label: '🇷🇺 러시아' },
  { code: 'HK', label: '🇭🇰 홍콩' },
];

type Step = 'company' | 'product';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasConfettied = useRef(false);

  // Step
  const [step, setStep] = useState<Step>('company');

  // Company info
  const [companyName, setCompanyName] = useState('');
  const [brandTone, setBrandTone] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  // Product upload
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [saving, setSaving] = useState(false);

  // Calculate precision score
  const precisionScore = (() => {
    let score = 10; // 회원가입 완료
    if (companyName.trim() && selectedCountries.length > 0) score += 20;
    if (uploadedFiles.length > 0) score += 40;
    return score;
  })();

  // Confetti when reaching 50%+
  useEffect(() => {
    if (precisionScore >= 50 && !hasConfettied.current) {
      hasConfettied.current = true;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2F6BFF', '#34D399', '#A78BFA', '#F59E0B'],
      });
    }
  }, [precisionScore]);

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : prev.length < 5 ? [...prev, code] : prev
    );
  };

  // File handling
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type === 'application/pdf' || f.type.startsWith('image/')
    );
    if (files.length) setUploadedFiles(prev => [...prev, ...files].slice(0, 5));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setUploadedFiles(prev => [...prev, ...files].slice(0, 5));
  };

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Save & continue
  const handleSaveCompany = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const companyInfo = {
        companyName,
        brandTone,
        targetCountries: selectedCountries,
      };
      await supabase
        .from('profiles')
        .update({
          company_info: companyInfo as any,
          precision_score: precisionScore,
        })
        .eq('user_id', user.id);

      setStep('product');
      toast.success('회사 정보가 저장되었습니다!');
    } catch (err) {
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setUploading(true);
    try {
      // Upload files to storage & trigger extraction
      const uploadedPaths: string[] = [];
      for (const file of uploadedFiles) {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage
          .from('onboarding-docs')
          .upload(filePath, file);
        if (error) {
          console.error('Upload error:', error);
        } else {
          uploadedPaths.push(filePath);
        }
      }

      // Extract text from each uploaded file (fire & forget for speed)
      const session = (await supabase.auth.getSession()).data.session;
      if (session) {
        for (const fp of uploadedPaths) {
          supabase.functions.invoke('extract-document', {
            body: { filePath: fp },
          }).then(({ data, error: fnErr }) => {
            if (fnErr) console.error('Extraction error:', fnErr);
            else console.log('Extracted:', data);
          });
        }
      }

      // Update precision score
      const finalScore = precisionScore;
      await supabase
        .from('profiles')
        .update({ precision_score: finalScore })
        .eq('user_id', user.id);

      if (finalScore >= 50) {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.4 },
          colors: ['#2F6BFF', '#34D399', '#A78BFA', '#F59E0B'],
        });
      }

      toast.success('온보딩 완료! 메인 화면으로 이동합니다.');
      setTimeout(() => navigate('/home'), 1200);
    } catch (err) {
      toast.error('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ precision_score: precisionScore })
      .eq('user_id', user.id);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">초기 설정</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={step === 'company' ? 'text-primary font-semibold' : ''}>
                1. 회사정보
              </span>
              <ArrowRight className="h-3 w-3" />
              <span className={step === 'product' ? 'text-primary font-semibold' : ''}>
                2. 제품데이터
              </span>
            </div>
          </div>
          <AIPrecisionMeter score={precisionScore} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {step === 'company' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">회사 DNA 입력</h2>
              <p className="text-sm text-muted-foreground">
                AI가 회사에 맞는 수출 문서를 작성하기 위한 기본 정보입니다.
              </p>
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                회사명 <span className="text-danger">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="예: (주)코스메틱코리아"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
              />
            </div>

            {/* Brand Tone */}
            <div className="space-y-2">
              <Label htmlFor="brandTone">브랜드 톤앤매너</Label>
              <Textarea
                id="brandTone"
                placeholder="예: 전문적이고 신뢰감 있는 톤, 데이터 기반 소통 선호"
                value={brandTone}
                onChange={e => setBrandTone(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                AI가 이메일, 문서 작성 시 이 톤을 참고합니다.
              </p>
            </div>

            {/* Target Countries */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-muted-foreground" />
                주요 타겟 국가 <span className="text-danger">*</span>
                <span className="text-xs text-muted-foreground ml-1">(최대 5개)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_COUNTRIES.map(c => (
                  <Badge
                    key={c.code}
                    variant={selectedCountries.includes(c.code) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/10 transition-colors select-none"
                    onClick={() => toggleCountry(c.code)}
                  >
                    {c.label}
                    {selectedCountries.includes(c.code) && <Check className="h-3 w-3 ml-1" />}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              {precisionScore < 50 && (
                <Button variant="ghost" size="sm" onClick={handleSkip} className="gap-1.5 text-muted-foreground">
                  <SkipForward className="h-4 w-4" />
                  건너뛰기
                </Button>
              )}
              <div className="ml-auto">
                <Button
                  onClick={handleSaveCompany}
                  disabled={!companyName.trim() || selectedCountries.length === 0 || saving}
                  className="gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  다음: 제품 데이터
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'product' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <Button variant="ghost" size="sm" onClick={() => setStep('company')} className="gap-1 mb-4 -ml-2">
                <ArrowLeft className="h-4 w-4" /> 이전 단계
              </Button>
              <h2 className="text-xl font-bold text-foreground mb-1">제품 데이터 업로드</h2>
              <p className="text-sm text-muted-foreground">
                카탈로그(PDF) 또는 전성분표 이미지를 업로드하면 AI 정밀도가 크게 향상됩니다.
              </p>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                ${dragActive
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">
                파일을 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, PNG (최대 5개, 각 20MB)
              </p>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>업로드된 파일 ({uploadedFiles.length})</Label>
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground truncate max-w-xs">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(1)}MB)
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(idx)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              {precisionScore < 50 && (
                <Button variant="ghost" size="sm" onClick={handleSkip} className="gap-1.5 text-muted-foreground">
                  <SkipForward className="h-4 w-4" />
                  건너뛰기
                </Button>
              )}
              <div className="ml-auto flex gap-3">
                <Button variant="outline" onClick={handleSkip}>
                  나중에 할게요
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {uploadedFiles.length > 0 ? '완료 & 시작하기' : '건너뛰고 시작'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
