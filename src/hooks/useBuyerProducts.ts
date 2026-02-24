import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BuyerProduct {
  id: string;
  buyer_id: string;
  product_id: string;
  user_id: string;
  custom_price: number | null;
  moq: number | null;
  status: 'offering' | 'negotiating' | 'contracted';
  created_at: string;
}

/** buyer_id 기준으로 연결된 product_id 목록 조회 */
export function useBuyerProducts(buyerId: string | null) {
  const { user } = useAuth();
  const [linkedProductIds, setLinkedProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLinks = useCallback(async () => {
    if (!user || !buyerId) { setLinkedProductIds([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('buyer_products')
      .select('product_id')
      .eq('buyer_id', buyerId)
      .eq('user_id', user.id);
    setLinkedProductIds((data || []).map((r: any) => r.product_id));
    setLoading(false);
  }, [user, buyerId]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const linkProduct = useCallback(async (productId: string) => {
    if (!user || !buyerId) return;
    await supabase.from('buyer_products').upsert({
      buyer_id: buyerId,
      product_id: productId,
      user_id: user.id,
      status: 'offering',
    }, { onConflict: 'buyer_id,product_id' });
    setLinkedProductIds(prev => prev.includes(productId) ? prev : [...prev, productId]);
  }, [user, buyerId]);

  const unlinkProduct = useCallback(async (productId: string) => {
    if (!user || !buyerId) return;
    await supabase.from('buyer_products')
      .delete()
      .eq('buyer_id', buyerId)
      .eq('product_id', productId)
      .eq('user_id', user.id);
    setLinkedProductIds(prev => prev.filter(id => id !== productId));
  }, [user, buyerId]);

  return { linkedProductIds, loading, fetchLinks, linkProduct, unlinkProduct };
}

/** product_id 기준으로 연결된 buyer_id 목록 조회 */
export function useProductBuyers(productId: string | null) {
  const { user } = useAuth();
  const [linkedBuyerIds, setLinkedBuyerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLinks = useCallback(async () => {
    if (!user || !productId) { setLinkedBuyerIds([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('buyer_products')
      .select('buyer_id')
      .eq('product_id', productId)
      .eq('user_id', user.id);
    setLinkedBuyerIds((data || []).map((r: any) => r.buyer_id));
    setLoading(false);
  }, [user, productId]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  return { linkedBuyerIds, loading };
}

/** 전체 buyer_products 맵 조회 (buyer_id → product_id[]) */
export function useAllBuyerProducts() {
  const { user } = useAuth();
  const [map, setMap] = useState<Record<string, string[]>>({});
  const [productMap, setProductMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('buyer_products')
      .select('buyer_id, product_id')
      .eq('user_id', user.id);

    const byBuyer: Record<string, string[]> = {};
    const byProduct: Record<string, string[]> = {};
    for (const row of (data || [])) {
      if (!byBuyer[row.buyer_id]) byBuyer[row.buyer_id] = [];
      byBuyer[row.buyer_id].push(row.product_id);
      if (!byProduct[row.product_id]) byProduct[row.product_id] = [];
      byProduct[row.product_id].push(row.buyer_id);
    }
    setMap(byBuyer);
    setProductMap(byProduct);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const linkProduct = useCallback(async (buyerId: string, productId: string) => {
    if (!user) return;
    await supabase.from('buyer_products').upsert({
      buyer_id: buyerId,
      product_id: productId,
      user_id: user.id,
      status: 'offering',
    }, { onConflict: 'buyer_id,product_id' });
    setMap(prev => {
      const cur = prev[buyerId] || [];
      return cur.includes(productId) ? prev : { ...prev, [buyerId]: [...cur, productId] };
    });
    setProductMap(prev => {
      const cur = prev[productId] || [];
      return cur.includes(buyerId) ? prev : { ...prev, [productId]: [...cur, buyerId] };
    });
  }, [user]);

  const unlinkProduct = useCallback(async (buyerId: string, productId: string) => {
    if (!user) return;
    await supabase.from('buyer_products')
      .delete()
      .eq('buyer_id', buyerId)
      .eq('product_id', productId)
      .eq('user_id', user.id);
    setMap(prev => ({ ...prev, [buyerId]: (prev[buyerId] || []).filter(id => id !== productId) }));
    setProductMap(prev => ({ ...prev, [productId]: (prev[productId] || []).filter(id => id !== buyerId) }));
  }, [user]);

  return { map, productMap, loading, fetchAll, linkProduct, unlinkProduct };
}
