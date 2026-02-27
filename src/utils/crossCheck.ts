// src/utils/crossCheck.ts
// PI ↔ CI ↔ PL 간 수량/단가/중량/CBM 교차 검증

export interface CrossCheckResult {
  passed: boolean;
  errors: CrossCheckError[];
  warnings: CrossCheckWarning[];
}

export interface CrossCheckError {
  field: string;
  docA: string;
  docB: string;
  valueA: number | string;
  valueB: number | string;
  message: string;
}

export interface CrossCheckWarning {
  field: string;
  message: string;
  suggestion: string;
}

export function crossCheckDocuments(
  pi: any | null,
  ci: any | null,
  pl: any | null
): CrossCheckResult {
  const errors: CrossCheckError[] = [];
  const warnings: CrossCheckWarning[] = [];

  // PI ↔ CI 교차 검증
  if (pi && ci) {
    // 총금액 비교
    const piTotal = pi.total_amount || 0;
    const ciTotal = ci.total_amount || 0;
    if (Math.abs(piTotal - ciTotal) > 0.01) {
      errors.push({
        field: "total_amount",
        docA: "PI",
        docB: "CI",
        valueA: piTotal,
        valueB: ciTotal,
        message: `PI 총금액(${piTotal})과 CI 총금액(${ciTotal})이 불일치합니다.`,
      });
    }

    // 아이템별 수량/단가 비교
    pi.items?.forEach((piItem: any, idx: number) => {
      const ciItem = ci.items?.[idx];
      if (!ciItem) {
        errors.push({
          field: `items[${idx}]`,
          docA: "PI",
          docB: "CI",
          valueA: piItem.product_name,
          valueB: "없음",
          message: `PI ${idx+1}번 품목(${piItem.product_name})이 CI에 없습니다.`,
        });
        return;
      }

      if (piItem.quantity !== ciItem.quantity) {
        errors.push({
          field: `items[${idx}].quantity`,
          docA: "PI",
          docB: "CI",
          valueA: piItem.quantity,
          valueB: ciItem.quantity,
          message: `${piItem.product_name} 수량: PI(${piItem.quantity}) ≠ CI(${ciItem.quantity})`,
        });
      }

      if (Math.abs(piItem.unit_price - ciItem.unit_price) > 0.01) {
        errors.push({
          field: `items[${idx}].unit_price`,
          docA: "PI",
          docB: "CI",
          valueA: piItem.unit_price,
          valueB: ciItem.unit_price,
          message: `${piItem.product_name} 단가: PI(${piItem.unit_price}) ≠ CI(${ciItem.unit_price})`,
        });
      }

      if (piItem.hs_code && ciItem.hs_code && piItem.hs_code !== ciItem.hs_code) {
        errors.push({
          field: `items[${idx}].hs_code`,
          docA: "PI",
          docB: "CI",
          valueA: piItem.hs_code,
          valueB: ciItem.hs_code,
          message: `${piItem.product_name} HS Code: PI(${piItem.hs_code}) ≠ CI(${ciItem.hs_code})`,
        });
      }
    });

    // Incoterms 비교
    const piTerms = pi.trade_terms?.incoterms;
    const ciTerms = ci.trade_terms?.incoterms;
    if (piTerms && ciTerms && piTerms !== ciTerms) {
      errors.push({
        field: "trade_terms.incoterms",
        docA: "PI",
        docB: "CI",
        valueA: piTerms,
        valueB: ciTerms,
        message: `Incoterms: PI(${piTerms}) ≠ CI(${ciTerms})`,
      });
    }
  }

  // CI ↔ PL 교차 검증
  if (ci && pl) {
    const ciNet = ci.total_net_weight || 0;
    const plNet = pl.total_net_weight || 0;
    if (ciNet > 0 && plNet > 0 && Math.abs(ciNet - plNet) > 0.1) {
      errors.push({
        field: "total_net_weight",
        docA: "CI",
        docB: "PL",
        valueA: ciNet,
        valueB: plNet,
        message: `순중량: CI(${ciNet}kg) ≠ PL(${plNet}kg)`,
      });
    }

    const ciCbm = ci.total_cbm || 0;
    const plCbm = pl.total_cbm || 0;
    if (ciCbm > 0 && plCbm > 0 && Math.abs(ciCbm - plCbm) > 0.001) {
      errors.push({
        field: "total_cbm",
        docA: "CI",
        docB: "PL",
        valueA: ciCbm,
        valueB: plCbm,
        message: `CBM: CI(${ciCbm}) ≠ PL(${plCbm})`,
      });
    }

    // 아이템 수량 비교
    ci.items?.forEach((ciItem: any, idx: number) => {
      const plItem = pl.items?.[idx];
      if (plItem && ciItem.quantity !== plItem.quantity) {
        errors.push({
          field: `items[${idx}].quantity`,
          docA: "CI",
          docB: "PL",
          valueA: ciItem.quantity,
          valueB: plItem.quantity,
          message: `${ciItem.product_name} 수량: CI(${ciItem.quantity}) ≠ PL(${plItem.quantity})`,
        });
      }
    });
  }

  // 경고 항목
  if (pi && !pi.trade_terms?.incoterms) {
    warnings.push({
      field: "incoterms",
      message: "PI에 Incoterms가 지정되지 않았습니다.",
      suggestion: "FOB Incheon 또는 CIF [목적항]을 명시하세요.",
    });
  }

  if (pi && pi.items?.some((item: any) => !item.hs_code)) {
    warnings.push({
      field: "hs_code",
      message: "HS Code가 없는 품목이 있습니다.",
      suggestion: "통관 시 HS Code는 필수입니다. 제품 관리에서 등록하세요.",
    });
  }

  if (pi && !pi.seller?.bank_info?.swift_code) {
    warnings.push({
      field: "swift_code",
      message: "SWIFT Code가 등록되지 않았습니다.",
      suggestion: "T/T 결제 시 SWIFT Code가 필수입니다. 설정에서 등록하세요.",
    });
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}
