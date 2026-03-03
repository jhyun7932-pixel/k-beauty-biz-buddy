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

    // streamPhase가 idle/complete/error 일 때만 전송 가능
    // (sendMessage 내부에서도 체크하지만, 여기서 명시적으로 대기)
    if (!["idle", "complete", "error"].includes(streamPhase)) return;

    const msg = pendingAgentMessage;
    setPendingAgentMessage(null);

    console.log("[DealRoom] pendingAgentMessage detected:", msg.slice(0, 60));
    console.log("[DealRoom] streamPhase:", streamPhase, "sendMessage:", typeof sendMessage);

    // sendMessage 내부에서 user 체크 → user가 아직 null이면 실패
    // 그 경우 다시 store에 복원하여 다음 렌더에서 재시도
    const timer = setTimeout(() => {
      console.log("[DealRoom] calling sendMessage...");
      sendMessage(msg);

      // sendMessage 호출 후 streamPhase가 바뀌지 않으면 user가 null이었던 것
      // 50ms 후 체크해서 복원
      setTimeout(() => {
        const phase = useTradeStore.getState().streamPhase;
        if (phase === "idle" || phase === "complete" || phase === "error") {
          // 아직 idle이면 전송 실패 → 복원하여 재시도
          console.log("[DealRoom] sendMessage may have failed (phase still:", phase, "), restoring...");
          setPendingAgentMessage(msg);
        } else {
          console.log("[DealRoom] sendMessage succeeded (phase:", phase, ")");
        }
      }, 50);
    }, 100);

    return () => clearTimeout(timer);
  }, [pendingAgentMessage, streamPhase, sendMessage, setPendingAgentMessage]);

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
