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
  const [isLoaded, setIsLoaded] = React.useState(false);
  const isOpen = isWithinOperatingHours();

  // Trigger loading animation
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
      <div className={`bg-white px-6 py-8 text-center transition-all duration-700 ease-out ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
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
        {restaurants.map((restaurant, index) => (
          <button
            key={restaurant.id}
            onClick={() => handleRestaurantSelect(restaurant)}
            disabled={!isOpen}
            className={`relative w-full p-3 md:p-4 rounded-2xl text-white font-semibold transition-all duration-300 active:scale-[0.98] md:hover:scale-[1.02] overflow-hidden group shadow-lg hover:shadow-xl transform-gpu ${
              restaurant.id === 'mister-crispy' 
                ? 'bg-gradient-to-r from-[#55421A] to-[#4a3817]' 
                : 'bg-gradient-to-r from-[#781220] to-[#651018]'
            } ${!isOpen ? 'opacity-50' : 'shadow-2xl hover:shadow-3xl hover:brightness-110 active:brightness-125 active:shadow-inner'} md:min-h-[80px] md:flex md:items-center ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{
              transitionDelay: isLoaded ? `${index * 150}ms` : '0ms',
              transitionDuration: '600ms'
            }}
          >
            {/* Interactive background overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-500 ease-out"></div>
            
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full group-active:translate-x-full transition-transform duration-1000 ease-out"></div>
            
            {/* Subtle accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 group-hover:bg-white/40 group-active:bg-white/60 transition-all duration-300"></div>
            
            {/* Mobile touch ripple effect */}
            <div className="absolute inset-0 bg-white/0 group-active:bg-white/10 transition-all duration-150 ease-out rounded-2xl"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                {restaurant.id === 'mister-crispy' ? (
                  <img 
                    src="/mr-Krispy.png" 
                    alt="مستر كريسبي" 
                    className="w-20 h-20 object-contain"
                  />
                ) : (
                  <img 
                    src="/Mr-Sheesh.png" 
                    alt="مستر شيش" 
                    className="w-20 h-20 object-contain"
                  />
                )}
                <div className="text-right md:text-center">
                  <div className="text-xl md:text-2xl font-bold mb-1 group-hover:scale-105 group-active:scale-102 transition-transform duration-300">{restaurant.name}</div>
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
      <div className={`px-6 py-6 text-center transition-all duration-700 ease-out ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`} style={{ transitionDelay: isLoaded ? '300ms' : '0ms' }}>
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