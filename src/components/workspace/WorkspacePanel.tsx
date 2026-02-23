import React from 'react';
import { WorkspaceTabs } from '@/components/layout/WorkspaceTabs';
import { SummaryTab } from '@/components/workspace/SummaryTab';
import { BuyerPackageTab } from '@/components/workspace/BuyerPackageTab';
import { DocumentsTab } from '@/components/workspace/DocumentsTab';
import { BuyersTab } from '@/components/workspace/BuyersTab';
import { ExpertTab } from '@/components/workspace/ExpertTab';
import { HistoryTab } from '@/components/workspace/HistoryTab';
import { CurrentGoalPill } from '@/components/goal/CurrentGoalPill';
import type { 
  DraftSummary, 
  Document, 
  ValidationWarning, 
  BuyerPackFile, 
  HistoryEntry,
  BuyerGoal
} from '@/types';

interface WorkspacePanelProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  summary: DraftSummary | null;
  documents: Document[];
  warnings: ValidationWarning[];
  buyerPack: BuyerPackFile[];
  history: HistoryEntry[];
  goal: BuyerGoal | null;
  onFixWarning: (warningId: string) => void;
  onExport: (type: 'pdf' | 'zip' | 'link') => void;
  onEditGoal?: () => void;
  isSampleMode?: boolean;
  onUpdateDocument?: (docId: string, content: string) => void;
}

export function WorkspacePanel({
  activeTab,
  onTabChange,
  summary,
  documents,
  warnings,
  buyerPack,
  history,
  goal,
  onFixWarning,
  onExport,
  onEditGoal,
  isSampleMode,
  onUpdateDocument,
}: WorkspacePanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Current Goal Pill (if goal exists) */}
      {goal && (
        <div className="px-4 py-2 border-b border-border bg-card flex items-center justify-between">
          <CurrentGoalPill goal={goal} onEdit={onEditGoal} isSampleMode={isSampleMode} />
        </div>
      )}

      <WorkspaceTabs 
        activeTab={activeTab} 
        onTabChange={onTabChange}
        warningCount={warnings.length}
      />
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 0 && <SummaryTab summary={summary} />}
        {activeTab === 1 && (
          <BuyerPackageTab 
            files={buyerPack} 
            goal={goal}
            onExport={onExport} 
            isSampleMode={isSampleMode}
          />
        )}
        {activeTab === 2 && (
          <DocumentsTab 
            documents={documents} 
            warnings={warnings}
            onFixWarning={onFixWarning}
            onUpdateDocument={onUpdateDocument}
            goal={goal}
          />
        )}
        {activeTab === 3 && <BuyersTab />}
        {activeTab === 4 && <ExpertTab />}
        {activeTab === 5 && <HistoryTab history={history} />}
      </div>
    </div>
  );
}
