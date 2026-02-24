// FLONIX Trade Assistant v2.0 - 단일 스트리밍 파이프라인

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = "gemini-2.5-pro";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}`;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SYSTEM_PROMPT = `당신은 FLONIX의 AI 무역 어시스턴트입니다. K-뷰티 수출 전문가로서:

[핵심 역할]
1. K-뷰티 제품 수출용 무역 서류(PI, CI, PL) 작성 지원
2. 11개국(미국/EU/중국/일본/동남아6/중동2) 화장품 규제 컴플라이언스
3. HS Code 분류 및 관세율 안내
4. 수출 절차 및 물류 가이드

[응답 원칙]
- 실무 중심: 바로 실행 가능한 액션 아이템 제시
- 구조화: 서류 생성 시 반드시 Function Calling 활용
- 한국어 우선: 사용자가 한국어로 질문하면 한국어로 답변
- 정확성: 무역 용어, HS Code, Incoterms는 정확히 사용

[Function Calling 규칙]
- 무역 서류 생성 → generate_trade_document 호출
- 규제 체크 → check_compliance 호출
- 단순 질문 → 텍스트로 직접 응답`;

const TOOLS = [{
  functionDeclarations: [{
    name: "generate_trade_document",
    description: "PI/CI/PL 등 무역 서류를 생성합니다.",
    parameters: {
      type: "object",
      properties: {
        document_type: { type: "string", enum: ["PI", "CI", "PL", "NDA", "SALES_CONTRACT"] },
        document_number: { type: "string" },
        issue_date: { type: "string" },
        seller: {
          type: "object",
          properties: {
            company_name: { type: "string" }, address: { type: "string" },
            contact_person: { type: "string" }, email: { type: "string" }, phone: { type: "string" },
          }
        },
        buyer: {
          type: "object",
          properties: {
            company_name: { type: "string" }, address: { type: "string" },
            country: { type: "string" }, contact_person: { type: "string" }, email: { type: "string" },
          }
        },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              product_name: { type: "string" }, hs_code: { type: "string" },
              quantity: { type: "number" }, unit_price: { type: "number" },
              currency: { type: "string", enum: ["USD", "EUR", "JPY", "CNY"] },
              net_weight_kg: { type: "number" }, gross_weight_kg: { type: "number" },
              cbm: { type: "number" }, country_of_origin: { type: "string" },
            }
          }
        },
        trade_terms: {
          type: "object",
          properties: {
            incoterms: { type: "string", enum: ["FOB", "CIF", "CFR", "EXW", "DDP"] },
            payment_terms: { type: "string" },
            port_of_loading: { type: "string" }, port_of_discharge: { type: "string" },
            validity_date: { type: "string" },
          }
        },
        remarks: { type: "string" },
      },
      required: ["document_type", "items"],
    }
  }, {
    name: "check_compliance",
    description: "K-뷰티 제품의 수출 대상국 규제 적합성을 체크합니다.",
    parameters: {
      type: "object",
      properties: {
        product_name: { type: "string" },
        target_country: { type: "string", enum: ["US","EU","CN","JP","TH","VN","ID","PH","MY","SG","AE"] },
        ingredients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              inci_name: { type: "string" }, percentage: { type: "number" }, cas_number: { type: "string" }
            }
          }
        },
        product_category: { type: "string", enum: ["skincare","makeup","haircare","bodycare","sunscreen","fragrance"] },
      },
      required: ["product_name", "target_country"],
    }
  }]
}];

interface SSEPayload { type: string; data: Record<string, unknown> }
function sse(p: SSEPayload): string { return `data: ${JSON.stringify(p)}\n\n`; }

interface GeminiChunk {
  kind: "text" | "function_call" | "finish";
  text?: string;
  fnName?: string;
  fnArgs?: string;
}

function parseGeminiLine(line: string): GeminiChunk | null {
  if (!line.startsWith("data: ")) return null;
  const j = line.slice(6).trim();
  if (j === "[DONE]") return { kind: "finish" };
  try {
    const d = JSON.parse(j);
    const c = d.candidates?.[0];
    if (!c?.content?.parts) return null;
    for (const p of c.content.parts) {
      if (p.text !== undefined) return { kind: "text", text: p.text };
      if (p.functionCall) return {
        kind: "function_call",
        fnName: p.functionCall.name,
        fnArgs: JSON.stringify(p.functionCall.args),
      };
    }
    if (c.finishReason === "STOP") return { kind: "finish" };
    return null;
  } catch { return null; }
}

async function geminiStream(
  messages: Array<{ role: string; parts: Array<Record<string, unknown>> }>,
  tools: boolean,
  maxTokens = 8192,
) {
  return fetch(`${GEMINI_URL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: messages,
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      ...(tools ? { tools: TOOLS } : {}),
    }),
  });
}

