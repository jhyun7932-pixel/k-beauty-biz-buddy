-- ============================================================
-- Create: ai_chat_messages — AI 채팅 히스토리 영구 저장
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content       TEXT        NOT NULL DEFAULT '',
  is_doc_output BOOLEAN     NOT NULL DEFAULT FALSE,
  doc_summary   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.ai_chat_messages IS 'AI 무역비서 채팅 히스토리. 사용자별로 대화 내역을 영구 보관합니다.';

CREATE INDEX IF NOT EXISTS idx_ai_chat_user_created
  ON public.ai_chat_messages(user_id, created_at);

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 메시지만 조회
CREATE POLICY "chat: 본인 SELECT"
  ON public.ai_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: 본인 user_id로만 삽입
CREATE POLICY "chat: 본인 INSERT"
  ON public.ai_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 본인 메시지만 삭제 (히스토리 초기화용)
CREATE POLICY "chat: 본인 DELETE"
  ON public.ai_chat_messages FOR DELETE
  USING (auth.uid() = user_id);
