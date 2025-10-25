import React from 'react';
import { CustomSelect } from './CustomSelect';

export interface MenuItem {
  id?: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_popular: boolean;
  is_available: boolean;
  restaurant_id?: string;
  branch_id?: string | null;
  available_airport?: boolean;
  available_dollar?: boolean;
  available_balaoun?: boolean;
  available_burgerito_airport?: boolean;
  image_brightness?: number;
  image_contrast?: number;
}

interface Category {
  id: string;
  name: string;
}

interface ItemFormProps {
  item: MenuItem;
  onChange: (item: MenuItem) => void;
  categories: Category[];
  isNew?: boolean;
  branches?: Array<{ id: string; name: string; area: string }>;
}

export const ItemForm: React.FC<ItemFormProps> = ({ item, onChange, categories, isNew = false, branches = [] }) => {
  const [previewBrightness, setPreviewBrightness] = React.useState(item.image_brightness || 1.2);
  const [previewContrast, setPreviewContrast] = React.useState(item.image_contrast || 1.1);

  return (
    <div className="bg-gray-50 p-6 rounded-xl space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">اسم العنصر</label>
          <input
            type="text"
            value={item.name}
            onChange={(e) => onChange({ ...item, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-right"
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
            className="w-full p-3 border border-gray-300 rounded-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-right"
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
          className="w-full p-3 border border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-right resize-none"
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
              value: cat.name,
              label: cat.name
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
            className="w-full p-3 border border-gray-300 rounded-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-right"
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>

      {/* Branch Selection */}
      {branches && branches.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">الفرع (اختياري - إذا كان العنصر متاحاً في فرع واحد فقط)</label>
          <CustomSelect
            value={item.branch_id || 'all'}
            onChange={(value) => onChange({ ...item, branch_id: value === 'all' ? null : value })}
            options={[
              { value: 'all', label: 'جميع الفروع' },
              ...branches.map(branch => ({
                value: branch.id,
                label: branch.area
              }))
            ]}
            placeholder="اختر الفرع"
          />
        </div>
      )}

      {/* Image Preview and Controls */}
      {item.image_url && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">معاينة الصورة وتعديل الإضاءة</h4>

          {/* Image Preview */}
          <div className="flex justify-center">
            <img
              src={item.image_url}
              alt="معاينة الصورة"
              className="w-32 h-32 object-cover rounded-xl transition-all duration-300"
              style={{
                filter: `brightness(${previewBrightness}) contrast(${previewContrast})`
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Brightness Control */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-700">السطوع</label>
              <span className="text-sm text-gray-500">{previewBrightness.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={previewBrightness}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value);
                setPreviewBrightness(newValue);
                onChange({ ...item, image_brightness: newValue });
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>مظلم</span>
              <span>مشرق</span>
            </div>
          </div>

          {/* Contrast Control */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-700">التباين</label>
              <span className="text-sm text-gray-500">{previewContrast.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={previewContrast}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value);
                setPreviewContrast(newValue);
                onChange({ ...item, image_contrast: newValue });
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>منخفض</span>
              <span>عالي</span>
            </div>
          </div>

          {/* Reset Button */}
          <button
            type="button"
            onClick={() => {
              setPreviewBrightness(1.2);
              setPreviewContrast(1.1);
              onChange({ ...item, image_brightness: 1.2, image_contrast: 1.1 });
            }}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            إعادة تعيين إلى القيم الافتراضية
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`popular-${isNew ? 'new' : item.id}`}
            checked={item.is_popular}
            onChange={(e) => onChange({ ...item, is_popular: e.target.checked })}
            className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
          <label htmlFor={`popular-${isNew ? 'new' : item.id}`} className="text-sm text-gray-700">
            الأكثر طلباً
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`available-${isNew ? 'new' : item.id}`}
            checked={item.is_available}
            onChange={(e) => onChange({ ...item, is_available: e.target.checked })}
            className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
          <label htmlFor={`available-${isNew ? 'new' : item.id}`} className="text-sm text-gray-700">
            متوفر
          </label>
        </div>
      </div>
    </div>
  );
};
