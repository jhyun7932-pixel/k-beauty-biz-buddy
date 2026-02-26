// FLONIX Trade Assistant API Types
// SSE 제거 — Claude JSON 응답 방식으로 전환 완료
// 실제 호출은 useStreamingChat.ts에서 수행

export interface ToolCall {
  id: string;
  name: 'update_document_field' | 'generate_document';
  arguments: {
    field_path?: string;
    new_value?: string;
    template_key?: string;
    preset?: string;
    reason: string;
  };
}
