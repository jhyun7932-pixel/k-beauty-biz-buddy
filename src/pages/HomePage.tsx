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

  // useBuyers auto-fetches on mount if authenticated
  const { buyers } = useBuyers();
  const { loadProducts } = useProducts();
  const productEntries = useAppStore((s) => s.productEntries);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 딜룸에서 전달된 컨텍스트 자동 전송
  const dealRoomHandled = useRef(false);
  useEffect(() => {
    if (dealRoomHandled.current) return;
    const ctx = localStorage.getItem("deal_room_context");
    if (!ctx) return;

    dealRoomHandled.current = true;
    localStorage.removeItem("deal_room_context");

    try {
      const parsed = JSON.parse(ctx);
      if (parsed.auto_message) {
        // 마운트 완료 후 자동 전송
        setTimeout(() => {
          sendMessage(parsed.auto_message);
        }, 300);
      }
    } catch (e) {
      console.error("deal_room_context parse error:", e);
    }
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
