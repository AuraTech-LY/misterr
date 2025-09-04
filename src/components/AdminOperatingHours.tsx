import React, { useState, useEffect } from 'react';
import { Save, Clock, MapPin } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { getAllBranches } from '../data/restaurantsData';

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
}

export const AdminOperatingHours: React.FC = () => {
  const [operatingHours, setOperatingHours] = useState<Record<string, OperatingHours>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [selectedRestaurant, setSelectedRestaurant] = useState<'mister-shish' | 'mister-crispy'>('mister-shish');
  const [error, setError] = useState<string | null>(null);

  const allBranches = getAllBranches();

  useEffect(() => {
    fetchOperatingHours();
  }, []);

  const fetchOperatingHours = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('operating_hours')
        .select('*');

      if (error) throw error;

      // Convert array to object keyed by branch_id
      const hoursMap: Record<string, OperatingHours> = {};
      
      // Initialize with default values for all branches
      allBranches.forEach(branch => {
        const defaultClosingTime = branch.id === 'dollar' ? '03:00' : '23:59';
        hoursMap[branch.id] = {
          branch_id: branch.id,
          opening_time: '11:00',
          closing_time: defaultClosingTime,
          is_24_hours: false,
          is_closed: false,
        };
      });

      // Override with database values
      data?.forEach(item => {
        hoursMap[item.branch_id] = item;
      });

      setOperatingHours(hoursMap);
    } catch (error) {
      console.error('Error fetching operating hours:', error);
      setError('فشل في تحميل أوقات العمل');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (branchId: string) => {
    try {
      setSaving(prev => ({ ...prev, [branchId]: true }));
      setError(null);
      
      const hours = operatingHours[branchId];
      if (!hours) return;

      const { data, error } = await supabase
        .from('operating_hours')
        .upsert({
         ...(hours.id && { id: hours.id }),
          branch_id: branchId,
          opening_time: hours.opening_time,
          closing_time: hours.closing_time,
          is_24_hours: hours.is_24_hours,
          is_closed: hours.is_closed,
        }, { onConflict: 'branch_id' })
        .select()
        .single();

      if (error) throw error;

      // Update local state with returned data
      setOperatingHours(prev => ({
        ...prev,
        [branchId]: data
      }));

    } catch (error) {
      console.error('Error saving operating hours:', error);
      setError('حدث خطأ في حفظ أوقات العمل');
    } finally {
      setSaving(prev => ({ ...prev, [branchId]: false }));
    }
  };

  const updateHours = (branchId: string, field: keyof OperatingHours, value: any) => {
    setOperatingHours(prev => ({
      ...prev,
      [branchId]: {
        ...prev[branchId],
        [field]: value
      }
    }));
  };

  const getFilteredBranches = () => {
    if (selectedRestaurant === 'mister-shish') {
      return allBranches.filter(branch => branch.id === 'airport' || branch.id === 'balaoun');
    } else {
      return allBranches.filter(branch => branch.id === 'dollar');
    }
  };

  const getCurrentStatus = (branchId: string) => {
    const hours = operatingHours[branchId];
    if (!hours) return 'غير محدد';
    
    if (hours.is_closed) return 'مغلق';
    if (hours.is_24_hours) return 'مفتوح 24 ساعة';
    
    return `${hours.opening_time} - ${hours.closing_time}`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A1120]"></div>
        <p className="mt-4 text-gray-600">جاري تحميل أوقات العمل...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Restaurant Sub-tabs */}
      <div className="bg-white shadow-sm border-b">
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
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">إدارة أوقات العمل</h2>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredBranches().map((branch) => {
          const hours = operatingHours[branch.id];
          const isSaving = saving[branch.id];
          
          return (
            <div key={branch.id} className="bg-white rounded-2xl shadow-lg p-6">
              {/* Branch Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 ${
                  selectedRestaurant === 'mister-crispy' ? 'bg-[#55421A]' : 'bg-[#781220]'
                } rounded-xl flex items-center justify-center`}>
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{branch.name}</h3>
                  <p className="text-sm text-gray-600">{branch.area}</p>
                </div>
              </div>

              {/* Current Status */}
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">الحالة الحالية</span>
                </div>
                <p className="text-sm text-gray-600">{getCurrentStatus(branch.id)}</p>
              </div>

              {hours && (
                <>
                  {/* Status Toggles */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`closed-${branch.id}`}
                        checked={hours.is_closed}
                        onChange={(e) => updateHours(branch.id, 'is_closed', e.target.checked)}
                        className={`w-5 h-5 ${
                          selectedRestaurant === 'mister-crispy' ? 'text-[#55421A]' : 'text-[#781220]'
                        } border-2 border-gray-300 rounded focus:ring-2 focus:ring-offset-2`}
                      />
                      <label htmlFor={`closed-${branch.id}`} className="text-sm font-medium text-gray-700">
                        مغلق
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`24hours-${branch.id}`}
                        checked={hours.is_24_hours}
                        onChange={(e) => updateHours(branch.id, 'is_24_hours', e.target.checked)}
                        disabled={hours.is_closed}
                        className={`w-5 h-5 ${
                          selectedRestaurant === 'mister-crispy' ? 'text-[#55421A]' : 'text-[#781220]'
                        } border-2 border-gray-300 rounded focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
                      />
                      <label htmlFor={`24hours-${branch.id}`} className="text-sm font-medium text-gray-700">
                        24 ساعة
                      </label>
                    </div>
                  </div>

                  {/* Time Inputs */}
                  {!hours.is_closed && !hours.is_24_hours && (
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          وقت الفتح
                        </label>
                        <input
                          type="time"
                          value={hours.opening_time}
                          onChange={(e) => updateHours(branch.id, 'opening_time', e.target.value)}
                          className={`w-full p-2 border border-gray-300 rounded-lg focus:border-${
                            selectedRestaurant === 'mister-crispy' ? '[#55421A]' : '[#781220]'
                          } text-right`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          وقت الإغلاق
                        </label>
                        <input
                          type="time"
                          value={hours.closing_time}
                          onChange={(e) => updateHours(branch.id, 'closing_time', e.target.value)}
                          className={`w-full p-2 border border-gray-300 rounded-lg focus:border-${
                            selectedRestaurant === 'mister-crispy' ? '[#55421A]' : '[#781220]'
                          } text-right`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <button
                    onClick={() => handleSave(branch.id)}
                    disabled={isSaving}
                    className={`w-full py-3 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      isSaving
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : `${
                            selectedRestaurant === 'mister-crispy' 
                              ? 'bg-[#55421A] hover:bg-[#3d2f12]' 
                              : 'bg-[#781220] hover:bg-[#5c0d18]'
                          } text-white shadow-lg hover:shadow-xl transform hover:scale-105`
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};