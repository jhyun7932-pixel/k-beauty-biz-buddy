// ============================================================
// Fleety Trade Assistant v3.0 — Claude API SSE Streaming
// ============================================================
// Claude Sonnet 4 + DB 컨텍스트 동적 로딩 + SSE 스트리밍
// 프론트엔드 useStreamingChat/streamingStore와 100% 호환
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function buildSystemPrompt(ctx: {
  seller: Record<string, string> | null;
  buyers: Array<Record<string, string>>;
  products: Array<Record<string, string>>;
}): string {
  const seller = ctx.seller
    ? `회사명: ${ctx.seller.name || ctx.seller.name_kr || '미등록'}
주소: ${ctx.seller.address || '미등록'}
Tel: ${ctx.seller.contact_phone || '미등록'}
Email: ${ctx.seller.contact_email || '미등록'}
대표: ${ctx.seller.contact_person || '미등록'}
Incoterms: ${ctx.seller.default_incoterms || 'FOB'}
Payment: ${ctx.seller.default_payment_terms || 'T/T'}`
    : "판매자 정보 미등록";

  const buyers = ctx.buyers?.length
    ? ctx.buyers.slice(0, 10).map((b, i) =>
        `${i + 1}. ${b.company_name} (${b.country || '?'}) - ${b.contact_name || ''} <${b.contact_email || ''}>`
      ).join('\n')
    : "등록된 바이어 없음";

  const products = ctx.products?.length
    ? ctx.products.slice(0, 10).map((p, i) =>
        `${i + 1}. ${p.name_en || p.name_kr || '이름없음'} | SKU:${p.sku_code || '-'} | HS:${p.hs_code || '미확인'} | ${p.category || ''}`
      ).join('\n')
    : "등록된 제품 없음";

  return `당신은 Fleety의 수석 AI 무역 어시스턴트입니다. K-뷰티 수출의 모든 것을 지원합니다.

[판매자(셀러) 정보]
${seller}

[바이어 목록]
${buyers}

[제품 목록]
${products}

[핵심 역할]
1. K-뷰티 제품 수출용 무역 서류(PI, CI, PL, NDA, 매매계약서) 작성 — 국제 표준 준수
2. 11개국 화장품 규제 컴플라이언스: 미국(MoCRA/FDA), EU(CPNP), 중국(NMPA), 일본(약기법), 베트남, 태국, 인도네시아, 말레이시아, 싱가포르, 독일, 프랑스, UAE
3. HS Code 분류 및 관세율/상호관세 안내
4. 수출 절차, 물류 가이드, 비용 시뮬레이션
5. 바이어 제안 이메일 초안 작성 (B2B 무역 전문 톤)

[응답 원칙]
- 실무 중심: 바로 실행 가능한 Action Item을 제시하세요
- 구조화: 서류 생성 시 반드시 Tool Use 활용
- 한국어 우선: 사용자가 한국어로 질문하면 한국어로 답변. 서류는 영문.
- 정확성: 무역 용어, HS Code, Incoterms 2020은 정확히 사용
- 판매자 정보 미등록 시: "⚙️ 설정 > My Data에서 회사 정보를 먼저 등록해주세요" 안내

[Tool Use 규칙]
- 무역 서류 생성 → generate_trade_document 호출
- 규제 체크 → check_compliance 호출
- 단순 질문 → 텍스트로 직접 응답 (Tool 불필요)

[check_compliance 규칙]
- compliance_results 배열에 성분별 결과 필수 포함
- FAIL/CAUTION이 있으면 overall_status="FAIL", 없으면 "PASS"
- action_item에 지금 당장 해야 할 구체적 조치 명시`;
}

