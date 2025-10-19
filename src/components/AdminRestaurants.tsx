import React, { useState, useEffect } from 'react';
import { Plus, Edit, Save, X, Store, ChevronDown, ChevronUp, MapPin, Phone, Navigation, DollarSign, Clock, Upload, Image as ImageIcon, Power, PowerOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Restaurant, RestaurantBranch } from '../types/restaurant';
import { AdminBranchOperatingHours } from './AdminBranchOperatingHours';

interface AdminRestaurantsProps {
  onRestaurantsChange: () => void;
}

interface BranchWithRestaurant extends RestaurantBranch {
  restaurant_name?: string;
  restaurant_color?: string;
}

interface RestaurantWithBranchCount extends Restaurant {
  branchCount?: number;
}

export const AdminRestaurants: React.FC<AdminRestaurantsProps> = ({ onRestaurantsChange }) => {
  const [restaurants, setRestaurants] = useState<RestaurantWithBranchCount[]>([]);
  const [branches, setBranches] = useState<BranchWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedRestaurantId, setExpandedRestaurantId] = useState<string | null>(null);
  const [editingBranch, setEditingBranch] = useState<BranchWithRestaurant | null>(null);
  const [addingBranchForRestaurant, setAddingBranchForRestaurant] = useState<string | null>(null);
  const [expandedBranchId, setExpandedBranchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

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

  const newBranchTemplate: Partial<BranchWithRestaurant> = {
    restaurant_id: '',
    name: '',
    area: '',
    address: '',
    phone: '',
    latitude: 0,
    longitude: 0,
    is_active: true,
    delivery_radius_km: 10.0,
    min_order_amount: 0,
    base_delivery_fee: 5.0
  };

  const [newBranch, setNewBranch] = useState<Partial<BranchWithRestaurant>>(newBranchTemplate);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ logo?: string; banner?: string }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

      if (restaurantsError) throw restaurantsError;

      const { data: branchesData, error: branchesError } = await supabase
        .from('restaurant_branches')
        .select('*')
        .order('name');

      if (branchesError) throw branchesError;

      const branchesWithRestaurant = (branchesData || []).map(branch => {
        const restaurant = restaurantsData?.find(r => r.id === branch.restaurant_id);
        return {
          ...branch,
          restaurant_name: restaurant?.name || 'غير معروف',
          restaurant_color: restaurant?.primary_color || '#781220'
        };
      });

      const restaurantsWithCount = (restaurantsData || []).map(restaurant => ({
        ...restaurant,
        branchCount: branchesWithRestaurant.filter(b => b.restaurant_id === restaurant.id).length
      }));

      setRestaurants(restaurantsWithCount);
      setBranches(branchesWithRestaurant);
    } catch (error) {
      console.error('Error fetching data:', error);
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
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleSaveBranch = async (branch: BranchWithRestaurant) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('restaurant_branches')
        .update({
          restaurant_id: branch.restaurant_id,
          name: branch.name,
          area: branch.area,
          address: branch.address,
          phone: branch.phone,
          latitude: branch.latitude,
          longitude: branch.longitude,
          is_active: branch.is_active,
          delivery_radius_km: branch.delivery_radius_km,
          min_order_amount: branch.min_order_amount,
          base_delivery_fee: branch.base_delivery_fee
        })
        .eq('id', branch.id);

      if (error) throw error;

      await fetchData();
      setEditingBranch(null);
      onRestaurantsChange();
    } catch (error) {
      console.error('Error updating branch:', error);
      alert('حدث خطأ في حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBranch = async () => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('restaurant_branches')
        .insert([{
          restaurant_id: newBranch.restaurant_id,
          name: newBranch.name,
          area: newBranch.area,
          address: newBranch.address,
          phone: newBranch.phone,
          latitude: newBranch.latitude,
          longitude: newBranch.longitude,
          is_active: newBranch.is_active,
          delivery_radius_km: newBranch.delivery_radius_km,
          min_order_amount: newBranch.min_order_amount,
          base_delivery_fee: newBranch.base_delivery_fee
        }])
        .select()
        .single();

      if (error) throw error;

      await createDefaultOperatingHours(data.id);

      await fetchData();
      setNewBranch(newBranchTemplate);
      setAddingBranchForRestaurant(null);
      onRestaurantsChange();
    } catch (error) {
      console.error('Error adding branch:', error);
      alert('حدث خطأ في إضافة الفرع');
    } finally {
      setSaving(false);
    }
  };

  const createDefaultOperatingHours = async (branchId: string) => {
    const defaultHours = Array.from({ length: 7 }, (_, i) => ({
      branch_id: branchId,
      day_of_week: i,
      opening_time: '11:00:00',
      closing_time: '23:59:00',
      is_closed: false,
      is_24_hours: false
    }));

    const { error } = await supabase
      .from('branch_operating_hours')
      .insert(defaultHours);

    if (error) {
      console.error('Error creating default operating hours:', error);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفرع؟ سيتم حذف جميع أوقات العمل المرتبطة به.')) return;

    try {
      const { error } = await supabase
        .from('restaurant_branches')
        .delete()
        .eq('id', branchId);

      if (error) throw error;

      await fetchData();
      onRestaurantsChange();
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert('حدث خطأ في حذف الفرع');
    }
  };

  const handleToggleRestaurantStatus = async (restaurant: Restaurant) => {
    const newStatus = !restaurant.is_active;
    const action = newStatus ? 'تفعيل' : 'تعطيل';

    if (!confirm(`هل أنت متأكد من ${action} مطعم "${restaurant.name}"؟${!newStatus ? ' سيتم إخفاء جميع الفروع من العملاء.' : ''}`)) {
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: newStatus })
        .eq('id', restaurant.id);

      if (error) throw error;

      await fetchData();
      onRestaurantsChange();
      alert(`تم ${action} المطعم بنجاح`);
    } catch (error) {
      console.error('Error toggling restaurant status:', error);
      alert(`حدث خطأ في ${action} المطعم`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBranchStatus = async (branch: BranchWithRestaurant) => {
    const newStatus = !branch.is_active;
    const action = newStatus ? 'تفعيل' : 'تعطيل';

    if (!confirm(`هل أنت متأكد من ${action} فرع "${branch.name}"؟${!newStatus ? ' سيتم إخفاء الفرع من العملاء.' : ''}`)) {
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('restaurant_branches')
        .update({ is_active: newStatus })
        .eq('id', branch.id);

      if (error) throw error;

      await fetchData();
      onRestaurantsChange();
      alert(`تم ${action} الفرع بنجاح`);
    } catch (error) {
      console.error('Error toggling branch status:', error);
      alert(`حدث خطأ في ${action} الفرع`);
    } finally {
      setSaving(false);
    }
  };

  const getRestaurantBranches = (restaurantId: string) => {
    return branches.filter(b => b.restaurant_id === restaurantId);
  };

  const toggleRestaurantExpansion = (restaurantId: string) => {
    setExpandedRestaurantId(expandedRestaurantId === restaurantId ? null : restaurantId);
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branches.some(b =>
        b.restaurant_id === restaurant.id &&
        (b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         b.area.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && restaurant.is_active) ||
      (statusFilter === 'inactive' && !restaurant.is_active);

    return matchesSearch && matchesStatus;
  });

  const handleImageUpload = async (file: File, type: 'logo' | 'banner', restaurantId?: string) => {
    try {
      setUploadingImage(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `restaurant-images/${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('restaurant-assets')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('حدث خطأ في رفع الصورة. يرجى المحاولة مرة أخرى.');
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-assets')
        .getPublicUrl(filePath);

      if (restaurantId && editingRestaurant) {
        const updateField = type === 'logo' ? 'logo_url' : 'banner_url';
        setEditingRestaurant({ ...editingRestaurant, [updateField]: publicUrl });
      } else {
        const updateField = type === 'logo' ? 'logo_url' : 'banner_url';
        setNewRestaurant({ ...newRestaurant, [updateField]: publicUrl });
        setImagePreview({ ...imagePreview, [type]: publicUrl });
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ في رفع الصورة');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner', restaurantId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار ملف صورة');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      handleImageUpload(file, type, restaurantId);
    }
  };

  const BranchForm = ({ branch, onChange }: { branch: Partial<BranchWithRestaurant>, onChange: (b: Partial<BranchWithRestaurant>) => void }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">اسم الفرع *</label>
        <input
          type="text"
          value={branch.name || ''}
          onChange={(e) => onChange({ ...branch, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
          placeholder="مثال: فرع طريق المطار"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">المنطقة *</label>
        <input
          type="text"
          value={branch.area || ''}
          onChange={(e) => onChange({ ...branch, area: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
          placeholder="مثال: طريق المطار"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">رقم الهاتف *</label>
        <input
          type="text"
          value={branch.phone || ''}
          onChange={(e) => onChange({ ...branch, phone: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
          placeholder="مثال: 093-0625795"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">نطاق التوصيل (كم)</label>
        <input
          type="number"
          step="0.5"
          value={branch.delivery_radius_km || 10}
          onChange={(e) => onChange({ ...branch, delivery_radius_km: parseFloat(e.target.value) })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-2">العنوان الكامل *</label>
        <input
          type="text"
          value={branch.address || ''}
          onChange={(e) => onChange({ ...branch, address: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
          placeholder="مثال: طريق المطار مقابل مدرسة المهاجرين"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">خط العرض (Latitude)</label>
        <input
          type="number"
          step="0.00000001"
          value={branch.latitude || 0}
          onChange={(e) => onChange({ ...branch, latitude: parseFloat(e.target.value) })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">خط الطول (Longitude)</label>
        <input
          type="number"
          step="0.00000001"
          value={branch.longitude || 0}
          onChange={(e) => onChange({ ...branch, longitude: parseFloat(e.target.value) })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">الحد الأدنى للطلب (د.ل)</label>
        <input
          type="number"
          step="0.5"
          value={branch.min_order_amount || 0}
          onChange={(e) => onChange({ ...branch, min_order_amount: parseFloat(e.target.value) })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">رسوم التوصيل الأساسية (د.ل)</label>
        <input
          type="number"
          step="0.5"
          value={branch.base_delivery_fee || 5}
          onChange={(e) => onChange({ ...branch, base_delivery_fee: parseFloat(e.target.value) })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
        />
      </div>
      <div className="flex items-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={branch.is_active ?? true}
            onChange={(e) => onChange({ ...branch, is_active: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm font-semibold text-gray-700">الفرع مفعل</span>
        </label>
      </div>
    </div>
  );

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 w-full md:w-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">إدارة المطاعم والفروع</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <input
              type="text"
              placeholder="ابحث عن مطعم أو فرع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 md:w-96 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#781220]"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#781220] bg-white"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">مفعل فقط</option>
              <option value="inactive">معطل فقط</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-[#781220] hover:bg-[#5c0d18] text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg w-full md:w-auto justify-center"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">شعار المطعم (Logo)</label>
              <div className="flex items-center gap-3">
                {(imagePreview.logo || newRestaurant.logo_url) && (
                  <div className="w-20 h-20 rounded-lg border-2 border-gray-300 overflow-hidden">
                    <img
                      src={imagePreview.logo || newRestaurant.logo_url}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#781220] hover:bg-gray-50 transition-all">
                    {uploadingImage ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#781220]"></div>
                        <span className="text-sm text-gray-600">جاري الرفع...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-600" />
                        <span className="text-sm text-gray-600">اختر صورة</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'logo')}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (أقصى حجم: 5MB)</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">صورة الغلاف (Banner)</label>
              <div className="flex items-center gap-3">
                {(imagePreview.banner || newRestaurant.banner_url) && (
                  <div className="w-32 h-20 rounded-lg border-2 border-gray-300 overflow-hidden">
                    <img
                      src={imagePreview.banner || newRestaurant.banner_url}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#781220] hover:bg-gray-50 transition-all">
                    {uploadingImage ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#781220]"></div>
                        <span className="text-sm text-gray-600">جاري الرفع...</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 text-gray-600" />
                        <span className="text-sm text-gray-600">اختر صورة</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'banner')}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (أقصى حجم: 5MB)</p>
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
        {filteredRestaurants.map((restaurant) => {
          const restaurantBranches = getRestaurantBranches(restaurant.id);
          const isExpanded = expandedRestaurantId === restaurant.id;

          return (
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
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">شعار المطعم (Logo)</label>
                      <div className="flex items-center gap-3">
                        {editingRestaurant.logo_url && (
                          <div className="w-20 h-20 rounded-lg border-2 border-gray-300 overflow-hidden">
                            <img
                              src={editingRestaurant.logo_url}
                              alt="Logo"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <label className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#781220] hover:bg-gray-50 transition-all">
                            {uploadingImage ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#781220]"></div>
                                <span className="text-sm text-gray-600">جاري الرفع...</span>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-5 h-5 text-gray-600" />
                                <span className="text-sm text-gray-600">تغيير الشعار</span>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, 'logo', editingRestaurant.id)}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">صورة الغلاف (Banner)</label>
                      <div className="flex items-center gap-3">
                        {editingRestaurant.banner_url && (
                          <div className="w-32 h-20 rounded-lg border-2 border-gray-300 overflow-hidden">
                            <img
                              src={editingRestaurant.banner_url}
                              alt="Banner"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <label className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#781220] hover:bg-gray-50 transition-all">
                            {uploadingImage ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#781220]"></div>
                                <span className="text-sm text-gray-600">جاري الرفع...</span>
                              </div>
                            ) : (
                              <>
                                <ImageIcon className="w-5 h-5 text-gray-600" />
                                <span className="text-sm text-gray-600">تغيير الغلاف</span>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, 'banner', editingRestaurant.id)}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                        </label>
                      </div>
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
                <>
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
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {restaurantBranches.length} فرع
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{restaurant.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="bg-gray-100 px-3 py-1 rounded-full">{restaurant.cuisine_type}</span>
                        <span>/{restaurant.slug}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleRestaurantStatus(restaurant)}
                        disabled={saving}
                        className={`p-3 rounded-full transition-all duration-300 ${
                          restaurant.is_active
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-red-600 hover:bg-red-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={restaurant.is_active ? 'تعطيل المطعم' : 'تفعيل المطعم'}
                      >
                        {restaurant.is_active ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => toggleRestaurantExpansion(restaurant.id)}
                        className="p-3 text-gray-600 hover:bg-gray-50 rounded-full transition-all duration-300"
                        title="عرض الفروع"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => setEditingRestaurant(restaurant)}
                        className="p-3 text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-gray-800">فروع {restaurant.name}</h4>
                        <button
                          onClick={() => {
                            setNewBranch({ ...newBranchTemplate, restaurant_id: restaurant.id });
                            setAddingBranchForRestaurant(restaurant.id);
                          }}
                          className="bg-[#781220] hover:bg-[#5c0d18] text-white px-4 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          إضافة فرع
                        </button>
                      </div>

                      {addingBranchForRestaurant === restaurant.id && (
                        <div className="bg-white rounded-xl shadow p-4 mb-4">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="text-md font-bold text-gray-800">إضافة فرع جديد</h5>
                            <button
                              onClick={() => {
                                setAddingBranchForRestaurant(null);
                                setNewBranch(newBranchTemplate);
                              }}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <BranchForm branch={newBranch} onChange={setNewBranch} />
                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={handleAddBranch}
                              disabled={saving || !newBranch.name || !newBranch.area || !newBranch.phone || !newBranch.address}
                              className="px-4 py-2 bg-[#781220] hover:bg-[#5c0d18] text-white rounded-full font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                            >
                              <Save className="w-4 h-4" />
                              {saving ? 'جاري الحفظ...' : 'حفظ الفرع'}
                            </button>
                            <button
                              onClick={() => {
                                setAddingBranchForRestaurant(null);
                                setNewBranch(newBranchTemplate);
                              }}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300 text-sm"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      )}

                      {restaurantBranches.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p>لا توجد فروع لهذا المطعم</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {restaurantBranches.map((branch) => (
                            <div key={branch.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                              {editingBranch?.id === branch.id ? (
                                <div className="p-4">
                                  <div className="flex justify-between items-center mb-4">
                                    <h5 className="text-md font-bold text-gray-800">تعديل الفرع</h5>
                                    <button
                                      onClick={() => setEditingBranch(null)}
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </div>
                                  <BranchForm branch={editingBranch} onChange={setEditingBranch} />
                                  <div className="flex gap-3 mt-4">
                                    <button
                                      onClick={() => handleSaveBranch(editingBranch)}
                                      disabled={saving}
                                      className="px-4 py-2 bg-[#781220] hover:bg-[#5c0d18] text-white rounded-full font-semibold transition-all duration-300 flex items-center gap-2 text-sm"
                                    >
                                      <Save className="w-4 h-4" />
                                      {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                    </button>
                                    <button
                                      onClick={() => setEditingBranch(null)}
                                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 text-sm"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${restaurant.primary_color}15` }}
                                          >
                                            <MapPin className="w-5 h-5" style={{ color: restaurant.primary_color }} />
                                          </div>
                                          <div>
                                            <h5 className="text-md font-bold text-gray-800">{branch.name}</h5>
                                            <p className="text-xs text-gray-500">{branch.area}</p>
                                          </div>
                                          {!branch.is_active && (
                                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">معطل</span>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">
                                          <div className="flex items-center gap-2 text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            <span>{branch.phone}</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-gray-600">
                                            <Navigation className="w-4 h-4" />
                                            <span>نطاق: {branch.delivery_radius_km} كم</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-gray-600">
                                            <DollarSign className="w-4 h-4" />
                                            <span>حد أدنى: {branch.min_order_amount} د.ل</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-gray-600">
                                            <DollarSign className="w-4 h-4" />
                                            <span>رسوم التوصيل: {branch.base_delivery_fee} د.ل</span>
                                          </div>
                                        </div>

                                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                          <p className="font-semibold mb-1">العنوان:</p>
                                          <p>{branch.address}</p>
                                        </div>
                                      </div>

                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleToggleBranchStatus(branch)}
                                          disabled={saving}
                                          className={`p-2 rounded-full transition-all duration-300 ${
                                            branch.is_active
                                              ? 'text-green-600 hover:bg-green-50'
                                              : 'text-red-600 hover:bg-red-50'
                                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                                          title={branch.is_active ? 'تعطيل الفرع' : 'تفعيل الفرع'}
                                        >
                                          {branch.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                          onClick={() => setExpandedBranchId(expandedBranchId === branch.id ? null : branch.id)}
                                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-full transition-all duration-300"
                                          title="أوقات العمل"
                                        >
                                          <Clock className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => setEditingBranch(branch)}
                                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteBranch(branch.id)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-all duration-300"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {expandedBranchId === branch.id && (
                                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                                      <AdminBranchOperatingHours branchId={branch.id} branchName={branch.name} />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد نتائج للبحث</p>
        </div>
      )}
    </div>
  );
};
