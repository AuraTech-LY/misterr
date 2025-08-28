import React from 'react';
import { Restaurant } from '../types';
import { Store, Clock, CheckCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col" dir="rtl">
      {/* Cool Header */}
      <div className="relative px-6 py-12 text-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-red-500 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <img 
              src="/New Element 88 [8BACFE9].png" 
              alt="المستر" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">المستر</h1>
          <p className="text-gray-300 text-lg font-medium">اختر مطعمك المفضل</p>
          
          {/* Status Indicator */}
          <div className="mt-6 inline-flex items-center gap-3 bg-black bg-opacity-30 backdrop-blur-lg px-6 py-3 rounded-full border border-white border-opacity-20">
            {isOpen ? (
              <>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-green-300 font-semibold">مفتوح الآن</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-red-400" />
                <span className="text-red-300 font-semibold">مغلق حالياً</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cool Restaurant Cards */}
      <div className="flex-1 px-6 pb-8 space-y-6">
        {restaurants.map((restaurant, index) => (
          <button
            key={restaurant.id}
            onClick={() => onSelectRestaurant(restaurant)}
            disabled={!isOpen}
            className={`group relative w-full p-8 rounded-3xl font-bold text-xl transition-all duration-500 transform hover:scale-105 active:scale-95 overflow-hidden ${
              !isOpen ? 'opacity-50 cursor-not-allowed' : 'shadow-2xl hover:shadow-3xl'
            }`}
            style={{
              background: restaurant.id === 'mister-crispy' 
                ? 'linear-gradient(135deg, #55421A 0%, #6B5423 50%, #55421A 100%)'
                : 'linear-gradient(135deg, #781220 0%, #8B1538 50%, #781220 100%)',
              animationDelay: `${index * 100}ms`
            }}
          >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl transform translate-x-16 -translate-y-16 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl transform -translate-x-12 translate-y-12 group-hover:-translate-x-6 group-hover:translate-y-6 transition-transform duration-700"></div>
            </div>
            
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
            
            <div className="relative z-10 text-white">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                  <Store className="w-8 h-8" />
                </div>
                <span className="text-2xl font-black tracking-wide">{restaurant.name}</span>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-lg opacity-90">
                <span>{restaurant.branches.length}</span>
                <span>{restaurant.branches.length === 1 ? 'فرع' : 'فروع'}</span>
                {isOpen && (
                  <CheckCircle className="w-5 h-5 text-green-300 mr-2" />
                )}
              </div>
              
              {!isOpen && (
                <div className="mt-3 text-red-200 text-base opacity-75">
                  مغلق حالياً
                </div>
              )}
            </div>
            
            {/* Border Glow */}
            <div className="absolute inset-0 rounded-3xl border-2 border-white border-opacity-0 group-hover:border-opacity-30 transition-all duration-500"></div>
          </button>
        ))}
      </div>

      {/* Cool Footer */}
      <div className="px-6 pb-8 text-center">
        <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-2xl px-6 py-4 border border-white border-opacity-10">
          <p className="text-gray-300 text-sm font-medium">
            {isOpen ? '🔥 جاهزون لاستقبال طلباتكم' : '⏰ نفتح من 11:00 ص إلى 11:59 م'}
          </p>
        </div>
      </div>
    </div>
  );
};