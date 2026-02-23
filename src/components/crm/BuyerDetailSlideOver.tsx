import React from 'react';
import { X, Mail, Phone, Globe, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getCountryDisplay } from '@/lib/countryFlags';
import type { Buyer } from '@/hooks/useBuyers';

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-muted text-muted-foreground',
  contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  replied: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  sample: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  negotiation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  won: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STAGE_LABELS: Record<string, string> = {
  lead: '리드',
  contacted: '연락완료',
  replied: '회신',
  sample: '샘플',
  negotiation: '협상중',
  won: '계약',
  lost: '보류',
};

interface BuyerDetailSlideOverProps {
  buyer: Buyer;
  onClose: () => void;
}

export function BuyerDetailSlideOver({ buyer, onClose }: BuyerDetailSlideOverProps) {
  const stage = buyer.buyer_type ?? 'lead'; // fallback
  // Use status_stage from the buyers table via the raw row shape
  const statusStage = (buyer as any).status_stage ?? 'lead';

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold truncate">{buyer.name}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Status & Country */}
        <div className="flex flex-wrap gap-2">
          <Badge className={STAGE_COLORS[statusStage] ?? STAGE_COLORS.lead}>
            {STAGE_LABELS[statusStage] ?? statusStage}
          </Badge>
          <Badge variant="outline">{getCountryDisplay(buyer.country)}</Badge>
          {buyer.channel && <Badge variant="secondary">{buyer.channel}</Badge>}
        </div>

        <Separator />

        {/* Contact info */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">연락처</h3>
          {buyer.contact_name && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{buyer.contact_name}</span>
            </div>
          )}
          {buyer.contact_email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={`mailto:${buyer.contact_email}`} className="text-primary hover:underline truncate">
                {buyer.contact_email}
              </a>
            </div>
          )}
          {buyer.contact_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{buyer.contact_phone}</span>
            </div>
          )}
          {buyer.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={buyer.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                {buyer.website}
              </a>
            </div>
          )}
        </div>

        {buyer.notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">메모</h3>
              <p className="text-sm bg-muted/50 p-3 rounded-lg">{buyer.notes}</p>
            </div>
          </>
        )}

        {buyer.company_name && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">회사</h3>
              <p className="text-sm font-medium">{buyer.company_name}</p>
            </div>
          </>
        )}

        <Separator />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>등록일: {new Date(buyer.created_at).toLocaleDateString('ko-KR')}</p>
          <p>수정일: {new Date(buyer.updated_at).toLocaleDateString('ko-KR')}</p>
        </div>
      </div>
    </div>
  );
}
