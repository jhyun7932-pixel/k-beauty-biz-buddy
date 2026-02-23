import type { StateCreator } from 'zustand';
import type { AppStore, DocState, DocActions, DocInstance, FileItem } from '../types';
import { DOC_TILES } from '../types';
import { generateDefaultFields, generateDocumentHTML, deepMerge } from '../helpers/docTemplates';
import { runGateChecks } from '../helpers/gateChecks';

export const defaultDocState: DocState = {
  project: {
    projectId: null,
    name: '새 프로젝트',
    targetCountries: [],
    channel: '도매',
    stagePreset: 'FIRST_PROPOSAL',
    buyerType: '유통사',
    language: 'KO',
    currency: 'USD',
    incotermsDefault: 'FOB',
    paymentDefault: 'T/T 30/70',
  },
  companyProfile: {
    companyName: 'K-Beauty Co., Ltd.',
    address: 'Seoul, South Korea',
    phone: '+82-2-1234-5678',
    website: 'www.kbeauty.com',
    introDeckFileId: null,
    logoUrl: '',
    stampImageUrl: '',
    exportEmailSignature: '',
    brandTone: 'clean',
    brandColors: { primary: '#2F6BFF', secondary: '#7B61FF', accent: '#2EE59D' },
  },
  productProfile: {
    productName: 'K-Beauty Skincare Line',
    category: '스킨케어',
    skuList: [
      { sku: 'HS-001', name: 'Hydra Serum 30ml', size: '30ml', unit: 'EA', unitPrice: 4.5, moq: 500, leadTimeDays: 14 },
      { sku: 'GC-001', name: 'Glow Cream 50ml', size: '50ml', unit: 'EA', unitPrice: 5.2, moq: 300, leadTimeDays: 14 },
    ],
    inciIngredients: [],
    labelImagesFileIds: [],
  },
  docs: { byId: {} },
  files: { list: [] },
};

export const createDocSlice: StateCreator<AppStore, [], [], DocState & DocActions> = (set, get) => ({
  ...defaultDocState,

  setPreset: (preset) => {
    set((s) => ({
      project: { ...s.project, stagePreset: preset },
      ui: { ...s.ui, workbenchTab: 'FILES', activeDocId: null, selectedFileId: null },
    }));
  },

  getDocTilesForPreset: (preset) => {
    return DOC_TILES[preset].map((tile, index) => ({ ...tile, order: index + 1 }));
  },

  createDocFromTemplate: ({ templateKey, preset }) => {
    const state = get();
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const tileInfo = DOC_TILES[preset].find(t => t.templateKey === templateKey);
    if (!tileInfo) {
      console.error('Unknown template:', templateKey);
      return '';
    }

    const fields = generateDefaultFields(templateKey, state);
    const html = generateDocumentHTML(templateKey, fields);

    const newDoc: DocInstance = {
      docId,
      title: tileInfo.titleKr,
      stagePreset: preset,
      templateKey,
      status: 'draft',
      fields,
      html,
      qa: { score: 85, warnings: [] },
      gate: { required: 10, passed: 0, locked: false, results: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newFile: FileItem = {
      fileId,
      docId,
      name: `${tileInfo.titleKr}.html`,
      type: 'html',
      status: 'draft',
      createdAt: new Date(),
    };

    set((s) => ({
      docs: { byId: { ...s.docs.byId, [docId]: newDoc } },
      files: { list: [...s.files.list, newFile] },
      ui: { ...s.ui, activeDocId: docId, selectedFileId: fileId, workbenchTab: 'PREVIEW' },
    }));

    return docId;
  },

  renderDocHTML: ({ templateKey, fields }) => {
    return generateDocumentHTML(templateKey, fields);
  },

  applyFieldPatch: ({ docId, patch }) => {
    const state = get();
    const doc = state.docs.byId[docId];
    if (!doc || doc.status === 'final') return;

    const newFields = deepMerge(doc.fields, patch);
    const newHtml = generateDocumentHTML(doc.templateKey, newFields);

    set((s) => ({
      docs: {
        byId: {
          ...s.docs.byId,
          [docId]: { ...doc, fields: newFields, html: newHtml, updatedAt: new Date() },
        },
      },
    }));
  },

  setProjectConfig: (config) => {
    set((s) => ({
      project: { ...s.project, ...config, projectId: s.project.projectId || `proj_${Date.now()}` },
    }));
  },

  setCompanyProfile: (profile) => {
    set((s) => ({ companyProfile: { ...s.companyProfile, ...profile } }));
  },

  setProductProfile: (profile) => {
    set((s) => ({ productProfile: { ...s.productProfile, ...profile } }));
  },

  runCrossCheckGate: (docId) => {
    const state = get();
    const docs = Object.values(state.docs.byId).filter(d => d.stagePreset === 'PURCHASE_ORDER');
    const results = runGateChecks(docs, state);
    const passed = results.filter(r => r.status === 'PASS').length;

    const doc = state.docs.byId[docId];
    if (doc) {
      set((s) => ({
        docs: {
          byId: {
            ...s.docs.byId,
            [docId]: { ...doc, gate: { required: 10, passed, locked: false, results } },
          },
        },
      }));
    }

    return results;
  },

  finalizeDoc: (docId) => {
    const state = get();
    const doc = state.docs.byId[docId];
    if (!doc) return false;

    if (doc.stagePreset === 'PURCHASE_ORDER') {
      const results = get().runCrossCheckGate(docId);
      const hasHighFail = results.some(r => r.severity === 'HIGH' && r.status === 'FAIL');
      if (hasHighFail) return false;
    }

    set((s) => ({
      docs: {
        byId: {
          ...s.docs.byId,
          [docId]: { ...doc, status: 'final', gate: { ...doc.gate, locked: true } },
        },
      },
      files: {
        list: s.files.list.map(f => f.docId === docId ? { ...f, status: 'final' as const } : f),
      },
    }));

    return true;
  },

  getActiveDoc: () => {
    const { activeDocId } = get().ui;
    if (!activeDocId) return null;
    return get().docs.byId[activeDocId] || null;
  },

  getDocsForCurrentPreset: () => {
    const { stagePreset } = get().project;
    return Object.values(get().docs.byId).filter(d => d.stagePreset === stagePreset);
  },

  clearProject: () => {
    set({
      docs: { byId: {} },
      files: { list: [] },
      ui: { ...get().ui, activeDocId: null, selectedFileId: null, workbenchTab: 'FILES' },
    });
  },

  exportZip: () => {
    const state = get();
    const finalDocs = Object.values(state.docs.byId).filter(d => d.status === 'final');
    console.log('Exporting ZIP with', finalDocs.length, 'final documents');
  },
});
