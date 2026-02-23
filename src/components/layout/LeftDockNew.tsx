import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface LeftDockProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}
import {
  Bot,
  Database,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  LayoutDashboard,
  Shield,
  Settings,
  Handshake,
} from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const NAV_ITEMS = [
  {
    path: '/home',
    label: '에이전트 홈',
    icon: Bot,
    description: 'AI 무역비서와 대화',
    emoji: '🏠',
  },
  {
    path: '/my-data',
    label: '마이 데이터',
    icon: Database,
    description: '바이어 · 제품 관리',
    emoji: '🗂️',
  },
  {
    path: '/export-projects',
    label: '수출 프로젝트',
    icon: Rocket,
    description: '수출 프로젝트 칸반 관리',
    emoji: '🚀',
  },
  {
    path: '/compliance',
    label: '규제 체크리스트',
    icon: Shield,
    description: '11개국 수출 규제 현황',
    emoji: '🛡️',
  },
  {
    path: '/expert-connection',
    label: '전문가 연결',
    icon: Handshake,
    description: '관세사 · 포워더 매칭',
    emoji: '🤝',
    badge: '서비스 준비중',
    children: [
      { path: '/expert-connection?type=customs', label: '관세사 매칭' },
      { path: '/expert-connection?type=forwarder', label: '포워더 매칭' },
    ],
  },
  {
    path: '/settings',
    label: '설정',
    icon: Settings,
    description: '회사 정보 및 브랜드 자산 설정',
    emoji: '⚙️',
  },
];

export function LeftDock({ isCollapsed = false, onToggleCollapse }: LeftDockProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const currentPath = location.pathname;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r border-border transition-all duration-200",
      isCollapsed ? "w-[56px]" : "w-[220px]"
    )}>
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-border flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-sm text-foreground">FLONIX</span>
          </div>
        )}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={onToggleCollapse}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isCollapsed ? '메뉴 펼치기' : '메뉴 접기'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path ||
            (item.path === '/home' && currentPath === '/') ||
            (item.children && currentPath.startsWith(item.path.split('?')[0]));

          if (isCollapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="icon"
                    className={cn(
                      "w-full h-11",
                      isActive && "bg-primary/10 text-primary"
                    )}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex flex-col">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-xs">{item.label}</span>
                    {(item as any).badge && (
                      <span className="text-[9px] px-1 py-0 rounded bg-primary/20 text-primary font-bold">
                        {(item as any).badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <div key={item.path}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-11 text-sm",
                  isActive && "bg-primary/10 text-primary font-semibold"
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {(item as any).badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-normal whitespace-nowrap">
                      {(item as any).badge}
                    </span>
                  )}
                </div>
              </Button>
              {/* Sub-menu children */}
              {item.children && isActive && (
                <div className="ml-8 mt-0.5 space-y-0.5">
                  {item.children.map((child) => {
                    const isChildActive = location.search.includes(child.path.split('?')[1] || '');
                    return (
                      <Button
                        key={child.path}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start h-8 text-xs",
                          isChildActive ? "text-primary font-medium" : "text-muted-foreground"
                        )}
                        onClick={() => navigate(child.path)}
                      >
                        {child.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-2 space-y-1 flex-shrink-0">
        <NotificationBell collapsed={isCollapsed} />
        {isAdmin && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  isCollapsed ? "w-full h-10 px-0 justify-center" : "w-full justify-start gap-3 h-10"
                )}
                onClick={() => navigate('/admin')}
              >
                <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="text-xs">어드민 대시보드</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">어드민 대시보드</TooltipContent>
            )}
          </Tooltip>
        )}

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "text-muted-foreground hover:text-destructive",
                isCollapsed ? "w-full h-10 px-0 justify-center" : "w-full justify-start gap-3 h-10"
              )}
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span className="text-xs">로그아웃</span>}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">로그아웃</TooltipContent>
          )}
        </Tooltip>
      </div>
    </div>
  );
}
