import React from 'react';
import { cn } from '@/lib/utils';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';

interface AgentSplitLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  mobileActiveView?: 'dock' | 'chat' | 'workspace';
  showDock?: boolean;
  showWorkArea?: boolean;
  isDockCollapsed?: boolean;
}

export function AgentSplitLayout({ 
  leftPanel, 
  centerPanel, 
  rightPanel, 
  mobileActiveView = 'chat',
  showDock = true,
  showWorkArea = true,
  isDockCollapsed = false
}: AgentSplitLayoutProps) {
  return (
    <div className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden">
      {/* Left Panel - Dock (hidden on mobile by default) */}
      {showDock && (
        <div className={cn(
          "hidden lg:flex flex-shrink-0 transition-all duration-200",
          isDockCollapsed ? "w-[56px]" : "w-[220px]",
          mobileActiveView === 'dock' && "flex"
        )}>
          {leftPanel}
        </div>
      )}
      
      {/* Center + Right - Resizable Split View or Center only */}
      <div className={cn(
        "flex-1 hidden md:flex",
        mobileActiveView !== 'dock' && "flex"
      )}>
        {showWorkArea ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Center Panel - Chat */}
            <ResizablePanel 
              defaultSize={50} 
              minSize={35} 
              maxSize={70}
              className={cn(
                "hidden md:flex flex-col",
                mobileActiveView === 'chat' && "flex"
              )}
            >
              {centerPanel}
            </ResizablePanel>

            <ResizableHandle withHandle className="hidden md:flex" />

            {/* Right Panel - Work Area */}
            <ResizablePanel 
              defaultSize={50} 
              minSize={30}
              className={cn(
                "hidden md:flex flex-col border-l border-border",
                mobileActiveView === 'workspace' && "flex"
              )}
            >
              {rightPanel}
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          // Center panel takes full width when Work Area is hidden
          <div className={cn(
            "flex-1 flex flex-col",
            mobileActiveView === 'chat' && "flex"
          )}>
            {centerPanel}
          </div>
        )}
      </div>

      {/* Mobile: Show only active view */}
      <div className={cn(
        "flex-1 flex flex-col md:hidden",
        mobileActiveView === 'dock' && "hidden"
      )}>
        {mobileActiveView === 'chat' && centerPanel}
        {mobileActiveView === 'workspace' && showWorkArea && rightPanel}
      </div>
    </div>
  );
}
