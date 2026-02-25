// @멘션 팝업 메뉴

export interface MentionItem {
  id: string;
  name: string;
  type: "buyer" | "product";
  detail?: string;
}

interface MentionMenuProps {
  items: MentionItem[];
  selectedIndex: number;
  onSelect: (item: MentionItem) => void;
}

export default function MentionMenu({ items, selectedIndex, onSelect }: MentionMenuProps) {
  if (!items.length) return null;

  const buyers = items.filter((i) => i.type === "buyer");
  const products = items.filter((i) => i.type === "product");

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 max-h-[280px] overflow-y-auto">
      {buyers.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 flex items-center gap-1">
            <span>🏢</span> 바이어
          </div>
          {buyers.map((item) => {
            const globalIdx = items.indexOf(item);
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  globalIdx === selectedIndex
                    ? "bg-violet-50 text-violet-900"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                  {item.name.charAt(0)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  {item.detail && <p className="text-xs text-gray-400 truncate">{item.detail}</p>}
                </div>
              </button>
            );
          })}
        </>
      )}
      {products.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 flex items-center gap-1">
            <span>📦</span> 제품
          </div>
          {products.map((item) => {
            const globalIdx = items.indexOf(item);
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  globalIdx === selectedIndex
                    ? "bg-violet-50 text-violet-900"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px] shrink-0">
                  📦
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  {item.detail && <p className="text-xs text-gray-400 truncate">{item.detail}</p>}
                </div>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
