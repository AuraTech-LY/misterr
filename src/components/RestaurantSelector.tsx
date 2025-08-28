import React from 'react';
import { Restaurant } from '../types';
import { Store } from 'lucide-react';
import { isWithinOperatingHours } from '../utils/timeUtils';

interface RestaurantSelectorProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
}

export const RestaurantSelector: React.FC<RestaurantSelectorProps> = ({
  restaurants,
  onSelectRestaurant,
}) => {
  const isOpen = isWithinOperatingHours();

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    // Update browser theme color immediately
    if (window.updateThemeColorForRestaurant) {
      window.updateThemeColorForRestaurant(restaurant.name);
    }
    onSelectRestaurant(restaurant);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Simple Header */}
      <div className="bg-white px-6 py-8 text-center">
        <div className="w-16 h-16 bg-[#781220] rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <img 
            src="/New Element 88 [8BACFE9].png" 
            alt="المستر" 
            className="w-10 h-10 object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">المستر</h1>
        <p className="text-gray-600">اختر المطعم المناسب لك</p>
      </div>

      {/* Restaurant Cards */}
      <div className="flex-1 px-6 py-6 space-y-6">
        {restaurants.map((restaurant) => (
          <button
            key={restaurant.id}
            onClick={() => handleRestaurantSelect(restaurant)}
            disabled={!isOpen}
            className={`relative w-full p-8 rounded-3xl text-white font-bold text-xl transition-all duration-300 active:scale-95 overflow-hidden group ${
              restaurant.id === 'mister-crispy' 
                ? 'bg-gradient-to-br from-[#55421A] to-[#3d2f12]' 
                : 'bg-gradient-to-br from-[#781220] to-[#5c0d18]'
            } ${!isOpen ? 'opacity-50' : 'shadow-2xl hover:shadow-3xl'}`}
          >
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-20 h-20 rounded-full border border-white/20"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full border border-white/10"></div>
            </div>
            
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative flex items-center justify-center gap-4 mb-3">
              <Store className="w-6 h-6" />
              <span className="text-2xl font-black tracking-wide">{restaurant.name}</span>
            </div>
            <div className="relative text-base opacity-90 font-medium">
              {restaurant.branches.length} {restaurant.branches.length === 1 ? 'فرع' : 'فروع'}
            </div>
            {!isOpen && (
              <div className="relative text-sm mt-3 opacity-75 bg-black/20 px-3 py-1 rounded-full inline-block">مغلق حالياً</div>
            )}
          </button>
        ))}
      </div>

      {/* Simple Status */}
      <div className="px-6 py-6 text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          isOpen 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-gray-100 text-gray-600 border border-gray-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          {isOpen ? 'مفتوح للطلبات الآن' : 'مغلق • يفتح من 11:00 ص إلى 11:59 م'}
        </div>
      </div>
    </div>
  );
};