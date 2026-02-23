import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { LayoutDashboard, MessageSquareMore, Building2, Database, LogOut, Shield, Users, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ADMIN_NAV = [
  { title: '대시보드', url: '/admin', icon: LayoutDashboard },
  { title: '세일즈 프로젝트 문의 관리', url: '/admin/inquiries', icon: MessageSquareMore },
  { title: '고객사 관리', url: '/admin/customers', icon: Building2 },
  { title: '사용자 역할 관리', url: '/admin/users', icon: Users },
  { title: 'RulePack DB 관리', url: '/admin/rulepacks', icon: Database },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const setSession = useAppStore((s) => s.setSession);

  const handleLogout = async () => {
    await signOut();
    setSession({ userId: null, email: null, role: 'user' });
    navigate('/login');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="w-64 border-r-0">
          <div className="flex flex-col h-full bg-[hsl(220,30%,12%)] text-white">
            {/* Header */}
            <div className="px-5 py-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(220,60%,50%)]">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight">FLONIX</p>
                  <p className="text-[10px] text-white/40 tracking-wider uppercase">Admin Workspace</p>
                </div>
              </div>
            </div>

            <SidebarContent className="flex-1 py-4">
              <SidebarGroup>
                <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-white/30 px-5 mb-2">
                  메뉴
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {ADMIN_NAV.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end={item.url === '/admin'}
                            className="flex items-center gap-3 px-5 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            activeClassName="bg-white/10 text-white font-medium"
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            {/* App link + Logout */}
            <div className="px-4 py-4 border-t border-white/10 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/home')}
                className="w-full justify-start gap-2 text-white/50 hover:text-white hover:bg-white/5"
              >
                <ExternalLink className="h-4 w-4" />
                일반 앱으로 이동
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start gap-2 text-white/50 hover:text-white hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </Sidebar>

        <div className="flex-1 flex flex-col bg-background">
          {/* Top bar */}
          <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-foreground">FLONIX Admin Workspace</h1>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
