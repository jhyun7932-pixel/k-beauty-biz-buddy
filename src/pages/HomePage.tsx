// 메인 페이지 - 좌측 채팅 + 우측 문서 패널 통합

import { useEffect } from "react";
import { useStreamingChat } from "../hooks/useStreamingChat";
import { useBuyers } from "../hooks/useBuyers";
import { useProducts } from "../hooks/useProducts";
import { useAppStore } from "../stores/appStore";
import ChatPanel from "../components/chat/ChatPanel";
import RightPanel from "../components/panels/RightPanel";

// 모듈 스코프 싱글턴 - HMR 재로드 시에도 모듈 캐시에 유지됨
let _dealRoomPendingMsg: string | null = null;

export function setDealRoomMessage(msg: string) {
  _dealRoomPendingMsg = msg;
}

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

  // 마운트 시 URL에서 q 추출 → 모듈 변수에 저장
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      _dealRoomPendingMsg = decodeURIComponent(q);
      window.history.replaceState({}, '', '/home');
    }
  }, []);

  // sendMessage 준비 완료 시 전송
  useEffect(() => {
    if (!_dealRoomPendingMsg) return;
    if (typeof sendMessage !== 'function') return;

    const msg = _dealRoomPendingMsg;
    _dealRoomPendingMsg = null;

    // sendMessage가 완전히 준비된 후 실행 보장
    const timer = setTimeout(() => {
      console.log('[DealRoom] sending (final):', msg.slice(0, 30));
      sendMessage(msg);
    }, 300);

    return () => clearTimeout(timer);
  }, [sendMessage]);

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
