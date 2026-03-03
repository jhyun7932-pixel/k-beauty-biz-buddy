// 메인 페이지 - 좌측 채팅 + 우측 문서 패널 통합

import { useEffect } from "react";
import { useStreamingChat } from "../hooks/useStreamingChat";
import { useAuth } from "../hooks/useAuth";
import { useBuyers } from "../hooks/useBuyers";
import { useProducts } from "../hooks/useProducts";
import { useAppStore } from "../stores/appStore";
import { useTradeStore } from "../stores/tradeStore";
import ChatPanel from "../components/chat/ChatPanel";
import RightPanel from "../components/panels/RightPanel";

export default function HomePage() {
  const { user } = useAuth();
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
  // user가 null이면 이 effect는 스킵됨.
  // user가 null→User로 전환되면 sendMessage 참조도 바뀌므로 effect 재실행.
  const pendingAgentMessage = useTradeStore((s) => s.pendingAgentMessage);
  const setPendingAgentMessage = useTradeStore((s) => s.setPendingAgentMessage);

  useEffect(() => {
    if (!pendingAgentMessage || !user || isStreaming) return;

    const msg = pendingAgentMessage;
    setPendingAgentMessage(null);

    console.log("[DealRoom] user ready, sending:", msg.slice(0, 60));
    sendMessage(msg);
  }, [pendingAgentMessage, user, isStreaming, sendMessage, setPendingAgentMessage]);

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
