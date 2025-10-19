import { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { createClient } from '@supabase/supabase-js';

interface Category {
  id: string;
  name: string;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const useMenu = (branchId?: string, restaurantId?: string) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching menu data for branch:', branchId, 'restaurant:', restaurantId);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true, nullsLast: true })
          .order('name', { ascending: true });

        if (categoriesError) {
          throw categoriesError;
        }

        setCategories(categoriesData || []);

        // Fetch menu items
        let query = supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true);

        // If restaurantId is provided, filter by restaurant
        if (restaurantId) {
          query = query.eq('restaurant_id', restaurantId);
        } else if (branchId) {
          // Fallback to old branch filtering for backward compatibility
          let branchColumn;
          if (branchId === 'burgerito-airport' || branchId === 'dddddddd-dddd-dddd-dddd-dddddddddddd') {
            branchColumn = 'available_burgerito_airport';
          } else if (branchId === 'dollar' || branchId === 'cccccccc-cccc-cccc-cccc-cccccccccccc') {
            branchColumn = 'available_dollar';
          } else if (branchId === 'airport' || branchId === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') {
            branchColumn = 'available_airport';
          } else if (branchId === 'balaoun' || branchId === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') {
            branchColumn = 'available_balaoun';
          } else {
            branchColumn = `available_${branchId}`;
          }
          console.log('Filtering by branch column:', branchColumn);
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
          popular: item.is_popular || false,
          image_brightness: item.image_brightness || 1.2,
          image_contrast: item.image_contrast || 1.1
        }));

        console.log('Loaded menu items:', transformedItems.length);
        setMenuItems(transformedItems);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('فشل في تحميل البيانات');
        setMenuItems([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [branchId, restaurantId]);

  // Filter categories to only include those that have items
  const availableCategories = categories.filter(category => 
    menuItems.some(item => item.category === category.name)
  );

  return { menuItems, categories: availableCategories, loading, error };
};