import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ Types ============
export type LayoutMode = 'CHAT_ONLY' | 'SPLIT_WORKBENCH';
export type SessionStatus = 'draft' | 'running' | 'blocked' | 'done' | 'failed';
export type PresetLabel = '첫제안' | '샘플' | '본오더' | null;
export type OnboardingStep = 0 | 1 | 2 | 3; // 0: not started, 1: country, 2: preset, 3: files

export interface SessionContextSnapshot {
  targetCountries: string[];
  channel: '도매' | '리테일' | '온라인' | '기타' | null;
  preset: PresetLabel;
  language: 'KO' | 'EN' | 'JP' | string | null;
  currency: 'USD' | 'KRW' | 'JPY' | 'EUR' | string | null;
  buyerType: string | null;
  stage: string | null;
  productName: string | null;
}

export interface SessionMessage {
  role: 'user' | 'agent';
  text: string;
  at: number;
}

export interface SessionAction {
  type: string;
  payload: any;
  at: number;
  status: 'ok' | 'fail';
  note?: string;
}

export interface SessionMetrics {
  docsCreated: number;
  fieldsUpdated: number;
  complianceChecks: number;
  gateBlocks: number;
  finalizeCount: number;
}

export interface WorkSession {
  sessionId: string;
  title: string;
  status: SessionStatus;
  createdAt: number;
  updatedAt: number;
  contextSnapshot: SessionContextSnapshot;
  messages: SessionMessage[];
  actions: SessionAction[];
  linkedProjectId: string | null;
  linkedDocIds: string[];
  linkedComplianceIds: string[];
  linkedGateRuns: string[];
  linkedFileIds: string[];
  metrics: SessionMetrics;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  text: string;
}

// ============ Execution Actions (trigger SPLIT_WORKBENCH) ============
export const EXECUTION_ACTIONS = [
  'start_project',
  'select_preset',
  'upload_files',
  'create_doc',
  'run_compliance',
  'run_gate',
  'update_fields',
  'finalize_doc',
  'export_zip',
  'send_email_draft',
] as const;

export type ExecutionActionType = typeof EXECUTION_ACTIONS[number];

// ============ State Interface ============
interface SessionState {
  // UI State
  layoutMode: LayoutMode;
  activeSessionId: string | null;
  activeProjectId: string | null;
  onboardingStep: OnboardingStep;
  inlineSetupOpen: boolean;
  toastQueue: ToastItem[];
  
  // Sessions
  sessions: {
    byId: Record<string, WorkSession>;
    recentIds: string[];
  };
}

interface SessionActions {
  // Layout
  setLayoutMode: (mode: LayoutMode) => void;
  
  // Session Management
  createNewSession: () => string;
  loadSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<WorkSession>) => void;
  appendMessage: (sessionId: string, msg: Omit<SessionMessage, 'at'>) => void;
  appendAction: (sessionId: string, action: Omit<SessionAction, 'at'>) => void;
  setSessionStatus: (sessionId: string, status: SessionStatus) => void;
  generateSessionTitle: (sessionId: string) => void;
  
  // Onboarding
  setOnboardingStep: (step: OnboardingStep) => void;
  updateContextSnapshot: (sessionId: string, snapshot: Partial<SessionContextSnapshot>) => void;
  
  // Inline Setup
  openInlineSetup: () => void;
  closeInlineSetup: () => void;
  
  // Toasts
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Helpers
  getActiveSession: () => WorkSession | null;
  getRecentSessions: () => WorkSession[];
  isExecutionAction: (actionType: string) => boolean;
  
  // Linking
  linkDocToSession: (sessionId: string, docId: string) => void;
  linkProjectToSession: (sessionId: string, projectId: string) => void;
  
  // Metrics
  incrementMetric: (sessionId: string, metric: keyof SessionMetrics) => void;
}

// ============ Default State ============
const defaultState: SessionState = {
  layoutMode: 'CHAT_ONLY',
  activeSessionId: null,
  activeProjectId: null,
  onboardingStep: 0,
  inlineSetupOpen: false,
  toastQueue: [],
  sessions: {
    byId: {},
    recentIds: [],
  },
};

// ============ Helper: Generate Auto Title ============
function generateAutoTitle(session: WorkSession): string {
  const { contextSnapshot, actions } = session;
  
  // Country part
  const countries = contextSnapshot.targetCountries;
  let countryStr = '';
  if (countries.length === 0) {
    countryStr = '';
  } else if (countries.length === 1) {
    countryStr = getCountryName(countries[0]);
  } else {
    countryStr = `${getCountryName(countries[0])}+${countries.length - 1}`;
  }
  
  // Preset part
  const preset = contextSnapshot.preset || '';
  
  // Channel part
  const channel = contextSnapshot.channel || '';
  
  // Action keyword
  let keyword = '작업 중';
  const lastExecAction = actions.filter(a => 
    EXECUTION_ACTIONS.includes(a.type as ExecutionActionType)
  ).pop();
  
  if (lastExecAction) {
    keyword = getActionKeyword(lastExecAction.type);
  }
  
  // Compose title
  const parts = [countryStr, preset, channel, keyword].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : '새 작업';
}

