import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, Package, FileText, Loader2, AlertCircle, ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SharedData {
  shareLink: {
    id: string;
    token: string;
    expires_at: string | null;
    view_count: number;
  };
  deal: {
    id: string;
    status: string;
    quantity: number;
    unit_price: number;
    currency: string;
    incoterms: string;
    payment_terms: string;
    lead_time: number;
    buyer: {
      name: string;
      country: string;
    } | null;
    product: {
      name: string;
      category: string;
    } | null;
    documents: Array<{
      id: string;
      type: string;
      title: string;
      content: string;
    }>;
  } | null;
  company: {
    name: string;
    contact_email: string | null;
    logo_url: string | null;
    website: string | null;
  } | null;
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SharedData | null>(null);

  useEffect(() => {
    async function fetchSharedData() {
      if (!token) {
        setError('유효하지 않은 링크입니다.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-package?token=${token}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || '링크를 불러올 수 없습니다.');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchSharedData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">패키지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <div className="p-4 rounded-full bg-destructive/10 inline-block mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">링크 오류</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!data || !data.deal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <div className="p-4 rounded-full bg-muted/20 inline-block mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">패키지를 찾을 수 없습니다</h1>
          <p className="text-muted-foreground">이 링크에 연결된 패키지가 없거나 삭제되었습니다.</p>
        </div>
      </div>
    );
  }

  const { company, deal } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {company?.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={company.name} 
                className="h-10 w-10 object-contain rounded-lg border"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="font-semibold text-foreground">{company?.name || 'K-Beauty Exporter'}</h1>
              <p className="text-xs text-muted-foreground">바이어 패키지</p>
            </div>
          </div>
          
          {company?.website && (
            <a 
              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                웹사이트
              </Button>
            </a>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Draft Notice */}
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">⚠️ 초안 문서입니다</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              최종 제출 전 내용을 확인해주세요. 모든 조건은 협의 후 확정됩니다.
            </p>
          </div>
        </div>

        {/* Deal Summary */}
        <div className="card-elevated p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">거래 요약</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">제품</p>
              <p className="font-medium text-foreground">{deal.product?.name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">수량</p>
              <p className="font-medium text-foreground">{deal.quantity?.toLocaleString() || '-'} pcs</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">단가</p>
              <p className="font-medium text-foreground">{deal.currency} {deal.unit_price}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">인코텀즈</p>
              <p className="font-medium text-foreground">{deal.incoterms || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">결제 조건</p>
              <p className="font-medium text-foreground">{deal.payment_terms || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">리드타임</p>
              <p className="font-medium text-foreground">{deal.lead_time || '-'} days</p>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="card-elevated p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">첨부 문서</h2>
          
          {deal.documents && deal.documents.length > 0 ? (
            <div className="space-y-3">
              {deal.documents.map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-muted/10 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{doc.type}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    다운로드
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              첨부된 문서가 없습니다.
            </p>
          )}
        </div>

        {/* Contact */}
        {company?.contact_email && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">문의하기</p>
            <a 
              href={`mailto:${company.contact_email}`}
              className="text-primary hover:underline"
            >
              {company.contact_email}
            </a>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by K-뷰티 AI 무역비서
          </p>
        </div>
      </footer>
    </div>
  );
}
