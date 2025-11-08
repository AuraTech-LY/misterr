import React, { useState, useEffect } from 'react';
import { Power, PowerOff, RefreshCw, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  is_available: boolean;
  image_url: string;
  restaurant_id: string | null;
  branch_id: string | null;
}

export default function AdminItemAvailability() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);

      // Albaron branch ID (مستر شيش - بلعون)
      const albaronBranchId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('branch_id', albaronBranchId)
        .order('category')
        .order('name');

      if (error) throw error;

      setItems(data || []);

      const uniqueCategories = Array.from(
        new Set(data?.map((item) => item.category) || [])
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    setUpdating((prev) => ({ ...prev, [itemId]: true }));
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          is_available: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_available: !currentStatus } : item
        )
      );
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('فشل في تحديث حالة المنتج');
    } finally {
      setUpdating((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const bulkToggleCategory = async (category: string, makeAvailable: boolean) => {
    try {
      const itemsToUpdate = filteredItems.filter(
        (item) => item.category === category
      );

      const updates = itemsToUpdate.map((item) =>
        supabase
          .from('menu_items')
          .update({
            is_available: makeAvailable,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)
      );

      await Promise.all(updates);
      await fetchItems();
    } catch (error) {
      console.error('Error bulk updating availability:', error);
      alert('فشل في تحديث حالة المنتجات');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#781220]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#781220] to-[#9a1929] text-white p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-2">إدارة توفر المنتجات - فرع بلعون</h2>
        <p className="text-white/90">
          تحكم سريع في توفر المنتجات لفرع بلعون. يتم إعادة تعيين جميع المنتجات تلقائياً إلى "متوفر" في بداية كل يوم.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="بحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#781220]"
          />
        </div>

        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#781220] appearance-none cursor-pointer"
          >
            <option value="all">جميع الفئات</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {Object.keys(groupedItems).length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500 text-lg">لا توجد منتجات</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, categoryItems]) => {
            const availableCount = categoryItems.filter((item) => item.is_available).length;
            const totalCount = categoryItems.length;

            return (
              <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{category}</h3>
                    <p className="text-sm text-gray-600">
                      {availableCount} من {totalCount} متوفر
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => bulkToggleCategory(category, true)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <Power className="w-4 h-4" />
                      تفعيل الكل
                    </button>
                    <button
                      onClick={() => bulkToggleCategory(category, false)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <PowerOff className="w-4 h-4" />
                      تعطيل الكل
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 flex items-center justify-between transition-colors ${
                        !item.is_available ? 'bg-red-50/50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.price} ر.س</p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleAvailability(item.id, item.is_available)}
                        disabled={updating[item.id]}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                          item.is_available
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        } ${updating[item.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {updating[item.id] ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : item.is_available ? (
                          <>
                            <Power className="w-5 h-5" />
                            متوفر
                          </>
                        ) : (
                          <>
                            <PowerOff className="w-5 h-5" />
                            غير متوفر
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
