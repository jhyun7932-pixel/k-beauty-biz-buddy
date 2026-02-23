/**
 * Comprehensive INCI ↔ Korean name mapping for 100% RulePack matching.
 * Key: uppercase INCI name, Value: Korean name
 */
export const INCI_KOREAN_MAP: Record<string, string> = {
  // ── 기본 성분 ──
  'WATER': '정제수',
  'AQUA': '정제수',
  'GLYCERIN': '글리세린',
  'BUTYLENE GLYCOL': '부틸렌글라이콜',
  'PROPANEDIOL': '프로판다이올',
  '1,2-HEXANEDIOL': '1,2-헥산다이올',
  'PENTYLENE GLYCOL': '펜틸렌글라이콜',
  'DIPROPYLENE GLYCOL': '디프로필렌글라이콜',

  // ── 보습/컨디셔닝 ──
  'NIACINAMIDE': '나이아신아마이드',
  'SODIUM HYALURONATE': '히알루론산나트륨',
  'HYALURONIC ACID': '히알루론산',
  'PANTHENOL': '판테놀',
  'ALLANTOIN': '알란토인',
  'BETAINE': '베타인',
  'UREA': '우레아',
  'SQUALANE': '스쿠알란',
  'CERAMIDE NP': '세라마이드엔피',
  'CERAMIDE AP': '세라마이드에이피',
  'CERAMIDE EOP': '세라마이드이오피',
  'CHOLESTEROL': '콜레스테롤',
  'PHYTOSPHINGOSINE': '파이토스핑고신',
  'TREHALOSE': '트레할로스',
  'GLYCERYL GLUCOSIDE': '글리세릴글루코사이드',

  // ── 비타민/기능성 ──
  'RETINOL': '레티놀',
  'RETINYL PALMITATE': '레티닐팔미테이트',
  'ASCORBIC ACID': '아스코르빅애씨드',
  'ASCORBYL GLUCOSIDE': '아스코빌글루코사이드',
  'TOCOPHEROL': '토코페롤',
  'TOCOPHERYL ACETATE': '토코페릴아세테이트',
  'ADENOSINE': '아데노신',
  'TRANEXAMIC ACID': '트라넥사믹애씨드',
  'ALPHA-ARBUTIN': '알파알부틴',
  'ARBUTIN': '알부틴',
  'BAKUCHIOL': '바쿠치올',

  // ── 미백/피부개선 ──
  'HYDROQUINONE': '하이드로퀴논',
  'KOJIC ACID': '코직애씨드',
  'AZELAIC ACID': '아젤라익애씨드',

  // ── 식물 추출물 ──
  'CENTELLA ASIATICA EXTRACT': '센텔라아시아티카추출물',
  'MADECASSOSIDE': '마데카소사이드',
  'ASIATICOSIDE': '아시아티코사이드',
  'CAMELLIA SINENSIS LEAF EXTRACT': '녹차잎추출물',
  'ALOE BARBADENSIS LEAF EXTRACT': '알로에베라잎추출물',
  'GLYCYRRHIZA GLABRA ROOT EXTRACT': '감초뿌리추출물',
  'CHAMOMILLA RECUTITA FLOWER EXTRACT': '캐모마일꽃추출물',
  'ROSA DAMASCENA FLOWER WATER': '다마스크로즈꽃수',
  'GLYCINE SOJA SEED EXTRACT': '대두종자추출물',
  'MELALEUCA ALTERNIFOLIA LEAF OIL': '티트리잎오일',
  'ROSMARINUS OFFICINALIS LEAF EXTRACT': '로즈마리잎추출물',
  'CALENDULA OFFICINALIS FLOWER EXTRACT': '칼렌듈라꽃추출물',
  'HAMAMELIS VIRGINIANA EXTRACT': '위치하젤추출물',
  'SALIX ALBA BARK EXTRACT': '버드나무껍질추출물',

  // ── 산/각질케어 ──
  'SALICYLIC ACID': '살리실산',
  'GLYCOLIC ACID': '글리콜산',
  'LACTIC ACID': '젖산',
  'CITRIC ACID': '시트릭애씨드',
  'MANDELIC ACID': '만델릭애씨드',
  'BETAINE SALICYLATE': '베타인살리실레이트',
  'PHA': '폴리히드록시산',
  'GLUCONOLACTONE': '글루코노락톤',

  // ── 계면활성제/유화제 ──
  'SODIUM LAURYL SULFATE': '소듐라우릴설페이트',
  'SODIUM LAURETH SULFATE': '소듐라우레스설페이트',
  'COCAMIDOPROPYL BETAINE': '코카미도프로필베타인',
  'POLYSORBATE 20': '폴리소르베이트20',
  'POLYSORBATE 60': '폴리소르베이트60',
  'POLYSORBATE 80': '폴리소르베이트80',
  'CETEARYL ALCOHOL': '세테아릴알코올',
  'CETYL ALCOHOL': '세틸알코올',
  'STEARIC ACID': '스테아릭애씨드',
  'GLYCERYL STEARATE': '글리세릴스테아레이트',

  // ── 실리콘 ──
  'DIMETHICONE': '디메치콘',
  'CYCLOMETHICONE': '사이클로메치콘',
  'CYCLOPENTASILOXANE': '사이클로펜타실록산',
  'DIMETHICONE/VINYL DIMETHICONE CROSSPOLYMER': '디메치콘/비닐디메치콘크로스폴리머',
  'PHENYL TRIMETHICONE': '페닐트리메치콘',

  // ── 방부제 ──
  'PHENOXYETHANOL': '페녹시에탄올',
  'ETHYLHEXYLGLYCERIN': '에틸헥실글리세린',
  'CHLORPHENESIN': '클로르페네신',
  'SODIUM BENZOATE': '소듐벤조에이트',
  'POTASSIUM SORBATE': '포타슘소르베이트',
  'BENZISOTHIAZOLINONE': '벤지소티아졸리논',
  'METHYLISOTHIAZOLINONE': '메칠이소치아졸리논',
  'FORMALDEHYDE': '포름알데히드',
  'TRICLOSAN': '트리클로산',
  'DMDM HYDANTOIN': '디엠디엠하이단토인',

  // ── 증점/안정화 ──
  'CARBOMER': '카보머',
  'XANTHAN GUM': '잔탄검',
  'ACRYLATES/C10-30 ALKYL ACRYLATE CROSSPOLYMER': '아크릴레이츠크로스폴리머',
  'HYDROXYETHYL ACRYLATE/SODIUM ACRYLOYLDIMETHYL TAURATE COPOLYMER': '하이드록시에틸아크릴레이트코폴리머',
  'TRIETHANOLAMINE': '트리에탄올아민',
  'SODIUM HYDROXIDE': '수산화나트륨',
  'TROMETHAMINE': '트로메타민',

  // ── 오일 ──
  'CAPRYLIC/CAPRIC TRIGLYCERIDE': '카프릴릭/카프릭트리글리세라이드',
  'JOJOBA OIL': '호호바오일',
  'SIMMONDSIA CHINENSIS SEED OIL': '호호바씨오일',
  'ARGANIA SPINOSA KERNEL OIL': '아르간오일',
  'HELIANTHUS ANNUUS SEED OIL': '해바라기씨오일',
  'OLEA EUROPAEA FRUIT OIL': '올리브오일',
  'SHEA BUTTER': '시어버터',
  'BUTYROSPERMUM PARKII BUTTER': '시어버터',
  'CERA ALBA': '밀랍',
  'BEESWAX': '밀랍',

  // ── 자외선 차단 ──
  'TITANIUM DIOXIDE': '이산화티타늄',
  'ZINC OXIDE': '산화아연',
  'ETHYLHEXYL METHOXYCINNAMATE': '에틸헥실메톡시신나메이트',
  'HOMOSALATE': '호모살레이트',
  'OCTOCRYLENE': '옥토크릴렌',
  'AVOBENZONE': '아보벤존',
  'BUTYL METHOXYDIBENZOYLMETHANE': '부틸메톡시디벤조일메탄',

  // ── 색소 ──
  'CI 77491': '산화철(적)',
  'CI 77492': '산화철(황)',
  'CI 77499': '산화철(흑)',
  'CI 77891': '이산화티타늄',
  'CI 15985': '황색5호',
  'CI 19140': '황색4호',
  'CI 42090': '청색1호',
  'CI 16035': '적색40호',
  'CI 45410': '적색27호',

  // ── 향료 ──
  'FRAGRANCE': '향료',
  'PARFUM': '향료',
  'LINALOOL': '리날룰',
  'LIMONENE': '리모넨',
  'CITRONELLOL': '시트로넬롤',
  'GERANIOL': '제라니올',
  'EUGENOL': '유제놀',
  'COUMARIN': '쿠마린',

  // ── 금지/주의 성분 ──
  'MERCURY': '수은',
  'LEAD ACETATE': '초산납',
  'CHLOROFORM': '클로로포름',
  'BITHIONOL': '비치오놀',
  'DIETHYLSTILBESTROL': '디에틸스틸베스트롤',
  'ESTRADIOL': '에스트라디올',

  // ── 기타 ──
  'DISODIUM EDTA': '디소듐이디티에이',
  'BHT': '부틸히드록시톨루엔',
  'BHA': '부틸히드록시아니솔',
  'PIROCTONE OLAMINE': '피록톤올아민',
  'CAFFEINE': '카페인',
  'COLLAGEN': '콜라겐',
  'ELASTIN': '엘라스틴',
  'PEPTIDE': '펩타이드',
  'COPPER TRIPEPTIDE-1': '구리트리펩타이드-1',
  'ACETYL HEXAPEPTIDE-8': '아세틸헥사펩타이드-8',
  'PALMITOYL PENTAPEPTIDE-4': '팔미토일펜타펩타이드-4',
};

/**
 * Get Korean name for an INCI ingredient. Returns original if no match found.
 */
export function getKoreanName(inci: string): string {
  const key = inci.trim().toUpperCase();
  return INCI_KOREAN_MAP[key] || inci;
}

/**
 * Get INCI English name from Korean name (reverse lookup).
 */
export function getInciFromKorean(korean: string): string | null {
  const target = korean.trim();
  for (const [inci, kr] of Object.entries(INCI_KOREAN_MAP)) {
    if (kr === target) return inci;
  }
  return null;
}

/**
 * Format ingredient display: "한글명 (INCI)"
 */
export function formatIngredientDisplay(inci: string, nameKr?: string): string {
  const kr = nameKr || getKoreanName(inci);
  if (kr === inci) return inci;
  return `${kr} (${inci})`;
}
