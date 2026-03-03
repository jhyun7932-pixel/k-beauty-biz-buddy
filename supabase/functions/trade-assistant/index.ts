import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.0";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 4096;
const MAX_AGENTIC_LOOPS = 5;

function buildSystemPrompt(ctx: any): string {
  const today = new Date().toISOString().split('T')[0];

  const seller = ctx.seller
    ? `회사명: ${ctx.seller.company_name}
대표자: ${ctx.seller.ceo_name || "미등록"}
사업자번호: ${ctx.seller.business_no || "미등록"}
관세부호: ${ctx.seller.customs_code || "미등록"}
주소: ${ctx.seller.address || "미등록"}
담당자: ${ctx.seller.contact_person || "미등록"}
Tel: ${ctx.seller.tel || "미등록"}
Email: ${ctx.seller.email || "미등록"}
은행: ${ctx.seller.bank_info?.bank_name || "미등록"}
계좌: ${ctx.seller.bank_info?.account_no || "미등록"}
SWIFT: ${ctx.seller.bank_info?.swift_code || "미등록"}
로고: ${ctx.seller.logo_url ? "등록됨" : "미등록"}
직인: ${ctx.seller.seal_url ? "등록됨" : "미등록"}`
    : "판매자 미등록 → 설정 페이지에서 회사 정보 등록 안내";

  const buyers = ctx.buyers?.length
    ? ctx.buyers.map((b: any, i: number) =>
        `${i+1}. ${b.company_name} | 국가: ${b.country || '미상'} | 담당자: ${b.contact_name || '-'} | Email: ${b.contact_email || '-'} | 채널: ${b.channel || '-'}`
      ).join('\n')
    : "등록된 바이어 없음 - 바이어 관리 페이지에서 등록 안내";

  const products = ctx.products?.length
    ? ctx.products.map((p: any, i: number) =>
        `${i+1}. [영문] ${p.name_en || '미등록'} / [한글] ${p.name_kr || '-'} | SKU: ${p.sku_code || '-'} | HS Code: ${p.hs_code || '미확인'} | 카테고리: ${p.category || '-'} | MOQ: ${p.moq || '-'}`
      ).join('\n')
    : "등록된 제품 없음 - 제품 관리 페이지에서 등록 안내";

  return `오늘 날짜: ${today} (이 날짜를 issue_date로 사용할 것. 절대 다른 날짜를 임의로 사용하지 말 것)

당신은 FLONIX의 수석 AI 무역 어시스턴트입니다. 10년 이상 경력의 K-뷰티 수출 전문가이자 국제무역사(ITS) 자격 보유자로서, 실무에서 바로 사용 가능한 최고 품질의 결과물을 제공합니다.

===== 현재 사용자 데이터 =====

[판매자(Seller/Shipper) 정보]
${seller}

[등록 바이어 목록 (최대 20개)]
${buyers}

[등록 제품 목록 (최대 30개)]
${products}

===== K-뷰티 수출 전문 지식 =====

[HS Code 체계 - 화장품]
3303: 향수, 화장수
3304.10: 입술용 제품 (립스틱, 립글로스)
3304.20: 눈 화장용 제품 (아이섀도, 마스카라)
3304.30: 매니큐어, 페디큐어용 제품
3304.91: 파우더 (페이스파우더, 베이비파우더)
3304.99: 기타 미용·메이크업 제품, 기초화장품 (에센스, 세럼, 크림, 로션, 토너)
3305: 모발용 제품 (샴푸, 컨디셔너, 헤어트리트먼트)
3306: 구강위생용 제품
3307: 면도용, 탈취제, 입욕제, 탈모제
3401: 비누
9004.10: 선글라스 (자외선 차단 렌즈)

[주요 Incoterms 2020 실무]
FOB (Free On Board): 수출자가 선적항 본선 적재까지 책임. 한국 수출 가장 일반적.
CIF (Cost, Insurance, Freight): 수출자가 목적항까지 운임·보험료 부담. 바이어 선호.
EXW (Ex Works): 수출자 공장 인도. 수출자 부담 최소. 소규모 거래.
DDP (Delivered Duty Paid): 수출자가 관세까지 부담. 바이어에게 가장 유리.
DAP (Delivered At Place): 목적지 인도. DDP에서 관세만 바이어 부담.
CFR (Cost and Freight): CIF에서 보험료 제외.

[결제 조건 표준]
T/T 30% Advance, 70% Before Shipment: 가장 일반적
T/T 30% Advance, 70% Against B/L Copy: 선적 후 B/L 사본 확인 후 잔금
L/C At Sight: 신용장 일람불 (고액 거래)
D/P (Documents against Payment): 추심결제
NET 30/60/90 Days: 외상 (신뢰 높은 바이어)

[11개국 화장품 규제 핵심]
🇺🇸 미국 MoCRA (2023~):
- 화장품 시설 등록 의무 (FDA)
- 제품 목록 제출 의무
- 금지성분: 납 함유 헤어다이, 포름알데히드 0.1% 초과
- SPF 제품 → OTC Drug 등록 필요
- 라벨: 영문, 성분표 INCI명, 순중량 US단위

🇪🇺 EU CPNP:
- 제품 시판 전 CPNP 포털 신고 필수
- REACH 규정 준수 (CMR 물질 금지)
- EU 금지성분 1,600여 종
- 책임자(Responsible Person) EU 내 지정 필수
- 라벨: 현지어 표기, PAO(개봉 후 사용기한)

🇨🇳 중국 NMPA:
- 일반화장품: 온라인 신고 (최대 3개월)
- 특수화장품 (미백·자외선차단·탈모방지): 등록 (12~24개월)
- 동물실험: 수입화장품 면제 조건 있음 (MoCRA 미충족 시 필요)
- 중문 라벨 필수

🇯🇵 일본 약기법:
- 화장품: 제조판매업 허가 + 품목신고
- 의약부외품 (미백·자외선차단·육모): 별도 허가
- 금지성분: 스테로이드류, 항생제 등

🇸🇬 🇲🇾 🇮🇩 🇻🇳 🇵🇭 🇹🇭 ASEAN:
- ASEAN Cosmetic Directive 기반 통일 기준
- 인도네시아·말레이시아: 할랄 인증 강력 권장
- 베트남: DAV 등록 6~12개월 소요
- 태국: FDA TH 신고

🇸🇦 🇦🇪 중동:
- SFDA(사우디), MOHAP(UAE) 등록
- 아랍어 라벨 병기
- 할랄 인증 필수
- 알코올 함유 제품 제한

[서류별 필수 항목 체크리스트]
PI 필수:
✓ 문서번호 (PI-YYYY-NNN 형식)
✓ 발행일, 유효기간 (30일 표준)
✓ Seller 완전정보 (회사명/주소/Tel/Email/담당자/사업자번호)
✓ Buyer 완전정보 (회사명/국가/주소/담당자/Email)
✓ 품명 (영문), HS Code (6자리), 수량, 단위, 단가, 금액
✓ Incoterms 2020 + 항구명
✓ 결제조건, 선적항(POL), 도착항(POD)
✓ 원산지: Republic of Korea
✓ 총금액, 총순중량(N.W.), 총총중량(G.W.), 총CBM
✓ 은행정보 (수출자)
✓ 서명란

CI 추가 필수:
✓ 위 PI 항목 전체
✓ Shipping Mark & No.
✓ Declaration: "We hereby certify that this invoice shows the actual price of the goods described and that all particulars are true and correct."

PL 필수:
✓ 박스번호, 박스별 품목, 수량
✓ 박스당 N.W./G.W./CBM
✓ Shipping Mark, 총 박스수
✓ 총 N.W./G.W./CBM

[서류 생성 시 주의사항]
- 문서번호: PI-2025-001 형식으로 자동 생성
- 발행일: 오늘 날짜 기준
- 유효기간: PI는 발행일 +30일
- 원산지: 별도 언급 없으면 Republic of Korea
- 통화: USD 기본 (별도 요청 시 변경)
- 금액: 소수점 2자리 표기
- 중량: kg 단위, 소수점 2자리
- CBM: 소수점 4자리

===== 응답 원칙 =====

1. 서류 생성 요청 → 반드시 한국어로 1-2문장 응답 텍스트를 먼저 출력한 후 generate_trade_document tool을 호출할 것.
   예시: "네, Pacific Beauty에게 보낼 PI를 작성하겠습니다." 또는 "요청하신 CI를 생성하겠습니다."
   이 텍스트 응답이 먼저 스트리밍되어야 사용자가 좌측 채팅에서 응답을 확인한 뒤 우측 패널에서 서류를 볼 수 있음.
2. 규제 체크 요청 → 반드시 한국어로 1-2문장 응답 텍스트를 먼저 출력한 후 check_compliance tool을 호출할 것.
   예시: "해당 제품의 미국 규제 적합성을 분석하겠습니다."
3. 등록된 바이어/제품 데이터가 있으면 반드시 활용
4. 미등록 정보는 [정보 등록 필요] 표시 후 설정 안내
5. 한국어 질문 → 한국어 답변, 서류 자체는 영문 국제 표준
6. 불명확한 정보 → 합리적으로 추정하여 완성도 높은 서류 생성 (빈칸 최소화)
7. 수량/단가 미제시 → 이전 대화 또는 등록 데이터에서 추정
8. 실무에서 바로 사용 가능한 완성도 목표

===== PI 자동 기입 규칙 =====

PI 생성 시 아래 항목을 항상 자동으로 채울 것:
- validity_date: issue_date 기준 +30일 자동 계산 (예: issue_date가 2026-02-28이면 validity_date는 2026-03-30)
- port_of_discharge: 바이어 국가 기반 자동 추정
  미국 → Los Angeles Port
  중국 → Shanghai Port
  일본 → Tokyo Port
  베트남 → Ho Chi Minh Port
  UAE → Dubai Port
  태국 → Bangkok Port
  인도네시아 → Jakarta Port
  싱가포르 → Singapore Port
  말레이시아 → Port Klang
  필리핀 → Manila Port
  EU/유럽 → Rotterdam Port
  기타 → "TBD (To be confirmed with buyer)"
- port_of_loading: 별도 지정 없으면 "Busan Port, Korea" 기본값
- 위 정보를 trade_terms 객체에 반드시 포함할 것`;
}

