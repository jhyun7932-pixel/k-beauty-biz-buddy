// Slash Command 팝업 메뉴

import type { SlashCommand } from "../../lib/chatCommands";

interface SlashCommandMenuProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
}

export default function SlashCommandMenu({ commands, selectedIndex, onSelect }: SlashCommandMenuProps) {
  if (!commands.length) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 max-h-[280px] overflow-y-auto">
      <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
        명령어
      </div>
      {commands.map((cmd, i) => (
        <button
          key={cmd.id}
          onClick={() => onSelect(cmd)}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
            i === selectedIndex
              ? "bg-violet-50 text-violet-900"
              : "hover:bg-gray-50 text-gray-700"
          }`}
        >
          <span className="text-base shrink-0">{cmd.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-violet-600">{cmd.command}</span>
              <span className="font-medium truncate">{cmd.label}</span>
            </div>
            <p className="text-xs text-gray-400 truncate">{cmd.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
