import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/stores/appStore';
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
import { LayoutDashboard, Inbox, FolderKanban, UserCircle, LogOut, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PARTNER_NAV = [
  { title: '대시보드', url: '/partner-dashboard', icon: LayoutDashboard },
  { title: '신규 견적 요청', url: '/partner-dashboard/leads', icon: Inbox },
  { title: '진행 중인 건', url: '/partner-dashboard/active', icon: FolderKanban },
  { title: '내 프로필 / 정산', url: '/partner-dashboard/profile', icon: UserCircle },
];

export default function PartnerLayout() {
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
          <div className="flex flex-col h-full bg-[hsl(160,30%,12%)] text-white">
            {/* Header */}
            <div className="px-5 py-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(160,60%,40%)]">
                  <Handshake className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight">FLONIX</p>
                  <p className="text-[10px] text-white/40 tracking-wider uppercase">Partner Portal</p>
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
                    {PARTNER_NAV.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end={item.url === '/partner-dashboard'}
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

            {/* Logout */}
            <div className="px-4 py-4 border-t border-white/10">
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
          <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-foreground">FLONIX Partner Portal</h1>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