const CLAUDE_TOOLS = [
  {
    name: "generate_trade_document",
    description: "PI, CI, PL, NDA, 매매계약서 등 무역 서류를 생성합니다.",
    input_schema: {
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
        nda_terms: {
          type: "object",
          properties: {
            confidential_info_scope: { type: "string" },
            duration_years: { type: "number" },
            governing_law: { type: "string" },
            dispute_resolution: { type: "string" },
            breach_remedy: { type: "string" },
          }
        },
        contract_terms: {
          type: "object",
          properties: {
            payment_method: { type: "string" },
            shipping_deadline: { type: "string" },
            quality_inspection: { type: "string" },
            force_majeure: { type: "string" },
            governing_law: { type: "string" },
          }
        },
        remarks: { type: "string" },
      },
      required: ["document_type"],
    }
  },
  {
    name: "check_compliance",
    description: "K-뷰티 제품의 수출 대상국 규제 적합성을 체크합니다.",
    input_schema: {
      type: "object",
      properties: {
        product_name: { type: "string" },
        target_country: { type: "string", enum: ["US", "EU", "CN", "JP", "TH", "VN", "ID", "PH", "MY", "SG", "AE", "DE", "FR"] },
        ingredients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              inci_name: { type: "string" }, percentage: { type: "number" }, cas_number: { type: "string" }
            }
          }
        },
        product_category: { type: "string", enum: ["skincare", "makeup", "haircare", "bodycare", "sunscreen", "fragrance"] },
        overall_status: { type: "string", enum: ["PASS", "FAIL"] },
        compliance_results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              inci_name: { type: "string" },
              percentage: { type: "number" },
              status: { type: "string", enum: ["PASS", "FAIL", "CAUTION"] },
              regulation: { type: "string" },
              action_item: { type: "string" },
            }
          }
        },
      },
      required: ["product_name", "target_country"],
    }
  }
];

interface SSEPayload { type: string; data: Record<string, unknown> }
function sse(p: SSEPayload): string { return `data: ${JSON.stringify(p)}\n\n`; }

async function loadUserContext(sb: ReturnType<typeof createClient>, userId: string) {
  const { data: companies } = await sb.from("companies").select("*").eq("user_id", userId).limit(1);
  const { data: buyers } = await sb.from("buyers").select("*").eq("user_id", userId).limit(20);
  const { data: products } = await sb.from("products").select("*").eq("user_id", userId).limit(20);
  return {
    seller: (companies?.[0] || null) as Record<string, string> | null,
    buyers: (buyers || []) as Array<Record<string, string>>,
    products: (products || []) as Array<Record<string, string>>,
  };
}

async function saveMsg(
  sb: ReturnType<typeof createClient>, uid: string,
  role: "user" | "assistant", content: string, isDoc = false, summary?: string,
) {
  try {
    await sb.from("ai_chat_messages").insert({
      user_id: uid, role, content, is_doc_output: isDoc, doc_summary: summary,
    });
  } catch {
    // 저장 실패해도 채팅 기능에 영향 없음
  }
}

