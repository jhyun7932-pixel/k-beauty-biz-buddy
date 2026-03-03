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

  const { buyers } = useBuyers();
  const { loadProducts } = useProducts();
  const productEntries = useAppStore((s) => s.productEntries);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 딜룸 → 에이전트 홈 자동 전송
  // consumePendingAgentMessage()는 원자적: 첫 호출만 msg 반환, 이후 null.
  // HMR이 4번 마운트해도 store 싱글턴이므로 1번만 처리됨.
  const consumePendingAgentMessage = useTradeStore((s) => s.consumePendingAgentMessage);

  useEffect(() => {
    const msg = consumePendingAgentMessage();
    if (!msg) return;

    console.log("[DealRoom] consumed once:", msg.slice(0, 60));
    requestAnimationFrame(() => sendMessage(msg));
  }, []); // 마운트 1회만

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
