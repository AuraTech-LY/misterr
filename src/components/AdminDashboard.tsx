import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, LogOut, MapPin, Menu, Tag, Store, ShoppingCart } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { CustomSelect } from './CustomSelect';
import { ItemForm, MenuItem } from './ItemForm';
import { AdminCategories } from './AdminCategories';
import { AdminOperatingHours } from './AdminOperatingHours';
import { AdminRestaurants } from './AdminRestaurants';
import { AdminOrders } from './AdminOrders';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Category {
  id: string;
  name: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

interface SuccessMessage {
  id: string;
  message: string;
  timestamp: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'categories' | 'hours' | 'restaurants' | 'orders'>('menu');
  const [selectedRestaurant, setSelectedRestaurant] = useState<'mister-shish' | 'mister-crispy' | 'mister-burgerito'>('mister-shish');
  const [successMessages, setSuccessMessages] = useState<SuccessMessage[]>([]);

  const newItemTemplate: MenuItem = {
    name: '',
    description: '',
    price: 0,
    image_url: '',
    category: 'برجر',
    is_popular: false,
    is_available: true,
    available_airport: false,
    available_dollar: false,
    available_balaoun: false,
    available_burgerito_airport: false,
    image_brightness: 1.2,
    image_contrast: 1.1,
  };

  const [newItem, setNewItem] = useState(newItemTemplate);

  // Auto-remove success messages after 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSuccessMessages(prev => prev.filter(msg => now - msg.timestamp < 3000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addSuccessMessage = (message: string) => {
    const newMessage: SuccessMessage = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      timestamp: Date.now()
    };
    setSuccessMessages(prev => [...prev, newMessage]);
  };

  useEffect(() => {
    fetchData();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      onLogout();
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch menu items
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoriesChange = () => {
    fetchData();
  };

  // Filter items based on selected restaurant and branch
  const getFilteredItems = () => {
    let filtered = [];
    
    // Filter by restaurant branches
    if (selectedRestaurant === 'mister-shish') {
      filtered = menuItems.filter(item => 
        item.available_airport || item.available_balaoun
      );
    } else if (selectedRestaurant === 'mister-crispy') {
      filtered = menuItems.filter(item => 
        item.available_dollar
      );
    } else if (selectedRestaurant === 'mister-burgerito') {
      filtered = menuItems.filter(item => 
        item.available_burgerito_airport
      );
    }
    
    // Further filter by specific branch if selected
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(item => 
        item[`available_${selectedBranch}` as keyof MenuItem]
      );
    }
    
    return filtered;
  };

  const filteredItems = getFilteredItems();

  // Get categories that have items in the filtered results
  // For admin, show all categories (don't filter empty ones)
  const availableCategories = categories;

  const handleSaveItem = async (item: MenuItem) => {
    try {
      setSaving(true);
      
      // Ensure item maintains correct restaurant availability
      const itemToSave = { ...item };
      if (selectedRestaurant === 'mister-shish') {
        // For Mister Shish, ensure dollar is false
        itemToSave.available_dollar = false;
        itemToSave.available_burgerito_airport = false;
      } else if (selectedRestaurant === 'mister-crispy') {
        // For Mister Crispy, ensure airport and balaoun are false
        itemToSave.available_airport = false;
        itemToSave.available_balaoun = false;
        // Ensure dollar is true
        itemToSave.available_dollar = true;
        itemToSave.available_burgerito_airport = false;
      } else if (selectedRestaurant === 'mister-burgerito') {
        // For Mister Burgerito, ensure other branches are false
        itemToSave.available_airport = false;
        itemToSave.available_balaoun = false;
        itemToSave.available_dollar = false;
        // Ensure burgerito-airport is true
        itemToSave.available_burgerito_airport = true;
      }
      
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: itemToSave.name,
          description: itemToSave.description,
          price: itemToSave.price,
          image_url: itemToSave.image_url,
          category: itemToSave.category,
          is_popular: itemToSave.is_popular,
          is_available: itemToSave.is_available,
          available_airport: itemToSave.available_airport,
          available_dollar: itemToSave.available_dollar,
          available_balaoun: itemToSave.available_balaoun,
          available_burgerito_airport: itemToSave.available_burgerito_airport,
          image_brightness: itemToSave.image_brightness || 1.2,
          image_contrast: itemToSave.image_contrast || 1.1,
        })
        .eq('id', itemToSave.id);

      if (error) throw error;

      setMenuItems(prev => prev.map(i => i.id === itemToSave.id ? itemToSave : i));
      setEditingItem(null);
      addSuccessMessage('تم حفظ التغييرات بنجاح');
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
      
      // Ensure new item has correct restaurant availability based on selected restaurant
      const itemToAdd = { ...newItem };
      if (selectedRestaurant === 'mister-shish') {
        // For Mister Shish, ensure dollar is false
        itemToAdd.available_dollar = false;
        itemToAdd.available_burgerito_airport = false;
        // If no branches selected, default to both Mister Shish branches
        if (!itemToAdd.available_airport && !itemToAdd.available_balaoun) {
          itemToAdd.available_airport = true;
          itemToAdd.available_balaoun = true;
        }
      } else if (selectedRestaurant === 'mister-crispy') {
        // For Mister Crispy, ensure airport and balaoun are false
        itemToAdd.available_airport = false;
        itemToAdd.available_balaoun = false;
        // Ensure dollar is true
        itemToAdd.available_dollar = true;
        itemToAdd.available_burgerito_airport = false;
      } else if (selectedRestaurant === 'mister-burgerito') {
        // For Mister Burgerito, ensure other branches are false
        itemToAdd.available_airport = false;
        itemToAdd.available_balaoun = false;
        itemToAdd.available_dollar = false;
        // Ensure burgerito-airport is true
        itemToAdd.available_burgerito_airport = true;
      }
      
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{
          name: itemToAdd.name,
          description: itemToAdd.description,
          price: itemToAdd.price,
          image_url: itemToAdd.image_url,
          category: itemToAdd.category,
          is_popular: itemToAdd.is_popular,
          is_available: itemToAdd.is_available,
          available_airport: itemToAdd.available_airport,
          available_dollar: itemToAdd.available_dollar,
          available_balaoun: itemToAdd.available_balaoun,
          available_burgerito_airport: itemToAdd.available_burgerito_airport,
          image_brightness: itemToAdd.image_brightness || 1.2,
          image_contrast: itemToAdd.image_contrast || 1.1,
        }])
        .select()
        .single();

      if (error) throw error;

      setMenuItems(prev => [...prev, data]);
      setNewItem(newItemTemplate);
      setShowAddForm(false);
      addSuccessMessage('تم إضافة العنصر بنجاح');
    } catch (error) {
      console.error('Error adding item:', error);
      alert('حدث خطأ في إضافة العنصر');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    // Find the item to check if it belongs to other restaurants
    const itemToDelete = menuItems.find(item => item.id === id);
    if (!itemToDelete) return;
    
    // Check if item exists in other restaurants
    const existsInOtherRestaurants = 
      (selectedRestaurant === 'mister-shish' && itemToDelete.available_dollar) ||
      (selectedRestaurant === 'mister-crispy' && (itemToDelete.available_airport || itemToDelete.available_balaoun)) ||
      (selectedRestaurant === 'mister-burgerito' && (itemToDelete.available_airport || itemToDelete.available_balaoun || itemToDelete.available_dollar));
    
    if (existsInOtherRestaurants) {
      // If item exists in other restaurants, just disable it for current restaurant
      const restaurantName = selectedRestaurant === 'mister-shish' ? 'مستر شيش' : selectedRestaurant === 'mister-crispy' ? 'مستر كريسبي' : 'مستر برجريتو';
      if (!confirm('هذا العنصر موجود في مطاعم أخرى. هل تريد إزالته من ' + restaurantName + ' فقط؟')) return;
      
      try {
        const updatedItem = { ...itemToDelete };
        if (selectedRestaurant === 'mister-shish') {
          updatedItem.available_airport = false;
          updatedItem.available_balaoun = false;
        } else if (selectedRestaurant === 'mister-crispy') {
          updatedItem.available_dollar = false;
        } else if (selectedRestaurant === 'mister-burgerito') {
          updatedItem.available_burgerito_airport = false;
        }
        
        const { error } = await supabase
          .from('menu_items')
          .update({
            available_airport: updatedItem.available_airport,
            available_dollar: updatedItem.available_dollar,
            available_balaoun: updatedItem.available_balaoun,
            available_burgerito_airport: updatedItem.available_burgerito_airport,
          })
          .eq('id', id);

        if (error) throw error;

        setMenuItems(prev => prev.map(item => item.id === id ? updatedItem : item));
        addSuccessMessage('تم تحديث العنصر بنجاح');
      } catch (error) {
        console.error('Error updating item:', error);
        alert('حدث خطأ في تحديث العنصر');
      }
    } else {
      // If item only exists in current restaurant, delete it completely
      if (!confirm('هل أنت متأكد من حذف هذا العنصر نهائياً؟')) return;

      try {
        const { error } = await supabase
          .from('menu_items')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setMenuItems(prev => prev.filter(item => item.id !== id));
        addSuccessMessage('تم حذف العنصر بنجاح');
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('حدث خطأ في حذف العنصر');
      }
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

      {/* Success Messages */}
      <div className="fixed top-20 left-4 right-4 z-50 space-y-2 pointer-events-none">
        {successMessages.map((message) => (
          <div
            key={message.id}
            className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg animate-fadeInUp mx-auto max-w-md text-center font-semibold"
          >
            ✓ {message.message}
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-3 sm:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all duration-300 flex items-center gap-2 text-sm sm:text-base border-b-2 ${
                activeTab === 'menu'
                  ? 'text-[#55421A] border-[#55421A] bg-red-50'
                  : 'text-gray-600 border-transparent hover:text-[#55421A] hover:border-gray-300'
              }`}
            >
              <Menu className="w-5 h-5" />
              إدارة المنتجات
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all duration-300 flex items-center gap-2 text-sm sm:text-base border-b-2 ${
                activeTab === 'categories'
                  ? 'text-[#55421A] border-[#55421A] bg-red-50'
                  : 'text-gray-600 border-transparent hover:text-[#55421A] hover:border-gray-300'
              }`}
            >
              <Tag className="w-5 h-5" />
              إدارة الفئات
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all duration-300 flex items-center gap-2 text-sm sm:text-base border-b-2 ${
                activeTab === 'hours'
                  ? 'text-[#55421A] border-[#55421A] bg-red-50'
                  : 'text-gray-600 border-transparent hover:text-[#55421A] hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              أوقات العمل
            </button>
            <button
              onClick={() => setActiveTab('restaurants')}
              className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all duration-300 flex items-center gap-2 text-sm sm:text-base border-b-2 ${
                activeTab === 'restaurants'
                  ? 'text-[#55421A] border-[#55421A] bg-red-50'
                  : 'text-gray-600 border-transparent hover:text-[#55421A] hover:border-gray-300'
              }`}
            >
              <Store className="w-5 h-5" />
              إدارة المطاعم والفروع
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all duration-300 flex items-center gap-2 text-sm sm:text-base border-b-2 ${
                activeTab === 'orders'
                  ? 'text-[#55421A] border-[#55421A] bg-red-50'
                  : 'text-gray-600 border-transparent hover:text-[#55421A] hover:border-gray-300'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              إدارة الطلبات
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-3 sm:px-8 py-4 sm:py-8">
        {activeTab === 'categories' ? (
          <AdminCategories onCategoriesChange={handleCategoriesChange} />
        ) : activeTab === 'hours' ? (
          <AdminOperatingHours />
        ) : activeTab === 'restaurants' ? (
          <AdminRestaurants onRestaurantsChange={fetchData} />
        ) : activeTab === 'orders' ? (
          <AdminOrders />
        ) : (
          <>
            {/* Restaurant Sub-tabs */}
            <div className="bg-white shadow-sm border-b mb-6">
              <div className="container mx-auto px-3 sm:px-8">
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedRestaurant('mister-shish')}
                    className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all duration-300 flex items-center gap-2 text-sm sm:text-base border-b-2 ${
                      selectedRestaurant === 'mister-shish'
                        ? 'text-[#781220] border-[#781220] bg-red-50'
                        : 'text-gray-600 border-transparent hover:text-[#781220] hover:border-gray-300'
                    }`}
                  >
                    مستر شيش
                  </button>
                  <button
                    onClick={() => setSelectedRestaurant('mister-crispy')}
                    className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all duration-300 flex items-center gap-2 text-sm sm:text-base border-b-2 ${
                      selectedRestaurant === 'mister-crispy'
                        ? 'text-[#55421A] border-[#55421A] bg-red-50'
                        : 'text-gray-600 border-transparent hover:text-[#55421A] hover:border-gray-300'
                    }`}
                  >
                    مستر كريسبي
                  </button>
                  <button
                    onClick={() => setSelectedRestaurant('mister-burgerito')}
                    className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all duration-300 flex items-center gap-2 text-sm sm:text-base border-b-2 ${
                      selectedRestaurant === 'mister-burgerito'
                        ? 'text-[#E59F49] border-[#E59F49] bg-red-50'
                        : 'text-gray-600 border-transparent hover:text-[#E59F49] hover:border-gray-300'
                    }`}
                  >
                    مستر برجريتو
                  </button>
                </div>
              </div>
            </div>

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
                    options={selectedRestaurant === 'mister-shish' ? [
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
                        value: 'balaoun', 
                        label: 'مستر شيش - بلعون',
                        icon: <MapPin className="w-4 h-4 text-purple-500" />
                      }
                    ] : selectedRestaurant === 'mister-crispy' ? [
                      { 
                        value: 'all', 
                        label: 'جميع الفروع',
                        icon: <MapPin className="w-4 h-4 text-gray-500" />
                      },
                      { 
                        value: 'dollar', 
                        label: 'مستر كريسبي',
                        icon: <MapPin className="w-4 h-4 text-green-500" />
                      }
                    ] : [
                      { 
                        value: 'all', 
                        label: 'جميع الفروع',
                        icon: <MapPin className="w-4 h-4 text-gray-500" />
                      },
                      { 
                        value: 'burgerito-airport', 
                        label: 'مستر برجريتو - طريق المطار',
                        icon: <MapPin className="w-4 h-4 text-orange-500" />
                      }
                    ]}
                    placeholder="اختر الفرع"
                  />
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className={`${selectedRestaurant === 'mister-crispy' ? 'bg-[#55421A] hover:bg-[#3d2f12]' : selectedRestaurant === 'mister-burgerito' ? 'bg-[#E59F49] hover:bg-[#cc8a3d]' : 'bg-[#7A1120] hover:bg-[#5c0d18]'} text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base w-full md:w-auto justify-center`}
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
                <ItemForm item={newItem} onChange={setNewItem} categories={categories} selectedRestaurant={selectedRestaurant} />
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
                  <button
                    onClick={handleAddItem}
                    disabled={saving || !newItem.name || !newItem.description}
                    className={`px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${
                      saving || !newItem.name || !newItem.description
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : `${selectedRestaurant === 'mister-crispy' ? 'bg-[#55421A] hover:bg-[#3d2f12]' : selectedRestaurant === 'mister-burgerito' ? 'bg-[#E59F49] hover:bg-[#cc8a3d]' : 'bg-[#7A1120] hover:bg-[#5c0d18]'} text-white shadow-lg hover:shadow-xl transform hover:scale-105 rounded-full`
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
                      <ItemForm item={editingItem} onChange={setEditingItem} categories={categories} selectedRestaurant={selectedRestaurant} />
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
                        <button
                          onClick={() => handleSaveItem(editingItem)}
                          disabled={saving}
                          className={`px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${
                            saving
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : `${selectedRestaurant === 'mister-crispy' ? 'bg-[#55421A] hover:bg-[#3d2f12]' : selectedRestaurant === 'mister-burgerito' ? 'bg-[#E59F49] hover:bg-[#cc8a3d]' : 'bg-[#7A1120] hover:bg-[#5c0d18]'} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
                          }`}
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
                        style={{
                          filter: `brightness(${item.image_brightness || 1.2}) contrast(${item.image_contrast || 1.1})`
                        }}
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
                              <span className={`font-bold ${selectedRestaurant === 'mister-crispy' ? 'text-[#55421A]' : selectedRestaurant === 'mister-burgerito' ? 'text-[#E59F49]' : 'text-[#7A1120]'} text-sm sm:text-base`}>{item.price.toFixed(2)} د.ل</span>
                              {!item.is_available && (
                                <span className="bg-red-100 text-red-800 px-2 sm:px-3 py-1 rounded-full">غير متوفر</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 text-xs">
                              {selectedRestaurant === 'mister-shish' && (
                                <>
                                  {item.available_airport && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">مستر شيش - فرع طريق المطار</span>}
                                  {item.available_balaoun && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">مستر شيش - بلعون</span>}
                                </>
                              )}
                              {selectedRestaurant === 'mister-crispy' && (
                                <>
                                  {item.available_dollar && <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">مستر كريسبي</span>}
                                </>
                              )}
                              {selectedRestaurant === 'mister-burgerito' && (
                                <>
                                  {item.available_burgerito_airport && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">مستر برجريتو - طريق المطار</span>}
                                </>
                              )}
                            </div>
                            
                            {/* Image Controls */}
                            <div className="mt-4 space-y-3 bg-gray-50 p-3 rounded-lg">
                              <h4 className="text-sm font-semibold text-gray-700">إعدادات الصورة</h4>
                              
                              {/* Brightness Control */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <label className="text-xs font-medium text-gray-600">السطوع</label>
                                  <span className="text-xs text-gray-500">{(item.image_brightness || 1.2).toFixed(1)}</span>
                                </div>
                                <input
                                  type="range"
                                  min="0.5"
                                  max="2.0"
                                  step="0.1"
                                  value={item.image_brightness || 1.2}
                                  onChange={(e) => {
                                    const newBrightness = parseFloat(e.target.value);
                                    const updatedItem = { ...item, image_brightness: newBrightness };
                                    setMenuItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
                                    // Auto-save after a short delay
                                    clearTimeout((window as any)[`brightness_timeout_${item.id}`]);
                                    (window as any)[`brightness_timeout_${item.id}`] = setTimeout(() => {
                                      handleSaveItem(updatedItem);
                                    }, 1000);
                                  }}
                                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                                    selectedRestaurant === 'mister-crispy' 
                                      ? 'bg-gray-200 slider-thumb-[#55421A]' 
                                      : selectedRestaurant === 'mister-burgerito'
                                        ? 'bg-gray-200 slider-thumb-[#E59F49]'
                                        : 'bg-gray-200 slider-thumb-[#7A1120]'
                                  }`}
                                />
                              </div>

                              {/* Contrast Control */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <label className="text-xs font-medium text-gray-600">التباين</label>
                                  <span className="text-xs text-gray-500">{(item.image_contrast || 1.1).toFixed(1)}</span>
                                </div>
                                <input
                                  type="range"
                                  min="0.5"
                                  max="2.0"
                                  step="0.1"
                                  value={item.image_contrast || 1.1}
                                  onChange={(e) => {
                                    const newContrast = parseFloat(e.target.value);
                                    const updatedItem = { ...item, image_contrast: newContrast };
                                    setMenuItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
                                    // Auto-save after a short delay
                                    clearTimeout((window as any)[`contrast_timeout_${item.id}`]);
                                    (window as any)[`contrast_timeout_${item.id}`] = setTimeout(() => {
                                      handleSaveItem(updatedItem);
                                    }, 1000);
                                  }}
                                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                                    selectedRestaurant === 'mister-crispy' 
                                      ? 'bg-gray-200 slider-thumb-[#55421A]' 
                                      : selectedRestaurant === 'mister-burgerito'
                                        ? 'bg-gray-200 slider-thumb-[#E59F49]'
                                        : 'bg-gray-200 slider-thumb-[#7A1120]'
                                  }`}
                                />
                              </div>

                              {/* Reset Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedItem = { ...item, image_brightness: 1.2, image_contrast: 1.1 };
                                  setMenuItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
                                  handleSaveItem(updatedItem);
                                }}
                                className="text-xs text-gray-600 hover:text-gray-800 underline"
                              >
                                إعادة تعيين
                              </button>
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
          </>
        )}
      </main>
    </div>
  );
};