async function saveMsg(
  sb: ReturnType<typeof createClient>,
  uid: string,
  role: "user" | "assistant",
  content: string,
  isDoc = false,
  summary?: string,
) {
  await sb.from("ai_chat_messages").insert({
    user_id: uid, role, content, is_doc_output: isDoc, doc_summary: summary,
  });
}

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const auth = req.headers.get("Authorization")!;
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: ae } = await sb.auth.getUser();
    if (ae || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { message, history = [] } = await req.json();
    await saveMsg(sb, user.id, "user", message);

    // Gemini 메시지 포맷
    const gHist = history.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    gHist.push({ role: "user", parts: [{ text: message }] });

    // ReadableStream 즉시 반환
    const stream = new ReadableStream({
      async start(ctrl) {
        const enc = new TextEncoder();
        const push = (p: SSEPayload) => ctrl.enqueue(enc.encode(sse(p)));

        try {
          push({ type: "stream_start", data: { ts: Date.now() } });

          // Phase 1: 단일 스트리밍 (tools 포함)
          const r1 = await geminiStream(gHist, true);
          if (!r1.ok || !r1.body) {
            push({ type: "error", data: { message: `Gemini Error: ${await r1.text()}` } });
            ctrl.close();
            return;
          }

          const reader = r1.body.getReader();
          const dec = new TextDecoder();
          let buf = "", fullText = "";
          let hasFn = false, fnName = "", fnArgs = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() || "";

            for (const line of lines) {
              const t = line.trim();
              if (!t || t === "data: [DONE]") continue;
              const ch = parseGeminiLine(t);
              if (!ch) continue;

              switch (ch.kind) {
                case "text":
                  fullText += ch.text || "";
                  push({ type: "text_delta", data: { content: ch.text } });
                  break;

                case "function_call": {
                  hasFn = true;
                  fnName = ch.fnName || "";
                  fnArgs = ch.fnArgs || "";

                  // 1) 패널 열기 신호
                  push({ type: "tool_call_start", data: { name: fnName } });

                  // 2) Arguments 청크 분할 전송 (Progressive Rendering용)
                  if (fnArgs) {
                    const SZ = 120;
                    for (let i = 0; i < fnArgs.length; i += SZ) {
                      push({
                        type: "tool_call_delta",
                        data: {
                          name: fnName,
                          arguments_chunk: fnArgs.slice(i, i + SZ),
                          chunk_index: Math.floor(i / SZ),
                          is_last: (i + SZ) >= fnArgs.length,
                        },
                      });
                    }
                  }

                  // 3) 완료 신호
                  push({
                    type: "tool_call_end",
                    data: { name: fnName, arguments_complete: fnArgs },
                  });
                  break;
                }
              }
            }
          }

          // Phase 2: Function Call 후 확인 메시지
          if (hasFn) {
            push({ type: "phase2_start", data: { functionName: fnName } });

            let parsedArgs: Record<string, unknown> = {};
            try { parsedArgs = JSON.parse(fnArgs); } catch { /* ignore */ }

            const p2Msgs = [
              ...gHist,
              {
                role: "model",
                parts: [{ functionCall: { name: fnName, args: parsedArgs } }],
              },
              {
                role: "user",
                parts: [{
                  functionResponse: {
                    name: fnName,
                    response: {
                      success: true,
                      message: `${fnName} 실행 완료. 문서가 화면에 표시됩니다.`,
                    },
                  },
                }],
              },
            ];

            const r2 = await geminiStream(p2Msgs, false, 2048);
            if (r2.ok && r2.body) {
              const rd2 = r2.body.getReader();
              let b2 = "", p2Text = "";
              while (true) {
                const { done, value } = await rd2.read();
                if (done) break;
                b2 += dec.decode(value, { stream: true });
                const ls = b2.split("\n");
                b2 = ls.pop() || "";
                for (const l of ls) {
                  const ch = parseGeminiLine(l.trim());
                  if (ch?.kind === "text") {
                    p2Text += ch.text || "";
                    push({ type: "text_delta_phase2", data: { content: ch.text } });
                  }
                }
              }
              if (p2Text) {
                await saveMsg(sb, user.id, "assistant", p2Text, true, `[${fnName}] 완료`);
              }
            }
          } else if (fullText) {
            await saveMsg(sb, user.id, "assistant", fullText);
          }

          push({
            type: "stream_end",
            data: { had_fn: hasFn, fn_name: fnName || null, ts: Date.now() },
          });
        } catch (e) {
          push({ type: "error", data: { message: (e as Error).message } });
        } finally {
          ctrl.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
