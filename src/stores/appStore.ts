import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Re-export all types for backward compatibility
export type {
  TargetCountry, SalesChannel, BuyerType, StagePreset, Language, Currency,
  Incoterms, PaymentTerms, WorkbenchTab, ActivePage,
  GateResult, QAWarning, DocInstance, FileItem,
  RulePackItem, LabelRequirement, CountryCompliance,
  SKUItem, INCIIngredient, DebugAction,
  BuyerEntry, ProductEntry,
  AppState, AppActions, AppStore,
} from './types';

export {
  COUNTRY_NAMES, PRESET_LABELS, DOC_TILES,
} from './types';

// Import slices
import { createAuthSlice } from './slices/createAuthSlice';
import { createUISlice } from './slices/createUISlice';
import { createDocSlice } from './slices/createDocSlice';
import { createCRMSlice } from './slices/createCRMSlice';

import type { AppStore } from './types';

// ============ Combined Store ============
export const useAppStore = create<AppStore>()(
  persist(
    (set, get, api) => ({
      // Merge all slices
      ...createAuthSlice(set, get, api),
      ...createUISlice(set, get, api),
      ...createDocSlice(set, get, api),
      ...createCRMSlice(set, get, api),

      // ============ Core Action Dispatcher ============
      handleAction: (action) => {
        const { type, payload } = action;
        const state = get();

        // Log action for debug
        set((s) => ({
          debug: {
            lastActions: [{ type, payload, at: new Date() }, ...s.debug.lastActions.slice(0, 19)],
          },
        }));

        switch (type) {
          case 'NAVIGATE':
            get().navigate(payload.page);
            break;
          case 'SET_PRESET':
            get().setPreset(payload.preset);
            break;
          case 'CREATE_DOC':
            get().createDocFromTemplate({ templateKey: payload.templateKey, preset: state.project.stagePreset });
            break;
          case 'SET_ACTIVE_DOC':
            get().setActiveDoc(payload.docId);
            break;
          case 'APPLY_PATCH':
            get().applyFieldPatch({ docId: payload.docId, patch: payload.patch });
            break;
          case 'RUN_GATE':
            get().runCrossCheckGate(payload.docId);
            break;
          case 'FINALIZE':
            get().finalizeDoc(payload.docId);
            break;
          default:
            console.warn('Unknown action type:', type);
        }
      },
    }),
    {
      name: 'kbeauty-app-store',
      partialize: (state) => ({
        session: state.session,
        project: state.project,
        companyProfile: state.companyProfile,
        productProfile: state.productProfile,
        docs: state.docs,
        files: state.files,
        compliance: state.compliance,
        buyerEntries: state.buyerEntries,
        productEntries: state.productEntries,
      }),
    }
  )
);
