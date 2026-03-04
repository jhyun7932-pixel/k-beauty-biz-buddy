import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useExportProjects, type ExportProject } from "@/hooks/useExportProjects";
import { useBuyers } from "@/hooks/useBuyers";
import { useAppStore } from "@/stores/appStore";
import { useTradeStore } from "@/stores/tradeStore";

// ── 상수 정의 ──────────────────────────────────────────
const STAGES = [
  { key: "proposal", label: "탐색", icon: "🔍", color: "blue",
    desc: "바이어 검증 · 첫 제안",
    docs: ["PROPOSAL", "NDA", "EMAIL"],
    hint: "바이어에게 첫 제안서를 보내세요. B2B Proposal 또는 NDA를 작성해드릴까요?" },
  { key: "sample", label: "샘플", icon: "📦", color: "yellow",
    desc: "샘플 발송 · 피드백",
    docs: ["PI", "EMAIL"],
    hint: "샘플 PI를 작성하고 발송 준비를 하세요. 이전 제안 내용을 기반으로 샘플 PI를 만들어드릴까요?" },
  { key: "order", label: "협상·오더", icon: "💬", color: "violet",
    desc: "가격협상 · PI 확정",
    docs: ["PI", "CONTRACT", "EMAIL"],
    hint: "본오더 PI를 작성하세요. 수량과 단가가 확정되면 PI → CI → PL 순서로 진행합니다." },
  { key: "shipping", label: "서류·선적", icon: "🚢", color: "orange",
    desc: "CI · PL · Cross-check",
    docs: ["CI", "PL", "EMAIL"],
    hint: "CI와 PL을 작성하고 Cross-check를 완료하세요. 서류 정합성이 확인되면 선적이 가능합니다." },
  { key: "done", label: "완료", icon: "✅", color: "green",
    desc: "대금수취 · 재오더",
    docs: ["EMAIL"],
    hint: "수출이 완료됐습니다! 재오더 제안 이메일을 보내볼까요?" },
] as const;

type StageKey = typeof STAGES[number]["key"];

const FLAG: Record<string, string> = {
  "United States": "🇺🇸", "China": "🇨🇳", "Japan": "🇯🇵",
  "Vietnam": "🇻🇳", "UAE": "🇦🇪", "Saudi Arabia": "🇸🇦",
  "Singapore": "🇸🇬", "Malaysia": "🇲🇾", "Indonesia": "🇮🇩",
  "Thailand": "🇹🇭", "Philippines": "🇵🇭", "Germany": "🇩🇪",
  "France": "🇫🇷", "UK": "🇬🇧", "Australia": "🇦🇺", "Korea": "🇰🇷",
};

const STAGE_COLOR: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  yellow: "bg-yellow-100 text-yellow-700",
  violet: "bg-violet-100 text-violet-700",
  orange: "bg-orange-100 text-orange-700",
  green: "bg-green-100 text-green-700",
};

// ── 메인 컴포넌트 ──────────────────────────────────────
export default function ExportProjectsPage() {
  const { projects, loading, createProject, updateStage, updateProject, deleteProject } = useExportProjects();
  const { buyers } = useBuyers();
  const { productEntries } = useAppStore();

  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedProject, setSelectedProject] = useState<ExportProject | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const activeProjects = projects.filter(p => p.stage !== "done");
  const doneProjects = projects.filter(p => p.stage === "done");

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        딜 룸을 불러오는 중...
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {view === "list" ? (
        <DealListView
          activeProjects={activeProjects}
          doneProjects={doneProjects}
          onSelectProject={(p) => { setSelectedProject(p); setView("detail"); }}
          onNewProject={() => setShowNewModal(true)}
        />
      ) : selectedProject ? (
        <DealRoomView
          project={projects.find(p => p.id === selectedProject.id) || selectedProject}
          onBack={() => { setView("list"); setSelectedProject(null); }}
          onUpdateStage={async (stage) => {
            await updateStage(selectedProject.id, stage as any);
            setSelectedProject(prev => prev ? { ...prev, stage: stage as any } : null);
          }}
          onUpdateProject={async (updates) => {
            await updateProject(selectedProject.id, updates);
            setSelectedProject(prev => prev ? { ...prev, ...updates } : null);
          }}
        />
      ) : null}

      {showNewModal && (
        <NewDealModal
          buyers={buyers}
          products={productEntries}
          onClose={() => setShowNewModal(false)}
          onCreate={async (data) => {
            const project = await createProject(data);
            if (project) {
              setShowNewModal(false);
              setSelectedProject(project as ExportProject);
              setView("detail");
            }
          }}
        />
      )}
    </div>
  );
}

