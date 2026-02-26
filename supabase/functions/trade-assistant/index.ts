import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.0";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 4096;
const MAX_AGENTIC_LOOPS = 5;

function buildSystemPrompt(ctx: any): string {
  const seller = ctx.seller
    ? `회사명: ${ctx.seller.company_name}, 주소: ${ctx.seller.address||'미등록'}, Tel: ${ctx.seller.tel||'미등록'}, Email: ${ctx.seller.email||'미등록'}, 담당자: ${ctx.seller.contact_person||'미등록'}, 사업자번호: ${ctx.seller.business_no||'미등록'}`
    : "판매자 정보 미등록 - 설정 페이지에서 회사 정보를 등록하도록 안내";

  const buyers = ctx.buyers?.length
    ? ctx.buyers.map((b:any,i:number)=>`${i+1}. ${b.company_name} (${b.country||'?'}) - ${b.contact_name||''} <${b.contact_email||''}>`).join('\n')
    : "등록된 바이어 없음";

  const products = ctx.products?.length
    ? ctx.products.map((p:any,i:number)=>`${i+1}. ${p.name_en||p.name_kr||'이름없음'} | SKU:${p.sku_code||'-'} | HS:${p.hs_code||'미확인'}`).join('\n')
    : "등록된 제품 없음";

  return `당신은 FLONIX의 수석 AI 무역 어시스턴트입니다. K-뷰티 수출 전문가입니다.

[판매자 정보]
${seller}

[바이어 목록]
${buyers}

[제품 목록]
${products}

[역할]
1. PI/CI/PL/NDA/Sales Contract 국제 표준 서류 작성
2. 11개국 화장품 규제 컴플라이언스: 미국(MoCRA), EU(CPNP), 중국(NMPA), 일본(약기법), 동남아6개국, 중동2개국
3. HS Code 분류, Incoterms 2020 안내
4. 수출 물류/통관 절차 가이드

[서류 품질 기준]
PI 필수: 문서번호, 발행일, 유효기간, Seller/Buyer 완전정보, HS Code, Incoterms 2020, 결제조건, 선적항/도착항, 원산지(Republic of Korea), 총액/총중량/CBM, 은행정보, 서명란
CI 추가: L/C Number, B/L Number, Shipping Mark, Declaration 문구
PL 필수: 박스수량, 박스별내용물, Net/Gross Weight, CBM

[Function Calling 규칙]
- 서류 생성 → generate_trade_document 반드시 호출
- 규제 체크 → check_compliance 반드시 호출
- 일반 질문 → 텍스트 직접 응답
- 한국어 질문 → 한국어 답변, 서류 자체는 영문`;
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
            etd:{type:"string"}, eta:{type:"string"}
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
  const [companyRes, profileRes, buyersRes, productsRes] = await Promise.all([
    sb.from("companies").select("company_name,address,tel,email,contact_name,business_no,bank_info").eq("user_id",userId).maybeSingle(),
    sb.from("profiles").select("company_info,full_name,email").eq("id",userId).maybeSingle(),
    sb.from("buyers").select("company_name,country,contact_name,contact_email,contact_phone,buyer_type,channel").eq("user_id",userId).limit(20),
    sb.from("products").select("name_en,name_kr,sku_code,hs_code,unit_price_range,moq,category").eq("user_id",userId).limit(30),
  ]);

  let seller = null;
  if (companyRes.data) {
    seller = { company_name:companyRes.data.company_name, address:companyRes.data.address, tel:companyRes.data.tel, email:companyRes.data.email, contact_person:companyRes.data.contact_name, business_no:companyRes.data.business_no, bank_info:companyRes.data.bank_info };
  } else if (profileRes.data?.company_info) {
    const ci = profileRes.data.company_info as any;
    seller = { company_name:ci.company_name||ci.companyName||profileRes.data.full_name||"미등록", address:ci.address, tel:ci.tel||ci.phone, email:ci.email||profileRes.data.email, contact_person:ci.contact_person||ci.contactPerson, business_no:ci.business_no, bank_info:ci.bank_info };
  }
  return { seller, buyers: buyersRes.data||[], products: productsRes.data||[] };
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
    const { messages: rawMessages = [], hasFile = false } = body;
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
              model: MODEL, max_tokens: MAX_TOKENS,
              system: buildSystemPrompt(userContext),
              tools: TOOLS, messages: currentMessages, stream: true,
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
