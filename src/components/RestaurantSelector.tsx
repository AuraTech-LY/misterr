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
      <div className="flex-1 px-6 py-4 space-y-4">
        {restaurants.map((restaurant) => (
          <button
            key={restaurant.id}
            onClick={() => onSelectRestaurant(restaurant)}
            disabled={!isOpen}
            className={`w-full p-6 rounded-2xl text-white font-bold text-xl transition-all active:scale-95 ${
              restaurant.id === 'mister-crispy' 
                ? 'bg-[#55421A]' 
                : 'bg-[#781220]'
            } ${!isOpen ? 'opacity-50' : 'shadow-lg'}`}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Store className="w-6 h-6" />
              <span>{restaurant.name}</span>
            </div>
            <div className="text-sm opacity-90">
              {restaurant.branches.length} {restaurant.branches.length === 1 ? 'فرع' : 'فروع'}
            </div>
            {!isOpen && (
              <div className="text-sm mt-2 opacity-75">مغلق حالياً</div>
            )}
          </button>
        ))}
      </div>

      {/* Simple Status */}
      <div className="px-6 py-4 text-center text-gray-500 text-sm">
        {isOpen ? 'مفتوح للطلبات الآن' : 'مغلق • يفتح من 11:00 ص إلى 11:59 م'}
      </div>
    </div>
  );
};