// ── 딜 목록 화면 ───────────────────────────────────────
function DealListView({ activeProjects, doneProjects, onSelectProject, onNewProject }: {
  activeProjects: ExportProject[];
  doneProjects: ExportProject[];
  onSelectProject: (p: ExportProject) => void;
  onNewProject: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🚀 딜 룸</h1>
            <p className="text-sm text-gray-500 mt-1">
              진행중 <span className="font-semibold text-violet-600">{activeProjects.length}건</span>
              {doneProjects.length > 0 && (
                <> · 완료 <span className="font-semibold text-green-600">{doneProjects.length}건</span></>
              )}
            </p>
          </div>
          <button
            onClick={onNewProject}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors"
          >
            + 새 딜 시작
          </button>
        </div>

        {/* 진행중 딜 */}
        {activeProjects.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-4">🌏</p>
            <p className="text-lg font-medium">아직 진행중인 딜이 없습니다</p>
            <p className="text-sm mt-2">새 딜을 시작해서 수출 여정을 시작하세요</p>
            <button
              onClick={onNewProject}
              className="mt-4 px-6 py-2 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700"
            >
              첫 딜 시작하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeProjects.map(project => (
              <DealCard
                key={project.id}
                project={project}
                onClick={() => onSelectProject(project)}
              />
            ))}
          </div>
        )}

        {/* 완료된 딜 */}
        {doneProjects.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              완료된 딜
            </h2>
            <div className="space-y-3">
              {doneProjects.map(project => (
                <DealCard
                  key={project.id}
                  project={project}
                  onClick={() => onSelectProject(project)}
                  isDone
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 딜 카드 ────────────────────────────────────────────
function DealCard({ project, onClick, isDone = false }: {
  project: ExportProject;
  onClick: () => void;
  isDone?: boolean;
}) {
  const stage = STAGES.find(s => s.key === project.stage) || STAGES[0];
  const stageIdx = STAGES.findIndex(s => s.key === project.stage);
  const docs = (project.documents as any[]) || [];
  const docTypes = docs.map((d: any) => d.doc_type);
  const flag = FLAG[project.buyer_country || ""] || FLAG[project.buyer_name || ""] || "🌏";

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border cursor-pointer transition-all hover:shadow-md hover:border-violet-200 ${
        isDone ? "opacity-60 border-gray-100" : "border-gray-200"
      }`}
    >
      <div className="p-5">
        {/* 상단: 바이어 정보 */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{flag}</span>
              <h3 className="font-semibold text-gray-900 text-base">
                {project.buyer_name || project.project_name}
              </h3>
            </div>
            {project.products && (project.products as any[]).length > 0 && (
              <p className="text-xs text-gray-500 mt-1 ml-7">
                {(project.products as any[]).slice(0, 2).map((p: any) => p.productName || p.name_en || p.name || "").join(" · ")}
                {(project.products as any[]).length > 2 && ` 외 ${(project.products as any[]).length - 2}건`}
              </p>
            )}
          </div>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STAGE_COLOR[stage.color]}`}>
            {stage.icon} {stage.label}
          </span>
        </div>

        {/* 진행 바 */}
        <div className="flex items-center gap-1 mb-3">
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <div className={`h-1.5 w-full rounded-full transition-all ${
                i < stageIdx ? "bg-violet-400" :
                i === stageIdx ? "bg-violet-600" :
                "bg-gray-100"
              }`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mb-3">
          {STAGES.map((s, i) => (
            <span key={s.key} className={i === stageIdx ? "text-violet-600 font-medium" : ""}>
              {s.icon}
            </span>
          ))}
        </div>

        {/* 하단: 서류 상태 + 금액 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {["PI", "CI", "PL"].map(type => {
              const has = docTypes.includes(type);
              return (
                <span key={type} className={`px-2 py-0.5 text-xs rounded-md font-medium ${
                  has ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                }`}>
                  {type} {has ? "✓" : "–"}
                </span>
              );
            })}
            {docs.length > 0 && !isDone && (
              <span className="text-xs text-gray-400">{docs.length}개 문서</span>
            )}
          </div>
          <div className="text-right">
            {project.total_amount ? (
              <span className="text-sm font-semibold text-gray-700">
                {project.currency || "USD"} {project.total_amount.toLocaleString()}
              </span>
            ) : (
              <span className="text-xs text-gray-400">금액 미정</span>
            )}
          </div>
        </div>

        {/* AI 힌트 (완료 아닐 때만) */}
        {!isDone && (
          <div className="mt-3 p-2.5 bg-violet-50 rounded-xl">
            <p className="text-xs text-violet-600">
              🤖 {stage.hint.slice(0, 60)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 딜 룸 상세 화면 ────────────────────────────────────
function DealRoomView({ project, onBack, onUpdateStage, onUpdateProject }: {
  project: ExportProject;
  onBack: () => void;
  onUpdateStage: (stage: StageKey) => Promise<void>;
  onUpdateProject: (updates: Partial<ExportProject>) => Promise<void>;
}) {
  const stage = STAGES.find(s => s.key === project.stage) || STAGES[0];
  const stageIdx = STAGES.findIndex(s => s.key === project.stage);
  const docs = (project.documents as any[]) || [];

  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [memo, setMemo] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [timeline, setTimeline] = useState<any[]>(
    (project.timeline as any[]) || []
  );

  // AI 메모 응답 요청
  async function handleMemoSubmit() {
    if (!memo.trim() || loadingAI) return;
    setLoadingAI(true);
    setAiResponse(null);

    const currentMemo = memo;
    setMemo("");

    // 타임라인에 메모 즉시 추가
    const memoEntry = {
      id: crypto.randomUUID(),
      type: "memo",
      content: currentMemo,
      created_at: new Date().toISOString(),
    };
    const timelineWithMemo = [...timeline, memoEntry];
    setTimeline(timelineWithMemo);
    await onUpdateProject({ timeline: timelineWithMemo } as any);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const contextMessage = `당신은 K-뷰티 수출 전문가입니다.

딜 정보:
- 바이어: ${project.buyer_name || project.project_name}
- 현재 단계: ${stage.label} (${stage.desc})
- 저장된 서류: ${docs.map((d: any) => d.doc_type).join(", ") || "없음"}

담당자가 전한 오늘의 상황:
"${currentMemo}"

위 상황에서 무역 전문가로서 다음 액션을 구체적으로 안내해줘.
어떤 서류가 필요한지, 다음 단계는 무엇인지, 주의사항은 무엇인지
한국어로 3~5줄로 간결하게 답해줘.`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trade-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: contextMessage }],
            mode: "deal_room_advice",
          }),
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("event:")) continue;

          if (trimmed.startsWith("data: ")) {
            const jsonStr = trimmed.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const data = JSON.parse(jsonStr);
              // SSE format: event: text_delta → data: {"text":"..."}
              if (data.text) {
                fullText += data.text;
                setAiResponse(fullText);
              } else if (data.delta?.text) {
                fullText += data.delta.text;
                setAiResponse(fullText);
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }

      // 스트리밍 완료 후 AI 응답 타임라인 저장
      if (fullText) {
        const aiEntry = {
          id: crypto.randomUUID(),
          type: "ai_response",
          content: fullText,
          created_at: new Date().toISOString(),
        };
        const finalTimeline = [...timelineWithMemo, aiEntry];
        setTimeline(finalTimeline);
        await onUpdateProject({ timeline: finalTimeline } as any);
      }

    } catch (error) {
      console.error("Deal room AI error:", error);
      setAiResponse(`오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    } finally {
      setLoadingAI(false);
    }
  }

  const navigate = useNavigate();
  const setPendingAutoMessage = useTradeStore((s) => s.setPendingAutoMessage);

  function handleAIRequest() {
    const autoMessage = `[딜룸 AI 안내 요청]
바이어: ${project.buyer_name}
현재 단계: ${stage.label}
저장된 서류: ${docs.map((d: any) => d.doc_type).join(", ") || "없음"}

${stage.hint}

위 상황에서 지금 당장 해야 할 구체적인 다음 액션을 알려줘.`;

    setPendingAutoMessage(autoMessage);
    navigate('/home');
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 상단 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              ← 목록
            </button>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">
                {FLAG[project.buyer_country || ""] || FLAG[project.buyer_name || ""] || "🌏"} {project.buyer_name || project.project_name}
              </h2>
            </div>
          </div>

          {/* 단계 진행바 */}
          <div className="flex items-center gap-1 flex-1 mx-6 max-w-sm">
            {STAGES.map((s, i) => (
              <button
                key={s.key}
                onClick={() => onUpdateStage(s.key)}
                title={s.label}
                className={`flex-1 h-2 rounded-full transition-all hover:opacity-80 ${
                  i < stageIdx ? "bg-violet-400" :
                  i === stageIdx ? "bg-violet-600" :
                  "bg-gray-200"
                }`}
              />
            ))}
          </div>

          <span className={`px-3 py-1 text-xs font-medium rounded-full ${STAGE_COLOR[stage.color]}`}>
            {stage.icon} {stage.label}
          </span>
        </div>
      </div>

      {/* 3컬럼 메인 */}
      <div className="flex-1 flex overflow-hidden">

        {/* 좌측: 단계 네비 + AI 안내 */}
        <div className="w-44 flex-shrink-0 bg-gray-50 border-r border-gray-100 flex flex-col overflow-y-auto">
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">단계</p>
            {STAGES.map((s, i) => (
              <button
                key={s.key}
                onClick={() => onUpdateStage(s.key)}
                className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-all text-sm ${
                  s.key === project.stage
                    ? "bg-violet-600 text-white font-medium"
                    : i < stageIdx
                    ? "text-gray-400 hover:bg-gray-200"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span className="mr-1.5">{s.icon}</span>
                <span>{s.label}</span>
                {i < stageIdx && <span className="ml-1 text-xs">✓</span>}
              </button>
            ))}
          </div>

          {/* AI 안내 박스 */}
          <div className="p-3 mt-auto">
            <div className="bg-violet-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-violet-600 mb-1.5">🤖 AI 안내</p>
              <p className="text-xs text-violet-700 leading-relaxed">
                {stage.hint}
              </p>
              <button
                onClick={handleAIRequest}
                className="mt-2 w-full text-xs bg-violet-600 text-white py-1.5 rounded-lg hover:bg-violet-700"
              >
                AI에게 요청 →
              </button>
            </div>
          </div>
        </div>

        {/* 중앙: 문서 리스트 + 오늘의 상황 메모 */}
        <div className="w-56 flex-shrink-0 border-r border-gray-100 flex flex-col overflow-hidden">

          {/* 문서 리스트 */}
          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">문서</p>

            {stage.docs.map(docType => {
              const savedDoc = docs.find((d: any) => d.doc_type === docType);
              return (
                <button
                  key={docType}
                  onClick={() => savedDoc && setSelectedDoc(savedDoc)}
                  className={`w-full text-left p-3 rounded-xl mb-2 border transition-all ${
                    savedDoc
                      ? "border-green-200 bg-green-50 hover:border-green-300"
                      : "border-gray-100 bg-gray-50 opacity-60"
                  } ${selectedDoc?.doc_type === docType ? "ring-2 ring-violet-400" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {docType === "EMAIL" ? "📧" :
                       docType === "NDA" ? "🔏" :
                       docType === "CONTRACT" ? "📑" : "📄"} {docType}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                      savedDoc
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      {savedDoc ? "✓ 저장" : "미작성"}
                    </span>
                  </div>
                  {savedDoc && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(savedDoc.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  )}
                </button>
              );
            })}

            {/* Cross-check 결과 */}
            {project.stage === "shipping" && (
              <CrossCheckBadge docs={docs} />
            )}
          </div>

          {/* 오늘의 상황 메모 */}
          <div className="flex-shrink-0 border-t border-gray-100 p-3">
            <p className="text-xs font-semibold text-gray-400 mb-2">📝 오늘의 상황</p>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="바이어에게서 연락 왔나요? 진행 상황을 메모하면 AI가 다음 액션을 안내해드려요."
              className="w-full text-xs border border-gray-200 rounded-xl p-2.5 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <button
              onClick={handleMemoSubmit}
              disabled={!memo.trim() || loadingAI}
              className="w-full mt-2 py-2 bg-violet-600 text-white text-xs font-medium rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {loadingAI ? "AI 분석중..." : "🤖 AI에게 물어보기"}
            </button>
          </div>
        </div>

        {/* 우측: 문서 미리보기 OR AI 응답 OR 타임라인 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* AI 응답 표시 */}
          {(aiResponse || loadingAI) && (
            <div className="mb-4 bg-violet-50 rounded-2xl p-4 border border-violet-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-violet-700">🤖 AI 분석</span>
                {loadingAI && (
                  <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className="text-sm text-violet-800 leading-relaxed prose prose-sm prose-violet max-w-none">
                <ReactMarkdown>{aiResponse || "분석중..."}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* 선택된 문서 미리보기 */}
          {selectedDoc ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">{selectedDoc.doc_type}</h3>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  닫기
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="font-medium text-gray-700 mb-2 text-sm">{selectedDoc.doc_number}</p>
                <p className="text-xs text-gray-500">저장일: {new Date(selectedDoc.created_at).toLocaleDateString("ko-KR")}</p>
                {/* Seller/Buyer 요약 */}
                {selectedDoc.data?.seller && (
                  <div className="grid grid-cols-2 gap-3 mt-3 border-t border-gray-100 pt-3">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Seller</p>
                      <p className="text-xs font-medium text-gray-800">{selectedDoc.data.seller.company_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Buyer</p>
                      <p className="text-xs font-medium text-gray-800">{selectedDoc.data.buyer?.company_name}</p>
                    </div>
                  </div>
                )}
                {/* 품목 요약 */}
                {selectedDoc.data?.items && selectedDoc.data.items.length > 0 && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Items</p>
                    {selectedDoc.data.items.map((item: any, i: number) => (
                      <p key={i} className="text-xs text-gray-600">
                        {item.product_name} × {item.quantity?.toLocaleString()}
                        {item.unit_price != null && ` @ ${item.currency ?? "USD"} ${item.unit_price.toFixed(2)}`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 타임라인 */
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">활동 기록</p>
              {timeline.length === 0 ? (
                <div className="text-center py-12 text-gray-300">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm">아직 기록이 없습니다</p>
                  <p className="text-xs mt-1">오늘의 상황을 메모해보세요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...timeline].reverse().map((entry: any) => (
                    <div key={entry.id} className={`rounded-xl p-3 text-sm ${
                      entry.type === "ai_response"
                        ? "bg-violet-50 border border-violet-100"
                        : "bg-gray-50 border border-gray-100"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">
                          {entry.type === "ai_response" ? "🤖 AI" : "📝 메모"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(entry.created_at).toLocaleString("ko-KR", {
                            month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                      </div>
                      {entry.type === "ai_response" ? (
                        <div className="text-xs text-gray-700 leading-relaxed prose prose-xs max-w-none">
                          <ReactMarkdown>{entry.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                          {entry.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Cross-check 뱃지 ───────────────────────────────────
function CrossCheckBadge({ docs }: { docs: any[] }) {
  const docTypes = docs.map((d: any) => d.doc_type);
  const hasPI = docTypes.includes("PI");
  const hasCI = docTypes.includes("CI");
  const hasPL = docTypes.includes("PL");
  const allDone = hasPI && hasCI && hasPL;

  return (
    <div className={`p-3 rounded-xl border mt-2 ${
      allDone ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
    }`}>
      <p className={`text-xs font-semibold mb-1 ${allDone ? "text-green-700" : "text-yellow-700"}`}>
        ⚡ Cross-check
      </p>
      <div className="space-y-0.5">
        {([["PI", hasPI], ["CI", hasCI], ["PL", hasPL]] as [string, boolean][]).map(([type, has]) => (
          <p key={type} className="text-xs text-gray-600">
            {has ? "✅" : "❌"} {type}
          </p>
        ))}
      </div>
      {allDone && (
        <p className="text-xs text-green-600 mt-1 font-medium">정합성 검증 준비 완료</p>
      )}
    </div>
  );
}

// ── 새 딜 모달 ─────────────────────────────────────────
function NewDealModal({ buyers, products, onClose, onCreate }: {
  buyers: any[];
  products: any[];
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
}) {
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [stage, setStage] = useState<StageKey>("proposal");
  const [memoText, setMemoText] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!selectedBuyer) return;
    setCreating(true);
    await onCreate({
      project_name: `${selectedBuyer.company_name} · ${new Date().toLocaleDateString("ko-KR")}`,
      buyer_id: selectedBuyer.id,
      buyer_name: selectedBuyer.company_name,
      buyer_country: selectedBuyer.country || "",
      stage,
      products: selectedProducts.map(p => ({
        id: p.id,
        productName: p.productName,
        name_en: p.productName,
      })),
      notes: memoText,
      documents: [],
      timeline: memoText ? [{
        id: crypto.randomUUID(),
        type: "memo",
        content: memoText,
        created_at: new Date().toISOString(),
      }] : [],
    });
    setCreating(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🚀 새 딜 시작</h2>

          {/* 바이어 선택 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">바이어 선택 *</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {buyers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">등록된 바이어가 없습니다. 마이 데이터에서 먼저 추가하세요.</p>
              ) : (
                buyers.map(buyer => (
                  <button
                    key={buyer.id}
                    onClick={() => setSelectedBuyer(buyer)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      selectedBuyer?.id === buyer.id
                        ? "border-violet-400 bg-violet-50 text-violet-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="mr-2">{FLAG[buyer.country] || "🌏"}</span>
                    <span className="font-medium">{buyer.company_name}</span>
                    <span className="text-gray-400 text-xs ml-2">{buyer.country}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 제품 선택 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">제품 선택</label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {products.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">등록된 제품이 없습니다.</p>
              ) : (
                products.map(product => {
                  const selected = selectedProducts.some(p => p.id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProducts(prev =>
                        selected ? prev.filter(p => p.id !== product.id) : [...prev, product]
                      )}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-all ${
                        selected
                          ? "border-violet-400 bg-violet-50 text-violet-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {selected ? "✓ " : ""}{product.productName}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 시작 단계 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">시작 단계</label>
            <div className="grid grid-cols-5 gap-1">
              {STAGES.map(s => (
                <button
                  key={s.key}
                  onClick={() => setStage(s.key)}
                  className={`py-1.5 rounded-lg text-xs transition-all ${
                    stage === s.key
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s.icon}<br/>{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              첫 메모 (선택)
            </label>
            <textarea
              value={memoText}
              onChange={e => setMemoText(e.target.value)}
              placeholder="이 딜을 시작하게 된 배경이나 특이사항을 메모하세요"
              className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              disabled={!selectedBuyer || creating}
              className="flex-1 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 disabled:opacity-50"
            >
              {creating ? "생성중..." : "딜 시작하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
