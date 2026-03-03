// 메인 페이지 - 좌측 채팅 + 우측 문서 패널 통합

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

  const location = useLocation();
  const navigate = useNavigate();
  const { buyers } = useBuyers();
  const { loadProducts } = useProducts();
  const productEntries = useAppStore((s) => s.productEntries);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 딜룸에서 URL 파라미터로 전달된 AI 요청 처리
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (!q) return;
    if (typeof sendMessage !== 'function') return;

    // 1. q값 즉시 로컬 변수에 저장 (URL 변경과 무관)
    const message = decodeURIComponent(q);

    // 2. URL 클린업 (히스토리 교체)
    navigate('/home', { replace: true });

    // 3. 다음 틱에 sendMessage 실행
    //    (navigate의 리렌더링과 충돌 방지)
    setTimeout(() => {
      console.log('[DealRoom] URL param received, sending:', message.slice(0, 30));
      sendMessage(message);
    }, 100);
  }, [location.search]);

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
