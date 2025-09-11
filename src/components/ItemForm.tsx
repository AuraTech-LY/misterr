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
  available_airport: boolean;
  available_dollar: boolean;
  available_balaoun: boolean;
  available_burgerito_airport: boolean;
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
  selectedRestaurant?: 'mister-shish' | 'mister-crispy' | 'mister-burgerito';
}

export const ItemForm: React.FC<ItemFormProps> = ({ item, onChange, categories, isNew = false, selectedRestaurant = 'mister-shish' }) => {
  const [previewBrightness, setPreviewBrightness] = React.useState(item.image_brightness || 1.2);
  const [previewContrast, setPreviewContrast] = React.useState(item.image_contrast || 1.1);

  // Update item when sliders change
  React.useEffect(() => {
    onChange({ 
      ...item, 
      image_brightness: previewBrightness,
      image_contrast: previewContrast 
    });
  }, [previewBrightness, previewContrast]);

  return (
    <div className="bg-gray-50 p-6 rounded-xl space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">اسم العنصر</label>
          <input
            type="text"
            value={item.name}
            onChange={(e) => onChange({ ...item, name: e.target.value })}
            className={`w-full p-3 border border-gray-300 rounded-full ${selectedRestaurant === 'mister-crispy' ? 'focus:border-[#55421A]' : selectedRestaurant === 'mister-burgerito' ? 'focus:border-[#E59F49]' : 'focus:border-[#7A1120]'} text-right`}
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
            className={`w-full p-3 border border-gray-300 rounded-full ${selectedRestaurant === 'mister-crispy' ? 'focus:border-[#55421A]' : selectedRestaurant === 'mister-burgerito' ? 'focus:border-[#E59F49]' : 'focus:border-[#7A1120]'} text-right`}
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
          className={`w-full p-3 border border-gray-300 rounded-2xl ${selectedRestaurant === 'mister-crispy' ? 'focus:border-[#55421A]' : selectedRestaurant === 'mister-burgerito' ? 'focus:border-[#E59F49]' : 'focus:border-[#7A1120]'} text-right resize-none`}
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
            className={`w-full p-3 border border-gray-300 rounded-full ${selectedRestaurant === 'mister-crispy' ? 'focus:border-[#55421A]' : selectedRestaurant === 'mister-burgerito' ? 'focus:border-[#E59F49]' : 'focus:border-[#7A1120]'} text-right`}
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>

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
              onChange={(e) => setPreviewBrightness(parseFloat(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                selectedRestaurant === 'mister-crispy' 
                  ? 'bg-gray-200 slider-thumb-[#55421A]' 
                  : selectedRestaurant === 'mister-burgerito'
                    ? 'bg-gray-200 slider-thumb-[#E59F49]'
                    : 'bg-gray-200 slider-thumb-[#7A1120]'
              }`}
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
              onChange={(e) => setPreviewContrast(parseFloat(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                selectedRestaurant === 'mister-crispy' 
                  ? 'bg-gray-200 slider-thumb-[#55421A]' 
                  : selectedRestaurant === 'mister-burgerito'
                    ? 'bg-gray-200 slider-thumb-[#E59F49]'
                    : 'bg-gray-200 slider-thumb-[#7A1120]'
              }`}
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
            }}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            إعادة تعيين إلى القيم الافتراضية
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`popular-${isNew ? 'new' : item.id}`}
            checked={item.is_popular}
            onChange={(e) => onChange({ ...item, is_popular: e.target.checked })}
            className={`w-5 h-5 ${selectedRestaurant === 'mister-crispy' ? 'text-[#55421A]' : selectedRestaurant === 'mister-burgerito' ? 'text-[#E59F49]' : 'text-[#7A1120]'} border-2 border-gray-300 rounded-full focus:ring-2 ${selectedRestaurant === 'mister-crispy' ? 'focus:ring-[#55421A]' : selectedRestaurant === 'mister-burgerito' ? 'focus:ring-[#E59F49]' : 'focus:ring-[#7A1120]'} focus:ring-offset-2 flex-shrink-0`}
          />
          <label htmlFor={`popular-${isNew ? 'new' : item.id}`} className="text-sm text-gray-700 flex-1 min-w-0">
            الأكثر طلباً
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`available-${isNew ? 'new' : item.id}`}
            checked={item.is_available}
            onChange={(e) => onChange({ ...item, is_available: e.target.checked })}
            className={`w-5 h-5 ${selectedRestaurant === 'mister-crispy' ? 'text-[#55421A]' : selectedRestaurant === 'mister-burgerito' ? 'text-[#E59F49]' : 'text-[#7A1120]'} border-2 border-gray-300 rounded-full focus:ring-2 ${selectedRestaurant === 'mister-crispy' ? 'focus:ring-[#55421A]' : selectedRestaurant === 'mister-burgerito' ? 'focus:ring-[#E59F49]' : 'focus:ring-[#7A1120]'} focus:ring-offset-2 flex-shrink-0`}
          />
          <label htmlFor={`available-${isNew ? 'new' : item.id}`} className="text-sm text-gray-700 flex-1 min-w-0">
            متوفر
          </label>
        </div>
        
        {/* Restaurant-specific branch checkboxes */}
        {selectedRestaurant === 'mister-shish' && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`airport-${isNew ? 'new' : item.id}`}
                checked={item.available_airport}
                onChange={(e) => onChange({ ...item, available_airport: e.target.checked })}
                className="w-5 h-5 text-[#781220] border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-[#781220] focus:ring-offset-2 flex-shrink-0"
              />
              <label htmlFor={`airport-${isNew ? 'new' : item.id}`} className="text-sm text-gray-700 flex-1 min-w-0">
                مستر شيش - فرع طريق المطار
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`balaoun-${isNew ? 'new' : item.id}`}
                checked={item.available_balaoun}
                onChange={(e) => onChange({ ...item, available_balaoun: e.target.checked })}
                className="w-5 h-5 text-[#781220] border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-[#781220] focus:ring-offset-2 flex-shrink-0"
              />
              <label htmlFor={`balaoun-${isNew ? 'new' : item.id}`} className="text-sm text-gray-700 flex-1 min-w-0">
                مستر شيش - بلعون
              </label>
            </div>
          </>
        )}
        
        {selectedRestaurant === 'mister-burgerito' && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`burgerito-airport-${isNew ? 'new' : item.id}`}
              checked={item.available_burgerito_airport}
              onChange={(e) => onChange({ ...item, available_burgerito_airport: e.target.checked })}
              className="w-5 h-5 text-[#E59F49] border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-[#E59F49] focus:ring-offset-2 flex-shrink-0"
            />
            <label htmlFor={`burgerito-airport-${isNew ? 'new' : item.id}`} className="text-sm text-gray-700 flex-1 min-w-0">
              مستر برجريتو - طريق المطار
            </label>
          </div>
        )}
        
        {selectedRestaurant === 'mister-crispy' && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`dollar-${isNew ? 'new' : item.id}`}
              checked={item.available_dollar}
              onChange={(e) => onChange({ ...item, available_dollar: e.target.checked })}
              className="w-5 h-5 text-[#55421A] border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-[#55421A] focus:ring-offset-2 flex-shrink-0"
            />
            <label htmlFor={`dollar-${isNew ? 'new' : item.id}`} className="text-sm text-gray-700 flex-1 min-w-0">
              مستر كريسبي
            </label>
          </div>
        )}
      </div>
    </div>
  );
};