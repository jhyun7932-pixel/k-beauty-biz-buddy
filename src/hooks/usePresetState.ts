import { useState, useMemo, useCallback } from 'react';

export type DealStagePreset = 'PROPOSAL' | 'SAMPLE' | 'BULK';

export interface DocumentTile {
  id: string;
  name: string;
  nameKr: string;
  description: string;
  icon: string;
  pages?: string;
  optional?: boolean;
}

export interface Task {
  id: string;
  title: string;
  order: number;
  completed?: boolean;
}

export interface PresetConfig {
  documents: DocumentTile[];
  tasks: Task[];
  defaultPreviewDoc: string;
  ctaLabel: string;
  ctaAction: string;
  description: string;
}

// Preset definitions
export const PRESET_CONFIGS: Record<DealStagePreset, PresetConfig> = {
  PROPOSAL: {
    description: '바이어 설득용 소개/카탈로그/규제 요약',
    ctaLabel: '첫 제안 패키지 만들기',
    ctaAction: 'create_proposal_package',
    defaultPreviewDoc: 'brand_deck',
    documents: [
      { id: 'brand_deck', name: 'Company/Brand Deck', nameKr: '브랜드 소개서', description: '회사 및 브랜드 소개', icon: '🏢', pages: '≤15p' },
      { id: 'catalog', name: 'Product Catalog', nameKr: '제품 카탈로그', description: '제품 라인업 소개', icon: '📚', pages: '≤15p' },
      { id: 'compliance', name: 'Compliance Snapshot', nameKr: '수출 준비 요약', description: '국가별 규제 체크리스트', icon: '✅', pages: '≤6p' },
      { id: 'outreach', name: 'Buyer Outreach Message', nameKr: '바이어 메시지', description: '이메일/링크드인 초안', icon: '✉️' },
    ],
    tasks: [
      { id: 't1', title: '타겟 국가별 컴플라이언스 스냅샷 생성', order: 1 },
      { id: 't2', title: 'Company/Brand Deck 초안 생성', order: 2 },
      { id: 't3', title: 'Catalog 초안 생성', order: 3 },
      { id: 't4', title: '바이어 메시지 생성(채널/바이어유형 반영)', order: 4 },
      { id: 't5', title: '최종 패키지 ZIP로 묶기(내부 검토용)', order: 5 },
    ],
  },
  SAMPLE: {
    description: '샘플 발송용 PI/포장명세/안내문',
    ctaLabel: '샘플 서류 만들기',
    ctaAction: 'create_sample_package',
    defaultPreviewDoc: 'sample_pi',
    documents: [
      { id: 'sample_pi', name: 'Sample Proforma Invoice', nameKr: '샘플 PI', description: '샘플용 견적서', icon: '📄' },
      { id: 'sample_pl', name: 'Sample Packing List', nameKr: '샘플 포장명세서', description: '포장 상세 내역', icon: '📦' },
      { id: 'shipping_note', name: 'Sample Shipping Note', nameKr: '발송 안내문', description: '배송 추적/ETA 템플릿', icon: '🚚' },
      { id: 'label_draft', name: 'Label Draft', nameKr: '라벨 초안', description: '국가별 라벨 시안', icon: '🏷️', optional: true },
      { id: 'msds', name: 'MSDS/Ingredients Summary', nameKr: 'MSDS/성분 요약', description: '안전 데이터 시트', icon: '⚗️', optional: true },
    ],
    tasks: [
      { id: 't1', title: '샘플 PI 생성', order: 1 },
      { id: 't2', title: '샘플 Packing List 생성', order: 2 },
      { id: 't3', title: '항공/운송 주의사항 요약(MSDS 필요 여부 안내)', order: 3 },
      { id: 't4', title: '샘플 발송 안내 메시지 작성', order: 4 },
      { id: 't5', title: '문서 실수 체크(수량/단가/총액/주소)', order: 5 },
    ],
  },
  BULK: {
    description: 'PI/계약서/인보이스/실수 체크',
    ctaLabel: '본오더 서류 만들기',
    ctaAction: 'create_bulk_package',
    defaultPreviewDoc: 'final_pi',
    documents: [
      { id: 'final_pi', name: 'Final PI', nameKr: '최종 PI', description: '정식 견적서', icon: '📄' },
      { id: 'contract', name: 'Sales Contract', nameKr: '판매 계약서', description: '거래 계약서', icon: '📝', pages: '≤12p' },
      { id: 'commercial_invoice', name: 'Commercial Invoice', nameKr: '상업 송장', description: '인보이스 초안', icon: '💰' },
      { id: 'packing_list', name: 'Packing List (Final)', nameKr: '포장명세서', description: '최종 포장 내역', icon: '📦' },
      { id: 'label_final', name: 'Label Final', nameKr: '최종 라벨', description: '국가별 최종 라벨', icon: '🏷️' },
      { id: 'error_check', name: 'Cross-document Error Check', nameKr: '실수 체크 리포트', description: '문서 간 불일치 탐지', icon: '🔍' },
      { id: 'coo_guide', name: 'CoO Requirement Guide', nameKr: '원산지 증명 가이드', description: '원산지 증명서 요건', icon: '🌍', optional: true },
      { id: 'bl_info', name: 'B/L(AWB) Info Sheet', nameKr: 'B/L 정보 시트', description: '포워더용 선적 정보', icon: '🚢', optional: true },
    ],
    tasks: [
      { id: 't1', title: 'PI 최종 생성', order: 1 },
      { id: 't2', title: '계약서 생성(결제/인코텀즈/납기 포함)', order: 2 },
      { id: 't3', title: 'Invoice/PL 생성', order: 3 },
      { id: 't4', title: '문서 일관성 실수 체크(필수)', order: 4 },
      { id: 't5', title: '바이어 발송용 ZIP 패키지 출력', order: 5 },
    ],
  },
};

export interface PresetState {
  selectedPreset: DealStagePreset;
  currentConfig: PresetConfig;
  completedTasks: string[];
  generatedDocs: string[];
}

export function usePresetState(initialPreset: DealStagePreset = 'PROPOSAL') {
  const [selectedPreset, setSelectedPreset] = useState<DealStagePreset>(initialPreset);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<string[]>([]);

  const currentConfig = useMemo(() => PRESET_CONFIGS[selectedPreset], [selectedPreset]);

  const selectPreset = useCallback((preset: DealStagePreset) => {
    setSelectedPreset(preset);
    // Reset progress when switching presets
    setCompletedTasks([]);
    setGeneratedDocs([]);
  }, []);

  const completeTask = useCallback((taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) ? prev : [...prev, taskId]
    );
  }, []);

  const markDocGenerated = useCallback((docId: string) => {
    setGeneratedDocs(prev => 
      prev.includes(docId) ? prev : [...prev, docId]
    );
  }, []);

  const resetProgress = useCallback(() => {
    setCompletedTasks([]);
    setGeneratedDocs([]);
  }, []);

  return {
    selectedPreset,
    currentConfig,
    completedTasks,
    generatedDocs,
    selectPreset,
    completeTask,
    markDocGenerated,
    resetProgress,
  };
}
