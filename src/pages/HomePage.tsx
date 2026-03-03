// 메인 페이지 - 좌측 채팅 + 우측 문서 패널 통합

import { useEffect } from "react";
import { useStreamingChat } from "../hooks/useStreamingChat";
import { useBuyers } from "../hooks/useBuyers";
import { useProducts } from "../hooks/useProducts";
import { useAppStore } from "../stores/appStore";
import { useTradeStore } from "../stores/tradeStore";
import ChatPanel from "../components/chat/ChatPanel";
import RightPanel from "../components/panels/RightPanel";

// 모듈 스코프 플래그 — HMR 리로드·StrictMode 이중실행·리마운트 모두 방어
let dealRoomSentFlag = false;

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

  // useBuyers auto-fetches on mount if authenticated
  const { buyers } = useBuyers();
  const { loadProducts } = useProducts();
  const productEntries = useAppStore((s) => s.productEntries);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 딜룸에서 전달된 pendingAgentMessage 자동 전송 (Zustand store 경유)
  const pendingAgentMessage = useTradeStore((s) => s.pendingAgentMessage);
  const setPendingAgentMessage = useTradeStore((s) => s.setPendingAgentMessage);

  useEffect(() => {
    if (dealRoomSentFlag) return;
    if (!pendingAgentMessage) return;
    if (typeof sendMessage !== "function") return;

    // 전송 전 즉시 store 클리어 + 모듈 플래그 (재진입 완전 차단)
    dealRoomSentFlag = true;
    const msg = pendingAgentMessage;
    setPendingAgentMessage(null);

    console.log("[DealRoom] sending (once):", msg.slice(0, 60));

    // rAF로 DOM 안정화 후 1회만 전송
    requestAnimationFrame(() => {
      sendMessage(msg);
      // 5초 후 플래그 리셋 (다음 딜룸 요청을 위해)
      setTimeout(() => { dealRoomSentFlag = false; }, 5000);
    });
  }, [pendingAgentMessage]); // sendMessage 의존성 제거 — 재트리거 방지

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
