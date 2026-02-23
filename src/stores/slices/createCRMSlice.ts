import type { StateCreator } from 'zustand';
import type { AppStore, CRMState, CRMActions } from '../types';
import { generateCountryCompliance } from '../helpers/complianceHelpers';

export const defaultCRMState: CRMState = {
  compliance: { byCountry: {} },
  buyerEntries: [],
  productEntries: [],
};

export const createCRMSlice: StateCreator<AppStore, [], [], CRMState & CRMActions> = (set) => ({
  ...defaultCRMState,

  runCompliance: ({ countries, inciIngredients }) => {
    const newCompliance: Record<string, any> = {};
    countries.forEach(country => {
      newCompliance[country] = generateCountryCompliance(country, inciIngredients);
    });
    set((s) => ({
      compliance: { byCountry: { ...s.compliance.byCountry, ...newCompliance } },
    }));
  },

  addBuyerEntry: (buyer) => {
    const entry = { ...buyer, id: `buyer_${Date.now()}`, createdAt: new Date() };
    set((s) => ({ buyerEntries: [...s.buyerEntries, entry] }));
  },

  removeBuyerEntry: (id) => {
    set((s) => ({ buyerEntries: s.buyerEntries.filter(b => b.id !== id) }));
  },

  addProductEntry: (product) => {
    const entry = { ...product, id: `product_${Date.now()}`, createdAt: new Date() };
    set((s) => ({ productEntries: [...s.productEntries, entry] }));
  },

  updateProductEntry: (id, updates) => {
    set((s) => ({
      productEntries: s.productEntries.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  },

  removeProductEntry: (id) => {
    set((s) => ({ productEntries: s.productEntries.filter(p => p.id !== id) }));
  },
});
