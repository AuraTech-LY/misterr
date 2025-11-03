import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, LogOut, MapPin, Menu, Tag, Store, ShoppingCart, Users, FileText, Bell } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { CustomSelect } from './CustomSelect';
import { ItemForm, MenuItem } from './ItemForm';
import { AdminCategories } from './AdminCategories';
import { AdminOperatingHours } from './AdminOperatingHours';
import { AdminRestaurants } from './AdminRestaurants';
import { AdminOrders } from './AdminOrders';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminAuditLogs } from './AdminAuditLogs';
import { CashierOrdersView } from './CashierOrdersView';
import { usePermission } from '../hooks/usePermission';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Category {
  id: string;
  name: string;
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  logo_url: string;
}

interface RestaurantBranch {
  id: string;
  restaurant_id: string;
  name: string;
  area: string;
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
  const [activeTab, setActiveTab] = useState<'menu' | 'categories' | 'hours' | 'restaurants' | 'orders' | 'cashier' | 'users' | 'logs'>('menu');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [branches, setBranches] = useState<RestaurantBranch[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [successMessages, setSuccessMessages] = useState<SuccessMessage[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const { isOwner, canManageUsers, loading: permissionLoading } = usePermission();

  const newItemTemplate: MenuItem = {
    name: '',
    description: '',
    price: 0,
    image_url: '',
    category: 'برجر',
    is_popular: false,
    is_available: true,
    restaurant_id: '',
    branch_id: null,
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
    fetchRestaurants();
    fetchData();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      onLogout();
    } else {
      setCurrentUserEmail(user.email || '');
    }
  };

  const fetchRestaurants = async () => {
    try {
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

      if (restaurantsError) throw restaurantsError;
      setRestaurants(restaurantsData || []);

      if (restaurantsData && restaurantsData.length > 0 && !selectedRestaurantId) {
        setSelectedRestaurantId(restaurantsData[0].id);
      }

      const { data: branchesData, error: branchesError } = await supabase
        .from('restaurant_branches')
        .select('*')
        .order('name');

      if (branchesError) throw branchesError;
      setBranches(branchesData || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
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
    if (!selectedRestaurantId) return [];

    let filtered = menuItems.filter(item => item.restaurant_id === selectedRestaurantId);

    // Further filter by specific branch if selected
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(item => item.branch_id === selectedBranch);
    }

    return filtered;
  };

  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);
  const restaurantBranches = branches.filter(b => b.restaurant_id === selectedRestaurantId);

  const filteredItems = getFilteredItems();

  // Get categories that have items in the filtered results
  // For admin, show all categories (don't filter empty ones)
  const availableCategories = categories;

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
          restaurant_id: item.restaurant_id,
          branch_id: item.branch_id,
          image_brightness: item.image_brightness || 1.2,
          image_contrast: item.image_contrast || 1.1,
        })
        .eq('id', item.id);

      if (error) throw error;

      setMenuItems(prev => prev.map(i => i.id === item.id ? item : i));
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

      const { data, error } = await supabase
        .from('menu_items')
        .insert([{
          name: newItem.name,
          description: newItem.description,
          price: newItem.price,
          image_url: newItem.image_url,
          category: newItem.category,
          is_popular: newItem.is_popular,
          is_available: newItem.is_available,
          restaurant_id: selectedRestaurantId,
          branch_id: newItem.branch_id || null,
          image_brightness: newItem.image_brightness || 1.2,
          image_contrast: newItem.image_contrast || 1.1,
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
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;

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
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-px">
            {/* Custom scrollbar hiding and smooth scroll */}
            <style dangerouslySetInnerHTML={{__html: `.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; scroll-behavior: smooth; }`}} />
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 sm:px-6 py-3 font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'menu'
                  ? 'text-[#55421A] border-[#55421A] bg-red-50'
                  : 'text-gray-600 border-transparent hover:text-[#55421A] hover:border-gray-300'
              }`}
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">إدارة المنتجات</span>
              <span className="xs:hidden">المنتجات</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 sm:px-6 py-3 font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'categories'
                  ? 'text-[#55421A] border-[#55421A] bg-red-50'
                  : 'text-gray-600 border-transparent hover:text-[#55421A] hover:border-gray-300'
              }`}
            >
              <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>الفئات</span>
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`px-3 sm:px-6 py-3 font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'hours'
                  ? 'text-[#55421A] border-[#55421A] bg-red-50'
                  : 'text-gray-600 border-transparent hover:text-[#55421A] hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden xs:inline">أوقات العمل</span>
              <span className="xs:hidden">الأوقات</span>
            </button>
            <button
              onClick={() => setActiveTab('restaurants')}
              className={`px-3 sm:px-6 py-3 font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'restaurants'
                  ? 'text-[#55421A] border-[#55421A] bg-red-50'
                  : 'text-gray-600 border-transparent hover:text-[#55421A] hover:border-gray-300'
              }`}
            >
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">المطاعم والفروع</span>
              <span className="xs:hidden">المطاعم</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 sm:px-6 py-3 font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'orders'
                  ? 'text-[#55421A] border-[#55421A] bg-red-50'
                  : 'text-gray-600 border-transparent hover:text-[#55421A] hover:border-gray-300'
              }`}
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>الطلبات</span>
            </button>
            <button
              onClick={() => setActiveTab('cashier')}
              className={`px-3 sm:px-6 py-3 font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'cashier'
                  ? 'text-[#55421A] border-[#55421A] bg-red-50'
                  : 'text-gray-600 border-transparent hover:text-[#55421A] hover:border-gray-300'
              }`}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">الطلبات المباشرة</span>
              <span className="xs:hidden">مباشر</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 sm:px-6 py-3 font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'users'
                  ? 'text-[#55421A] border-[#55421A] bg-red-50'
                  : 'text-gray-600 border-transparent hover:text-[#55421A] hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>المستخدمون</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 sm:px-6 py-3 font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'logs'
                  ? 'text-[#55421A] border-[#55421A] bg-red-50'
                  : 'text-gray-600 border-transparent hover:text-[#55421A] hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">سجل التدقيق</span>
              <span className="xs:hidden">السجل</span>
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
        ) : activeTab === 'cashier' ? (
          <CashierOrdersView />
        ) : activeTab === 'users' ? (
          <AdminUserManagement currentUserEmail={currentUserEmail} />
        ) : activeTab === 'logs' ? (
          <AdminAuditLogs />
        ) : (
          <>
            {/* Restaurant Sub-tabs */}
            <div className="bg-white shadow-sm border-b mb-4 sm:mb-6 sticky top-[52px] sm:top-[60px] z-30">
              <div className="container mx-auto px-3 sm:px-4">
                <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-px">
                  {restaurants.map((restaurant) => (
                    <button
                      key={restaurant.id}
                      onClick={() => setSelectedRestaurantId(restaurant.id)}
                      className={`px-3 sm:px-6 py-2.5 sm:py-4 font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base border-b-2 whitespace-nowrap flex-shrink-0 ${
                        selectedRestaurantId === restaurant.id
                          ? `border-[${restaurant.primary_color}] bg-red-50`
                          : 'text-gray-600 border-transparent hover:border-gray-300'
                      }`}
                      style={{
                        color: selectedRestaurantId === restaurant.id ? restaurant.primary_color : undefined
                      }}
                    >
                      {restaurant.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
                <div className="w-full sm:w-auto">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
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
                      ...restaurantBranches.map(branch => ({
                        value: branch.id,
                        label: branch.area,
                        icon: <MapPin className="w-4 h-4 text-blue-500" />
                      }))
                    ]}
                    placeholder="اختر الفرع"
                  />
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 text-xs sm:text-base w-full sm:w-auto justify-center"
                  style={{ backgroundColor: selectedRestaurant?.primary_color || '#781220' }}
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>إضافة عنصر جديد</span>
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
                <ItemForm item={newItem} onChange={setNewItem} categories={categories} branches={restaurantBranches} />
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
                  <button
                    onClick={handleAddItem}
                    disabled={saving || !newItem.name || !newItem.description}
                    className="px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base text-white shadow-lg hover:shadow-xl transform hover:scale-105 rounded-full"
                    style={{ backgroundColor: saving || !newItem.name || !newItem.description ? '#d1d5db' : selectedRestaurant?.primary_color || '#781220' }}
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
                      <ItemForm item={editingItem} onChange={setEditingItem} categories={categories} branches={restaurantBranches} />
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
                        <button
                          onClick={() => handleSaveItem(editingItem)}
                          disabled={saving}
                          className="px-4 sm:px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                          style={{ backgroundColor: saving ? '#d1d5db' : selectedRestaurant?.primary_color || '#781220' }}
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
                              <span className="font-bold text-sm sm:text-base" style={{ color: selectedRestaurant?.primary_color || '#781220' }}>{item.price.toFixed(2)} د.ل</span>
                              {!item.is_available && (
                                <span className="bg-red-100 text-red-800 px-2 sm:px-3 py-1 rounded-full">غير متوفر</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 text-xs">
                              {item.branch_id ? (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {branches.find(b => b.id === item.branch_id)?.area || 'فرع محدد'}
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">جميع الفروع</span>
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
                                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-200"
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
                                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-200"
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