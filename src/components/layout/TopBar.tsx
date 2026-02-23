import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, HelpCircle, Settings, User, Building2, LogOut, LogIn, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { AuthModal } from '@/components/auth/AuthModal';
import { CompanyFormModal } from '@/components/company/CompanyFormModal';
import type { Step } from '@/types';
interface TopBarProps {
  currentStep: Step;
  progress: number;
  progressMessage: string;
  onSampleClick: () => void;
}

const steps: { key: Step; label: string; shortLabel: string }[] = [
  { key: 'upload', label: '1 목표/자료', shortLabel: '1' },
  { key: 'ingredients', label: '2 성분확인', shortLabel: '2' },
  { key: 'draft', label: '3 초안', shortLabel: '3' },
  { key: 'edit', label: '4 수정', shortLabel: '4' },
  { key: 'validate', label: '5 실수체크', shortLabel: '5' },
  { key: 'export', label: '6 출력', shortLabel: '6' },
];

const stepOrder: Step[] = ['upload', 'ingredients', 'draft', 'edit', 'validate', 'export'];

export function TopBar({ currentStep, progress, progressMessage, onSampleClick }: TopBarProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user, profile, signOut, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  
  const currentStepIndex = stepOrder.indexOf(currentStep);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <>
      <header className="aurora-header border-b border-border bg-card">
        <div className="relative z-10 flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">K-뷰티 AI 무역비서</span>
              <span className="text-xs text-muted-foreground hidden sm:block">수출 업무 자동화</span>
            </div>
          </div>

          {/* Step Chips */}
          <div className="hidden md:flex items-center gap-1.5">
            {steps.map((step, index) => {
              const isActive = step.key === currentStep;
              const isComplete = index < currentStepIndex;
              
              return (
                <span
                  key={step.key}
                  className={`step-chip ${
                    isActive ? 'step-chip-active' : 
                    isComplete ? 'step-chip-complete' : 
                    'step-chip-pending'
                  }`}
                >
                  {step.label}
                </span>
              );
            })}
          </div>

          {/* Mobile Step Indicator */}
          <div className="flex md:hidden items-center gap-1">
            {steps.map((step, index) => {
              const isActive = step.key === currentStep;
              const isComplete = index < currentStepIndex;
              
              return (
                <span
                  key={step.key}
                  className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full ${
                    isActive ? 'bg-primary text-primary-foreground' : 
                    isComplete ? 'bg-success/20 text-success' : 
                    'bg-muted/30 text-muted-foreground'
                  }`}
                >
                  {step.shortLabel}
                </span>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSampleClick}
              className="hidden sm:flex gap-1.5 text-accent-violet border-accent-violet/30 hover:bg-accent-violet/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              샘플 체험
            </Button>
            
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </Button>
            
            {isAuthenticated && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hidden sm:flex"
                onClick={() => setShowCompanyModal(true)}
              >
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1.5 px-2"
                  >
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium hidden sm:inline max-w-[100px] truncate">
                      {profile?.display_name || user?.email?.split('@')[0] || '사용자'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.display_name || '사용자'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowCompanyModal(true)}>
                    <Building2 className="h-4 w-4 mr-2" />
                    {company ? '회사 정보 수정' : '회사 정보 등록'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSettingsClick}>
                    <Settings className="h-4 w-4 mr-2" />
                    설정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setShowAuthModal(true)}
                disabled={authLoading}
                className="gap-1.5"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">로그인</span>
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {progress > 0 && progress < 100 && (
          <div className="px-4 pb-2 relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">{progressMessage}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Company Form Modal */}
      <CompanyFormModal 
        open={showCompanyModal} 
        onClose={() => setShowCompanyModal(false)} 
      />
    </>
  );
}