Deno.serve(async (req) => {
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
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const sbAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: ae } = await sbAuth.auth.getUser();
    if (ae || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const { message, history = [] } = await req.json();
    await saveMsg(sb, user.id, "user", message);

    const ctx = await loadUserContext(sb, user.id);
    const systemPrompt = buildSystemPrompt(ctx);

    const claudeMessages = history
      .filter((m: { role: string; content: string }) => m.content?.trim())
      .map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" as const : "user" as const,
        content: m.content,
      }));
    claudeMessages.push({ role: "user" as const, content: message });

    const stream = new ReadableStream({
      async start(ctrl) {
        const enc = new TextEncoder();
        const push = (p: SSEPayload) => {
          try { ctrl.enqueue(enc.encode(sse(p))); } catch {}
        };

        try {
          push({ type: "stream_start", data: { ts: Date.now() } });

          const claudeRes = await fetch(CLAUDE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: CLAUDE_MODEL,
              max_tokens: 8192,
              system: systemPrompt,
              messages: claudeMessages,
              tools: CLAUDE_TOOLS,
              stream: true,
            }),
          });

          if (!claudeRes.ok || !claudeRes.body) {
            const errText = await claudeRes.text();
            console.error("[Fleety ERROR] Claude API:", errText);
            push({ type: "error", data: { message: `AI 서비스 오류 (${claudeRes.status})` } });
            ctrl.close();
            return;
          }

          const reader = claudeRes.body.getReader();
          const dec = new TextDecoder();
          let buf = "", fullText = "";
          let hasFn = false, fnName = "", fnArgs = "", currentToolUseId = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() || "";

            for (const line of lines) {
              const t = line.trim();
              if (!t || !t.startsWith("data: ")) continue;
              const jsonStr = t.slice(6);
              if (jsonStr === "[DONE]") continue;
              try {
                const evt = JSON.parse(jsonStr);
                switch (evt.type) {
                  case "content_block_delta": {
                    if (evt.delta?.type === "text_delta" && evt.delta.text) {
                      fullText += evt.delta.text;
                      push({ type: "text_delta", data: { content: evt.delta.text } });
                    }
                    if (evt.delta?.type === "input_json_delta" && evt.delta.partial_json) {
                      fnArgs += evt.delta.partial_json;
                      push({
                        type: "tool_call_delta",
                        data: { name: fnName, arguments_chunk: evt.delta.partial_json, chunk_index: -1, is_last: false },
                      });
                    }
                    break;
                  }
                  case "content_block_start": {
                    if (evt.content_block?.type === "tool_use") {
                      hasFn = true;
                      fnName = evt.content_block.name || "";
                      fnArgs = "";
                      currentToolUseId = evt.content_block.id || "";
                      push({ type: "tool_call_start", data: { name: fnName } });
                    }
                    break;
                  }
                  case "content_block_stop": {
                    if (hasFn && fnName && fnArgs) {
                      push({ type: "tool_call_end", data: { name: fnName, arguments_complete: fnArgs } });
                    }
                    break;
                  }
                }
              } catch {}
            }
          }

          if (hasFn && fnName && fnArgs) {
            push({ type: "phase2_start", data: { functionName: fnName } });
            let parsedArgs: Record<string, unknown> = {};
            try { parsedArgs = JSON.parse(fnArgs); } catch {}

            const phase2Messages = [
              ...claudeMessages,
              {
                role: "assistant" as const,
                content: [
                  ...(fullText ? [{ type: "text" as const, text: fullText }] : []),
                  { type: "tool_use" as const, id: currentToolUseId || "tool_001", name: fnName, input: parsedArgs },
                ],
              },
              {
                role: "user" as const,
                content: [
                  { type: "tool_result" as const, tool_use_id: currentToolUseId || "tool_001", content: `${fnName} 실행 완료. 문서가 우측 패널에 표시됩니다. 간결한 확인 메시지를 전달하세요.` },
                ],
              },
            ];

            const p2Res = await fetch(CLAUDE_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
              },
              body: JSON.stringify({
                model: CLAUDE_MODEL, max_tokens: 2048,
                system: systemPrompt, messages: phase2Messages, stream: true,
              }),
            });

            if (p2Res.ok && p2Res.body) {
              const rd2 = p2Res.body.getReader();
              let b2 = "", p2Text = "";
              while (true) {
                const { done, value } = await rd2.read();
                if (done) break;
                b2 += dec.decode(value, { stream: true });
                const ls = b2.split("\n");
                b2 = ls.pop() || "";
                for (const l of ls) {
                  const lt = l.trim();
                  if (!lt || !lt.startsWith("data: ")) continue;
                  try {
                    const e2 = JSON.parse(lt.slice(6));
                    if (e2.type === "content_block_delta" && e2.delta?.type === "text_delta" && e2.delta.text) {
                      p2Text += e2.delta.text;
                      push({ type: "text_delta_phase2", data: { content: e2.delta.text } });
                    }
                  } catch {}
                }
              }
              if (p2Text) await saveMsg(sb, user.id, "assistant", p2Text, true, `[${fnName}] 완료`);
            }
          } else if (fullText) {
            await saveMsg(sb, user.id, "assistant", fullText);
          }

          push({ type: "stream_end", data: { had_fn: hasFn, fn_name: fnName || null, ts: Date.now() } });
        } catch (e) {
          console.error("[Fleety ERROR]", e);
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
    console.error("[Fleety FATAL]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
