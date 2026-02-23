import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/stores/appStore';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading, error, isAuthenticated } = useAuth();
  const setSession = useAppStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    const result = await signIn(email, password);
    if (!result.error) {
      const userId = result.data?.user?.id ?? '';

      // profiles.role 컬럼으로 역할 확인 (user_roles 테이블 대신)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      const role = profile?.role ?? 'user';

      if (role === 'admin') {
        setSession({ userId, email, role: 'admin' });
        navigate('/admin');
        return;
      }

      if (role === 'partner') {
        setSession({ userId, email, role: 'user' });
        navigate('/partner-dashboard');
        return;
      }

      setSession({ userId, email, role: 'user' });
      navigate('/home');
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-accent-violet/10 to-accent-mint/10 p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            홈으로
          </Link>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">K-뷰티 AI 무역비서</span>
          </div>
          <p className="text-xl text-muted-foreground max-w-md">
            수출 업무를 자동화하고, 바이어에게 필요한 문서를 빠르게 준비하세요.
          </p>
          <div className="space-y-3 pt-8">
            <p className="text-sm text-muted-foreground">💡 문서가 '프로젝트(수출 건)' 단위로 저장됩니다.</p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          © 2025 K-Beauty AI Trade Assistant
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              홈으로
            </Link>
            <div className="flex items-center justify-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">K-뷰티 AI 무역비서</span>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-2xl font-bold text-foreground">로그인</h1>
            <p className="text-muted-foreground">계정에 로그인하여 계속하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {displayError && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {displayError}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              로그인
            </Button>
          </form>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