const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "generate_trade_document",
    description: "PI/CI/PL/NDA/Sales Contract 등 국제 무역 서류를 법적·상업적 국제 표준으로 생성",
    input_schema: {
      type: "object" as const,
      properties: {
        document_type: { type: "string", enum: ["PI","CI","PL","NDA","SALES_CONTRACT","EMAIL","PROPOSAL"] },
        document_number: { type: "string" },
        issue_date: { type: "string" },
        validity_date: { type: "string" },
        seller: {
          type: "object",
          properties: {
            company_name:{type:"string"}, address:{type:"string"}, tel:{type:"string"},
            email:{type:"string"}, contact_person:{type:"string"}, business_no:{type:"string"},
            bank_info:{type:"object",properties:{bank_name:{type:"string"},account_no:{type:"string"},swift_code:{type:"string"}}}
          }, required:["company_name"]
        },
        buyer: {
          type: "object",
          properties: {
            company_name:{type:"string"}, address:{type:"string"}, country:{type:"string"},
            contact_person:{type:"string"}, email:{type:"string"}, tel:{type:"string"}
          }, required:["company_name"]
        },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              product_name:{type:"string"}, hs_code:{type:"string"},
              quantity:{type:"number"}, unit:{type:"string",enum:["PCS","SET","BOX","CTN","KG","L"]},
              unit_price:{type:"number"}, currency:{type:"string",enum:["USD","EUR","JPY","CNY","KRW"]},
              net_weight_kg:{type:"number"}, gross_weight_kg:{type:"number"},
              cbm:{type:"number"}, country_of_origin:{type:"string",default:"Republic of Korea"},
              description:{type:"string"}
            }, required:["product_name","quantity","unit_price"]
          }
        },
        trade_terms: {
          type: "object",
          properties: {
            incoterms:{type:"string",enum:["EXW","FCA","FOB","CFR","CIF","CPT","CIP","DAP","DPU","DDP"]},
            payment_terms:{type:"string"}, port_of_loading:{type:"string"},
            port_of_discharge:{type:"string"}, shipping_mark:{type:"string"},
            etd:{type:"string"}, eta:{type:"string"},
            validity_date:{type:"string",description:"PI 유효기간. issue_date +30일 자동 계산"}
          }
        },
        special_conditions:{type:"string"}, remarks:{type:"string"}
      },
      required: ["document_type","items"]
    }
  },
  {
    name: "check_compliance",
    description: "K-뷰티 화장품의 수출 대상국 규제 적합성 분석 및 실행 액션 제시",
    input_schema: {
      type: "object" as const,
      properties: {
        target_country:{type:"string"},
        product_name:{type:"string"},
        product_category:{type:"string",enum:["skincare","makeup","haircare","bodycare","sunscreen","functional_cosmetic"]},
        ingredients:{type:"array",items:{type:"string"}},
        claims:{type:"array",items:{type:"string"}},
        overall_status:{type:"string",enum:["PASS","FAIL","CAUTION"]},
        checks:{type:"array",items:{type:"object",properties:{
          category:{type:"string"},status:{type:"string",enum:["PASS","FAIL","CAUTION"]},
          issue:{type:"string"},action_required:{type:"string"},
          deadline:{type:"string"},reference_law:{type:"string"}
        },required:["category","status"]}},
        summary:{type:"string"},
        urgent_actions:{type:"array",items:{type:"string"}}
      },
      required:["target_country","product_name","overall_status","checks","summary"]
    }
  }
];

