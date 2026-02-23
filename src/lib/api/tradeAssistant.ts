import { supabase } from '@/integrations/supabase/client';

type Message = { role: 'user' | 'assistant'; content: string };

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

export interface StreamChatOptions {
  messages: Message[];
  context?: {
    products?: any[];
    deal?: any;
    targetCountry?: string;
    activeDoc?: {
      docId: string;
      templateKey: string;
      status: string;
      fields: Record<string, any>;
    };
  };
  onDelta: (deltaText: string) => void;
  onToolCalls?: (toolCalls: ToolCall[]) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export async function streamTradeAssistant({
  messages,
  context,
  onDelta,
  onToolCalls,
  onDone,
  onError,
}: StreamChatOptions) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trade-assistant`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ messages, context }),
    });

    if (!response.ok || !response.body) {
      if (response.status === 429) {
        onError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      if (response.status === 402) {
        onError('AI 크레딧이 부족합니다.');
        return;
      }
      const errorData = await response.json().catch(() => ({}));
      onError(errorData.error || 'AI 서비스에 연결할 수 없습니다.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);

          // Check for custom tool_calls event from our edge function
          if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
            onToolCalls?.(parsed.tool_calls as ToolCall[]);
            continue;
          }

          // Standard SSE delta content
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          // Incomplete JSON, put back and wait
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);

          if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
            onToolCalls?.(parsed.tool_calls as ToolCall[]);
            continue;
          }

          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (error) {
    console.error('Stream error:', error);
    onError('네트워크 오류가 발생했습니다.');
  }
}
