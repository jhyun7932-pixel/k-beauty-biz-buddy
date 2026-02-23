import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Users, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BuyerDataTable } from '@/components/crm/BuyerDataTable';
import { AddBuyerDialog } from '@/components/crm/AddBuyerDialog';
import { DealPipelinePanel } from '@/components/crm/DealPipelinePanel';
import { useBuyers, type Buyer } from '@/hooks/useBuyers';
import { useAuth } from '@/hooks/useAuth';
import { getCountryDisplay } from '@/lib/countryFlags';

// ── Stage badge config ──
const STAGE_CONFIG: Record<string, { label: string; className: string }> = {
  lead: { label: '리드', className: 'bg-muted text-muted-foreground' },
  contacted: { label: '연락완료', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  replied: { label: '회신', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  sample: { label: '샘플', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  negotiation: { label: '협상중', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  won: { label: '계약', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  lost: { label: '보류', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const CHANNEL_LABELS: Record<string, string> = {
  wholesale: '도매',
  retail: '리테일',
  online: '온라인',
  d2c: 'D2C',
};

// ── Column definitions ──
const columns: ColumnDef<Buyer>[] = [
  {
    accessorKey: 'name',
    header: '바이어명',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: 'country',
    header: '국가',
    cell: ({ row }) => (
      <span className="text-sm">{getCountryDisplay(row.original.country)}</span>
    ),
  },
  {
    accessorKey: 'channel',
    header: '채널',
    cell: ({ row }) => {
      const ch = row.original.channel;
      return ch ? (
        <Badge variant="secondary" className="text-xs">
          {CHANNEL_LABELS[ch] ?? ch}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-xs">-</span>
      );
    },
  },
  {
    id: 'status_stage',
    header: '진행 단계',
    accessorFn: (row) => (row as any).status_stage ?? 'lead',
    cell: ({ getValue }) => {
      const stage = getValue<string>();
      const config = STAGE_CONFIG[stage] ?? STAGE_CONFIG.lead;
      return <Badge className={config.className}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: 'contact_name',
    header: '담당자',
    cell: ({ row }) => (
      <span className="text-sm">{row.original.contact_name || '-'}</span>
    ),
  },
  {
    accessorKey: 'contact_email',
    header: '이메일',
    cell: ({ row }) => (
      <span className="text-sm truncate max-w-[180px] block">
        {row.original.contact_email || '-'}
      </span>
    ),
  },
];

export default function CRMPage() {
  const { isAuthenticated } = useAuth();
  const { buyers, loading, createBuyer, updateBuyer } = useBuyers();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);

  const handleStageChange = async (buyerId: string, stage: string) => {
    return updateBuyer(buyerId, { status_stage: stage } as any);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Users className="h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">로그인이 필요합니다</h3>
        <p className="text-sm text-muted-foreground">바이어 CRM 기능을 사용하려면 먼저 로그인해주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              바이어 CRM
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              바이어 관계를 관리하고 거래 진행 상황을 추적하세요.
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            바이어 추가
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <BuyerDataTable
            columns={columns}
            data={buyers}
            onRowClick={(buyer) => setSelectedBuyer(buyer)}
          />
        )}
      </div>

      {/* Add Buyer Dialog */}
      <AddBuyerDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onSubmit={createBuyer}
      />

      {/* Deal Pipeline Panel */}
      {selectedBuyer && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setSelectedBuyer(null)}
          />
          <DealPipelinePanel
            buyer={selectedBuyer}
            onClose={() => setSelectedBuyer(null)}
            onStageChange={handleStageChange}
          />
        </>
      )}
    </div>
  );
}
