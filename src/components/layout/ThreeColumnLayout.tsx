import React from 'react';
import { LeftDock } from '@/components/layout/LeftDock';
import { cn } from '@/lib/utils';

interface ThreeColumnLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  mobileActiveView?: 'dock' | 'chat' | 'workspace';
  showDock?: boolean;
}

export function ThreeColumnLayout({ 
  leftPanel, 
  centerPanel, 
  rightPanel, 
  mobileActiveView = 'chat',
  showDock = true
}: ThreeColumnLayoutProps) {
  return (
    <div className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden">
      {/* Left Panel - Dock */}
      {showDock && (
        <div className={cn(
          "hidden lg:flex w-[220px] flex-shrink-0 border-r border-border",
          mobileActiveView === 'dock' && "flex"
        )}>
          {leftPanel}
        </div>
      )}
      
      {/* Center Panel - Chat */}
      <div className={cn(
        "hidden md:flex w-full md:w-[380px] lg:w-[400px] flex-shrink-0 border-r border-border flex-col",
        mobileActiveView === 'chat' && "flex",
        !showDock && "lg:w-[420px]"
      )}>
        {centerPanel}
      </div>
      
      {/* Right Panel - Workspace Canvas */}
      <div className={cn(
        "hidden md:flex flex-1 flex-col bg-background overflow-hidden relative",
        mobileActiveView === 'workspace' && "flex"
      )}>
        {rightPanel}
      </div>
    </div>
  );
}
