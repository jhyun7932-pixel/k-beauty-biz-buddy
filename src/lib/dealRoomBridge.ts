// 딜룸 → 에이전트 홈 메시지 브릿지
// 컴포넌트 파일 외부에 분리하여 Vite Fast Refresh 호환성 보장

let _sendMessageFn: ((msg: string) => void) | null = null;
let _pendingMessage: string | null = null;

/** HomePage가 마운트될 때 sendMessage 함수를 등록 */
export function registerSendMessage(fn: (msg: string) => void) {
  _sendMessageFn = fn;
  // 대기 중인 메시지가 있으면 즉시 전송
  if (_pendingMessage && _sendMessageFn) {
    const msg = _pendingMessage;
    _pendingMessage = null;
    setTimeout(() => _sendMessageFn?.(msg), 0);
  }
}

/** HomePage 언마운트 시 해제 */
export function unregisterSendMessage() {
  _sendMessageFn = null;
}

/** 딜룸 버튼 클릭 시 호출 */
export function triggerDealRoomMessage(msg: string) {
  if (_sendMessageFn) {
    // sendMessage 준비됨 → 즉시 전송
    setTimeout(() => _sendMessageFn?.(msg), 0);
  } else {
    // 아직 준비 안 됨 → 대기열에 저장
    _pendingMessage = msg;
  }
}
