import React from 'react';

interface SplitViewProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  mobileActiveView: 'chat' | 'workspace';
}

export function SplitView({ leftPanel, rightPanel, mobileActiveView }: SplitViewProps) {
  return (
    <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden pb-16 md:pb-0">
      {/* Left Panel - Chat */}
      <div className={`${
        mobileActiveView === 'chat' ? 'flex' : 'hidden'
      } md:flex w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-border bg-card flex-col`}>
        {leftPanel}
      </div>
      
      {/* Right Panel - Workspace */}
      <div className={`${
        mobileActiveView === 'workspace' ? 'flex' : 'hidden'
      } md:flex flex-1 flex-col bg-background overflow-hidden`}>
        {rightPanel}
      </div>
    </div>
  );
}