function getCountryName(code: string): string {
  const names: Record<string, string> = {
    'US': '미국', 'JP': '일본', 'EU': 'EU', 'HK': '홍콩', 'TW': '대만',
    'CN': '중국', 'VN': '베트남', 'ID': '인도네시아', 'MY': '말레이시아', 'TH': '태국', 'AU': '호주'
  };
  return names[code] || code;
}

function getActionKeyword(actionType: string): string {
  const keywords: Record<string, string> = {
    'select_preset': '패키지 준비',
    'create_doc': '문서 생성',
    'run_compliance': '규제 체크',
    'run_gate': '불일치 점검',
    'finalize_doc': '최종 확정',
    'upload_files': '자료 업로드',
    'update_fields': '필드 수정',
    'export_zip': '내보내기',
    'send_email_draft': '이메일 발송',
    'start_project': '프로젝트 시작',
  };
  return keywords[actionType] || '작업 중';
}

// ============ Store Implementation ============
export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    (set, get) => ({
      ...defaultState,
      
      // Layout
      setLayoutMode: (mode) => {
        set({ layoutMode: mode });
      },
      
      // Session Management
      createNewSession: () => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        
        const newSession: WorkSession = {
          sessionId,
          title: '새 작업',
          status: 'draft',
          createdAt: now,
          updatedAt: now,
          contextSnapshot: {
            targetCountries: [],
            channel: null,
            preset: null,
            language: 'KO',
            currency: 'USD',
            buyerType: null,
            stage: null,
            productName: null,
          },
          messages: [],
          actions: [],
          linkedProjectId: null,
          linkedDocIds: [],
          linkedComplianceIds: [],
          linkedGateRuns: [],
          linkedFileIds: [],
          metrics: {
            docsCreated: 0,
            fieldsUpdated: 0,
            complianceChecks: 0,
            gateBlocks: 0,
            finalizeCount: 0,
          },
        };
        
        set((s) => ({
          sessions: {
            byId: { ...s.sessions.byId, [sessionId]: newSession },
            recentIds: [sessionId, ...s.sessions.recentIds.slice(0, 29)],
          },
          activeSessionId: sessionId,
          onboardingStep: 0,
          layoutMode: 'CHAT_ONLY',
        }));
        
        return sessionId;
      },
      
      loadSession: (sessionId) => {
        const session = get().sessions.byId[sessionId];
        if (!session) return;
        
        // Determine layout mode based on session state
        const hasExecutionActions = session.actions.some(a => 
          EXECUTION_ACTIONS.includes(a.type as ExecutionActionType)
        );
        const hasDocs = session.linkedDocIds.length > 0;
        
        set({
          activeSessionId: sessionId,
          activeProjectId: session.linkedProjectId,
          layoutMode: (hasExecutionActions || hasDocs) ? 'SPLIT_WORKBENCH' : 'CHAT_ONLY',
        });
        
        // Update recent order
        set((s) => ({
          sessions: {
            ...s.sessions,
            recentIds: [
              sessionId,
              ...s.sessions.recentIds.filter(id => id !== sessionId).slice(0, 29),
            ],
          },
        }));
      },
      
      updateSession: (sessionId, updates) => {
        set((s) => {
          const session = s.sessions.byId[sessionId];
          if (!session) return s;
          
          return {
            sessions: {
              ...s.sessions,
              byId: {
                ...s.sessions.byId,
                [sessionId]: {
                  ...session,
                  ...updates,
                  updatedAt: Date.now(),
                },
              },
            },
          };
        });
      },
      
      appendMessage: (sessionId, msg) => {
        set((s) => {
          const session = s.sessions.byId[sessionId];
          if (!session) return s;
          
          return {
            sessions: {
              ...s.sessions,
              byId: {
                ...s.sessions.byId,
                [sessionId]: {
                  ...session,
                  messages: [...session.messages, { ...msg, at: Date.now() }],
                  updatedAt: Date.now(),
                },
              },
            },
          };
        });
      },
      
      appendAction: (sessionId, action) => {
        const state = get();
        const session = state.sessions.byId[sessionId];
        if (!session) return;
        
        const newAction: SessionAction = { ...action, at: Date.now() };
        
        set((s) => ({
          sessions: {
            ...s.sessions,
            byId: {
              ...s.sessions.byId,
              [sessionId]: {
                ...session,
                actions: [...session.actions, newAction],
                updatedAt: Date.now(),
                status: action.status === 'fail' ? 'failed' : session.status === 'draft' ? 'running' : session.status,
              },
            },
          },
        }));
        
        // Auto-switch to SPLIT_WORKBENCH on execution action
        if (EXECUTION_ACTIONS.includes(action.type as ExecutionActionType) && action.status === 'ok') {
          set({ layoutMode: 'SPLIT_WORKBENCH' });
          
          // Generate title on first execution action
          if (session.title === '새 작업') {
            get().generateSessionTitle(sessionId);
          }
        }
      },
      
      setSessionStatus: (sessionId, status) => {
        get().updateSession(sessionId, { status });
      },
      
      generateSessionTitle: (sessionId) => {
        const session = get().sessions.byId[sessionId];
        if (!session) return;
        
        const title = generateAutoTitle(session);
        get().updateSession(sessionId, { title });
      },
      
      // Onboarding
      setOnboardingStep: (step) => {
        set({ onboardingStep: step });
      },
      
      updateContextSnapshot: (sessionId, snapshot) => {
        set((s) => {
          const session = s.sessions.byId[sessionId];
          if (!session) return s;
          
          return {
            sessions: {
              ...s.sessions,
              byId: {
                ...s.sessions.byId,
                [sessionId]: {
                  ...session,
                  contextSnapshot: { ...session.contextSnapshot, ...snapshot },
                  updatedAt: Date.now(),
                },
              },
            },
          };
        });
      },
      
      // Inline Setup
      openInlineSetup: () => set({ inlineSetupOpen: true }),
      closeInlineSetup: () => set({ inlineSetupOpen: false }),
      
      // Toasts
      addToast: (toast) => {
        const id = `toast_${Date.now()}`;
        set((s) => ({
          toastQueue: [...s.toastQueue, { ...toast, id }],
        }));
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          get().removeToast(id);
        }, 5000);
      },
      
      removeToast: (id) => {
        set((s) => ({
          toastQueue: s.toastQueue.filter(t => t.id !== id),
        }));
      },
      
      // Helpers
      getActiveSession: () => {
        const { activeSessionId, sessions } = get();
        if (!activeSessionId) return null;
        return sessions.byId[activeSessionId] || null;
      },
      
      getRecentSessions: () => {
        const { sessions } = get();
        return sessions.recentIds
          .map(id => sessions.byId[id])
          .filter(Boolean);
      },
      
      isExecutionAction: (actionType) => {
        return EXECUTION_ACTIONS.includes(actionType as ExecutionActionType);
      },
      
      // Linking
      linkDocToSession: (sessionId, docId) => {
        set((s) => {
          const session = s.sessions.byId[sessionId];
          if (!session) return s;
          
          return {
            sessions: {
              ...s.sessions,
              byId: {
                ...s.sessions.byId,
                [sessionId]: {
                  ...session,
                  linkedDocIds: [...new Set([...session.linkedDocIds, docId])],
                  updatedAt: Date.now(),
                },
              },
            },
          };
        });
      },
      
      linkProjectToSession: (sessionId, projectId) => {
        get().updateSession(sessionId, { linkedProjectId: projectId });
        set({ activeProjectId: projectId });
      },
      
      // Metrics
      incrementMetric: (sessionId, metric) => {
        set((s) => {
          const session = s.sessions.byId[sessionId];
          if (!session) return s;
          
          return {
            sessions: {
              ...s.sessions,
              byId: {
                ...s.sessions.byId,
                [sessionId]: {
                  ...session,
                  metrics: {
                    ...session.metrics,
                    [metric]: session.metrics[metric] + 1,
                  },
                  updatedAt: Date.now(),
                },
              },
            },
          };
        });
      },
    }),
    {
      name: 'kbeauty-session-store',
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        activeProjectId: state.activeProjectId,
        layoutMode: state.layoutMode,
      }),
    }
  )
);

// ============ Status Badge Helpers ============
export function getStatusBadgeStyle(status: SessionStatus): { label: string; className: string } {
  switch (status) {
    case 'draft':
      return { label: '초안', className: 'bg-muted text-muted-foreground' };
    case 'running':
      return { label: '진행중', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
    case 'blocked':
      return { label: '막힘', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    case 'done':
      return { label: '완료', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    case 'failed':
      return { label: '실패', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
    default:
      return { label: '알 수 없음', className: 'bg-muted text-muted-foreground' };
  }
}

export function getPresetBadgeStyle(preset: PresetLabel): { className: string } {
  switch (preset) {
    case '첫제안':
      return { className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
    case '샘플':
      return { className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' };
    case '본오더':
      return { className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' };
    default:
      return { className: 'bg-muted text-muted-foreground' };
  }
}
