# FLONIX 개발 정책

> 이 파일은 Claude Code 및 모든 개발자가 반드시 준수해야 할 프로젝트 정책입니다.

---

## 브랜치 전략

| 브랜치 | 역할 | 규칙 |
|--------|------|------|
| `main` | 프로덕션 배포용 | **직접 Push 절대 금지** — PR + 코드리뷰 후 머지만 허용 |
| `develop` | 개발 통합 브랜치 | 일상적 개발은 여기서 진행 |
| `feature/기능명` | 새 기능 개발 | `develop`에서 분기, 완료 후 `develop`으로 PR |
| `hotfix/이슈명` | 긴급 버그 수정 | `main`에서 분기, `main`+`develop` 양쪽 머지 |

### 브랜치 워크플로우
```
main ←── (PR + review) ←── develop ←── feature/기능명
 ↑                              ↑
hotfix/이슈명 ─────────────────┘
```

---

## DB 변경 정책

- **Supabase 대시보드에서 직접 SQL 실행 금지**
- 반드시 `supabase/migrations/` 폴더에 마이그레이션 파일 생성 후 적용
- 파일명 형식: `YYYYMMDDHHMMSS_변경내용.sql`
  - 예: `20260224120000_add_ai_chat_messages.sql`
- 마이그레이션 적용 명령: `supabase db push`

---

## 보안 정책

### 환경변수
- **API 키/비밀번호 코드 하드코딩 절대 금지**
- 프론트엔드 환경변수: `VITE_` 접두사, `.env.local` 파일 사용
- Edge Function secrets: `Deno.env.get()` + `supabase secrets set`
- `.env` 파일은 **절대 GitHub에 Push 금지** (`.gitignore`에 등록됨)
- 팀 합류 시 `.env.example`을 참고해 `.env.local` 직접 생성

### Edge Function 보안
- `ANTHROPIC_API_KEY` → Supabase Vault: `supabase secrets set ANTHROPIC_API_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY` → Edge Function에서만 사용, 프론트엔드 노출 금지

---

## AI 모델 정책

| 항목 | 값 |
|------|-----|
| 메인 AI 모델 | `claude-sonnet-4-5` (Anthropic) |
| SDK | `@anthropic-ai/sdk` (esm.sh 경유) |

- 모델명 변경 시 **전체 팀 합의 필요** + 이 문서 업데이트
- 모델 관련 파일: `supabase/functions/trade-assistant/index.ts`

---

## Edge Function 배포

```bash
# 단일 함수 배포
supabase functions deploy trade-assistant

# 전체 함수 목록 확인
supabase functions list
```

현재 배포된 함수 (9개):
- `trade-assistant` — 메인 AI 채팅 (Claude claude-sonnet-4-5 JSON 응답)
- `ocr-extract` — 이미지 OCR
- `generate-email` — 이메일 생성
- `share-package` — 공유 패키지
- `rulepack-crawler` — 규제 정보 크롤링
- `create-partner-account` — 파트너 계정 생성
- `manage-user-role` — 사용자 권한 관리
- `approve-rulepack-update` — 규제 업데이트 승인
- `notify-status-change` — 상태 변경 알림

---

## 프로젝트 구조 요약

```
src/
├── components/
│   ├── panels/RightPanel.tsx     # AI 문서 우측 패널 (PI/CI/PL/NDA/SC/Compliance)
│   ├── chat/ChatPanel.tsx        # 채팅 UI
│   └── layout/LeftDockNew.tsx    # 좌측 네비게이션
├── stores/streamingStore.ts      # Zustand SSE 스트리밍 상태
├── hooks/useStreamingChat.ts     # SSE 스트리밍 훅
├── lib/export/exportDocument.ts  # PDF/DOCX 내보내기 유틸
└── pages/HomePage.tsx            # 메인 홈 (채팅 + 우측 패널)

supabase/
├── functions/trade-assistant/    # 메인 AI Edge Function
└── migrations/                   # DB 스키마 변경 이력
```

---

## 코딩 컨벤션

- **TypeScript strict 모드** 유지
- Tailwind CSS 클래스 사용 (인라인 style 최소화)
- Zustand store slice 패턴 유지
- SSE 이벤트 타입: `text_delta`, `tool_call_start`, `tool_call_delta`, `tool_call_end`, `phase2_start`, `text_delta_phase2`, `stream_end`, `error`
