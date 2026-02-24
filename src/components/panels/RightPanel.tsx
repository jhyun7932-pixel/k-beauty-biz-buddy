// 우측 패널 - PI/CI/PL A4 문서 Progressive Rendering

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useStreamingStore } from "../../stores/streamingStore";
import type { DocumentType, ToolCallInfo } from "../../stores/streamingStore";
import {
  downloadTradeDocAsPDF,
  downloadComplianceAsPDF,
  downloadTradeDocAsWord,
  downloadComplianceAsWord,
} from "../../lib/export/exportDocument";

interface TradeItem {
  product_name?: string;
  hs_code?: string;
  quantity?: number;
  unit_price?: number;
  currency?: string;
  net_weight_kg?: number;
  gross_weight_kg?: number;
  cbm?: number;
  country_of_origin?: string;
}

interface TradeDocArgs {
  document_type?: string;
  document_number?: string;
  issue_date?: string;
  seller?: {
    company_name?: string;
    address?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
  };
  buyer?: {
    company_name?: string;
    address?: string;
    country?: string;
    contact_person?: string;
    email?: string;
  };
  items?: TradeItem[];
  trade_terms?: {
    incoterms?: string;
    payment_terms?: string;
    port_of_loading?: string;
    port_of_discharge?: string;
    validity_date?: string;
  };
  remarks?: string;
}

interface NdaArgs {
  document_type?: string;
  document_number?: string;
  issue_date?: string;
  seller?: {
    company_name?: string;
    address?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
  };
  buyer?: {
    company_name?: string;
    address?: string;
    country?: string;
    contact_person?: string;
    email?: string;
  };
  nda_terms?: {
    confidential_info_scope?: string;
    duration_years?: number;
    governing_law?: string;
    dispute_resolution?: string;
    breach_remedy?: string;
  };
  remarks?: string;
}

interface SalesContractArgs {
  document_type?: string;
  document_number?: string;
  issue_date?: string;
  seller?: {
    company_name?: string;
    address?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
  };
  buyer?: {
    company_name?: string;
    address?: string;
    country?: string;
    contact_person?: string;
    email?: string;
  };
  items?: TradeItem[];
  trade_terms?: {
    incoterms?: string;
    payment_terms?: string;
    port_of_loading?: string;
    port_of_discharge?: string;
  };
  contract_terms?: {
    payment_method?: string;
    shipping_deadline?: string;
    quality_inspection?: string;
    force_majeure?: string;
    governing_law?: string;
  };
  remarks?: string;
}

interface ComplianceResult {
  inci_name?: string;
  percentage?: number;
  status?: "PASS" | "FAIL" | "CAUTION";
  regulation?: string;
  action_item?: string;
}

interface ComplianceArgs {
  product_name?: string;
  target_country?: string;
  product_category?: string;
  overall_status?: "PASS" | "FAIL";
  ingredients?: Array<{
    inci_name?: string;
    percentage?: number;
    cas_number?: string;
  }>;
  compliance_results?: ComplianceResult[];
}

const DOC_LABELS: Record<string, string> = {
  PI: "Proforma Invoice",
  CI: "Commercial Invoice",
  PL: "Packing List",
  NDA: "Non-Disclosure Agreement",
  SALES_CONTRACT: "Sales Contract",
  COMPLIANCE: "Compliance Check",
};

const DOC_TITLES: Record<string, string> = {
  PI: "PROFORMA INVOICE",
  CI: "COMMERCIAL INVOICE",
  PL: "PACKING LIST",
  NDA: "NON-DISCLOSURE AGREEMENT",
  SALES_CONTRACT: "SALES CONTRACT",
};

const COUNTRIES: Record<string, string> = {
  US: "🇺🇸 미국 (MoCRA/FDA)",
  EU: "🇪🇺 유럽 (CPNP)",
  CN: "🇨🇳 중국 (NMPA)",
  JP: "🇯🇵 일본 (PMDA)",
  TH: "🇹🇭 태국",
  VN: "🇻🇳 베트남",
  ID: "🇮🇩 인도네시아 (BPOM)",
  PH: "🇵🇭 필리핀",
  MY: "🇲🇾 말레이시아",
  SG: "🇸🇬 싱가포르 (HSA)",
  AE: "🇦🇪 UAE (ECAS)",
};

