// 파일 첨부 미리보기 스트립

interface ChatFileAttachmentProps {
  files: File[];
  onRemove: (index: number) => void;
}

function getFileIcon(type: string): string {
  if (type === "application/pdf") return "📕";
  if (type.startsWith("image/")) return "🖼️";
  return "📎";
}

export default function ChatFileAttachment({ files, onRemove }: ChatFileAttachmentProps) {
  if (!files.length) return null;

  return (
    <div className="flex gap-2 px-3 py-2 overflow-x-auto">
      {files.map((file, i) => (
        <div
          key={`${file.name}-${i}`}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-600 max-w-[180px]"
        >
          <span>{getFileIcon(file.type)}</span>
          <span className="truncate flex-1">{file.name}</span>
          <button
            onClick={() => onRemove(i)}
            className="shrink-0 w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-300 text-gray-400 hover:text-gray-600 transition-colors text-[10px]"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
