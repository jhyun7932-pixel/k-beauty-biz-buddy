// 메인 페이지 - 좌측 채팅 + 우측 문서 패널 통합

import { useEffect } from "react";
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

  // useBuyers auto-fetches on mount if authenticated
  const { buyers } = useBuyers();
  const { loadProducts } = useProducts();
  const productEntries = useAppStore((s) => s.productEntries);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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
