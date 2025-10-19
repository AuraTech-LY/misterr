import React, { useState, useEffect } from 'react';
import { Plus, Edit, Save, X, MapPin, Phone, Navigation, DollarSign, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Restaurant, RestaurantBranch } from '../types/restaurant';
import { AdminBranchOperatingHours } from './AdminBranchOperatingHours';

interface AdminBranchesProps {
  onBranchesChange: () => void;
}

interface BranchWithRestaurant extends RestaurantBranch {
  restaurant_name?: string;
  restaurant_color?: string;
}

export const AdminBranches: React.FC<AdminBranchesProps> = ({ onBranchesChange }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [branches, setBranches] = useState<BranchWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBranch, setEditingBranch] = useState<BranchWithRestaurant | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRestaurantFilter, setSelectedRestaurantFilter] = useState<string>('all');
  const [expandedBranchId, setExpandedBranchId] = useState<string | null>(null);

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
      setRestaurants(restaurantsData || []);

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

      setBranches(branchesWithRestaurant);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
      onBranchesChange();
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
      setShowAddForm(false);
      onBranchesChange();
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
      onBranchesChange();
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert('حدث خطأ في حذف الفرع');
    }
  };

  const filteredBranches = selectedRestaurantFilter === 'all'
    ? branches
    : branches.filter(b => b.restaurant_id === selectedRestaurantFilter);

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

  const BranchForm = ({ branch, onChange }: { branch: Partial<BranchWithRestaurant>, onChange: (b: Partial<BranchWithRestaurant>) => void }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">المطعم *</label>
        <select
          value={branch.restaurant_id || ''}
          onChange={(e) => onChange({ ...branch, restaurant_id: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220]"
          disabled={!!branch.id}
        >
          <option value="">اختر المطعم</option>
          {restaurants.map(restaurant => (
            <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
          ))}
        </select>
      </div>
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">نطاق التوصيل (كم)</label>
        <input
          type="number"
          step="0.5"
          value={branch.delivery_radius_km || 10}
          onChange={(e) => onChange({ ...branch, delivery_radius_km: parseFloat(e.target.value) })}
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">إدارة الفروع</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <select
            value={selectedRestaurantFilter}
            onChange={(e) => setSelectedRestaurantFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#781220]"
          >
            <option value="all">جميع المطاعم</option>
            {restaurants.map(restaurant => (
              <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#781220] hover:bg-[#5c0d18] text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg justify-center"
          >
            <Plus className="w-5 h-5" />
            إضافة فرع جديد
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">إضافة فرع جديد</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <BranchForm branch={newBranch} onChange={setNewBranch} />
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleAddBranch}
              disabled={saving || !newBranch.restaurant_id || !newBranch.name || !newBranch.area || !newBranch.phone || !newBranch.address}
              className="px-6 py-3 bg-[#781220] hover:bg-[#5c0d18] text-white rounded-full font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'جاري الحفظ...' : 'حفظ الفرع'}
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
        {filteredBranches.map((branch) => (
          <div key={branch.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {editingBranch?.id === branch.id ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">تعديل الفرع</h3>
                  <button
                    onClick={() => setEditingBranch(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <BranchForm branch={editingBranch} onChange={setEditingBranch} />
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => handleSaveBranch(editingBranch)}
                    disabled={saving}
                    className="px-6 py-3 bg-[#781220] hover:bg-[#5c0d18] text-white rounded-full font-semibold transition-all duration-300 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                  <button
                    onClick={() => setEditingBranch(null)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${branch.restaurant_color}15` }}
                      >
                        <MapPin className="w-6 h-6" style={{ color: branch.restaurant_color }} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{branch.name}</h3>
                        <p className="text-sm text-gray-500">{branch.restaurant_name}</p>
                      </div>
                      {!branch.is_active && (
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">معطل</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{branch.area}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{branch.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Navigation className="w-4 h-4" />
                        <span className="text-sm">نطاق التوصيل: {branch.delivery_radius_km} كم</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">الحد الأدنى: {branch.min_order_amount} د.ل</span>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <p className="font-semibold mb-1">العنوان:</p>
                      <p>{branch.address}</p>
                    </div>

                    {(branch.latitude !== 0 || branch.longitude !== 0) && (
                      <div className="mt-2 text-xs text-gray-500">
                        الإحداثيات: {branch.latitude.toFixed(6)}, {branch.longitude.toFixed(6)}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedBranchId(expandedBranchId === branch.id ? null : branch.id)}
                      className="p-3 text-gray-600 hover:bg-gray-50 rounded-full transition-all duration-300"
                      title="أوقات العمل"
                    >
                      {expandedBranchId === branch.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setEditingBranch(branch)}
                      className="p-3 text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(branch.id)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-full transition-all duration-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {expandedBranchId === branch.id && (
                  <AdminBranchOperatingHours branchId={branch.id} branchName={branch.name} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredBranches.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد فروع {selectedRestaurantFilter !== 'all' ? 'لهذا المطعم' : ''}</p>
        </div>
      )}
    </div>
  );
};
