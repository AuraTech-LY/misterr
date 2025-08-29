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
      <div className="flex-1 px-6 py-8">
        {/* Mobile: Vertical stack, Desktop: Horizontal grid */}
        <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6 md:max-w-4xl md:mx-auto">
        {restaurants.map((restaurant) => (
          <button
            key={restaurant.id}
            onClick={() => handleRestaurantSelect(restaurant)}
            disabled={!isOpen}
            className={`relative w-full p-6 md:p-8 rounded-2xl text-white font-semibold transition-all duration-300 active:scale-[0.98] md:hover:scale-[1.02] overflow-hidden group shadow-lg hover:shadow-xl transform-gpu ${
              restaurant.id === 'mister-crispy' 
                ? 'bg-gradient-to-r from-[#55421A] to-[#4a3817]' 
                : 'bg-gradient-to-r from-[#781220] to-[#651018]'
            } ${!isOpen ? 'opacity-50' : 'shadow-2xl hover:shadow-3xl hover:brightness-110'} md:min-h-[120px] md:flex md:items-center`}
          >
            {/* Interactive background overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"></div>
            
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
            
            {/* Subtle accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 group-hover:bg-white/40 transition-all duration-300"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div className="text-right md:text-center">
                  <div className="text-xl md:text-2xl font-bold mb-1 group-hover:scale-105 transition-transform duration-300">{restaurant.name}</div>
                  <div className="text-sm md:text-base opacity-80 font-normal">
                    {restaurant.branches.length} {restaurant.branches.length === 1 ? 'فرع' : 'فروع'}
                  </div>
                </div>
              </div>
              
              {!isOpen && (
                <div className="bg-black/20 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                  مغلق حالياً
                </div>
              )}
            </div>
          </button>
        ))}
        </div>
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