// Next Action Cards - AI 응답 후 상황별 다음 행동 추천

export interface NextAction {
  id: string;
  icon: string;
  label: string;
  message: string;
}

export type ResponseContext =
  | "PI_COMPLETE"
  | "CI_COMPLETE"
  | "PL_COMPLETE"
  | "NDA_COMPLETE"
  | "SC_COMPLETE"
  | "COMPLIANCE_PASS"
  | "COMPLIANCE_FAIL"
  | "EMAIL_COMPLETE"
  | "GENERAL_RESPONSE";

/** toolCall 정보 + 응답 텍스트로 응답 컨텍스트 추론 */
export function detectResponseContext(
  toolCallName?: string,
  docType?: string | null,
  completedArgs?: Record<string, unknown> | null,
  responseText?: string,
): ResponseContext {
  if (toolCallName === "check_compliance") {
    const overall = completedArgs?.overall_status as string | undefined;
    return overall === "PASS" ? "COMPLIANCE_PASS" : "COMPLIANCE_FAIL";
  }

  if (toolCallName === "generate_document" || toolCallName === "generate_trade_document") {
    const dt = (completedArgs?.document_type as string) || docType;
    switch (dt) {
      case "PI": return "PI_COMPLETE";
      case "CI": return "CI_COMPLETE";
      case "PL": return "PL_COMPLETE";
      case "NDA": return "NDA_COMPLETE";
      case "SALES_CONTRACT": return "SC_COMPLETE";
    }
  }

  // 이메일 감지: 응답 텍스트에 이메일 키워드 + 문서 생성 아닌 경우
  if (responseText && /이메일|email|메일/i.test(responseText) && !toolCallName) {
    return "EMAIL_COMPLETE";
  }

  return "GENERAL_RESPONSE";
}

/** 컨텍스트별 추천 액션 배열 반환 */
export function getNextActions(context: ResponseContext): NextAction[] {
  const ACTIONS: Record<ResponseContext, NextAction[]> = {
    PI_COMPLETE: [
      { id: "pi-email", icon: "📧", label: "PI 발송 이메일 작성", message: "방금 만든 PI를 바이어에게 보내는 이메일을 작성해줘" },
      { id: "pi-pl", icon: "📦", label: "PL 생성", message: "같은 내용으로 Packing List도 생성해줘" },
      { id: "pi-ci", icon: "📋", label: "CI 생성", message: "같은 내용으로 Commercial Invoice도 생성해줘" },
      { id: "pi-compliance", icon: "🔍", label: "수출 규제 확인", message: "이 제품의 수출 규제 적합성을 확인해줘" },
    ],
    CI_COMPLETE: [
      { id: "ci-pl", icon: "📦", label: "PL 생성", message: "같은 내용으로 Packing List도 생성해줘" },
      { id: "ci-email", icon: "📧", label: "CI 발송 이메일", message: "CI를 바이어에게 보내는 이메일을 작성해줘" },
      { id: "ci-nda", icon: "📝", label: "NDA 작성", message: "이 바이어와의 NDA를 작성해줘" },
    ],
    PL_COMPLETE: [
      { id: "pl-email", icon: "📧", label: "PL 발송 이메일", message: "Packing List를 바이어에게 보내는 이메일을 작성해줘" },
      { id: "pl-ci", icon: "📋", label: "CI 생성", message: "같은 내용으로 Commercial Invoice도 생성해줘" },
      { id: "pl-shipping", icon: "🚢", label: "선적 가이드", message: "이 화물의 선적 절차와 필요 서류를 안내해줘" },
    ],
    NDA_COMPLETE: [
      { id: "nda-email", icon: "📧", label: "NDA 발송 이메일", message: "NDA를 바이어에게 보내는 이메일을 작성해줘" },
      { id: "nda-pi", icon: "📄", label: "PI 작성", message: "이 바이어에게 보낼 PI를 작성해줘" },
      { id: "nda-contract", icon: "📑", label: "매매계약서 작성", message: "이 바이어와의 매매계약서를 작성해줘" },
    ],
    SC_COMPLETE: [
      { id: "sc-email", icon: "📧", label: "계약서 발송 이메일", message: "매매계약서를 바이어에게 보내는 이메일을 작성해줘" },
      { id: "sc-pi", icon: "📄", label: "PI 작성", message: "이 계약 내용으로 PI를 작성해줘" },
      { id: "sc-compliance", icon: "🔍", label: "수출 규제 확인", message: "이 제품의 수출 규제를 확인해줘" },
    ],
    COMPLIANCE_PASS: [
      { id: "comp-pi", icon: "📄", label: "PI 작성", message: "규제를 통과한 이 제품으로 PI를 작성해줘" },
      { id: "comp-email", icon: "📧", label: "통과 안내 메일", message: "규제 적합 결과를 바이어에게 안내하는 이메일을 작성해줘" },
      { id: "comp-other", icon: "🌍", label: "다른 국가도 확인", message: "이 제품을 다른 국가로 수출할 때의 규제도 확인해줘" },
    ],
    COMPLIANCE_FAIL: [
      { id: "compf-guide", icon: "✏️", label: "성분 수정 가이드", message: "규제 위반 성분을 수정하는 방법을 알려줘" },
      { id: "compf-email", icon: "📧", label: "검토 요청 메일", message: "성분 수정 검토 요청 이메일을 작성해줘" },
      { id: "compf-other", icon: "🌍", label: "다른 국가 확인", message: "이 제품을 다른 국가로 수출할 때의 규제를 확인해줘" },
      { id: "compf-alt", icon: "🔄", label: "대체 성분 추천", message: "규제 위반 성분의 대체 성분을 추천해줘" },
    ],
    EMAIL_COMPLETE: [
      { id: "email-gmail", icon: "📨", label: "Gmail 발송", message: "이 이메일을 Gmail로 발송해줘" },
      { id: "email-template", icon: "💾", label: "템플릿 저장", message: "이 이메일을 템플릿으로 저장해줘" },
      { id: "email-nda", icon: "📝", label: "NDA 첨부", message: "이 이메일에 첨부할 NDA를 작성해줘" },
    ],
    GENERAL_RESPONSE: [],
  };

  return ACTIONS[context] || [];
}