export default function RightPanel() {
  const {
    rightPanelOpen,
    rightPanelDocType,
    toolCall,
    phase,
    closeRightPanel,
  } = useStreamingStore();

  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);

  if (!rightPanelOpen) return null;

  const isStreaming =
    phase === "tool_call_start" || phase === "tool_call_streaming";
  const isComplete =
    phase === "tool_call_complete" ||
    phase === "phase2_streaming" ||
    phase === "complete";

  const docArgs = toolCall?.completedArgs ?? {};
  const isCompliance = toolCall?.name === "check_compliance";

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      if (isCompliance) {
        await downloadComplianceAsPDF(docArgs);
      } else {
        await downloadTradeDocAsPDF(docArgs, rightPanelDocType ?? "PI");
      }
      toast.success("PDF 다운로드 완료");
    } catch (e) {
      toast.error(`다운로드 실패: ${(e as Error).message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadDocx = async () => {
    setDocxLoading(true);
    try {
      if (isCompliance) {
        await downloadComplianceAsWord(docArgs);
      } else {
        await downloadTradeDocAsWord(docArgs, rightPanelDocType ?? "PI");
      }
      toast.success("Word 다운로드 완료");
    } catch (e) {
      toast.error(`다운로드 실패: ${(e as Error).message}`);
    } finally {
      setDocxLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(docArgs, null, 2));
      toast.success("클립보드에 복사됨");
    } catch {
      toast.error("클립보드 복사 실패");
    }
  };

  return (
    <div className="w-[520px] min-w-[520px] h-full border-l border-gray-200 bg-white flex flex-col shadow-xl">
      {/* 헤더 */}
      <div className="border-b border-gray-200 px-5 py-3.5 flex items-center justify-between bg-gray-50/80">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
              isComplete
                ? "bg-emerald-100 text-emerald-600"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            {isComplete ? "✓" : "📄"}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {rightPanelDocType
                ? DOC_LABELS[rightPanelDocType] || rightPanelDocType
                : "문서 생성 중..."}
            </h2>
            <p className="text-xs text-gray-500">
              {isStreaming
                ? `AI 작성 중... ${toolCall?.partialParsed?.progress ?? 0}%`
                : isComplete
                ? "✅ 생성 완료"
                : "준비 중..."}
            </p>
          </div>
        </div>

        {/* 프로그레스 바 */}
        {isStreaming && (
          <div className="flex-1 mx-4 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.max(toolCall?.partialParsed?.progress ?? 0, 5)}%`,
              }}
            />
          </div>
        )}

        <button
          onClick={closeRightPanel}
          className="p-1.5 rounded-md hover:bg-gray-200 transition-colors text-gray-500"
        >
          ✕
        </button>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-5">
        {toolCall ? (
          <DocRenderer
            toolCall={toolCall}
            docType={rightPanelDocType}
            isStreaming={isStreaming}
          />
        ) : (
          <FullSkeleton />
        )}
      </div>

      {/* 하단 액션 */}
      {isComplete && toolCall?.isComplete && (
        <div className="border-t border-gray-200 px-5 py-3 flex gap-2 bg-gray-50">
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading || docxLoading}
            className="flex-1 py-2 px-3 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {pdfLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "📄"
            )}
            PDF
          </button>
          <button
            onClick={handleDownloadDocx}
            disabled={pdfLoading || docxLoading}
            className="flex-1 py-2 px-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {docxLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "📝"
            )}
            Word
          </button>
          <button
            onClick={handleCopy}
            disabled={pdfLoading || docxLoading}
            className="flex-1 py-2 px-3 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            ✏️ 편집
          </button>
        </div>
      )}
    </div>
  );
}

// --- 문서 렌더러 분기 ---
function DocRenderer({
  toolCall,
  docType,
  isStreaming,
}: {
  toolCall: ToolCallInfo;
  docType: DocumentType;
  isStreaming: boolean;
}) {
  const data = useMemo(() => {
    if (toolCall.isComplete && toolCall.completedArgs)
      return toolCall.completedArgs;
    return (toolCall.partialParsed?.parsed as Record<string, unknown>) ?? null;
  }, [toolCall.isComplete, toolCall.completedArgs, toolCall.partialParsed]);

  if (!data) return <FullSkeleton />;

  if (toolCall.name === "check_compliance")
    return (
      <ComplianceView
        data={data as unknown as ComplianceArgs}
        isStreaming={isStreaming}
      />
    );

  const dt = (data as Record<string, unknown>).document_type as string | undefined;

  if (dt === "NDA")
    return (
      <NdaDocView
        data={data as unknown as NdaArgs}
        isStreaming={isStreaming}
      />
    );

  if (dt === "SALES_CONTRACT")
    return (
      <SalesContractView
        data={data as unknown as SalesContractArgs}
        isStreaming={isStreaming}
      />
    );

  return (
    <TradeDocView
      data={data as unknown as TradeDocArgs}
      isStreaming={isStreaming}
    />
  );
}

