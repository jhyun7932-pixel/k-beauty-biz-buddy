import type { TargetCountry, CountryCompliance, INCIIngredient, LabelRequirement } from '../types';

export function getDefaultRulepackItems(country: TargetCountry): Array<{ ruleId: string; title: string; evidence: string; checkHow: string; action: string; status: string }> {
  const common = [
    { ruleId: 'R1', title: 'INCI 영문 표기', evidence: 'EU 1223/2009, 21 CFR 701.3', checkHow: '라벨 전성분 확인', action: '전성분표 영문 번역', status: 'NEED_CHECK' },
    { ruleId: 'R2', title: '원산지 표기', evidence: '관세법, FTC 규정', checkHow: '라벨 확인', action: 'Made in Korea 표기', status: 'OK' },
  ];

  switch (country) {
    case 'US':
      return [
        ...common,
        { ruleId: 'R3', title: 'FDA MoCRA 등록', evidence: 'MoCRA 2022', checkHow: 'FDA 포털 확인', action: '시설/제품 등록', status: 'NEED_CHECK' },
        { ruleId: 'R4', title: 'Drug vs Cosmetic 분류', evidence: '21 CFR 201', checkHow: '효능 표현 검토', action: '표현 수정 필요시', status: 'NEED_CHECK' },
        { ruleId: 'R5', title: '경고문구', evidence: '21 CFR 740', checkHow: '라벨 확인', action: 'Warning 문구 추가', status: 'NEED_CHECK' },
      ];
    case 'JP':
      return [
        ...common,
        { ruleId: 'R3', title: '화장품 수입판매업 허가', evidence: '의약품의료기기등법', checkHow: '허가증 확인', action: '현지 파트너 확인', status: 'NEED_CHECK' },
        { ruleId: 'R4', title: '일본어 전성분 표기', evidence: '일본 성분 표시 기준', checkHow: '라벨 확인', action: '일본어 번역', status: 'NEED_ACTION' },
        { ruleId: 'R5', title: '제조판매원 표시', evidence: '의약품의료기기등법', checkHow: '라벨 확인', action: '현지 책임자 표기', status: 'NEED_CHECK' },
      ];
    case 'EU':
      return [
        ...common,
        { ruleId: 'R3', title: 'CPNP 등록', evidence: 'EU 1223/2009', checkHow: 'CPNP 포털 확인', action: '제품 등록', status: 'NEED_CHECK' },
        { ruleId: 'R4', title: 'EU 책임자 지정', evidence: 'EU 1223/2009 Art.4', checkHow: '계약서 확인', action: 'RP 계약 체결', status: 'NEED_CHECK' },
        { ruleId: 'R5', title: 'PIF 작성', evidence: 'EU 1223/2009 Art.11', checkHow: 'PIF 문서 확인', action: 'PIF 준비', status: 'NEED_ACTION' },
      ];
    case 'CN':
      return [
        ...common,
        { ruleId: 'R3', title: 'NMPA 등록', evidence: '화장품 감독관리조례', checkHow: '등록증 확인', action: '위생허가/비안 신청', status: 'NEED_ACTION' },
        { ruleId: 'R4', title: '중문 라벨', evidence: 'GB 5296.3', checkHow: '라벨 확인', action: '중국어 번역', status: 'NEED_ACTION' },
      ];
    default:
      return [
        ...common,
        { ruleId: 'R3', title: '현지 규정 확인', evidence: '국가별 화장품 규정', checkHow: '현지 파트너 문의', action: '추가 조사 필요', status: 'NEED_CHECK' },
      ];
  }
}

export function getLabelRequirements(country: TargetCountry): LabelRequirement[] {
  const common: LabelRequirement[] = [
    { item: '제품명', requirement: '현지어 표기', status: 'NEED_CHECK', note: '번역 확인 필요' },
    { item: '전성분(INCI)', requirement: '영문 또는 현지어', status: 'NEED_CHECK', note: 'INCI 명칭 확인' },
    { item: '내용량', requirement: 'ml/g 단위 표기', status: 'OK', note: '' },
    { item: '원산지', requirement: 'Made in Korea', status: 'OK', note: '' },
    { item: '제조자', requirement: '제조사명 및 주소', status: 'OK', note: '' },
    { item: '유통기한', requirement: '제조일/유통기한', status: 'NEED_CHECK', note: '표기 방식 확인' },
    { item: '사용법', requirement: '현지어 표기', status: 'NEED_CHECK', note: '번역 필요' },
    { item: '주의사항', requirement: '필수 경고문구', status: 'NEED_CHECK', note: '국가별 확인' },
  ];

  switch (country) {
    case 'US':
      return [
        ...common,
        { item: 'Drug Facts (해당시)', requirement: 'OTC Drug 표기', status: 'NEED_CHECK', note: 'SPF 등 해당시' },
        { item: 'Net Wt./Fl.Oz.', requirement: '미국 단위 병기', status: 'NEED_CHECK', note: 'oz 표기 필요' },
      ];
    case 'JP':
      return [
        ...common,
        { item: '제조판매원', requirement: '일본 현지 책임자', status: 'NEED_CHECK', note: '현지 파트너 확인' },
        { item: '일본어 전성분', requirement: '일본 표기 기준', status: 'NEED_ACTION', note: '번역 필수' },
      ];
    case 'EU':
      return [
        ...common,
        { item: 'EU 책임자', requirement: 'RP 정보 표기', status: 'NEED_CHECK', note: 'RP 계약 필요' },
        { item: 'PAO 기호', requirement: '개봉 후 사용기한', status: 'NEED_CHECK', note: '12M/24M 표기' },
        { item: 'Batch No.', requirement: '로트 번호', status: 'OK', note: '' },
      ];
    default:
      return common;
  }
}

export function generateCountryCompliance(country: TargetCountry, inciIngredients?: INCIIngredient[]): CountryCompliance {
  const ruleItems = getDefaultRulepackItems(country);

  return {
    rulePack: ruleItems.map(r => ({
      ruleId: r.ruleId,
      title: r.title,
      evidence: r.evidence,
      checkHow: r.checkHow,
      action: r.action,
      status: r.status as 'OK' | 'NEED_CHECK' | 'NEED_ACTION',
    })),
    labelRequirements: getLabelRequirements(country),
    hsCode: {
      hs6: '3304.99',
      rationale: '기타 미용/메이크업 제품 및 스킨케어 제품',
      needUserConfirm: true,
    },
  };
}