async function fetchUserContext(userId: string) {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const [companyRes, buyersRes, productsRes] = await Promise.all([
    sb.from("companies")
      .select("company_name,ceo_name,address,tel,email,contact_name,business_no,customs_code,bank_info,logo_url,seal_url")
      .eq("user_id", userId)
      .maybeSingle(),
    sb.from("buyers")
      .select("company_name,country,contact_name,contact_email,contact_phone,buyer_type,channel")
      .eq("user_id", userId)
      .limit(20),
    sb.from("products")
      .select("name_en,name_kr,sku_code,hs_code,unit_price_range,moq,category")
      .eq("user_id", userId)
      .limit(30),
  ]);

  let seller = null;
  if (companyRes.data) {
    const d = companyRes.data as any;
    const bank = d.bank_info || {};
    seller = {
      company_name: d.company_name || "",
      ceo_name: d.ceo_name || "",
      address: d.address || "",
      tel: d.tel || "",
      email: d.email || "",
      contact_person: d.contact_name || "",
      business_no: d.business_no || "",
      customs_code: d.customs_code || "",
      logo_url: d.logo_url || "",
      seal_url: d.seal_url || "",
      bank_info: {
        bank_name: bank.bank_name || "",
        account_no: bank.account_no || "",
        swift_code: bank.swift_code || "",
      },
    };
  }

  return {
    seller,
    buyers: buyersRes.data || [],
    products: productsRes.data || [],
  };
}

