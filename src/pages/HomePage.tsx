// 메인 페이지 - 좌측 채팅 + 우측 문서 패널 통합

import { useStreamingChat } from "../hooks/useStreamingChat";
import ChatPanel from "../components/chat/ChatPanel";
import RightPanel from "../components/panels/RightPanel";

export default function HomePage() {
  const {
    sendMessage,
    cancelStreaming,
    isStreaming,
    phase,
    messages,
    currentStreamingText,
    currentPhase2Text,
    rightPanelOpen,
    error,
  } = useStreamingChat();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ChatPanel
        messages={messages}
        currentStreamingText={currentStreamingText}
        currentPhase2Text={currentPhase2Text}
        isStreaming={isStreaming}
        phase={phase}
        error={error}
        onSendMessage={sendMessage}
        onCancel={cancelStreaming}
      />
      <RightPanel />
    </div>
  );
}
