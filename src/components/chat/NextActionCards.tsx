// Next Action Cards - AI 응답 후 추천 액션 카드

import type { NextAction } from "../../lib/nextActions";

interface NextActionCardsProps {
  actions: NextAction[];
  onActionClick: (message: string) => void;
  disabled?: boolean;
}

export default function NextActionCards({ actions, onActionClick, disabled }: NextActionCardsProps) {
  if (!actions.length) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 pt-1.5 scrollbar-thin">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onActionClick(action.message)}
          disabled={disabled}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-violet-50 border border-violet-200 rounded-xl text-xs font-medium text-violet-700 hover:bg-violet-100 hover:border-violet-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>{action.icon}</span>
          <span className="whitespace-nowrap">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
