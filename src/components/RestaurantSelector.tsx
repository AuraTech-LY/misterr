import React from 'react';
import { Restaurant } from '../types';
import { ChefHat, MapPin } from 'lucide-react';
import { getFormattedLibyaTime, isWithinOperatingHours } from '../utils/timeUtils';

interface RestaurantSelectorProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
}

export const RestaurantSelector: React.FC<RestaurantSelectorProps> = ({
  restaurants,
  onSelectRestaurant,
}) => {
  const [currentTime, setCurrentTime] = React.useState(getFormattedLibyaTime());
  const [isOpen, setIsOpen] = React.useState(isWithinOperatingHours());

  // Update time every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getFormattedLibyaTime());
      setIsOpen(isWithinOperatingHours());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col justify-start p-3 sm:p-4 pt-2 sm:pt-8 relative overflow-hidden" dir="rtl">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl animate-bounce">🍔</div>
        <div className="absolute top-32 right-20 text-4xl animate-pulse">🍟</div>
        <div className="absolute top-20 right-1/3 text-5xl animate-bounce delay-300">🍗</div>
        <div className="absolute bottom-40 left-20 text-4xl animate-pulse delay-500">🥤</div>
        <div className="absolute bottom-20 right-10 text-6xl animate-bounce delay-700">🍕</div>
        <div className="absolute top-1/2 left-1/4 text-3xl animate-pulse delay-1000">🌮</div>
        <div className="absolute bottom-1/3 right-1/3 text-5xl animate-bounce delay-1200">🍰</div>
        <div className="absolute top-2/3 right-20 text-4xl animate-pulse delay-1500">🥪</div>
      </div>
      
      {/* Floating Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-r from-red-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-gradient-to-br from-[#781220] via-red-600 to-[#5c0d18] rounded-2xl shadow-2xl border-2 border-white/30 backdrop-blur-sm transform hover:scale-110 transition-all duration-500 hover:rotate-6 animate-pulse">
              <img 
                src="/New Element 88 [8BACFE9].png" 
                alt="مطعم المستر" 
                className="w-8 h-8 sm:w-12 sm:h-12 object-contain filter drop-shadow-2xl"
              />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-white drop-shadow-2xl bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent animate-pulse">المستر</h1>
              <p className="text-base sm:text-lg text-white/90 drop-shadow-lg">مطاعم الوجبات السريعة</p>
            </div>
          </div>
          
          {/* Enhanced Title with Background */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-6 border border-white/20 shadow-2xl">
            <h2 className="text-lg sm:text-3xl font-bold text-white mb-2 px-4 drop-shadow-lg">🍽️ اختر المطعم المفضل لديك 🍽️</h2>
            <p className="text-sm sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed px-4 drop-shadow-md">
              لدينا مطاعم متميزة تقدم أشهى الوجبات السريعة
            </p>
          </div>
          
          {/* Time Display with Enhanced Styling */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl">
            <div className="flex items-center justify-center gap-2 text-sm text-white/90 mb-2">
              <span className="animate-pulse">⏰</span>
              <span>الوقت الحالي في ليبيا:</span>
              <span className="font-bold text-yellow-300 drop-shadow-lg">{currentTime}</span>
            </div>
            
            <div className="text-sm text-white/80 mb-2">
              ⏰ ساعات العمل: من 11:00 صباحاً إلى 11:59 مساءً
            </div>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              isOpen 
                ? 'bg-green-500/30 text-green-200 border border-green-400/50' 
                : 'bg-red-500/30 text-red-200 border border-red-400/50'
            }`}>
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                isOpen ? 'bg-green-400' : 'bg-red-400'
              }`} />
              {isOpen ? '🟢 جميع المطاعم مفتوحة الآن!' : '🔴 جميع المطاعم مغلقة حالياً'}
            </div>
          </div>
        </div>

        {/* Restaurant Cards with Enhanced Styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 px-2 sm:px-4 justify-items-center max-w-4xl mx-auto relative z-10">
          {restaurants.map((restaurant, index) => (
            <div
              key={restaurant.id}
              onClick={() => onSelectRestaurant(restaurant)}
              className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden cursor-pointer transform hover:scale-105 hover:-rotate-1 w-full max-w-sm h-[450px] flex flex-col border border-white/20 group relative"
              style={{
                animationDelay: `${index * 200}ms`
              }}
            >
              {/* Animated Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 animate-pulse"></div>
              
              {/* Restaurant Header with Food Icons */}
              <div className={`text-white p-6 relative flex-shrink-0 ${
                restaurant.id === 'mister-crispy' 
                  ? 'bg-gradient-to-br from-[#55421A] via-amber-700 to-yellow-600' 
                  : 'bg-gradient-to-br from-[#781220] via-red-600 to-pink-600'
              } overflow-hidden`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 left-2 text-2xl animate-spin-slow">🍔</div>
                  <div className="absolute bottom-2 right-2 text-xl animate-bounce">🍟</div>
                  <div className="absolute top-2 right-8 text-lg animate-pulse">🥤</div>
                </div>
                
                <div className="text-center relative z-10">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl animate-bounce">
                      {restaurant.id === 'mister-crispy' ? '🍗' : '🍔'}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 drop-shadow-lg">{restaurant.name}</h3>
                  <div className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border ${
                    isOpen 
                      ? 'bg-green-500/30 text-green-100 border-green-400/50' 
                      : 'bg-red-500/30 text-red-100 border-red-400/50'
                  }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      isOpen ? 'bg-green-300' : 'bg-red-300'
                    }`} />
                    {isOpen ? 'مفتوح الآن' : 'مغلق'}
                  </div>
                </div>
              </div>

              {/* Restaurant Details with Enhanced Styling */}
              <div className="p-6 space-y-4 flex-1 flex flex-col relative">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-4 right-4 text-4xl">🍽️</div>
                  <div className="absolute bottom-4 left-4 text-3xl">⭐</div>
                </div>
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    restaurant.id === 'mister-crispy' ? 'bg-[#55421A]/20' : 'bg-[#781220]/20'
                  }`}>
                    <MapPin className={`w-5 h-5 ${
                      restaurant.id === 'mister-crispy' ? 'text-[#55421A]' : 'text-[#781220]'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm drop-shadow-md">عدد الفروع</p>
                    <p className="text-white/80 text-sm">{restaurant.branches.length} فرع متاح</p>
                  </div>
                </div>

                {/* Branch List with Enhanced Styling */}
                <div className="space-y-2 flex-1 relative z-10">
                  <p className="font-semibold text-white text-sm drop-shadow-md flex items-center gap-2">
                    <span>🏪</span>
                    الفروع المتاحة:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.branches.map((branch, branchIndex) => (
                      <div 
                        key={branch.id} 
                        className={`flex items-center gap-1 text-xs text-white/90 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105`}
                        style={{
                          animationDelay: `${(index * 200) + (branchIndex * 100)}ms`
                        }}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                          restaurant.id === 'mister-crispy' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                        <span>{branch.area}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button with Enhanced Styling */}
                <div className="mt-auto pt-4 relative z-10">
                  <button
                    disabled={!isOpen}
                    className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-xl relative overflow-hidden ${
                      !isOpen
                        ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed backdrop-blur-sm'
                        : `bg-gradient-to-r ${
                            restaurant.id === 'mister-crispy' 
                              ? 'from-[#55421A] via-amber-600 to-yellow-500 hover:from-yellow-500 hover:to-[#55421A]' 
                              : 'from-[#781220] via-red-500 to-pink-500 hover:from-pink-500 hover:to-[#781220]'
                          } text-white shadow-2xl hover:shadow-3xl border border-white/20`
                    }`}
                  >
                    {/* Button Background Animation */}
                    {isOpen && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {!isOpen ? (
                        <>
                          <span>🔒</span>
                          مغلق حالياً
                        </>
                      ) : (
                        <>
                          <span>🚀</span>
                          اختر هذا المطعم
                          <span>✨</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
    </div>
  );
};