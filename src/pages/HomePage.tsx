// 메인 페이지 - 좌측 채팅 + 우측 문서 패널 통합

import { useEffect } from "react";
import { useStreamingChat } from "../hooks/useStreamingChat";
import { useBuyers } from "../hooks/useBuyers";
import { useProducts } from "../hooks/useProducts";
import { useAppStore } from "../stores/appStore";
import ChatPanel from "../components/chat/ChatPanel";
import RightPanel from "../components/panels/RightPanel";
import { consumeDealRoomMessage } from "@/lib/dealRoomBridge";

export default function HomePage() {
  const {
    sendMessage,
    cancelStream,
    isStreaming,
    streamPhase,
    messages,
    streamingText,
    rightPanelOpen,
    errorMessage,
  } = useStreamingChat();

  const { buyers } = useBuyers();
  const { loadProducts } = useProducts();
  const productEntries = useAppStore((s) => s.productEntries);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 마운트 시 URL fallback 클린업
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      window.history.replaceState({}, '', '/home');
    }
  }, []);

  // sendMessage 준비 완료 시 bridge에서 꺼내 전송
  // streamPhase가 undefined→"idle"로 바뀌는 순간 자동 재실행됨
  useEffect(() => {
    if (typeof sendMessage !== 'function') return;
    const phase = streamPhase ?? "idle";
    if (!["idle", "complete", "error"].includes(phase)) return;

    const msg = consumeDealRoomMessage();
    if (!msg) return;

    console.log('[DealRoom] sending:', msg.slice(0, 30));
    sendMessage(msg);
  }, [sendMessage, streamPhase]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ChatPanel
        messages={messages}
        currentStreamingText={streamingText}
        isStreaming={isStreaming}
        phase={streamPhase}
        error={errorMessage}
        onSendMessage={sendMessage}
        onCancel={cancelStream}
        buyers={buyers}
        productEntries={productEntries}
      />
      <RightPanel />
    </div>
  );
}
