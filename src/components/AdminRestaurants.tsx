import React, { useState, useEffect } from 'react';
import { Plus, Edit, Save, X, Store } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Restaurant, RestaurantBranch } from '../types/restaurant';

interface AdminRestaurantsProps {
  onRestaurantsChange: () => void;
}

export const AdminRestaurants: React.FC<AdminRestaurantsProps> = ({ onRestaurantsChange }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const newRestaurantTemplate: Partial<Restaurant> = {
    name: '',
    slug: '',
    description: '',
    logo_url: '',
    banner_url: '',
    cuisine_type: 'وجبات سريعة',
    is_active: true,
    is_featured: false,
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    primary_color: '#781220',
    rating: 0,
    total_reviews: 0
  };

  const [newRestaurant, setNewRestaurant] = useState<Partial<Restaurant>>(newRestaurantTemplate);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRestaurant = async (restaurant: Restaurant) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: restaurant.name,
          slug: restaurant.slug,
          description: restaurant.description,
          logo_url: restaurant.logo_url,
          banner_url: restaurant.banner_url,
          cuisine_type: restaurant.cuisine_type,
          is_active: restaurant.is_active,
          is_featured: restaurant.is_featured,
          owner_name: restaurant.owner_name,
          owner_email: restaurant.owner_email,
          owner_phone: restaurant.owner_phone,
          primary_color: restaurant.primary_color
        })
        .eq('id', restaurant.id);

      if (error) throw error;

      setRestaurants(prev => prev.map(r => r.id === restaurant.id ? restaurant : r));
      setEditingRestaurant(null);
      onRestaurantsChange();
    } catch (error) {
      console.error('Error updating restaurant:', error);
      alert('حدث خطأ في حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRestaurant = async () => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('restaurants')
        .insert([newRestaurant])
        .select()
        .single();

      if (error) throw error;

      setRestaurants(prev => [...prev, data]);
      setNewRestaurant(newRestaurantTemplate);
      setShowAddForm(false);
      onRestaurantsChange();
    } catch (error) {
      console.error('Error adding restaurant:', error);
      alert('حدث خطأ في إضافة المطعم');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#781220]"></div>
          <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">إدارة المطاعم</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-[#781220] hover:bg-[#5c0d18] text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          إضافة مطعم جديد
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">إضافة مطعم جديد</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المطعم *</label>
              <input
                type="text"
                value={newRestaurant.name || ''}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewRestaurant({ ...newRestaurant, name, slug: generateSlug(name) });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">الرابط (Slug) *</label>
              <input
                type="text"
                value={newRestaurant.slug || ''}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">الوصف</label>
              <textarea
                value={newRestaurant.description || ''}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">نوع المطبخ</label>
              <input
                type="text"
                value={newRestaurant.cuisine_type || ''}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, cuisine_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">اللون الأساسي</label>
              <input
                type="color"
                value={newRestaurant.primary_color || '#781220'}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, primary_color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newRestaurant.is_active || false}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">مفعل</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newRestaurant.is_featured || false}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, is_featured: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">مميز</span>
              </label>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleAddRestaurant}
              disabled={saving || !newRestaurant.name || !newRestaurant.slug}
              className="px-6 py-3 bg-[#781220] hover:bg-[#5c0d18] text-white rounded-full font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 inline-block ml-2" />
              {saving ? 'جاري الحفظ...' : 'حفظ المطعم'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {editingRestaurant?.id === restaurant.id ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">تعديل المطعم</h3>
                  <button
                    onClick={() => setEditingRestaurant(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                {/* Edit form similar to add form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المطعم</label>
                    <input
                      type="text"
                      value={editingRestaurant.name}
                      onChange={(e) => setEditingRestaurant({ ...editingRestaurant, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">اللون الأساسي</label>
                    <input
                      type="color"
                      value={editingRestaurant.primary_color}
                      onChange={(e) => setEditingRestaurant({ ...editingRestaurant, primary_color: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => handleSaveRestaurant(editingRestaurant)}
                    disabled={saving}
                    className="px-6 py-3 bg-[#781220] hover:bg-[#5c0d18] text-white rounded-full font-semibold transition-all duration-300"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                  <button
                    onClick={() => setEditingRestaurant(null)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6 p-6">
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${restaurant.primary_color}15` }}
                >
                  {restaurant.logo_url ? (
                    <img src={restaurant.logo_url} alt={restaurant.name} className="w-full h-full object-contain" />
                  ) : (
                    <Store className="w-10 h-10" style={{ color: restaurant.primary_color }} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{restaurant.name}</h3>
                    {!restaurant.is_active && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">معطل</span>
                    )}
                    {restaurant.is_featured && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">مميز</span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{restaurant.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="bg-gray-100 px-3 py-1 rounded-full">{restaurant.cuisine_type}</span>
                    <span>/{restaurant.slug}</span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingRestaurant(restaurant)}
                  className="p-3 text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
