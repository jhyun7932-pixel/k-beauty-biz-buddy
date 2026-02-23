import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LeftDock } from '@/components/layout/LeftDockNew';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function AppLayout() {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full bg-background">
        <LeftDock 
          isCollapsed={isDockCollapsed} 
          onToggleCollapse={() => setIsDockCollapsed(!isDockCollapsed)} 
        />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
}
