import React, { forwardRef } from 'react';
import { Sparkles, MapPin, Store, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { SamplePreset, BuyerGoal } from '@/types';

interface SamplePresetModalProps {
  open: boolean;
  onClose: () => void;
  onSelectPreset: (preset: SamplePreset) => void;
}

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'preset-hk',
    name: '홍콩 오프라인 리테일러',
    description: '홍콩 드럭스토어/편집샵에 제안하기',
    goal: {
      countries: ['홍콩'],
      channel: 'retail',
      buyerType: 'retailer',
      language: '영어',
      currency: 'HKD',
      dealStage: 'first_proposal',
    },
  },
  {
    id: 'preset-us',
    name: '미국 온라인 마켓 셀러',
    description: '아마존 셀러에게 제품 제안하기',
    goal: {
      countries: ['미국'],
      channel: 'online_market',
      buyerType: 'reseller',
      language: '영어',
      currency: 'USD',
      dealStage: 'first_proposal',
    },
  },
  {
    id: 'preset-jp-sample',
    name: '일본 샘플 발송 준비',
    description: '일본 바이어에게 샘플 보내기',
    goal: {
      countries: ['일본'],
      channel: 'distributor',
      buyerType: 'distributor',
      language: '일본어',
      currency: 'JPY',
      dealStage: 'sample_proposal',
    },
  },
  {
    id: 'preset-cn-bulk',
    name: '중국 본오더 계약',
    description: '중국 바이어와 본계약 진행하기',
    goal: {
      countries: ['중국'],
      channel: 'online_market',
      buyerType: 'reseller',
      language: '중국어',
      currency: 'CNY',
      dealStage: 'pre_contract',
    },
  },
];

const CHANNEL_LABELS: Record<string, string> = {
  distributor: '유통/도매',
  retail: '리테일(오프라인)',
  online_market: '온라인 마켓',
  d2c: 'D2C',
};

const BUYER_TYPE_LABELS: Record<string, string> = {
  importer: '수입사',
  distributor: '유통사',
  retailer: '리테일러',
  reseller: '마켓 셀러',
};

const DEAL_STAGE_LABELS: Record<string, { label: string; color: string }> = {
  first_proposal: { label: '첫 제안', color: 'bg-primary/10 text-primary' },
  sample_proposal: { label: '샘플', color: 'bg-accent-mint/10 text-accent-mint' },
  pre_contract: { label: '본오더', color: 'bg-accent-violet/10 text-accent-violet' },
  shipment_prep: { label: '출고준비', color: 'bg-warning/10 text-warning' },
};

export const SamplePresetModal = forwardRef<HTMLDivElement, SamplePresetModalProps>(
  function SamplePresetModal({ open, onClose, onSelectPreset }, ref) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent ref={ref} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent-violet" />
              샘플로 체험하기
            </DialogTitle>
            <DialogDescription>
              아래 프리셋 중 하나를 선택하면 샘플 데이터로 전체 플로우를 경험할 수 있어요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {SAMPLE_PRESETS.map((preset) => {
              const stageInfo = preset.goal.dealStage ? DEAL_STAGE_LABELS[preset.goal.dealStage] : null;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className="w-full p-4 text-left bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {preset.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {preset.description}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {stageInfo && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${stageInfo.color}`}>
                          {stageInfo.label}
                        </span>
                      )}
                      <span className="badge-sample">샘플</span>
                    </div>
                  </div>
                  
                  {/* Goal details */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                      <MapPin className="h-3 w-3" />
                      {preset.goal.countries.join(', ')}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-mint/10 text-accent-mint text-xs rounded-full">
                      <Store className="h-3 w-3" />
                      {preset.goal.channel && CHANNEL_LABELS[preset.goal.channel]}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-violet/10 text-accent-violet text-xs rounded-full">
                      <Users className="h-3 w-3" />
                      {preset.goal.buyerType && BUYER_TYPE_LABELS[preset.goal.buyerType]}
                    </span>
                    <span className="px-2 py-0.5 bg-muted/20 text-muted-foreground text-xs rounded-full">
                      {preset.goal.language} · {preset.goal.currency}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            ⓘ 샘플 선택 시 자동으로 문서 초안이 생성됩니다.
          </p>
        </DialogContent>
      </Dialog>
    );
  }
);

export { SAMPLE_PRESETS };
