// 메인 페이지 - 좌측 채팅 + 우측 문서 패널 통합

import { useEffect } from "react";
import { useStreamingChat } from "../hooks/useStreamingChat";
import { useBuyers } from "../hooks/useBuyers";
import { useProducts } from "../hooks/useProducts";
import { useAppStore } from "../stores/appStore";
import { useTradeStore } from "../stores/tradeStore";
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
    if (!pendingAgentMessage) return;
    if (typeof sendMessage !== "function") return;

    // sessionStorage 원자적 잠금: HMR 모듈 재로드에도 유지됨
    const LOCK_KEY = "flonix_dealroom_sending";
    if (sessionStorage.getItem(LOCK_KEY)) {
      console.log("[DealRoom] already sending, skip");
      setPendingAgentMessage(null);
      return;
    }

    // 잠금 설정 (3초 후 자동 해제)
    sessionStorage.setItem(LOCK_KEY, "1");
    setTimeout(() => sessionStorage.removeItem(LOCK_KEY), 3000);

    const msg = pendingAgentMessage;
    setPendingAgentMessage(null);

    console.log("[DealRoom] sending (locked):", msg.slice(0, 60));

    requestAnimationFrame(() => {
      sendMessage(msg);
    });
  }, [pendingAgentMessage]);

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
