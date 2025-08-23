import { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const useMenu = (branchId?: string) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true);

        // Filter by branch availability
        if (branchId) {
          const branchColumn = `available_${branchId}`;
          query = query.eq(branchColumn, true);
        }

        const { data, error: fetchError } = await query.order('category');

        if (fetchError) {
          throw fetchError;
        }

        // Transform database data to match our MenuItem interface
        const transformedItems: MenuItem[] = (data || []).map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: parseFloat(item.price),
          image: item.image_url,
          category: item.category,
          popular: item.is_popular || false
        }));

        setMenuItems(transformedItems);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('فشل في تحميل القائمة');
        // Fallback to static data if database fails
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [branchId]);

  return { menuItems, loading, error };
};