import React from 'react';
import { MessageCircle, Briefcase } from 'lucide-react';

interface MobileTabBarProps {
  activeView: 'chat' | 'workspace';
  onViewChange: (view: 'chat' | 'workspace') => void;
  hasNotification?: boolean;
}

export function MobileTabBar({ activeView, onViewChange, hasNotification }: MobileTabBarProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-4 py-2 safe-area-pb">
      <div className="flex items-center justify-around">
        <button
          onClick={() => onViewChange('chat')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
            activeView === 'chat' 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-xs font-medium">채팅</span>
        </button>
        
        <button
          onClick={() => onViewChange('workspace')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all relative ${
            activeView === 'workspace' 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Briefcase className="h-5 w-5" />
          <span className="text-xs font-medium">워크스페이스</span>
          {hasNotification && (
            <span className="absolute top-1 right-4 h-2 w-2 bg-danger rounded-full" />
          )}
        </button>
      </div>
    </div>
  );
}
