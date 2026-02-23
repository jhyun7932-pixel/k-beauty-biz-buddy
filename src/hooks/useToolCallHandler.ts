import { useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import type { ToolCall } from '@/lib/api/tradeAssistant';
import type { ToolCallResult } from '@/types';

/**
 * Hook that processes AI tool calls and dispatches corresponding Zustand actions.
 * Returns ToolCallResult[] with before/after values for visualization.
 */
export function useToolCallHandler() {
  const applyFieldPatch = useAppStore(s => s.applyFieldPatch);
  const createDocFromTemplate = useAppStore(s => s.createDocFromTemplate);
  const getActiveDoc = useAppStore(s => s.getActiveDoc);

  const handleToolCalls = useCallback((toolCalls: ToolCall[]): ToolCallResult[] => {
    const results: ToolCallResult[] = [];

    for (const tc of toolCalls) {
      switch (tc.name) {
        case 'update_document_field': {
          const activeDoc = getActiveDoc();
          if (!activeDoc) {
            toast.error('활성 문서가 없습니다. 먼저 문서를 선택하세요.');
            results.push({ toolCall: tc, success: false });
            break;
          }
          if (activeDoc.status === 'final') {
            toast.error('확정된 문서는 수정할 수 없습니다.');
            results.push({ toolCall: tc, success: false });
            break;
          }

          const { field_path, new_value, reason } = tc.arguments;
          if (!field_path || new_value === undefined) {
            results.push({ toolCall: tc, success: false });
            break;
          }

          // Capture before value
          const beforeValue = getFieldValue(activeDoc.fields, field_path);

          // Build and apply patch
          const patch = buildPatch(field_path, new_value, activeDoc.fields);
          applyFieldPatch({ docId: activeDoc.docId, patch });

          results.push({
            toolCall: tc,
            beforeValue: beforeValue !== undefined ? String(beforeValue) : undefined,
            success: true,
          });

          toast.success(`📝 ${reason}`, { duration: 3000 });
          break;
        }

        case 'generate_document': {
          const { template_key, preset, reason } = tc.arguments;
          if (!template_key || !preset) {
            results.push({ toolCall: tc, success: false });
            break;
          }

          const docId = createDocFromTemplate({
            templateKey: template_key,
            preset: preset as any,
          });

          if (docId) {
            results.push({ toolCall: tc, success: true });
            toast.success(`📄 ${reason}`, { duration: 3000 });
          } else {
            results.push({ toolCall: tc, success: false });
            toast.error('문서 생성에 실패했습니다.');
          }
          break;
        }

        default:
          console.warn('Unknown tool call:', tc.name);
          results.push({ toolCall: tc, success: false });
      }
    }

    return results;
  }, [applyFieldPatch, createDocFromTemplate, getActiveDoc]);

  return { handleToolCalls };
}

/**
 * Gets a field value from nested fields using a path string.
 */
function getFieldValue(fields: Record<string, any>, path: string): any {
  // Array path: 'items[0].unitPrice'
  const arrayMatch = path.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
  if (arrayMatch) {
    const [, arrayName, indexStr, propName] = arrayMatch;
    const arr = fields[arrayName];
    if (Array.isArray(arr) && arr[parseInt(indexStr)]) {
      return arr[parseInt(indexStr)][propName];
    }
    return undefined;
  }
  return fields[path];
}

/**
 * Converts a field_path like 'items[0].unitPrice' + new_value into a nested patch object.
 */
function buildPatch(fieldPath: string, newValue: string, currentFields: Record<string, any>): Record<string, any> {
  const arrayMatch = fieldPath.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
  if (arrayMatch) {
    const [, arrayName, indexStr, propName] = arrayMatch;
    const index = parseInt(indexStr, 10);
    const currentArray = [...(currentFields[arrayName] || [])];

    if (index < currentArray.length) {
      const convertedValue = smartConvert(newValue, currentArray[index][propName]);
      currentArray[index] = { ...currentArray[index], [propName]: convertedValue };

      if (propName === 'qty' || propName === 'unitPrice') {
        const item = currentArray[index];
        currentArray[index].amount = (item.qty || 0) * (item.unitPrice || 0);
      }
    }

    const totalAmount = currentArray.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    return { [arrayName]: currentArray, totalAmount };
  }

  const allItemsMatch = fieldPath.match(/^all_items\.(\w+)$/);
  if (allItemsMatch) {
    const [, propName] = allItemsMatch;
    const currentArray = [...(currentFields.items || [])];
    const updatedItems = currentArray.map((item: any) => {
      const convertedValue = smartConvert(newValue, item[propName]);
      const updated = { ...item, [propName]: convertedValue };
      if (propName === 'qty' || propName === 'unitPrice') {
        updated.amount = (updated.qty || 0) * (updated.unitPrice || 0);
      }
      return updated;
    });
    const totalAmount = updatedItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    return { items: updatedItems, totalAmount };
  }

  const convertedValue = smartConvert(newValue, currentFields[fieldPath]);
  return { [fieldPath]: convertedValue };
}

function smartConvert(newValue: string, existingValue: any): any {
  if (typeof existingValue === 'number') {
    const num = parseFloat(newValue.replace(/,/g, ''));
    return isNaN(num) ? newValue : num;
  }
  if (typeof existingValue === 'boolean') {
    return newValue === 'true';
  }
  return newValue;
}
