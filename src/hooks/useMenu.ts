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
          .select('*');

        // If restaurantId is provided, filter by restaurant
        if (restaurantId) {
          console.log('Filtering by restaurant_id:', restaurantId);
          query = query.eq('restaurant_id', restaurantId);
        } else if (branchId) {
          // If only branchId is provided, get the restaurant_id from the branch
          console.log('Getting restaurant_id for branch:', branchId);
          const { data: branchData, error: branchError } = await supabase
            .from('restaurant_branches')
            .select('restaurant_id')
            .eq('id', branchId)
            .maybeSingle();

          if (branchError) {
            console.error('Error fetching branch data:', branchError);
            throw branchError;
          }

          if (branchData?.restaurant_id) {
            console.log('Found restaurant_id:', branchData.restaurant_id);
            query = query.eq('restaurant_id', branchData.restaurant_id);
          } else {
            console.warn('No restaurant_id found for branch:', branchId);
          }
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
          is_available: item.is_available,
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