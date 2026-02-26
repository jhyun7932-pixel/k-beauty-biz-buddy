import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StreamPhase = "idle"|"connecting"|"streaming_text"|"tool_call_start"|"tool_call_streaming"|"tool_call_complete"|"complete"|"error";

export interface TradeItem {
  id: string;
  product_name: string;
  hs_code?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  currency: "USD"|"EUR"|"JPY"|"CNY"|"KRW";
  net_weight_kg?: number;
  gross_weight_kg?: number;
  cbm?: number;
  country_of_origin?: string;
  description?: string;
  line_total?: number;
  line_net_weight?: number;
  line_gross_weight?: number;
  line_cbm?: number;
}

export interface TradeDocument {
  document_type: "PI"|"CI"|"PL"|"NDA"|"SALES_CONTRACT"|"EMAIL"|"PROPOSAL";
  document_number?: string;
  issue_date?: string;
  validity_date?: string;
  seller?: { company_name:string; address?:string; tel?:string; email?:string; contact_person?:string; business_no?:string; bank_info?:{bank_name?:string;account_no?:string;swift_code?:string}; };
  buyer?: { company_name:string; address?:string; country?:string; contact_person?:string; email?:string; tel?:string; };
  items: TradeItem[];
  trade_terms?: { incoterms?:string; payment_terms?:string; port_of_loading?:string; port_of_discharge?:string; shipping_mark?:string; etd?:string; eta?:string; };
  total_amount?: number;
  total_net_weight?: number;
  total_gross_weight?: number;
  total_cbm?: number;
  total_packages?: number;
  currency?: string;
  special_conditions?: string;
  remarks?: string;
}

export interface ComplianceResult {
  target_country: string;
  product_name: string;
  overall_status: "PASS"|"FAIL"|"CAUTION";
  checks: Array<{category:string;status:"PASS"|"FAIL"|"CAUTION";issue?:string;action_required?:string;deadline?:string;reference_law?:string;}>;
  summary: string;
  urgent_actions: string[];
}

export interface ChatMessage {
  id: string;
  role: "user"|"assistant";
  content: string;
  timestamp: Date;
}

function recalc(items: TradeItem[]) {
  const updated = items.map(item => ({
    ...item,
    line_total: item.quantity * item.unit_price,
    line_net_weight: item.quantity * (item.net_weight_kg||0),
    line_gross_weight: item.quantity * (item.gross_weight_kg||0),
    line_cbm: item.quantity * (item.cbm||0),
  }));
  return {
    items: updated,
    total_amount: updated.reduce((s,i)=>s+(i.line_total||0),0),
    total_net_weight: updated.reduce((s,i)=>s+(i.line_net_weight||0),0),
    total_gross_weight: updated.reduce((s,i)=>s+(i.line_gross_weight||0),0),
    total_cbm: updated.reduce((s,i)=>s+(i.line_cbm||0),0),
  };
}

function repairJson(input: string): string {
  if (!input.trim()) return "{}";
  let r = input.trim();
  let inStr = false, esc = false;
  for (const c of r) {
    if (esc) { esc=false; continue; }
    if (c==="\\") { esc=true; continue; }
    if (c==='"') inStr=!inStr;
  }
  if (inStr) r+='"';
  const stack: string[] = [];
  inStr=false; esc=false;
  for (const c of r) {
    if (esc){esc=false;continue;}
    if (c==="\\"){esc=true;continue;}
    if (c==='"'){inStr=!inStr;continue;}
    if (inStr) continue;
    if (c==="{"||c==="[") stack.push(c);
    else if (c==="}"||c==="]") stack.pop();
  }
  r = r.replace(/,\s*$/,"");
  for (let i=stack.length-1;i>=0;i--) r += stack[i]==="{"?"}":"]";
  return r;
}