// --- PI/CI/PL A4 스타일 문서 ---
function TradeDocView({
  data,
  isStreaming,
}: {
  data: TradeDocArgs;
  isStreaming: boolean;
}) {
  const items = data.items || [];
  const total = items.reduce(
    (s, i) => s + (i.quantity ?? 0) * (i.unit_price ?? 0),
    0
  );
  const currency = items[0]?.currency || "USD";

  return (
    <div
      className="bg-white border border-gray-300 shadow-md rounded-sm mx-auto text-[11px] leading-relaxed"
      style={{
        maxWidth: "480px",
        fontFamily: "'Times New Roman', Georgia, serif",
      }}
    >
      {/* 문서 타이틀 */}
      <div className="border-b-2 border-gray-800 px-6 py-5 text-center">
        <h1 className="text-lg font-bold tracking-[0.2em] text-gray-900">
          {DOC_TITLES[data.document_type || "PI"] || "TRADE DOCUMENT"}
        </h1>
        <div className="flex justify-between mt-3 text-[10px] text-gray-600">
          <span>
            No: {data.document_number || <Sk w={80} s={isStreaming} />}
          </span>
          <span>Date: {data.issue_date || <Sk w={80} s={isStreaming} />}</span>
        </div>
      </div>

      {/* Seller / Buyer */}
      <div className="grid grid-cols-2 border-b border-gray-300">
        <div className="p-3 border-r border-gray-300">
          <h3 className="font-bold text-gray-600 uppercase tracking-wide mb-1.5 text-[9px]">
            SELLER / EXPORTER
          </h3>
          {data.seller ? (
            <div className="space-y-0.5 text-gray-800">
              <p className="font-semibold">{data.seller.company_name}</p>
              {data.seller.address && <p>{data.seller.address}</p>}
              {data.seller.contact_person && (
                <p>{data.seller.contact_person}</p>
              )}
              {data.seller.email && (
                <p className="text-blue-700">{data.seller.email}</p>
              )}
              {data.seller.phone && <p>{data.seller.phone}</p>}
            </div>
          ) : (
            <LineSkeleton n={3} s={isStreaming} />
          )}
        </div>
        <div className="p-3">
          <h3 className="font-bold text-gray-600 uppercase tracking-wide mb-1.5 text-[9px]">
            BUYER / IMPORTER
          </h3>
          {data.buyer ? (
            <div className="space-y-0.5 text-gray-800">
              <p className="font-semibold">{data.buyer.company_name}</p>
              {data.buyer.address && <p>{data.buyer.address}</p>}
              {data.buyer.country && <p>{data.buyer.country}</p>}
              {data.buyer.contact_person && (
                <p>{data.buyer.contact_person}</p>
              )}
              {data.buyer.email && (
                <p className="text-blue-700">{data.buyer.email}</p>
              )}
            </div>
          ) : (
            <LineSkeleton n={3} s={isStreaming} />
          )}
        </div>
      </div>

      {/* 품목 테이블 */}
      <div className="px-3 py-2">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-gray-100 text-gray-700 font-semibold">
              <th className="border border-gray-300 px-1.5 py-1 text-left w-8">
                No
              </th>
              <th className="border border-gray-300 px-1.5 py-1 text-left">
                Description
              </th>
              <th className="border border-gray-300 px-1.5 py-1 text-center">
                HS Code
              </th>
              <th className="border border-gray-300 px-1.5 py-1 text-right">
                Qty
              </th>
              <th className="border border-gray-300 px-1.5 py-1 text-right">
                Unit Price
              </th>
              <th className="border border-gray-300 px-1.5 py-1 text-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, i) => (
                <tr key={i} className="hover:bg-blue-50/30">
                  <td className="border border-gray-300 px-1.5 py-1 text-center">
                    {i + 1}
                  </td>
                  <td className="border border-gray-300 px-1.5 py-1 font-medium">
                    {item.product_name || <Sk w={100} s={isStreaming} />}
                  </td>
                  <td className="border border-gray-300 px-1.5 py-1 text-center font-mono text-[9px]">
                    {item.hs_code || "—"}
                  </td>
                  <td className="border border-gray-300 px-1.5 py-1 text-right">
                    {item.quantity?.toLocaleString() ?? "—"}
                  </td>
                  <td className="border border-gray-300 px-1.5 py-1 text-right">
                    {item.unit_price != null
                      ? `${item.currency || "USD"} ${item.unit_price.toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="border border-gray-300 px-1.5 py-1 text-right font-semibold">
                    {item.quantity != null && item.unit_price != null
                      ? `${item.currency || "USD"} ${(item.quantity * item.unit_price).toFixed(2)}`
                      : <Sk w={50} s={isStreaming} />}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="border border-gray-300 px-2 py-6 text-center text-gray-400"
                >
                  {isStreaming ? <Dots label="품목 데이터 수신 중" /> : "품목이 없습니다"}
                </td>
              </tr>
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td
                  colSpan={5}
                  className="border border-gray-300 px-1.5 py-1.5 text-right"
                >
                  TOTAL:
                </td>
                <td className="border border-gray-300 px-1.5 py-1.5 text-right text-blue-800">
                  {currency} {total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Trade Terms */}
      {(data.trade_terms || isStreaming) && (
        <div className="border-t border-gray-300 px-4 py-2.5">
          <h3 className="font-bold text-gray-700 uppercase tracking-wide mb-1.5 text-[9px]">
            Trade Terms
          </h3>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <KV k="Incoterms" v={data.trade_terms?.incoterms} s={isStreaming} />
            <KV k="Payment" v={data.trade_terms?.payment_terms} s={isStreaming} />
            <KV k="Port of Loading" v={data.trade_terms?.port_of_loading} s={isStreaming} />
            <KV k="Port of Discharge" v={data.trade_terms?.port_of_discharge} s={isStreaming} />
            <KV k="Validity" v={data.trade_terms?.validity_date} s={isStreaming} />
          </div>
        </div>
      )}

      {/* Weight/CBM */}
      {items.some((i) => i.net_weight_kg || i.gross_weight_kg || i.cbm) && (
        <div className="border-t border-gray-300 px-4 py-2.5">
          <h3 className="font-bold text-gray-700 uppercase tracking-wide mb-1.5 text-[9px]">
            Weight & Measurement
          </h3>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-1.5 py-1 text-left">Item</th>
                <th className="border border-gray-300 px-1.5 py-1 text-right">N/W (kg)</th>
                <th className="border border-gray-300 px-1.5 py-1 text-right">G/W (kg)</th>
                <th className="border border-gray-300 px-1.5 py-1 text-right">CBM</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="border border-gray-300 px-1.5 py-1">{item.product_name}</td>
                  <td className="border border-gray-300 px-1.5 py-1 text-right">{item.net_weight_kg?.toFixed(2) ?? "—"}</td>
                  <td className="border border-gray-300 px-1.5 py-1 text-right">{item.gross_weight_kg?.toFixed(2) ?? "—"}</td>
                  <td className="border border-gray-300 px-1.5 py-1 text-right">{item.cbm?.toFixed(4) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Remarks */}
      {data.remarks && (
        <div className="border-t border-gray-300 px-4 py-2.5">
          <h3 className="font-bold text-gray-700 uppercase tracking-wide mb-1 text-[9px]">
            Remarks
          </h3>
          <p className="text-gray-600 whitespace-pre-wrap">{data.remarks}</p>
        </div>
      )}

      {/* 서명 영역 */}
      <div className="border-t border-gray-300 px-6 py-5 flex justify-between items-end">
        <div className="text-center">
          <p className="text-gray-400 mb-6 text-[9px]">Authorized Signature</p>
          <div className="border-t border-gray-400 pt-1 w-28 text-[9px] text-gray-600">
            {data.seller?.company_name || "Seller"}
          </div>
        </div>
        <div className="w-14 h-14 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-300 text-[8px]">
          SEAL
        </div>
      </div>
    </div>
  );
}

// --- NDA 문서 뷰 ---
function NdaDocView({
  data,
  isStreaming,
}: {
  data: NdaArgs;
  isStreaming: boolean;
}) {
  const nt = data.nda_terms;
  return (
    <div
      className="bg-white border border-gray-300 shadow-md rounded-sm mx-auto text-[11px] leading-relaxed"
      style={{ maxWidth: "480px", fontFamily: "'Times New Roman', Georgia, serif" }}
    >
      {/* 타이틀 */}
      <div className="border-b-2 border-gray-800 px-6 py-5 text-center">
        <h1 className="text-lg font-bold tracking-[0.2em] text-gray-900">
          NON-DISCLOSURE AGREEMENT
        </h1>
        <div className="flex justify-between mt-3 text-[10px] text-gray-600">
          <span>No: {data.document_number || <Sk w={80} s={isStreaming} />}</span>
          <span>Date: {data.issue_date || <Sk w={80} s={isStreaming} />}</span>
        </div>
      </div>

      {/* 당사자 */}
      <div className="grid grid-cols-2 border-b border-gray-300">
        <div className="p-3 border-r border-gray-300">
          <h3 className="font-bold text-gray-600 uppercase tracking-wide mb-1.5 text-[9px]">
            PARTY A (DISCLOSING)
          </h3>
          {data.seller ? (
            <div className="space-y-0.5 text-gray-800">
              <p className="font-semibold">{data.seller.company_name}</p>
              {data.seller.address && <p>{data.seller.address}</p>}
              {data.seller.contact_person && <p>{data.seller.contact_person}</p>}
              {data.seller.email && <p className="text-blue-700">{data.seller.email}</p>}
            </div>
          ) : (
            <LineSkeleton n={3} s={isStreaming} />
          )}
        </div>
        <div className="p-3">
          <h3 className="font-bold text-gray-600 uppercase tracking-wide mb-1.5 text-[9px]">
            PARTY B (RECEIVING)
          </h3>
          {data.buyer ? (
            <div className="space-y-0.5 text-gray-800">
              <p className="font-semibold">{data.buyer.company_name}</p>
              {data.buyer.address && <p>{data.buyer.address}</p>}
              {data.buyer.country && <p>{data.buyer.country}</p>}
              {data.buyer.contact_person && <p>{data.buyer.contact_person}</p>}
              {data.buyer.email && <p className="text-blue-700">{data.buyer.email}</p>}
            </div>
          ) : (
            <LineSkeleton n={3} s={isStreaming} />
          )}
        </div>
      </div>

      {/* NDA 조항들 */}
      <div className="divide-y divide-gray-200">
        <NdaClause
          num="1"
          title="기밀정보의 범위 (Confidential Information)"
          content={nt?.confidential_info_scope}
          s={isStreaming}
        />
        <NdaClause
          num="2"
          title={`유효기간 (Duration): ${nt?.duration_years ?? 3}년`}
          content={`본 계약은 서명일로부터 ${nt?.duration_years ?? 3}년간 유효합니다. 계약 만료 후에도 수령한 기밀정보에 대한 비밀유지 의무는 존속합니다.`}
          s={false}
        />
        <NdaClause
          num="3"
          title="위반 시 구제 (Breach Remedy)"
          content={nt?.breach_remedy || "본 계약 위반 시 상대방은 손해배상 청구 및 금지청구권을 행사할 수 있습니다."}
          s={false}
        />
        <NdaClause
          num="4"
          title="준거법 (Governing Law)"
          content={nt?.governing_law || "대한민국 법률"}
          s={false}
        />
        <NdaClause
          num="5"
          title="분쟁해결 (Dispute Resolution)"
          content={nt?.dispute_resolution || "대한상사중재원 중재"}
          s={false}
        />
        {data.remarks && (
          <NdaClause num="6" title="기타 (Remarks)" content={data.remarks} s={false} />
        )}
      </div>

      {/* 서명 */}
      <div className="border-t border-gray-300 px-6 py-5">
        <div className="grid grid-cols-2 gap-6">
          {["PARTY A", "PARTY B"].map((p) => (
            <div key={p} className="text-center">
              <div className="h-10 border-b border-dashed border-gray-400 mb-1" />
              <p className="text-[9px] text-gray-500">{p} Signature & Seal</p>
              <p className="text-[9px] text-gray-400">Date: ___________</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NdaClause({
  num, title, content, s,
}: {
  num: string; title: string; content?: string; s: boolean;
}) {
  return (
    <div className="px-5 py-3">
      <h4 className="font-bold text-gray-800 text-[10px] mb-1">
        Article {num}. {title}
      </h4>
      {content ? (
        <p className="text-gray-600 text-[10px] leading-relaxed">{content}</p>
      ) : (
        <LineSkeleton n={2} s={s} />
      )}
    </div>
  );
}

// --- 매매계약서 뷰 ---
function SalesContractView({
  data,
  isStreaming,
}: {
  data: SalesContractArgs;
  isStreaming: boolean;
}) {
  const items = data.items || [];
  const currency = items[0]?.currency || "USD";
  const total = items.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_price ?? 0), 0);
  const ct = data.contract_terms;

  return (
    <div
      className="bg-white border border-gray-300 shadow-md rounded-sm mx-auto text-[11px] leading-relaxed"
      style={{ maxWidth: "480px", fontFamily: "'Times New Roman', Georgia, serif" }}
    >
      {/* 타이틀 */}
      <div className="border-b-2 border-gray-800 px-6 py-5 text-center">
        <h1 className="text-lg font-bold tracking-[0.2em] text-gray-900">SALES CONTRACT</h1>
        <div className="flex justify-between mt-3 text-[10px] text-gray-600">
          <span>No: {data.document_number || <Sk w={80} s={isStreaming} />}</span>
          <span>Date: {data.issue_date || <Sk w={80} s={isStreaming} />}</span>
        </div>
      </div>

      {/* Seller / Buyer */}
      <div className="grid grid-cols-2 border-b border-gray-300">
        <div className="p-3 border-r border-gray-300">
          <h3 className="font-bold text-gray-600 uppercase tracking-wide mb-1.5 text-[9px]">SELLER</h3>
          {data.seller ? (
            <div className="space-y-0.5 text-gray-800">
              <p className="font-semibold">{data.seller.company_name}</p>
              {data.seller.address && <p>{data.seller.address}</p>}
              {data.seller.contact_person && <p>{data.seller.contact_person}</p>}
              {data.seller.email && <p className="text-blue-700">{data.seller.email}</p>}
              {data.seller.phone && <p>{data.seller.phone}</p>}
            </div>
          ) : (
            <LineSkeleton n={3} s={isStreaming} />
          )}
        </div>
        <div className="p-3">
          <h3 className="font-bold text-gray-600 uppercase tracking-wide mb-1.5 text-[9px]">BUYER</h3>
          {data.buyer ? (
            <div className="space-y-0.5 text-gray-800">
              <p className="font-semibold">{data.buyer.company_name}</p>
              {data.buyer.address && <p>{data.buyer.address}</p>}
              {data.buyer.country && <p>{data.buyer.country}</p>}
              {data.buyer.contact_person && <p>{data.buyer.contact_person}</p>}
              {data.buyer.email && <p className="text-blue-700">{data.buyer.email}</p>}
            </div>
          ) : (
            <LineSkeleton n={3} s={isStreaming} />
          )}
        </div>
      </div>

      {/* 품목 테이블 */}
      {(items.length > 0 || isStreaming) && (
        <div className="px-3 py-2 border-b border-gray-300">
          <h3 className="font-bold text-gray-700 uppercase tracking-wide mb-1.5 text-[9px]">
            Article 1. Commodity
          </h3>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-semibold">
                <th className="border border-gray-300 px-1.5 py-1 text-left">Description</th>
                <th className="border border-gray-300 px-1.5 py-1 text-center">HS Code</th>
                <th className="border border-gray-300 px-1.5 py-1 text-right">Qty</th>
                <th className="border border-gray-300 px-1.5 py-1 text-right">Unit Price</th>
                <th className="border border-gray-300 px-1.5 py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item, i) => (
                  <tr key={i}>
                    <td className="border border-gray-300 px-1.5 py-1 font-medium">{item.product_name || "—"}</td>
                    <td className="border border-gray-300 px-1.5 py-1 text-center font-mono text-[9px]">{item.hs_code || "—"}</td>
                    <td className="border border-gray-300 px-1.5 py-1 text-right">{item.quantity?.toLocaleString() ?? "—"}</td>
                    <td className="border border-gray-300 px-1.5 py-1 text-right">
                      {item.unit_price != null ? `${item.currency || "USD"} ${item.unit_price.toFixed(2)}` : "—"}
                    </td>
                    <td className="border border-gray-300 px-1.5 py-1 text-right font-semibold">
                      {item.quantity != null && item.unit_price != null
                        ? `${item.currency || "USD"} ${(item.quantity * item.unit_price).toFixed(2)}`
                        : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="border border-gray-300 px-2 py-4 text-center text-gray-400">
                    {isStreaming ? <Dots label="품목 데이터 수신 중" /> : "—"}
                  </td>
                </tr>
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={4} className="border border-gray-300 px-1.5 py-1.5 text-right">TOTAL</td>
                  <td className="border border-gray-300 px-1.5 py-1.5 text-right text-blue-800">
                    {currency} {total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* 계약 조항들 */}
      <div className="divide-y divide-gray-200">
        {/* Article 2: Trade Terms */}
        {(data.trade_terms || isStreaming) && (
          <div className="px-5 py-3">
            <h4 className="font-bold text-gray-800 text-[10px] mb-2">Article 2. Trade Terms (Incoterms® 2020)</h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              <KV k="Incoterms" v={data.trade_terms?.incoterms} s={isStreaming} />
              <KV k="Port of Loading" v={data.trade_terms?.port_of_loading} s={isStreaming} />
              <KV k="Port of Discharge" v={data.trade_terms?.port_of_discharge} s={isStreaming} />
            </div>
          </div>
        )}

        {/* Article 3: Payment */}
        <div className="px-5 py-3">
          <h4 className="font-bold text-gray-800 text-[10px] mb-1">Article 3. Payment Terms</h4>
          {ct?.payment_method ? (
            <p className="text-gray-600 text-[10px]">{ct.payment_method}</p>
          ) : (
            <LineSkeleton n={1} s={isStreaming} />
          )}
        </div>

        {/* Article 4: Shipment */}
        <div className="px-5 py-3">
          <h4 className="font-bold text-gray-800 text-[10px] mb-1">Article 4. Shipment & Delivery</h4>
          {ct?.shipping_deadline ? (
            <p className="text-gray-600 text-[10px]">{ct.shipping_deadline}</p>
          ) : (
            <LineSkeleton n={1} s={isStreaming} />
          )}
        </div>

        {/* Article 5: Quality */}
        <div className="px-5 py-3">
          <h4 className="font-bold text-gray-800 text-[10px] mb-1">Article 5. Quality Inspection</h4>
          <p className="text-gray-600 text-[10px]">
            {ct?.quality_inspection || "선적 전 검사 (SGS 또는 동등 기관)"}
          </p>
        </div>

        {/* Article 6: Force Majeure */}
        <div className="px-5 py-3">
          <h4 className="font-bold text-gray-800 text-[10px] mb-1">Article 6. Force Majeure</h4>
          <p className="text-gray-600 text-[10px]">
            {ct?.force_majeure || "천재지변, 전쟁, 파업 등 불가항력 사유 발생 시 계약 이행 면제"}
          </p>
        </div>

        {/* Article 7: Governing Law */}
        <div className="px-5 py-3">
          <h4 className="font-bold text-gray-800 text-[10px] mb-1">Article 7. Governing Law</h4>
          <p className="text-gray-600 text-[10px]">{ct?.governing_law || "대한민국 법률"}</p>
        </div>

        {data.remarks && (
          <div className="px-5 py-3">
            <h4 className="font-bold text-gray-800 text-[10px] mb-1">Article 8. Remarks</h4>
            <p className="text-gray-600 text-[10px] whitespace-pre-wrap">{data.remarks}</p>
          </div>
        )}
      </div>

      {/* 서명 */}
      <div className="border-t border-gray-300 px-6 py-5 flex justify-between items-end">
        <div className="text-center">
          <p className="text-gray-400 mb-6 text-[9px]">Authorized Signature (Seller)</p>
          <div className="border-t border-gray-400 pt-1 w-28 text-[9px] text-gray-600">
            {data.seller?.company_name || "Seller"}
          </div>
        </div>
        <div className="text-center">
          <p className="text-gray-400 mb-6 text-[9px]">Authorized Signature (Buyer)</p>
          <div className="border-t border-gray-400 pt-1 w-28 text-[9px] text-gray-600">
            {data.buyer?.company_name || "Buyer"}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 컴플라이언스 뷰 (Rich UI) ---
function ComplianceView({
  data,
  isStreaming,
}: {
  data: ComplianceArgs;
  isStreaming: boolean;
}) {
  const hasResults = data.compliance_results && data.compliance_results.length > 0;
  const failCount = data.compliance_results?.filter((r) => r.status === "FAIL").length ?? 0;
  const cautionCount = data.compliance_results?.filter((r) => r.status === "CAUTION").length ?? 0;
  const passCount = data.compliance_results?.filter((r) => r.status === "PASS").length ?? 0;

  return (
    <div className="space-y-4">
      {/* 제품 헤더 */}
      <div
        className={`border rounded-xl p-4 ${
          data.overall_status === "FAIL"
            ? "bg-red-50 border-red-200"
            : data.overall_status === "PASS"
            ? "bg-emerald-50 border-emerald-200"
            : "bg-blue-50 border-blue-200"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm">
              {data.product_name || <Sk w={120} s={isStreaming} />}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              → {data.target_country ? COUNTRIES[data.target_country] || data.target_country : "..."}
            </p>
            {data.product_category && (
              <span className="inline-block mt-2 px-2.5 py-0.5 bg-white/70 text-gray-700 rounded-full text-xs font-medium border">
                {data.product_category}
              </span>
            )}
          </div>
          {data.overall_status && (
            <span
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-bold ${
                data.overall_status === "PASS"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {data.overall_status === "PASS" ? "✅ PASS" : "❌ FAIL"}
            </span>
          )}
        </div>

        {/* 요약 카운터 */}
        {hasResults && (
          <div className="flex gap-2 mt-3 text-xs">
            {failCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                ❌ FAIL {failCount}건
              </span>
            )}
            {cautionCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                ⚠️ 주의 {cautionCount}건
              </span>
            )}
            {passCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                ✅ PASS {passCount}건
              </span>
            )}
          </div>
        )}
      </div>

      {/* 성분별 상세 결과 (compliance_results 우선) */}
      {hasResults ? (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-2.5">📋 성분별 규제 검토 결과</h4>
          <div className="space-y-2">
            {data.compliance_results!.map((r, i) => (
              <div
                key={i}
                className={`rounded-xl border p-3 ${
                  r.status === "FAIL"
                    ? "bg-red-50 border-red-200"
                    : r.status === "CAUTION"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-emerald-50 border-emerald-100"
                }`}
              >
                {/* 성분명 + 상태 배지 */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-xs font-semibold text-gray-800">
                    {r.inci_name || "—"}
                    {r.percentage != null && (
                      <span className="ml-1.5 text-gray-500 font-normal">{r.percentage}%</span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                      r.status === "FAIL"
                        ? "bg-red-100 text-red-700"
                        : r.status === "CAUTION"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {r.status === "FAIL" ? "❌ FAIL" : r.status === "CAUTION" ? "⚠️ 주의" : "✅ PASS"}
                  </span>
                </div>

                {/* 위반 규정 */}
                {r.regulation && (
                  <p className="text-[11px] text-gray-600 mb-1">
                    <span className="font-semibold">규정:</span> {r.regulation}
                  </p>
                )}

                {/* Action Item */}
                {r.action_item && (
                  <div
                    className={`mt-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${
                      r.status === "FAIL"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    💡 {r.action_item}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : data.ingredients && data.ingredients.length > 0 ? (
        /* fallback: 결과 없을 때 단순 목록 */
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-2">📋 성분 검토 목록</h4>
          <div className="space-y-1.5">
            {data.ingredients.map((ing, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 text-sm px-3 py-2 bg-gray-50 rounded-lg border border-gray-100"
              >
                <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                <span className="font-mono text-xs text-gray-700 flex-1">{ing.inci_name || "..."}</span>
                {ing.percentage != null && (
                  <span className="text-xs text-gray-500 font-medium">{ing.percentage}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isStreaming && <Dots label="규제 데이터 분석 중" />}
    </div>
  );
}

// --- 유틸 컴포넌트 ---
function Sk({ w, s }: { w: number; s: boolean }) {
  if (!s) return <span className="text-gray-300">—</span>;
  return (
    <span
      className="inline-block bg-gray-200 rounded animate-pulse align-middle"
      style={{ width: w, height: 12 }}
    />
  );
}

function KV({ k, v, s }: { k: string; v?: string; s: boolean }) {
  return (
    <div className="flex gap-1 text-[10px]">
      <span className="text-gray-500 shrink-0">{k}:</span>
      <span className="font-medium text-gray-800">
        {v || (s ? <Sk w={60} s /> : "—")}
      </span>
    </div>
  );
}

function LineSkeleton({ n, s }: { n: number; s: boolean }) {
  if (!s) return null;
  return (
    <div className="space-y-1.5">
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-gray-200 rounded animate-pulse"
          style={{
            width: `${65 + Math.random() * 35}%`,
            animationDelay: `${i * 80}ms`,
          }}
        />
      ))}
    </div>
  );
}

function FullSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto" />
      <div className="border border-gray-200 rounded p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-3 bg-gray-100 rounded"
            style={{ width: `${60 + i * 10}%` }}
          />
        ))}
      </div>
      <div className="border border-gray-200 rounded p-4 space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}

function Dots({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-3 text-sm text-gray-400">
      {[0, 150, 300].map((d) => (
        <div
          key={d}
          className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
      <span className="ml-2">{label}...</span>
    </div>
  );
}
