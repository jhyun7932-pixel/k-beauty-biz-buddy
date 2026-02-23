import React from 'react';
import { FileText, Package, ScrollText, UserCheck, History, Users } from 'lucide-react';

interface WorkspaceTabsProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  warningCount?: number;
}

const tabs = [
  { id: 0, label: '수출 준비 요약', shortLabel: '요약', icon: FileText },
  { id: 1, label: '바이어 패키지', shortLabel: '패키지', icon: Package },
  { id: 2, label: '거래 서류', shortLabel: '서류', icon: ScrollText },
  { id: 3, label: '바이어 CRM', shortLabel: 'CRM', icon: Users },
  { id: 4, label: '전문가 확인', shortLabel: '전문가', icon: UserCheck },
  { id: 5, label: '기록', shortLabel: '기록', icon: History },
];

export function WorkspaceTabs({ activeTab, onTabChange, warningCount = 0 }: WorkspaceTabsProps) {
  return (
    <div className="flex border-b border-border bg-card px-1 md:px-2 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const showWarning = tab.id === 2 && warningCount > 0;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab-item flex items-center gap-1 md:gap-1.5 px-2 md:px-4 min-w-fit ${isActive ? 'tab-item-active' : ''}`}
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-xs md:text-sm whitespace-nowrap">
              <span className="md:hidden">{tab.shortLabel}</span>
              <span className="hidden md:inline">{tab.label}</span>
            </span>
            {showWarning && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger text-[10px] font-medium text-danger-foreground px-1">
                {warningCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
