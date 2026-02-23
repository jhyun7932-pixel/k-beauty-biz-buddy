import React, { useState } from 'react';
import { 
  FolderKanban, 
  Users, 
  FileText, 
  Shield,
  Settings,
  ChevronDown,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  Home,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface DockSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'destructive' | 'warning';
  items?: DockItem[];
  locked?: boolean;
  onClick?: () => void;
}

interface DockItem {
  id: string;
  name: string;
  badges?: { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }[];
  status?: 'complete' | 'warning' | 'pending';
}

interface LeftDockProps {
  onNavigate?: (section: string, itemId?: string) => void;
  onGoHome?: () => void;
  className?: string;
  activeSection?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function LeftDock({ 
  onNavigate, 
  onGoHome, 
  className, 
  activeSection = 'home',
  isCollapsed = false,
  onToggleCollapse
}: LeftDockProps) {
  const [currentWorkspace, setCurrentWorkspace] = useState('K-Beauty Export');
  const [openSections, setOpenSections] = useState<string[]>(['workspace']);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />;
      case 'pending':
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  // Main sections for MVP
  const sections: DockSection[] = [
    {
      id: 'workspace',
      label: '프로젝트',
      icon: <FolderKanban className="h-4 w-4" />,
      items: [], // Will be populated from actual data
    },
    {
      id: 'documents',
      label: '문서함',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onNavigate?.('documents'),
    },
    {
      id: 'crm',
      label: '바이어 CRM',
      icon: <Users className="h-4 w-4" />,
      onClick: () => onNavigate?.('crm'),
    },
    {
      id: 'settings',
      label: '설정',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => onNavigate?.('settings'),
    },
  ];

  // Collapsed state - show only icons
  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <div className={cn("flex flex-col h-full bg-card border-r border-border w-[56px]", className)}>
          {/* Expand button */}
          <div className="p-2 border-b border-border flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onToggleCollapse}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Show sidebar</TooltipContent>
            </Tooltip>
          </div>

          {/* Home */}
          <div className="p-2 border-b border-border flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeSection === 'home' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={onGoHome}
                >
                  <Home className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Agent Home</TooltipContent>
            </Tooltip>
          </div>

          {/* Icon-only sections */}
          <div className="flex-1 p-2 space-y-1 flex flex-col items-center">
            {sections.map((section) => (
              <Tooltip key={section.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeSection === section.id ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8 relative"
                    onClick={() => {
                      if (section.onClick) {
                        section.onClick();
                      } else {
                        onNavigate?.(section.id);
                      }
                    }}
                  >
                    {section.icon}
                    {section.badge && (
                      <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-destructive rounded-full text-[9px] text-destructive-foreground flex items-center justify-center">
                        {section.badge}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{section.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Quick Create */}
          <div className="p-2 border-t border-border flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">새로 만들기</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-card border-r border-border", className)}>
      {/* Workspace Switcher + Hide button */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 justify-between text-sm font-medium">
                <span className="truncate">{currentWorkspace}</span>
                <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
              <DropdownMenuItem onClick={() => setCurrentWorkspace('K-Beauty Export')}>
                K-Beauty Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentWorkspace('Cosmetics Line')}>
                Cosmetics Line
              </DropdownMenuItem>
              <DropdownMenuItem className="text-primary">
                <Plus className="h-4 w-4 mr-2" />
                새 워크스페이스
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={onToggleCollapse}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Hide sidebar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Home Button */}
      <div className="p-2 border-b border-border">
        <Button
          variant={activeSection === 'home' ? 'secondary' : 'ghost'}
          size="sm"
          className="w-full justify-start gap-2 h-9"
          onClick={onGoHome}
        >
          <Home className="h-4 w-4" />
          <span className="text-sm">Agent Home</span>
        </Button>
      </div>

      {/* Sections */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sections.map((section) => (
            <Collapsible
              key={section.id}
              open={openSections.includes(section.id)}
              onOpenChange={() => {
                if (section.onClick) {
                  section.onClick();
                } else if (!section.locked) {
                  toggleSection(section.id);
                }
              }}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant={activeSection === section.id ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    "w-full justify-between h-9",
                    section.locked && "opacity-60 cursor-not-allowed"
                  )}
                  disabled={section.locked}
                >
                  <div className="flex items-center gap-2">
                    {section.icon}
                    <span className="text-sm">{section.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.badge && (
                      <Badge 
                        variant={section.badgeVariant === 'warning' ? 'secondary' : section.badgeVariant}
                        className={cn(
                          "h-5 px-1.5 text-xs",
                          section.badgeVariant === 'warning' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        )}
                      >
                        {section.badge}
                      </Badge>
                    )}
                    {section.locked ? (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : section.items ? (
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        openSections.includes(section.id) && "rotate-180"
                      )} />
                    ) : null}
                  </div>
                </Button>
              </CollapsibleTrigger>
              
              {section.items && (
                <CollapsibleContent className="pl-4 pr-1 py-1 space-y-0.5">
                  {section.items.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-auto py-2 px-2"
                      onClick={() => onNavigate?.(section.id, item.id)}
                    >
                      <div className="flex flex-col items-start gap-1 w-full">
                        <div className="flex items-center gap-2 w-full">
                          {getStatusIcon(item.status)}
                          <span className="text-xs truncate flex-1 text-left">{item.name}</span>
                        </div>
                        {item.badges && (
                          <div className="flex flex-wrap gap-1">
                            {item.badges.map((badge, idx) => (
                              <Badge 
                                key={idx} 
                                variant={badge.variant}
                                className="h-4 px-1 text-[10px]"
                              >
                                {badge.label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </CollapsibleContent>
              )}

            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      {/* Quick Create */}
      <div className="p-3 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Plus className="h-4 w-4" />
              <span className="text-sm">새로 만들기</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[180px]">
            <DropdownMenuItem onClick={() => onNavigate?.('new-project')}>
              <FolderKanban className="h-4 w-4 mr-2" />
              새 프로젝트
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate?.('new-buyer')}>
              <Users className="h-4 w-4 mr-2" />
              새 바이어
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate?.('new-document')}>
              <FileText className="h-4 w-4 mr-2" />
              새 문서
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