function trimHistory(messages: any[], hasFile: boolean) {
  const max = hasFile ? 4 : 12;
  return messages.length <= max ? messages : messages.slice(-max);
}

function createPusher(controller: ReadableStreamDefaultController) {
  return (event: string, data: unknown) => {
    controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"} });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization header required");
    const sbAnon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data:{ user }, error:authError } = await sbAnon.auth.getUser(authHeader.replace("Bearer ",""));
    if (authError || !user) throw new Error("인증 실패: 다시 로그인해주세요");

    const body = await req.json();
    const { messages: rawMessages = [], hasFile = false, mode } = body;
    const isDealRoomMode = mode === "deal_room_advice";
    const userContext = await fetchUserContext(user.id);
    const trimmedMessages = trimHistory(rawMessages, hasFile);
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const stream = new ReadableStream({
      async start(controller) {
        const push = createPusher(controller);
        try {
          let loopCount = 0;
          let currentMessages: any[] = trimmedMessages;
          let finalText = "";

          while (loopCount < MAX_AGENTIC_LOOPS) {
            loopCount++;
            const streamResponse = await anthropic.messages.create({
              model: MODEL,
              max_tokens: isDealRoomMode ? 1024 : MAX_TOKENS,
              system: isDealRoomMode
                ? "당신은 K-뷰티 수출 전문가입니다. 간결하고 실용적인 조언을 한국어로 제공하세요. 3~5줄 이내로 답변하세요."
                : buildSystemPrompt(userContext),
              ...(isDealRoomMode ? {} : { tools: TOOLS }),
              messages: currentMessages,
              stream: true,
            });

            let currentText = "", currentToolName = "", currentToolId = "", currentToolInput = "", stopReason = "";
            const toolResults: any[] = [];
            const assistantContent: any[] = [];

            for await (const chunk of streamResponse) {
              if (chunk.type === "content_block_start") {
                if (chunk.content_block.type === "tool_use") {
                  currentToolName = chunk.content_block.name;
                  currentToolId = chunk.content_block.id;
                  currentToolInput = "";
                  push("tool_call_start", { tool_name: currentToolName, tool_id: currentToolId });
                }
              } else if (chunk.type === "content_block_delta") {
                if (chunk.delta.type === "text_delta") {
                  currentText += chunk.delta.text;
                  finalText += chunk.delta.text;
                  push("text_delta", { text: chunk.delta.text });
                } else if (chunk.delta.type === "input_json_delta") {
                  currentToolInput += chunk.delta.partial_json;
                  push("tool_input_delta", { tool_name: currentToolName, tool_id: currentToolId, partial_json: chunk.delta.partial_json, accumulated: currentToolInput });
                }
              } else if (chunk.type === "content_block_stop") {
                if (currentToolInput) {
                  try {
                    const parsed = JSON.parse(currentToolInput);
                    assistantContent.push({ type:"tool_use", id:currentToolId, name:currentToolName, input:parsed });
                    push("tool_call_complete", { tool_name: currentToolName, tool_id: currentToolId, document: parsed });
                    toolResults.push({ type:"tool_result", tool_use_id:currentToolId, content: JSON.stringify({ status:"success", data:parsed }) });
                  } catch(e) { console.error("parse error",e); }
                  currentToolInput = ""; currentToolName = ""; currentToolId = "";
                } else if (currentText) {
                  assistantContent.push({ type:"text", text:currentText });
                  currentText = "";
                }
              } else if (chunk.type === "message_delta") {
                stopReason = chunk.delta.stop_reason || "";
              }
            }

            if (stopReason === "end_turn" || toolResults.length === 0) break;
            if (stopReason === "tool_use" && toolResults.length > 0) {
              currentMessages = [...currentMessages, { role:"assistant", content:assistantContent }, { role:"user", content:toolResults }];
            }
          }

          // 메시지 저장
          if (finalText) {
            const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            await sb.from("ai_chat_messages").insert({ user_id:user.id, role:"assistant", content:finalText, created_at:new Date().toISOString() });
          }

          push("stream_end", { total_loops: loopCount, timestamp: Date.now() });
        } catch(err) {
          push("error", { message: err instanceof Error ? err.message : "알 수 없는 오류" });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: {"Content-Type":"text/event-stream","Cache-Control":"no-cache","Connection":"keep-alive","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, content-type"} });
  } catch(err) {
    const msg = err instanceof Error ? err.message : "서버 오류";
    return new Response(JSON.stringify({ error: msg }), { status:400, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"} });
  }
});
