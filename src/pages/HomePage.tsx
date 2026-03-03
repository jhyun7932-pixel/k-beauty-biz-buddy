// 메인 페이지 - 좌측 채팅 + 우측 문서 패널 통합

import { useEffect, useRef } from "react";
import { useStreamingChat } from "../hooks/useStreamingChat";
import { useBuyers } from "../hooks/useBuyers";
import { useProducts } from "../hooks/useProducts";
import { useAppStore } from "../stores/appStore";
import ChatPanel from "../components/chat/ChatPanel";
import RightPanel from "../components/panels/RightPanel";

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

  const dealRoomMsgRef = useRef<string | null>(null);

  // STEP 1: 마운트 시 URL에서 q값 추출 → ref에 저장 + URL 클린업
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (!q) return;

    dealRoomMsgRef.current = decodeURIComponent(q);

    // URL 즉시 클린업 (React navigate 없이 직접 히스토리 교체 → 리렌더링 없음)
    window.history.replaceState({}, '', '/home');
  }, []); // 마운트 1회만

  // STEP 2: sendMessage 준비되면 ref에서 꺼내 전송
  useEffect(() => {
    if (!dealRoomMsgRef.current) return;
    if (typeof sendMessage !== 'function') return;

    const message = dealRoomMsgRef.current;
    dealRoomMsgRef.current = null; // 소비 후 즉시 초기화 → 중복 전송 방지

    console.log('[DealRoom] sending:', message.slice(0, 30));
    sendMessage(message);
  }, [sendMessage]); // sendMessage가 준비됐을 때 실행

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
