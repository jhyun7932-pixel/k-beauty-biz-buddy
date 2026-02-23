import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import type { ProductEntry } from '@/stores/types';

/** Maps a local ProductEntry to the DB products table row shape */
function toDbRow(p: Omit<ProductEntry, 'id' | 'createdAt'>, userId: string) {
  return {
    user_id: userId,
    name_en: p.productName,
    category: p.category || null,
    sku_code: p.skuCode || null,
    hs_code: p.hsCode || null,
    size_ml_g: p.netWeight || null,
    moq: p.qtyPerCarton || null,
    ingredients_raw: p.inciText || null,
    unit_price_range: p.unitPrice ? { base: p.unitPrice } : null,
    status: 'active',
  };
}

/** Maps a DB row back to a local ProductEntry */
function fromDbRow(row: any): ProductEntry {
  return {
    id: row.id,
    productName: row.name_en || '',
    category: row.category || '',
    skuCode: row.sku_code || '',
    hsCode: row.hs_code || '',
    unitPrice: row.unit_price_range?.base ?? 0,
    netWeight: row.size_ml_g ?? 0,
    qtyPerCarton: row.moq ?? 0,
    inciText: row.ingredients_raw || '',
    createdAt: new Date(row.created_at),
  };
}

export function useProducts() {
  const { productEntries } = useAppStore();
  const setProductEntries = useAppStore.getState;

  /** Load products from DB into the store (call once on mount) */
  const loadProducts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const entries = (data || []).map(fromDbRow);
      useAppStore.setState({ productEntries: entries });
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }, []);

  /** Save a new product to DB and return the DB id */
  const saveProduct = useCallback(async (product: Omit<ProductEntry, 'id' | 'createdAt'>): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        return null;
      }

      const row = toDbRow(product, user.id);
      const { data, error } = await supabase
        .from('products')
        .insert(row)
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (err) {
      console.error('Failed to save product:', err);
      toast.error('제품 저장에 실패했습니다.');
      return null;
    }
  }, []);

  /** Update an existing product in DB */
  const updateProduct = useCallback(async (id: string, updates: Partial<Omit<ProductEntry, 'id' | 'createdAt'>>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const dbUpdates: Record<string, any> = {};
      if (updates.productName !== undefined) dbUpdates.name_en = updates.productName;
      if (updates.category !== undefined) dbUpdates.category = updates.category || null;
      if (updates.skuCode !== undefined) dbUpdates.sku_code = updates.skuCode || null;
      if (updates.hsCode !== undefined) dbUpdates.hs_code = updates.hsCode || null;
      if (updates.unitPrice !== undefined) dbUpdates.unit_price_range = { base: updates.unitPrice };
      if (updates.netWeight !== undefined) dbUpdates.size_ml_g = updates.netWeight;
      if (updates.qtyPerCarton !== undefined) dbUpdates.moq = updates.qtyPerCarton;
      if (updates.inciText !== undefined) dbUpdates.ingredients_raw = updates.inciText || null;

      const { error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Failed to update product:', err);
      toast.error('제품 수정에 실패했습니다.');
      return false;
    }
  }, []);

  /** Delete a product from DB */
  const deleteProduct = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Failed to delete product:', err);
      return false;
    }
  }, []);

  return { loadProducts, saveProduct, updateProduct, deleteProduct };
}
