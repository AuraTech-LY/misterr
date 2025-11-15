import React, { useState, useEffect } from 'react';
import { Save, Clock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface OperatingHours {
  id?: string;
  branch_id: string;
  opening_time: string;
  closing_time: string;
  is_24_hours: boolean;
  is_closed: boolean;
  delivery_start_time?: string | null;
  delivery_end_time?: string | null;
  delivery_available: boolean;
}

interface Branch {
  id: string;
  name: string;
  area: string;
  restaurant_name: string;
}

const AdminOperatingHours: React.FC = () => {
  const [operatingHours, setOperatingHours] = useState<OperatingHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      fetchOperatingHours();
    }
  }, [selectedBranchId]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: branchesData, error: branchError } = await supabase
        .from('restaurant_branches')
        .select('id, name, area, restaurants!inner(name)')
        .eq('is_active', true);

      if (branchError) throw branchError;

      const formattedBranches = (branchesData || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        area: b.area,
        restaurant_name: b.restaurants.name
      }));

      setBranches(formattedBranches);

      if (formattedBranches.length > 0) {
        setSelectedBranchId(formattedBranches[0].id);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('فشل في تحميل الفروع');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperatingHours = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: hoursData, error: hoursError } = await supabase
        .from('operating_hours')
        .select('*')
        .eq('branch_id', selectedBranchId)
        .maybeSingle();

      if (hoursError) throw hoursError;

      setOperatingHours(hoursData || {
        branch_id: selectedBranchId,
        opening_time: '11:00',
        closing_time: '23:59',
        is_24_hours: false,
        is_closed: false,
        delivery_start_time: null,
        delivery_end_time: null,
        delivery_available: true,
      });
    } catch (error) {
      console.error('Error fetching operating hours:', error);
      setError('فشل في تحميل أوقات العمل');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!operatingHours || !selectedBranchId) return;

      const { data, error } = await supabase
        .from('operating_hours')
        .upsert({
         ...(operatingHours.id && { id: operatingHours.id }),
          branch_id: selectedBranchId,
          opening_time: operatingHours.opening_time,
          closing_time: operatingHours.closing_time,
          is_24_hours: operatingHours.is_24_hours,
          is_closed: operatingHours.is_closed,
          delivery_start_time: operatingHours.delivery_start_time,
          delivery_end_time: operatingHours.delivery_end_time,
          delivery_available: operatingHours.delivery_available,
        }, { onConflict: 'branch_id' })
        .select()
        .single();

      if (error) throw error;

      setOperatingHours(data);
      setSuccess('تم حفظ أوقات العمل بنجاح');
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      console.error('Error saving operating hours:', error);
      setError('حدث خطأ في حفظ أوقات العمل');
    } finally {
      setSaving(false);
    }
  };

  const updateHours = (field: keyof OperatingHours, value: any) => {
    setOperatingHours(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  };

  const getCurrentStatus = () => {
    if (!operatingHours) return 'غير محدد';

    if (operatingHours.is_closed) return 'مغلق';
    if (operatingHours.is_24_hours) return 'مفتوح 24 ساعة';

    let status = `${operatingHours.opening_time} - ${operatingHours.closing_time}`;

    if (!operatingHours.delivery_available) {
      status += ' (استلام فقط)';
    } else if (operatingHours.delivery_start_time && operatingHours.delivery_end_time) {
      status += ` | توصيل: ${operatingHours.delivery_start_time} - ${operatingHours.delivery_end_time}`;
    }

    return status;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#fcb946]"></div>
        <p className="mt-4 text-gray-600">جاري تحميل أوقات العمل...</p>
      </div>
    );
  }

  if (branches.length === 0 || !operatingHours) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">لا توجد فروع متاحة</p>
      </div>
    );
  }

  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة أوقات العمل</h2>
          {selectedBranch && (
            <p className="text-gray-600 mt-1">{selectedBranch.restaurant_name} - {selectedBranch.name} - {selectedBranch.area}</p>
          )}
        </div>
      </div>

      {/* Branch Selector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          اختر الفرع
        </label>
        <select
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcb946] focus:border-transparent"
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.restaurant_name} - {branch.name} - {branch.area}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          {success}
        </div>
      )}

      {/* Single Branch Card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Current Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className="text-base font-semibold text-gray-700">الحالة الحالية</span>
            </div>
            <p className="text-base text-gray-600">{getCurrentStatus()}</p>
          </div>

          {/* Status Toggles */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="closed"
                checked={operatingHours.is_closed}
                onChange={(e) => updateHours('is_closed', e.target.checked)}
                className="w-5 h-5 text-[#fcb946] border-2 border-gray-300 rounded focus:ring-2 focus:ring-offset-2"
              />
              <label htmlFor="closed" className="text-base font-medium text-gray-700">
                مغلق
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="24hours"
                checked={operatingHours.is_24_hours}
                onChange={(e) => updateHours('is_24_hours', e.target.checked)}
                disabled={operatingHours.is_closed}
                className="w-5 h-5 text-[#fcb946] border-2 border-gray-300 rounded focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
              />
              <label htmlFor="24hours" className="text-base font-medium text-gray-700">
                24 ساعة
              </label>
            </div>
          </div>

          {/* Delivery Settings */}
          <div className="space-y-4 mb-6">
            <h4 className="text-base font-semibold text-gray-700">إعدادات التوصيل</h4>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="delivery-available"
                checked={operatingHours.delivery_available}
                onChange={(e) => updateHours('delivery_available', e.target.checked)}
                disabled={operatingHours.is_closed}
                className="w-5 h-5 text-[#fcb946] border-2 border-gray-300 rounded focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
              />
              <label htmlFor="delivery-available" className="text-base font-medium text-gray-700">
                التوصيل متاح
              </label>
            </div>
          </div>

          {/* Time Inputs */}
          {!operatingHours.is_closed && !operatingHours.is_24_hours && (
            <div className="space-y-4 mb-6">
              <h4 className="text-base font-semibold text-gray-700">أوقات العمل</h4>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  وقت الفتح
                </label>
                <input
                  type="time"
                  value={operatingHours.opening_time}
                  onChange={(e) => updateHours('opening_time', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-[#fcb946] focus:ring-2 focus:ring-[#fcb946] text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  وقت الإغلاق
                </label>
                <input
                  type="time"
                  value={operatingHours.closing_time}
                  onChange={(e) => updateHours('closing_time', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-[#fcb946] focus:ring-2 focus:ring-[#fcb946] text-right"
                />
              </div>
            </div>
          )}

          {/* Delivery Time Inputs */}
          {!operatingHours.is_closed && operatingHours.delivery_available && (
            <div className="space-y-4 mb-6">
              <h4 className="text-base font-semibold text-gray-700">أوقات التوصيل (اختياري)</h4>
              <p className="text-sm text-gray-500 mb-3">
                إذا لم تحدد أوقات التوصيل، سيكون التوصيل متاحاً خلال جميع ساعات العمل
              </p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  بداية التوصيل
                </label>
                <input
                  type="time"
                  value={operatingHours.delivery_start_time || ''}
                  onChange={(e) => updateHours('delivery_start_time', e.target.value || null)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-[#fcb946] focus:ring-2 focus:ring-[#fcb946] text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  نهاية التوصيل
                </label>
                <input
                  type="time"
                  value={operatingHours.delivery_end_time || ''}
                  onChange={(e) => updateHours('delivery_end_time', e.target.value || null)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-[#fcb946] focus:ring-2 focus:ring-[#fcb946] text-right"
                />
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              saving
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#fcb946] hover:bg-[#e5a835] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            <Save className="w-5 h-5" />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { AdminOperatingHours };