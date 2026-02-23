import type { StateCreator } from 'zustand';
import type { AppStore, UIState, UIActions } from '../types';

export const defaultUIState: UIState = {
  ui: {
    activePage: 'AGENT_HOME',
    activeDocId: null,
    selectedFileId: null,
    workbenchTab: 'FILES',
    showTour: false,
    showDebugPanel: false,
  },
  debug: { lastActions: [] },
};

export const createUISlice: StateCreator<AppStore, [], [], UIState & UIActions> = (set, get) => ({
  ...defaultUIState,

  navigate: (page) => {
    set({ ui: { ...get().ui, activePage: page } });
  },

  setActiveDoc: (docId) => {
    set((s) => ({ ui: { ...s.ui, activeDocId: docId } }));
    if (docId) {
      const file = get().files.list.find(f => f.docId === docId);
      if (file) {
        set((s) => ({ ui: { ...s.ui, selectedFileId: file.fileId } }));
      }
    }
  },

  setSelectedFile: (fileId) => {
    set((s) => ({ ui: { ...s.ui, selectedFileId: fileId } }));
    if (fileId) {
      const file = get().files.list.find(f => f.fileId === fileId);
      if (file) {
        set((s) => ({ ui: { ...s.ui, activeDocId: file.docId } }));
      }
    }
  },

  setWorkbenchTab: (tab) => {
    set((s) => ({ ui: { ...s.ui, workbenchTab: tab } }));
  },

  setShowTour: (show) => {
    set((s) => ({ ui: { ...s.ui, showTour: show } }));
  },

  setShowDebugPanel: (show) => {
    set((s) => ({ ui: { ...s.ui, showDebugPanel: show } }));
  },
});
