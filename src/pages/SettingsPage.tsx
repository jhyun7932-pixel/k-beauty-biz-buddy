import React, { useRef, useCallback, useState } from 'react';
import { useProjectStore, TargetCountry, COUNTRY_NAMES } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Building2,
  Upload,
  Image,
  FileText,
  Stamp,
  Trash2,
  Save,
  User,
  Mail,
  CheckCircle,
  X,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

const ALL_COUNTRIES: TargetCountry[] = ['US', 'JP', 'EU', 'HK', 'TW', 'CN', 'VN', 'ID', 'MY', 'TH', 'AU'];

export default function SettingsPage() {
  const { companySettings, setCompanySettings } = useProjectStore();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    toast.success('설정이 저장되었습니다.');
  };

  // Image upload handler (generic)
  const handleImageUpload = useCallback(
    (field: 'logoUrl' | 'stampImageUrl' | 'signatureImageUrl', maxSizeMB = 2) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`이미지 크기는 ${maxSizeMB}MB 이하만 가능합니다.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCompanySettings({ [field]: ev.target?.result as string });
        toast.success('이미지가 등록되었습니다.');
      };
      reader.readAsDataURL(file);
    },
    [setCompanySettings]
  );

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('PDF 파일은 10MB 이하만 가능합니다.');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('PDF 파일만 업로드 가능합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCompanySettings({ introPdfUrl: ev.target?.result as string, introPdfName: file.name });
      toast.success('소개서가 등록되었습니다.');
    };
    reader.readAsDataURL(file);
  };

  const toggleCountry = (country: TargetCountry) => {
    const current = companySettings.exportCountries || [];
    const next = current.includes(country)
      ? current.filter((c) => c !== country)
      : [...current, country];
    setCompanySettings({ exportCountries: next });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              회사 설정
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI 에이전트가 문서 생성 시 참조하는 회사 정보를 설정하세요.
            </p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            저장
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 max-w-3xl">
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="company" className="gap-1.5 text-xs sm:text-sm">
                <Building2 className="h-4 w-4 hidden sm:block" />
                회사 기본 정보
              </TabsTrigger>
              <TabsTrigger value="brand" className="gap-1.5 text-xs sm:text-sm">
                <Image className="h-4 w-4 hidden sm:block" />
                브랜드 자산 업로드
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-1.5 text-xs sm:text-sm">
                <User className="h-4 w-4 hidden sm:block" />
                담당자 & 연동
              </TabsTrigger>
            </TabsList>

            {/* ===== Tab 1: 회사 기본 정보 ===== */}
            <TabsContent value="company" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    기본 정보
                  </CardTitle>
                  <CardDescription>
                    문서(PI, 계약서 등)와 바이어 커뮤니케이션에 자동으로 반영됩니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>영문 회사명 <span className="text-destructive">*</span></Label>
                    <Input
                      value={companySettings.companyName}
                      onChange={(e) => setCompanySettings({ companyName: e.target.value })}
                      placeholder="K-Beauty Co., Ltd."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>한글 회사명</Label>
                    <Input
                      value={companySettings.companyNameKr}
                      onChange={(e) => setCompanySettings({ companyNameKr: e.target.value })}
                      placeholder="케이뷰티 주식회사"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>대표자명 (영문)</Label>
                    <Input
                      value={companySettings.ceoName || ''}
                      onChange={(e) => setCompanySettings({ ceoName: e.target.value })}
                      placeholder="Hong Gildong"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>웹사이트</Label>
                    <Input
                      value={companySettings.website}
                      onChange={(e) => setCompanySettings({ website: e.target.value })}
                      placeholder="https://www.company.com"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>영문 주소 <span className="text-destructive">*</span></Label>
                    <Input
                      value={companySettings.address}
                      onChange={(e) => setCompanySettings({ address: e.target.value })}
                      placeholder="123, Gangnam-daero, Gangnam-gu, Seoul, 06164, Republic of Korea"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    주력 수출 국가
                  </CardTitle>
                  <CardDescription>
                    컴플라이언스 체크 및 문서 생성 시 우선 적용됩니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {ALL_COUNTRIES.map((c) => {
                      const selected = (companySettings.exportCountries || []).includes(c);
                      return (
                        <Badge
                          key={c}
                          variant={selected ? 'default' : 'outline'}
                          className={`cursor-pointer transition-all text-sm px-3 py-1.5 ${
                            selected
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'hover:bg-accent'
                          }`}
                          onClick={() => toggleCountry(c)}
                        >
                          {selected && <CheckCircle className="h-3 w-3 mr-1" />}
                          {COUNTRY_NAMES[c]}
                        </Badge>
                      );
                    })}
                  </div>
                  {(companySettings.exportCountries || []).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      ✅ {(companySettings.exportCountries || []).length}개국 선택됨
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== Tab 2: 브랜드 자산 업로드 ===== */}
            <TabsContent value="brand" className="space-y-6 mt-0">
              {/* Logo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-primary" />
                    회사 로고
                  </CardTitle>
                  <CardDescription>
                    문서 헤더에 자동 삽입됩니다. (PNG/JPG, 2MB 이하)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageUpload('logoUrl')} />
                  <UploadZone
                    imageUrl={companySettings.logoUrl}
                    onUploadClick={() => logoInputRef.current?.click()}
                    onRemove={() => setCompanySettings({ logoUrl: '' })}
                    label="로고 이미지 업로드"
                    previewSize="w-32 h-20"
                  />
                </CardContent>
              </Card>

              {/* Stamp / Signature Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stamp className="h-5 w-5 text-primary" />
                    공식 직인 / 서명 이미지
                  </CardTitle>
                  <CardDescription>
                    PI, 계약서의 서명란에 자동 표시됩니다. (PNG/JPG, 2MB 이하)
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">직인</Label>
                    <input ref={stampInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageUpload('stampImageUrl')} />
                    <UploadZone
                      imageUrl={companySettings.stampImageUrl}
                      onUploadClick={() => stampInputRef.current?.click()}
                      onRemove={() => setCompanySettings({ stampImageUrl: '' })}
                      label="직인 업로드"
                      previewSize="w-24 h-24"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">서명</Label>
                    <input ref={signatureInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageUpload('signatureImageUrl')} />
                    <UploadZone
                      imageUrl={companySettings.signatureImageUrl || ''}
                      onUploadClick={() => signatureInputRef.current?.click()}
                      onRemove={() => setCompanySettings({ signatureImageUrl: '' })}
                      label="서명 업로드"
                      previewSize="w-24 h-24"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Intro PDF */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    회사/브랜드 소개서 (PDF)
                  </CardTitle>
                  <CardDescription>
                    AI가 소개서를 분석하여 맥락 정보로 활용합니다. (PDF, 10MB 이하)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
                  {companySettings.introPdfUrl ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                      <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{companySettings.introPdfName || '소개서.pdf'}</p>
                        <p className="text-xs text-muted-foreground">업로드 완료</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => pdfInputRef.current?.click()}>
                          변경
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setCompanySettings({ introPdfUrl: '', introPdfName: '' })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <DragDropArea onClick={() => pdfInputRef.current?.click()} label="소개서 PDF를 여기로 드래그하거나 클릭하세요" icon={<FileText className="h-8 w-8 text-muted-foreground" />} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== Tab 3: 담당자 & 연동 ===== */}
            <TabsContent value="contact" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    담당자 정보
                  </CardTitle>
                  <CardDescription>
                    이메일 서명 및 문서 담당자 란에 자동 반영됩니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>담당자명 (영문)</Label>
                    <Input
                      value={companySettings.contactName}
                      onChange={(e) => setCompanySettings({ contactName: e.target.value })}
                      placeholder="Minjun Kim"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>직급 (영문)</Label>
                    <Input
                      value={companySettings.contactTitle || ''}
                      onChange={(e) => setCompanySettings({ contactTitle: e.target.value })}
                      placeholder="Export Manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>전화번호</Label>
                    <Input
                      value={companySettings.contactPhone}
                      onChange={(e) => setCompanySettings({ contactPhone: e.target.value })}
                      placeholder="+82-10-1234-5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>이메일</Label>
                    <Input
                      type="email"
                      value={companySettings.contactEmail}
                      onChange={(e) => setCompanySettings({ contactEmail: e.target.value })}
                      placeholder="export@company.com"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    이메일 서명 (Signature)
                  </CardTitle>
                  <CardDescription>
                    AI가 바이어 이메일 초안 작성 시 하단에 자동 삽입합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={companySettings.emailSignature}
                    onChange={(e) => setCompanySettings({ emailSignature: e.target.value })}
                    placeholder={`Best regards,

${companySettings.contactName || '[담당자명]'}
${companySettings.contactTitle || '[직급]'}
${companySettings.companyName || '[회사명]'}
Tel: ${companySettings.contactPhone || '[전화번호]'}
Email: ${companySettings.contactEmail || '[이메일]'}`}
                    rows={7}
                    className="font-mono text-sm"
                  />
                  {companySettings.contactName && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-1.5"
                      onClick={() => {
                        const sig = `Best regards,\n\n${companySettings.contactName}\n${companySettings.contactTitle || ''}\n${companySettings.companyName}\nTel: ${companySettings.contactPhone}\nEmail: ${companySettings.contactEmail}`;
                        setCompanySettings({ emailSignature: sig.trim() });
                        toast.success('서명이 자동 생성되었습니다.');
                      }}
                    >
                      ✨ 서명 자동 생성
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}

// ===== Reusable Sub-Components =====

function UploadZone({
  imageUrl,
  onUploadClick,
  onRemove,
  label,
  previewSize,
}: {
  imageUrl: string;
  onUploadClick: () => void;
  onRemove: () => void;
  label: string;
  previewSize: string;
}) {
  if (imageUrl) {
    return (
      <div className="flex items-center gap-4">
        <div className={`${previewSize} border border-border rounded-lg flex items-center justify-center bg-secondary/30 p-2`}>
          <img src={imageUrl} alt={label} className="max-w-full max-h-full object-contain" />
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onUploadClick}>
            <Upload className="h-3.5 w-3.5" /> 변경
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" /> 삭제
          </Button>
        </div>
      </div>
    );
  }

  return <DragDropArea onClick={onUploadClick} label={label} icon={<Image className="h-8 w-8 text-muted-foreground" />} />;
}

function DragDropArea({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      onClick={onClick}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
      className={`flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-accent/30'
      }`}
    >
      {icon}
      <p className="text-sm text-muted-foreground text-center">{label}</p>
    </div>
  );
}
