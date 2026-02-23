import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BannedIngredient {
  name: string;
  inci: string;
  reason: string;
  action: string;
}

export interface RestrictedIngredient {
  name: string;
  inci: string;
  maxPercent: number;
  action: string;
  severity: 'WARNING';
}

export interface ComplianceRule {
  id: string;
  country_code: string;
  country_name: string;
  banned_ingredients: BannedIngredient[];
  restricted_ingredients: RestrictedIngredient[];
  label_requirements: string;
  regulatory_body: string | null;
  key_regulation: string | null;
  notes: string | null;
}

export type TrafficLight = 'PASS' | 'WARNING' | 'FAIL';

export interface ComplianceCheckItem {
  ingredient: string;
  inci: string;
  light: TrafficLight;
  reason: string;
  action: string;
}

export interface ComplianceResult {
  countryCode: string;
  countryName: string;
  overallLight: TrafficLight;
  items: ComplianceCheckItem[];
  labelRequirements: string;
  regulatoryBody: string | null;
  keyRegulation: string | null;
  notes: string | null;
}

export function useComplianceEngine() {
  const [results, setResults] = useState<ComplianceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async (
    ingredientList: string[],
    targetCountries: string[]
  ): Promise<ComplianceResult[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('compliance_rules')
        .select('*')
        .in('country_code', targetCountries);

      if (fetchError) throw fetchError;

      const rules = (data || []) as unknown as ComplianceRule[];
      const upperIngredients = ingredientList.map(i => i.trim().toUpperCase());

      const checkResults: ComplianceResult[] = rules.map(rule => {
        const items: ComplianceCheckItem[] = [];

        // Check banned ingredients
        for (const banned of rule.banned_ingredients) {
          const found = upperIngredients.find(i => 
            i.includes(banned.inci.toUpperCase()) || i.includes(banned.name.toUpperCase())
          );
          if (found) {
            items.push({
              ingredient: banned.name,
              inci: banned.inci,
              light: 'FAIL',
              reason: banned.reason,
              action: banned.action,
            });
          }
        }

        // Check restricted ingredients
        for (const restricted of rule.restricted_ingredients) {
          const found = upperIngredients.find(i =>
            i.includes(restricted.inci.toUpperCase()) || i.includes(restricted.name.toUpperCase())
          );
          if (found) {
            items.push({
              ingredient: restricted.name,
              inci: restricted.inci,
              light: 'WARNING',
              reason: `최대 허용 함량: ${restricted.maxPercent}%`,
              action: restricted.action,
            });
          }
        }

        // Determine overall light
        let overallLight: TrafficLight = 'PASS';
        if (items.some(i => i.light === 'FAIL')) overallLight = 'FAIL';
        else if (items.some(i => i.light === 'WARNING')) overallLight = 'WARNING';

        return {
          countryCode: rule.country_code,
          countryName: rule.country_name,
          overallLight,
          items,
          labelRequirements: rule.label_requirements,
          regulatoryBody: rule.regulatory_body,
          keyRegulation: rule.key_regulation,
          notes: rule.notes,
        };
      });

      setResults(checkResults);
      return checkResults;
    } catch (err: any) {
      setError(err.message || '규제 체크 중 오류가 발생했습니다.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { results, isLoading, error, runCheck, setResults };
}
