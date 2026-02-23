import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Package, FileText, PenTool, Shield } from 'lucide-react';
import { ExportReadinessTab } from './ExportReadinessTab';
import { BuyerPackageTab2 } from './BuyerPackageTab2';
import { TradeDocsTab } from './TradeDocsTab';
import { DocumentStudioTab } from './DocumentStudioTab';

interface WorkspaceCanvasProps {
  onExport?: (type: 'pdf' | 'zip' | 'link') => void;
}

export function WorkspaceCanvas({ onExport }: WorkspaceCanvasProps) {
  const [activeTab, setActiveTab] = useState('readiness');
  const [studioDocId, setStudioDocId] = useState<string | undefined>();

  const handleNavigate = (tab: string, docId?: string) => {
    if (tab === 'studio' && docId) {
      setStudioDocId(docId);
    }
    setActiveTab(tab === 'buyer-package' ? 'package' : 
                 tab === 'trade-docs' ? 'trade' : 
                 tab === 'studio' ? 'studio' : 
                 tab === 'label' ? 'readiness' : tab);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Expert Badge - Top Right */}
      <div className="absolute top-2 right-2 z-10">
        <Badge variant="secondary" className="gap-1 text-xs">
          <Shield className="h-3 w-3" />
          전문가 확인
          <span className="text-muted-foreground">(준비중)</span>
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-card px-2 h-11 shrink-0">
          <TabsTrigger 
            value="readiness" 
            className="gap-1.5 text-xs data-[state=active]:bg-background"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            수출 준비 요약
          </TabsTrigger>
          <TabsTrigger 
            value="package" 
            className="gap-1.5 text-xs data-[state=active]:bg-background"
          >
            <Package className="h-3.5 w-3.5" />
            바이어 패키지
          </TabsTrigger>
          <TabsTrigger 
            value="trade" 
            className="gap-1.5 text-xs data-[state=active]:bg-background"
          >
            <FileText className="h-3.5 w-3.5" />
            거래 서류
          </TabsTrigger>
          <TabsTrigger 
            value="studio" 
            className="gap-1.5 text-xs data-[state=active]:bg-background"
          >
            <PenTool className="h-3.5 w-3.5" />
            편집·출력
          </TabsTrigger>
        </TabsList>

        <TabsContent value="readiness" className="flex-1 m-0 overflow-hidden">
          <ExportReadinessTab onNavigate={handleNavigate} />
        </TabsContent>

        <TabsContent value="package" className="flex-1 m-0 overflow-hidden">
          <BuyerPackageTab2 
            onNavigate={handleNavigate} 
            onExport={(type) => onExport?.(type === 'zip' ? 'zip' : 'pdf')} 
          />
        </TabsContent>

        <TabsContent value="trade" className="flex-1 m-0 overflow-hidden">
          <TradeDocsTab onNavigate={handleNavigate} />
        </TabsContent>

        <TabsContent value="studio" className="flex-1 m-0 overflow-hidden">
          <DocumentStudioTab onExport={(type) => onExport?.(type === 'zip' ? 'zip' : 'pdf')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
