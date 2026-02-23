import React, { useEffect } from 'react';
import { ChatOnlyHome } from '@/components/home/ChatOnlyHome';
import { WorkbenchPanel } from '@/components/workbench/WorkbenchPanel';
import { ContextChipsBar } from '@/components/context/ContextChipsBar';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Sparkles } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useSessionStore } from '@/stores/sessionStore';

export function GensparkLayout() {
  const { ui } = useAppStore();
  const { 
    layoutMode, 
    activeSessionId, 
    createNewSession,
    getActiveSession,
  } = useSessionStore();
  
  useEffect(() => {
    if (!activeSessionId) {
      createNewSession();
    } else {
      // Restore layout mode from session data if needed
      const session = getActiveSession();
      if (session && layoutMode === 'CHAT_ONLY') {
        const hasExecutionActions = session.actions.some(a => 
          ['start_project', 'select_preset', 'create_doc', 'run_compliance', 'run_gate', 'update_fields', 'finalize_doc'].includes(a.type)
        );
        if (hasExecutionActions || session.linkedDocIds.length > 0) {
          useSessionStore.getState().setLayoutMode('SPLIT_WORKBENCH');
        }
      }
    }
  }, [activeSessionId, createNewSession]);
  
  const activeSession = getActiveSession();
  const isSplit = layoutMode === 'SPLIT_WORKBENCH';

  return (
    <div className="h-full flex flex-col">
      {/* Header - only in split mode */}
      {isSplit && (
        <div className="border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
          <div className="px-4 py-2.5 flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/60">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate">
                {activeSession?.title || 'K-뷰티 AI 무역비서'}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {activeSession?.contextSnapshot.preset 
                  ? `${activeSession.contextSnapshot.preset} · ${activeSession.contextSnapshot.targetCountries.join(', ') || '국가 미선택'}`
                  : '수출 문서 작성 · 규제 확인 · 바이어 커뮤니케이션'}
              </p>
            </div>
          </div>
          <ContextChipsBar />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {!isSplit ? (
          /* Chat Only Mode */
          <ChatOnlyHome />
        ) : (
          /* Split Workbench Mode with Resizable Panels */
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Panel - Chat */}
            <ResizablePanel defaultSize={42} minSize={30} maxSize={60}>
              <div className="h-full flex flex-col overflow-hidden">
                <ChatOnlyHome />
              </div>
            </ResizablePanel>

            {/* Resizable Handle */}
            <ResizableHandle withHandle className="bg-border hover:bg-primary/20 transition-colors" />

            {/* Right Panel - Workbench */}
            <ResizablePanel defaultSize={58} minSize={35} maxSize={70}>
              <div className="h-full overflow-hidden">
                <WorkbenchPanel />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
