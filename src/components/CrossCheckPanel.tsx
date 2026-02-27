// src/components/CrossCheckPanel.tsx
import { crossCheckDocuments } from "../utils/crossCheck";
import { useTradeStore } from "../stores/tradeStore";

export function CrossCheckPanel() {
  const { currentDocument } = useTradeStore();

  // 현재는 단일 문서만 있으므로 자기 자신과 검증
  if (!currentDocument) return null;

  const result = crossCheckDocuments(
    currentDocument.document_type === "PI" ? currentDocument : null,
    currentDocument.document_type === "CI" ? currentDocument : null,
    currentDocument.document_type === "PL" ? currentDocument : null
  );

  // 경고만 있을 때 표시
  if (result.errors.length === 0 && result.warnings.length === 0) return null;

  return (
    <div className="mx-4 mb-4 rounded-xl border overflow-hidden">
      {/* 에러 */}
      {result.errors.length > 0 && (
        <div className="bg-red-50 border-b border-red-100 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-600 font-bold text-sm">Cross-check {result.errors.length}</span>
          </div>
          {result.errors.map((err, i) => (
            <div key={i} className="text-xs text-red-700 mb-1 flex items-start gap-1">
              <span className="shrink-0">&bull;</span>
              <span>{err.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* 경고 */}
      {result.warnings.length > 0 && (
        <div className="bg-yellow-50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-700 font-bold text-sm">Checklist {result.warnings.length}</span>
          </div>
          {result.warnings.map((warn, i) => (
            <div key={i} className="text-xs text-yellow-800 mb-1">
              <span className="font-medium">{warn.message}</span>
              <span className="text-yellow-600 ml-1">{warn.suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
