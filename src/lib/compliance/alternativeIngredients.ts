/**
 * Static map of common banned/restricted cosmetic ingredients and their safer alternatives.
 * Used for instant recommendations; can be enhanced with AI later.
 */
export interface AlternativeSuggestion {
  name: string;
  inci: string;
  reason: string;
}

const ALTERNATIVES_MAP: Record<string, AlternativeSuggestion[]> = {
  'MERCURY': [
    { name: 'Niacinamide', inci: 'NIACINAMIDE', reason: '미백 효과가 있으며 안전한 대체 성분' },
    { name: 'Alpha Arbutin', inci: 'ALPHA-ARBUTIN', reason: '멜라닌 생성 억제, 안전한 미백 성분' },
  ],
  'CHLOROFORM': [
    { name: 'Phenoxyethanol', inci: 'PHENOXYETHANOL', reason: '안전한 방부제 대체제' },
    { name: 'Ethylhexylglycerin', inci: 'ETHYLHEXYLGLYCERIN', reason: '피부 컨디셔닝 및 방부 보조제' },
  ],
  'HYDROQUINONE': [
    { name: 'Alpha Arbutin', inci: 'ALPHA-ARBUTIN', reason: '하이드로퀴논보다 안전한 미백 성분' },
    { name: 'Tranexamic Acid', inci: 'TRANEXAMIC ACID', reason: '색소침착 개선에 효과적' },
    { name: 'Vitamin C (Ascorbic Acid)', inci: 'ASCORBIC ACID', reason: '항산화 및 미백 효과' },
  ],
  'RETINOL': [
    { name: 'Bakuchiol', inci: 'BAKUCHIOL', reason: '레티놀 대안으로 자극이 적은 식물 유래 성분' },
    { name: 'Retinyl Palmitate', inci: 'RETINYL PALMITATE', reason: '레티놀보다 순한 비타민 A 유도체' },
    { name: 'Adenosine', inci: 'ADENOSINE', reason: '주름 개선 기능성 성분으로 규제 우려 적음' },
  ],
  'SALICYLIC ACID': [
    { name: 'Willow Bark Extract', inci: 'SALIX ALBA BARK EXTRACT', reason: '자연 유래 살리실산 대체제' },
    { name: 'Betaine Salicylate', inci: 'BETAINE SALICYLATE', reason: '보다 순한 BHA 대체 성분' },
  ],
  'FORMALDEHYDE': [
    { name: 'Phenoxyethanol', inci: 'PHENOXYETHANOL', reason: '포름알데히드 프리 방부제' },
    { name: 'Sodium Benzoate', inci: 'SODIUM BENZOATE', reason: '안전한 식품급 방부제' },
  ],
  'TRICLOSAN': [
    { name: 'Tea Tree Oil', inci: 'MELALEUCA ALTERNIFOLIA LEAF OIL', reason: '천연 항균 성분' },
    { name: 'Chlorphenesin', inci: 'CHLORPHENESIN', reason: '안전한 방부/항균 대체제' },
  ],
  'DIETHYLSTILBESTROL': [
    { name: 'Phytoestrogen (Soy)', inci: 'GLYCINE SOJA SEED EXTRACT', reason: '식물성 에스트로겐 대안' },
  ],
  'ESTRADIOL': [
    { name: 'Phytoestrogen (Soy)', inci: 'GLYCINE SOJA SEED EXTRACT', reason: '식물성 에스트로겐 대안' },
  ],
  'LEAD ACETATE': [
    { name: 'Iron Oxides', inci: 'CI 77491', reason: '안전한 색소 대체제' },
  ],
  'BITHIONOL': [
    { name: 'Piroctone Olamine', inci: 'PIROCTONE OLAMINE', reason: '안전한 항균/항비듬 성분' },
  ],
};

export function getAlternatives(inci: string): AlternativeSuggestion[] {
  const key = inci.trim().toUpperCase();
  return ALTERNATIVES_MAP[key] || [];
}
