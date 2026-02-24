// FLONIX Partial JSON Parser
// 불완전한 JSON을 실시간 복구 파싱하여 Progressive Rendering 지원

export interface PartialParseResult {
  parsed: unknown | null;
  success: boolean;
  availableKeys: string[];
  isComplete: boolean;
  progress: number;
}

export function parsePartialJson(input: string): PartialParseResult {
  if (!input || !input.trim()) {
    return { parsed: null, success: false, availableKeys: [], isComplete: false, progress: 0 };
  }

  const trimmed = input.trim();

  // 1) 완전한 JSON 시도
  try {
    const complete = JSON.parse(trimmed);
    return {
      parsed: complete,
      success: true,
      availableKeys: isObj(complete) ? Object.keys(complete) : [],
      isComplete: true,
      progress: 100,
    };
  } catch {
    // partial 진행
  }

  // 2) Partial 복구
  const repaired = repair(trimmed);
  try {
    const parsed = JSON.parse(repaired);
    return {
      parsed,
      success: true,
      availableKeys: isObj(parsed) ? Object.keys(parsed) : [],
      isComplete: false,
      progress: estimateProgress(trimmed),
    };
  } catch {
    return {
      parsed: null,
      success: false,
      availableKeys: extractTopKeys(trimmed),
      isComplete: false,
      progress: estimateProgress(trimmed),
    };
  }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function repair(s: string): string {
  // 끝의 불완전한 key-value 제거
  for (let i = 0; i < 3; i++) {
    const prev = s;
    s = s.replace(/,\s*"[^"]*"\s*:\s*$/, "");
    s = s.replace(/,\s*"[^"]*"\s*$/, "");
    s = s.replace(/,\s*"[^"]*$/, "");
    s = s.replace(/:\s*(tru|fals|nul)$/i, ": null");
    if (s === prev) break;
  }

  // 열린 문자열 닫기
  let inStr = false;
  let esc = false;
  for (const c of s) {
    if (esc) { esc = false; continue; }
    if (c === "\\" && inStr) { esc = true; continue; }
    if (c === '"') inStr = !inStr;
  }
  if (inStr) {
    if (s.endsWith("\\")) s = s.slice(0, -1);
    s += '"';
  }

  // 끝 콤마 제거
  s = s.replace(/,\s*$/, "");

  // 열린 괄호 닫기
  const stack: string[] = [];
  inStr = false;
  esc = false;
  for (const c of s) {
    if (esc) { esc = false; continue; }
    if (c === "\\" && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") stack.push("}");
    else if (c === "[") stack.push("]");
    else if ((c === "}" || c === "]") && stack.length && stack[stack.length - 1] === c) stack.pop();
  }
  let result = s.replace(/,\s*$/, "");
  while (stack.length) result += stack.pop();
  return result;
}

function estimateProgress(s: string): number {
  let opens = 0, closes = 0, inStr = false, esc = false;
  for (const c of s) {
    if (esc) { esc = false; continue; }
    if (c === "\\" && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{" || c === "[") opens++;
    if (c === "}" || c === "]") closes++;
  }
  if (!opens) return 0;
  return Math.min(Math.round((closes / opens) * 80 + Math.min(s.length / 2000, 1) * 20), 99);
}

function extractTopKeys(input: string): string[] {
  const keys: string[] = [];
  const re = /"([^"]+)"\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) keys.push(m[1]);
  return [...new Set(keys)].slice(0, 10);
}

export class StreamingJsonAccumulator {
  private buf = "";
  private last: PartialParseResult | null = null;

  append(chunk: string): PartialParseResult {
    this.buf += chunk;
    this.last = parsePartialJson(this.buf);
    return this.last;
  }

  getBuffer() { return this.buf; }
  getLast() { return this.last; }
  reset() { this.buf = ""; this.last = null; }

  finalize(): unknown {
    try { return JSON.parse(this.buf); }
    catch { return this.last?.parsed ?? null; }
  }
}
