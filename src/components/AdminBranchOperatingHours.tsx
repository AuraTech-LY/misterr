import React, { useState, useEffect } from 'react';
import { Clock, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BranchOperatingHours } from '../types/restaurant';

interface AdminBranchOperatingHoursProps {
  branchId: string;
  branchName: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الاثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' }
];

export const AdminBranchOperatingHours: React.FC<AdminBranchOperatingHoursProps> = ({ branchId, branchName }) => {
  const [hours, setHours] = useState<BranchOperatingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOperatingHours();
  }, [branchId]);

  const fetchOperatingHours = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('branch_operating_hours')
        .select('*')
        .eq('branch_id', branchId)
        .order('day_of_week');

      if (error) throw error;

      if (!data || data.length === 0) {
        await createDefaultHours();
      } else {
        setHours(data);
      }
    } catch (error) {
      console.error('Error fetching operating hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultHours = async () => {
    const defaultHours = DAYS_OF_WEEK.map(day => ({
      branch_id: branchId,
      day_of_week: day.value,
      opening_time: '11:00:00',
      closing_time: '23:59:00',
      is_closed: false,
      is_24_hours: false
    }));

    const { data, error } = await supabase
      .from('branch_operating_hours')
      .insert(defaultHours)
      .select();

    if (error) {
      console.error('Error creating default hours:', error);
    } else {
      setHours(data || []);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);

      for (const hour of hours) {
        const { error } = await supabase
          .from('branch_operating_hours')
          .update({
            opening_time: hour.opening_time,
            closing_time: hour.closing_time,
            is_closed: hour.is_closed,
            is_24_hours: hour.is_24_hours
          })
          .eq('id', hour.id);

        if (error) throw error;
      }

      alert('تم حفظ أوقات العمل بنجاح');
    } catch (error) {
      console.error('Error saving operating hours:', error);
      alert('حدث خطأ في حفظ أوقات العمل');
    } finally {
      setSaving(false);
    }
  };

  const updateHour = (index: number, field: keyof BranchOperatingHours, value: any) => {
    const newHours = [...hours];
    newHours[index] = { ...newHours[index], [field]: value };
    setHours(newHours);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#781220]"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#781220]" />
          <h4 className="text-lg font-bold text-gray-800">أوقات العمل - {branchName}</h4>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-4 py-2 bg-[#781220] hover:bg-[#5c0d18] text-white rounded-full font-semibold transition-all duration-300 disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ الكل'}
        </button>
      </div>

      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day) => {
          const hour = hours.find(h => h.day_of_week === day.value);
          if (!hour) return null;

          const hourIndex = hours.findIndex(h => h.day_of_week === day.value);

          return (
            <div key={day.value} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div className="font-semibold text-gray-800">
                  {day.label}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hour.is_closed}
                      onChange={(e) => updateHour(hourIndex, 'is_closed', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-600">مغلق</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hour.is_24_hours}
                      onChange={(e) => updateHour(hourIndex, 'is_24_hours', e.target.checked)}
                      disabled={hour.is_closed}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-600">24 ساعة</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">من:</label>
                  <input
                    type="time"
                    value={hour.opening_time}
                    onChange={(e) => updateHour(hourIndex, 'opening_time', e.target.value)}
                    disabled={hour.is_closed || hour.is_24_hours}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220] disabled:bg-gray-100 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">إلى:</label>
                  <input
                    type="time"
                    value={hour.closing_time}
                    onChange={(e) => updateHour(hourIndex, 'closing_time', e.target.value)}
                    disabled={hour.is_closed || hour.is_24_hours}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#781220] disabled:bg-gray-100 text-sm"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
