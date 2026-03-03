// 메인 페이지 - 좌측 채팅 + 우측 문서 패널 통합

import { useEffect, useRef } from "react";
import { useStreamingChat } from "../hooks/useStreamingChat";
import { useAuth } from "../hooks/useAuth";
import { useBuyers } from "../hooks/useBuyers";
import { useProducts } from "../hooks/useProducts";
import { useAppStore } from "../stores/appStore";
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

  // 딜룸에서 전달된 컨텍스트 자동 전송
  // 1단계: 마운트 시 localStorage 읽어서 ref에 보관
  const pendingDealRoomMsg = useRef<string | null>(null);
  useEffect(() => {
    const ctx = localStorage.getItem("deal_room_context");
    if (!ctx) return;
    localStorage.removeItem("deal_room_context");
    try {
      const parsed = JSON.parse(ctx);
      if (parsed.auto_message) {
        pendingDealRoomMsg.current = parsed.auto_message;
        console.log("[DealRoom] context loaded:", parsed.auto_message.slice(0, 60));
      }
    } catch (e) {
      console.error("[DealRoom] parse error:", e);
    }
  }, []);

  // 2단계: user가 로드되면 전송 (user=null→User 전환 시 이 effect 재실행)
  useEffect(() => {
    if (!user || !pendingDealRoomMsg.current) return;
    const msg = pendingDealRoomMsg.current;
    pendingDealRoomMsg.current = null;

    console.log("[DealRoom] user ready, auto-sending:", msg.slice(0, 60));
    console.log("[DealRoom] sendMessage type:", typeof sendMessage);
    const timer = setTimeout(() => {
      console.log("[DealRoom] calling sendMessage...");
      sendMessage(msg);
    }, 100);
    return () => clearTimeout(timer);
  }, [user, sendMessage]);

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
