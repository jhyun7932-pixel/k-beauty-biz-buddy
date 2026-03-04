// 딜룸 → 에이전트 홈 메시지 브릿지
// 컴포넌트 파일 외부에 분리하여 Vite Fast Refresh 호환성 보장

let _pendingMessage: string | null = null;

export function setDealRoomMessage(msg: string) {
  _pendingMessage = msg;
}

export function consumeDealRoomMessage(): string | null {
  const msg = _pendingMessage;
  _pendingMessage = null;
  return msg;
}

export function hasDealRoomMessage(): boolean {
  return _pendingMessage !== null;
}
