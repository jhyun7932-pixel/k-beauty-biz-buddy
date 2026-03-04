// 메인 페이지 - 좌측 채팅 + 우측 문서 패널 통합

import { useEffect } from "react";
import { useStreamingChat } from "../hooks/useStreamingChat";
import { useBuyers } from "../hooks/useBuyers";
import { useProducts } from "../hooks/useProducts";
import { useAppStore } from "../stores/appStore";
import ChatPanel from "../components/chat/ChatPanel";
import RightPanel from "../components/panels/RightPanel";
import { useTradeStore } from "../stores/tradeStore";

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

  const pendingAutoMessage = useTradeStore((s) => s.pendingAutoMessage);
  const setPendingAutoMessage = useTradeStore((s) => s.setPendingAutoMessage);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 딜룸에서 저장된 pendingAutoMessage를 streamPhase가 준비되면 전송
  useEffect(() => {
    if (!pendingAutoMessage) return;
    const phase = streamPhase ?? "idle";
    if (!["idle", "complete", "error"].includes(phase)) return;

    const msg = pendingAutoMessage;
    setPendingAutoMessage(null);

    console.log("[DealRoom] sending:", msg.slice(0, 30));
    sendMessage(msg);
  }, [pendingAutoMessage, streamPhase, sendMessage, setPendingAutoMessage]);

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
