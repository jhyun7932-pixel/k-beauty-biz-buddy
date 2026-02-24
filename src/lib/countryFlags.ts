// Country code → flag emoji + name mapping
const COUNTRY_MAP: Record<string, { flag: string; name: string }> = {
  US: { flag: '🇺🇸', name: '미국' },
  JP: { flag: '🇯🇵', name: '일본' },
  CN: { flag: '🇨🇳', name: '중국' },
  HK: { flag: '🇭🇰', name: '홍콩' },
  TW: { flag: '🇹🇼', name: '대만' },
  VN: { flag: '🇻🇳', name: '베트남' },
  TH: { flag: '🇹🇭', name: '태국' },
  SG: { flag: '🇸🇬', name: '싱가포르' },
  MY: { flag: '🇲🇾', name: '말레이시아' },
  ID: { flag: '🇮🇩', name: '인도네시아' },
  PH: { flag: '🇵🇭', name: '필리핀' },
  AU: { flag: '🇦🇺', name: '호주' },
  DE: { flag: '🇩🇪', name: '독일' },
  FR: { flag: '🇫🇷', name: '프랑스' },
  GB: { flag: '🇬🇧', name: '영국' },
  CA: { flag: '🇨🇦', name: '캐나다' },
  AE: { flag: '🇦🇪', name: 'UAE' },
  SA: { flag: '🇸🇦', name: '사우디' },
  IN: { flag: '🇮🇳', name: '인도' },
  KR: { flag: '🇰🇷', name: '한국' },
  RU: { flag: '🇷🇺', name: '러시아' },
  BR: { flag: '🇧🇷', name: '브라질' },
  MX: { flag: '🇲🇽', name: '멕시코' },
};

export function getCountryFlag(code: string): string {
  return COUNTRY_MAP[code]?.flag ?? '🏳️';
}

export function getCountryName(code: string): string {
  return COUNTRY_MAP[code]?.name ?? code;
}

export function getCountryDisplay(code: string): string {
  const entry = COUNTRY_MAP[code];
  if (!entry) return `🏳️ ${code}`;
  return `${entry.flag} ${entry.name}`;
}

export const COUNTRY_OPTIONS = Object.entries(COUNTRY_MAP).map(([code, { flag, name }]) => ({
  value: code,
  label: `${flag} ${name}`,
}));

// ── 바이어 폼 전용: K-뷰티 주요 11개국 + 기타 ──────────────────────
// DB 저장값: 영어 이름 (Japan, United States, ...)
export const BUYER_COUNTRY_OPTIONS = [
  { value: 'United States', flag: '🇺🇸', label: '🇺🇸 미국 (United States)' },
  { value: 'European Union', flag: '🇪🇺', label: '🇪🇺 유럽 (European Union)' },
  { value: 'China',          flag: '🇨🇳', label: '🇨🇳 중국 (China)' },
  { value: 'Japan',          flag: '🇯🇵', label: '🇯🇵 일본 (Japan)' },
  { value: 'Thailand',       flag: '🇹🇭', label: '🇹🇭 태국 (Thailand)' },
  { value: 'Vietnam',        flag: '🇻🇳', label: '🇻🇳 베트남 (Vietnam)' },
  { value: 'Indonesia',      flag: '🇮🇩', label: '🇮🇩 인도네시아 (Indonesia)' },
  { value: 'Philippines',    flag: '🇵🇭', label: '🇵🇭 필리핀 (Philippines)' },
  { value: 'Malaysia',       flag: '🇲🇾', label: '🇲🇾 말레이시아 (Malaysia)' },
  { value: 'Singapore',      flag: '🇸🇬', label: '🇸🇬 싱가포르 (Singapore)' },
  { value: 'UAE',            flag: '🇦🇪', label: '🇦🇪 UAE' },
  { value: 'Other',          flag: '🌍', label: '🌍 기타 (Other)' },
] as const;

/** DB에 저장된 영어 이름 → "🇯🇵 일본 (Japan)" 형식으로 표시 */
export function getBuyerCountryDisplay(value: string): string {
  const found = BUYER_COUNTRY_OPTIONS.find((c) => c.value === value);
  if (found) return found.label;
  // 기존 코드 형식(JP, US...) 폴백
  const byCode = COUNTRY_MAP[value.toUpperCase()];
  if (byCode) return `${byCode.flag} ${byCode.name}`;
  return `🌍 ${value}`;
}
