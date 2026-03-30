// Slash Command 정의

export interface SlashCommand {
  id: string;
  command: string;
  label: string;
  description: string;
  icon: string;
  message: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "pi",
    command: "/PI",
    label: "Proforma Invoice",
    description: "PI 견적서 생성",
    icon: "📄",
    message: "PI(Proforma Invoice)를 작성해줘",
  },
  {
    id: "ci",
    command: "/CI",
    label: "Commercial Invoice",
    description: "CI 상업송장 생성",
    icon: "📋",
    message: "CI(Commercial Invoice)를 작성해줘",
  },
  {
    id: "pl",
    command: "/PL",
    label: "Packing List",
    description: "PL 패킹리스트 생성",
    icon: "📦",
    message: "PL(Packing List)를 작성해줘",
  },
  {
    id: "nda",
    command: "/NDA",
    label: "비밀유지계약서",
    description: "NDA 작성",
    icon: "🔒",
    message: "NDA(비밀유지계약서)를 작성해줘",
  },
  {
    id: "contract",
    command: "/CONTRACT",
    label: "매매계약서",
    description: "Sales Contract 작성",
    icon: "📑",
    message: "매매계약서(Sales Contract)를 작성해줘",
  },
  {
    id: "email",
    command: "/EMAIL",
    label: "이메일 작성",
    description: "바이어 이메일 작성",
    icon: "📧",
    message: "바이어에게 보낼 이메일을 작성해줘",
  },
  {
    id: "compliance",
    command: "/COMPLIANCE",
    label: "규제 확인",
    description: "수출 규제 컴플라이언스 체크",
    icon: "🔍",
    message: "이 제품의 수출 규제 적합성을 확인해줘",
  },
  {
    id: "help",
    command: "/도움말",
    label: "도움말",
    description: "사용 가능한 명령어 안내",
    icon: "❓",
    message: "Fleety AI가 할 수 있는 기능들을 알려줘",
  },
];

export function filterCommands(query: string): SlashCommand[] {
  if (!query) return SLASH_COMMANDS;
  const q = query.toLowerCase();
  return SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.command.toLowerCase().includes(q) ||
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q),
  );
}