interface TradeStore {
  messages: ChatMessage[];
  streamingText: string;
  streamPhase: StreamPhase;
  rightPanelOpen: boolean;
  activeToolName: string|null;
  activeToolId: string|null;
  currentDocument: TradeDocument|null;
  partialDocumentJson: string;
  complianceResult: ComplianceResult|null;
  errorMessage: string|null;
  addUserMessage: (content:string)=>void;
  addAssistantMessage: (content:string)=>void;
  onStreamConnecting: ()=>void;
  onTextDelta: (text:string)=>void;
  onToolCallStart: (name:string, id:string)=>void;
  onToolInputDelta: (partial:string, accumulated:string)=>void;
  onToolCallComplete: (name:string, doc:Record<string,unknown>)=>void;
  onStreamEnd: ()=>void;
  onStreamError: (msg:string)=>void;
  resetStream: ()=>void;
  updateItemQuantity: (id:string, qty:number)=>void;
  updateItemUnitPrice: (id:string, price:number)=>void;
}

export const useTradeStore = create<TradeStore>()(
  persist(
    (set) => ({
      messages: [], streamingText: "", streamPhase: "idle",
      rightPanelOpen: false, activeToolName: null, activeToolId: null,
      currentDocument: null, partialDocumentJson: "", complianceResult: null, errorMessage: null,

      addUserMessage: (content) => set(s=>({ messages:[...s.messages,{id:crypto.randomUUID(),role:"user",content,timestamp:new Date()}] })),
      addAssistantMessage: (content) => set(s=>({ messages:[...s.messages,{id:crypto.randomUUID(),role:"assistant",content,timestamp:new Date()}], streamingText:"" })),

      onStreamConnecting: () => set({ streamPhase:"connecting", streamingText:"", errorMessage:null }),

      onTextDelta: (text) => set(s=>({ streamPhase:"streaming_text", streamingText:s.streamingText+text })),

      onToolCallStart: (name, id) => set({
        streamPhase:"tool_call_start",
        activeToolName:name, activeToolId:id,
        rightPanelOpen:true,
        partialDocumentJson:"",
        currentDocument:null,
        complianceResult:null,
      }),

      onToolInputDelta: (_partial, accumulated) => set(s=>{
        const next: Partial<TradeStore> = { streamPhase:"tool_call_streaming", partialDocumentJson:accumulated };
        try {
          const parsed = JSON.parse(repairJson(accumulated));
          if (s.activeToolName==="generate_trade_document") next.currentDocument = parsed as TradeDocument;
          else if (s.activeToolName==="check_compliance") next.complianceResult = parsed as ComplianceResult;
        } catch {}
        return next;
      }),

      onToolCallComplete: (name, doc) => set(s=>{
        if (name==="generate_trade_document") {
          const raw = doc as unknown as TradeDocument;
          const itemsWithId = (raw.items||[]).map(item=>({...item, id:crypto.randomUUID()}));
          const r = recalc(itemsWithId);
          return { streamPhase:"tool_call_complete", currentDocument:{...raw,...r,currency:raw.items?.[0]?.currency||"USD"}, activeToolName:null, activeToolId:null };
        }
        if (name==="check_compliance") {
          return { streamPhase:"tool_call_complete", complianceResult:doc as unknown as ComplianceResult, activeToolName:null, activeToolId:null };
        }
        return { streamPhase:"tool_call_complete" };
      }),

      onStreamEnd: () => set(s=>{
        const newMsgs = s.streamingText
          ? [...s.messages,{id:crypto.randomUUID(),role:"assistant" as const,content:s.streamingText,timestamp:new Date()}]
          : s.messages;
        return { streamPhase:"complete", messages:newMsgs, streamingText:"" };
      }),

      onStreamError: (msg) => set({ streamPhase:"error", errorMessage:msg, streamingText:"" }),

      resetStream: () => set({ streamPhase:"idle", streamingText:"", errorMessage:"", partialDocumentJson:"" }),

      updateItemQuantity: (id, qty) => set(s=>{
        if (!s.currentDocument) return {};
        const r = recalc(s.currentDocument.items.map(item=>item.id===id?{...item,quantity:qty}:item));
        return { currentDocument:{...s.currentDocument,...r} };
      }),

      updateItemUnitPrice: (id, price) => set(s=>{
        if (!s.currentDocument) return {};
        const r = recalc(s.currentDocument.items.map(item=>item.id===id?{...item,unit_price:price}:item));
        return { currentDocument:{...s.currentDocument,...r} };
      }),
    }),
    {
      name:"flonix-trade-store",
      partialize:(s)=>({ messages:s.messages.slice(-50), currentDocument:s.currentDocument, complianceResult:s.complianceResult }),
    }
  )
);
