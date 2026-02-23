import React, { useState } from 'react';
import { Bug, ChevronDown, ChevronUp, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/stores/projectStore';
import { cn } from '@/lib/utils';

interface DebugPanelProps {
  className?: string;
}

export function DebugPanel({ className }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const {
    activeProjectId,
    projectContext,
    companySettings,
    projects,
    activeDocumentId,
    hasCompletedOnboarding,
    hasSeenTour,
  } = useProjectStore();

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeDocument = activeProject?.documents.find(d => d.id === activeDocumentId);

  const debugState = {
    session: {
      userId: 'test@exportops.dev',
      email: 'test@exportops.dev',
      role: 'admin',
    },
    workspace: {
      workspaceId: activeProjectId,
      name: activeProject?.name || null,
    },
    project: {
      projectId: activeProjectId,
      targetCountries: projectContext.targetCountries,
      channel: projectContext.salesChannel,
      stagePreset: projectContext.tradeStagePreset,
      language: projectContext.language,
      currency: projectContext.currency,
      incotermsDefault: projectContext.incotermsDefault,
      paymentDefault: projectContext.paymentDefault,
      buyerType: projectContext.buyerType,
    },
    companyProfile: {
      companyName: companySettings.companyName,
      address: companySettings.address,
      contactEmail: companySettings.contactEmail,
      contactPhone: companySettings.contactPhone,
      website: companySettings.website,
    },
    ui: {
      activePage: 'AGENT_HOME',
      activeDocId: activeDocumentId,
      showDebugPanel: isOpen,
    },
    files: {
      list: activeProject?.documents.map(d => ({
        fileId: d.id,
        docId: d.id,
        name: d.title,
        type: 'html',
        stagePreset: projectContext.tradeStagePreset,
        templateKey: d.docKey,
        status: d.status,
        createdAt: d.createdAt,
      })) || [],
      selectedFileId: activeDocumentId,
    },
    docs: {
      activeDoc: activeDocument ? {
        docId: activeDocument.id,
        stagePreset: projectContext.tradeStagePreset,
        templateKey: activeDocument.docKey,
        title: activeDocument.title,
        status: activeDocument.status,
        fieldsCount: Object.keys(activeDocument.fields).length,
      } : null,
    },
    onboarding: {
      hasCompletedOnboarding,
      hasSeenTour,
    },
    projectsCount: projects.length,
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(debugState, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Only show in development or for admin users
  const shouldShow = true; // In production, check for admin role

  if (!shouldShow) return null;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50",
      className
    )}>
      {/* Toggle Button */}
      {!isOpen && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="gap-1.5 bg-card shadow-lg border-2"
        >
          <Bug className="h-4 w-4 text-amber-600" />
          Debug
        </Button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="w-96 max-h-[70vh] bg-card border-2 border-amber-200 rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-amber-50">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-amber-600" />
              <span className="font-semibold text-sm">Dev Debug Panel</span>
              <Badge variant="outline" className="text-[10px] bg-amber-100 border-amber-300">
                Admin Only
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 max-h-[60vh]">
            <pre className="p-3 text-[10px] font-mono text-muted-foreground overflow-x-auto">
              {JSON.stringify(debugState, null, 2)}
            </pre>
          </ScrollArea>

          {/* Footer */}
          <div className="p-2 border-t bg-muted/30 text-center">
            <p className="text-[10px] text-muted-foreground">
              State updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
