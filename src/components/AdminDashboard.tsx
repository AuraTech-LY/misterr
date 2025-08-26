import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, LogOut, MapPin } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { branches } from '../data/branchData';
import { CustomSelect } from './CustomSelect';

// Move ItemForm outside to prevent recreation on every render
interface ItemFormProps {
  item: MenuItem | Omit<MenuItem, 'id'>;
  onChange: (item: any) => void;
  isNew?: boolean;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, onChange, isNew = false }) => {
  const categories = ['برجر', 'دجاج', 'مشروبات', 'حلويات'];
  
  return (
    <div className="bg-gray-50 p-6 rounded-xl space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">اسم العنصر</label>
          <input
            type="text"
            value={item.name}
            onChange={(e) => onChange({ ...item, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-full focus:border-[#7A1120] text-right"
            placeholder="أدخل اسم العنصر"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">السعر (د.ل)</label>
          <input
            type="number"
            step="0.01"
            value={item.price}
            onChange={(e) => onChange({ ...item, price: parseFloat(e.target.value) || 0 })}
            className="w-full p-3 border border-gray-300 rounded-full focus:border-[#7A1120] text-right"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">الوصف</label>
        <textarea
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-2xl focus:border-[#7A1120] text-right resize-none"
          placeholder="أدخل وصف العنصر"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">الفئة</label>
          <CustomSelect
            value={item.category}
            onChange={(value) => onChange({ ...item, category: value })}
            options={categories.map(cat => ({
              value: cat,
              label: cat
            }))}
            placeholder="اختر الفئة"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">رابط الصورة</label>
          <input
            type="url"
            value={item.image_url}
            onChange={(e) => onChange({ ...item, image_url: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-full focus:border-[#7A1120] text-right"
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`popular-${isNew ? 'new' : (item as MenuItem).id}`}
            checked={item.is_popular}
            onChange={(e) => onChange({ ...item, is_popular: e.target.checked })}
            className="w-5 h-5 text-[#7A1120] border-gray-300 rounded-full focus:ring-[#7A1120]"
          />
          <label htmlFor={`popular-${isNew ? 'new' : (item as MenuItem).id}`} className="text-sm text-gray-700">
            الأكثر طلباً
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`available-${isNew ? 'new' : (item as MenuItem).id}`}
            checked={item.is_available}
            onChange={(e) => onChange({ ...item, is_available: e.target.checked })}
            className="w-5 h-5 text-[#7A1120] border-gray-300 rounded-full focus:ring-[#7A1120]"
          />
          <label htmlFor={`available-${isNew ? 'new' : (item as MenuItem).id}`} className="text-sm text-gray-700">
            متوفر
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`airport-${isNew ? 'new' : (item as MenuItem).id}`}
            checked={item.available_airport}
            onChange={(e) => onChange({ ...item, available_airport: e.target.checked })}
            className="w-5 h-5 text-[#7A1120] border-gray-300 rounded-full focus:ring-[#7A1120]"
          />
          <label htmlFor={`airport-${isNew ? 'new' : (item as MenuItem).id}`} className="text-sm text-gray-700">
            مستر شيش - فرع طريق المطار
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`dollar-${isNew ? 'new' : (item as MenuItem).id}`}
            checked={item.available_dollar}
            onChange={(e) => onChange({ ...item, available_dollar: e.target.checked })}
            className="w-5 h-5 text-[#7A1120] border-gray-300 rounded-full focus:ring-[#7A1120]"
          />
          <label htmlFor={`dollar-${isNew ? 'new' : (item as MenuItem).id}`} className="text-sm text-gray-700">
            مستر كريسبي
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`balaoun-${isNew ? 'new' : (item as MenuItem).id}`}
            checked={item.available_balaoun}
            onChange={(e) => onChange({ ...item, available_balaoun: e.target.checked })}
            className="w-5 h-5 text-[#7A1120] border-gray-300 rounded-full focus:ring-[#7A1120]"
          />
          <label htmlFor={`balaoun-${isNew ? 'new' : (item as MenuItem).id}`} className="text-sm text-gray-700">
            مستر شيش - بلعون
          </label>
        </div>
      </div>
    </div>
  );
};

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_popular: boolean;
  is_available: boolean;
  available_airport: boolean;
  available_dollar: boolean;
  available_balaoun: boolean;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const newItemTemplate: Omit<MenuItem, 'id'> = {
    name: '',
    description: '',
    price: 0,
    image_url: '',
    category: 'برجر',
    is_popular: false,
    is_available: true,
    available_airport: true,
    available_dollar: true,
    available_balaoun: true,
  };

  const [newItem, setNewItem] = useState(newItemTemplate);

  useEffect(() => {
    fetchMenuItems();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      onLogout();
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedBranch === 'all' 
    ? menuItems 
    : menuItems.filter(item => item[`available_${selectedBranch}` as keyof MenuItem]);

  const handleSaveItem = async (item: MenuItem) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: item.name,
          description: item.description,
          price: item.price,
          image_url: item.image_url,
          category: item.category,
          is_popular: item.is_popular,
          is_available: item.is_available,
          available_airport: item.available_airport,
          available_dollar: item.available_dollar,
          available_balaoun: item.available_balaoun,
        })
        .eq('id', item.id);

      if (error) throw error;

      setMenuItems(prev => prev.map(i => i.id === item.id ? item : i));
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
      alert('حدث خطأ في حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('menu_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      setMenuItems(prev => [...prev, data]);
      setNewItem(newItemTemplate);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('حدث خطأ في إضافة العنصر');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMenuItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('حدث خطأ في حذف العنصر');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A1120]"></div>
          <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-[#781220] text-white shadow-lg">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                <img 
                  src="/New Element 88 [8BACFE9].png" 
                  alt="مطعم المستر" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black">لوحة التحكم</h1>
                <p className="text-xs sm:text-sm opacity-90">إدارة قائمة مطعم المستر</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="bg-white bg-opacity-20 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-full font-semibold hover:bg-opacity-30 transition-all duration-300 flex items-center gap-2 text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
              <span className="sm:hidden">خروج</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-8 py-4 sm:py-8">
        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                تصفية حسب الفرع
              </label>
              <CustomSelect
                value={selectedBranch}
                onChange={setSelectedBranch}
                options={[
                  { 
                    value: 'all', 
                    label: 'جميع الفروع',
                    icon: <MapPin className="w-4 h-4 text-gray-500" />
                  },
                  { 
                    value: 'airport', 
                    label: 'مستر شيش - فرع طريق المطار',
                    icon: <MapPin className="w-4 h-4 text-blue-500" />
                  },
                  { 
                    value: 'dollar', 
                    label: 'مستر كريسبي',
                    icon: <MapPin className="w-4 h-4 text-green-500" />
                  },
                  { 
                    value: 'balaoun', 
                    label: 'مستر شيش - بلعون',
                    icon: <MapPin className="w-4 h-4 text-purple-500" />
                  }
                ]}
                placeholder="اختر الفرع"
              />
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-[#7A1120] hover:bg-[#5c0d18] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base w-full md:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              إضافة عنصر جديد
            </button>
          </div>
        </div>

        {/* Add New Item Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">إضافة عنصر جديد</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <ItemForm item={newItem} onChange={setNewItem} isNew={true} />
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
              <button
                onClick={handleAddItem}
                disabled={saving || !newItem.name || !newItem.description}
                className={`px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${
                  saving || !newItem.name || !newItem.description
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#7A1120] hover:bg-[#5c0d18] text-white shadow-lg hover:shadow-xl transform hover:scale-105 rounded-full'
                }`}
              >
                <Save className="w-4 h-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ العنصر'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="space-y-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {editingItem?.id === item.id ? (
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800">تعديل العنصر</h3>
                    <button
                      onClick={() => setEditingItem(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <ItemForm item={editingItem} onChange={setEditingItem} />
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
                    <button
                      onClick={() => handleSaveItem(editingItem)}
                      disabled={saving}
                      className={`px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${
                        saving
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-[#7A1120] hover:bg-[#5c0d18] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                      }`}
                      style={{ borderRadius: '9999px' }}
                      style={{ borderRadius: '9999px' }}
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                    <button
                      onClick={() => setEditingItem(null)}
                      className="px-4 sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-6">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-32 sm:w-24 sm:h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-800">{item.name}</h3>
                          {item.is_popular && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs sm:text-sm">الأكثر طلباً</span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2 text-sm sm:text-base">{item.description}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                          <span className="bg-gray-100 px-2 sm:px-3 py-1 rounded-full">{item.category}</span>
                          <span className="font-bold text-[#7A1120] text-sm sm:text-base">{item.price.toFixed(2)} د.ل</span>
                          {!item.is_available && (
                            <span className="bg-red-100 text-red-800 px-2 sm:px-3 py-1 rounded-full">غير متوفر</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 text-xs">
                          {item.available_airport && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">مستر شيش - فرع طريق المطار</span>}
                          {item.available_dollar && <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">مستر كريسبي</span>}
                          {item.available_balaoun && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">مستر شيش - بلعون</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-start">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-3 text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300 transform hover:scale-110"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-3 text-red-600 hover:bg-red-50 rounded-full transition-all duration-300 transform hover:scale-110"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-base sm:text-lg">لا توجد عناصر في هذا الفرع</div>
          </div>
        )}
      </main>
    </div>
  );
};