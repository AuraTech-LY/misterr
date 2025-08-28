import React from 'react';
import { Restaurant } from '../types';
import { MapPin, Clock, Store } from 'lucide-react';
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

  const getTimeUntilOpening = () => {
    // Add your time calculation logic here
    return null;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 overflow-hidden" dir="rtl">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #781220 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, #781220 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      <div className="relative z-10 flex flex-col h-full p-3 sm:p-8">
        <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
          {/* Header Section */}
          <div className="text-center mb-4 sm:mb-8 flex-shrink-0">
            {/* Logo and Brand */}
            <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#781220] to-[#5c0d18] rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center transform hover:scale-105 transition-all duration-300">
                  <img 
                    src="/New Element 88 [8BACFE9].png" 
                    alt="مطعم المستر" 
                    className="w-8 h-8 sm:w-12 sm:h-12 object-contain filter drop-shadow-lg"
                  />
                </div>
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-[#781220] rounded-xl sm:rounded-2xl blur-xl opacity-20 -z-10"></div>
              </div>
              <div className="text-right">
                <h1 className="text-2xl sm:text-4xl font-black text-gray-800 mb-1">
                  المستر
                </h1>
                <p className="text-sm sm:text-lg text-gray-600 font-medium">
                  مطاعم الوجبات السريعة الرائدة
                </p>
              </div>
            </div>
            
            {/* Main heading */}
            <div className="max-w-4xl mx-auto mb-3 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2">
                اختر المطعم المناسب لك
              </h2>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto px-4">
                استمتع بتجربة طعام استثنائية من خلال شبكة مطاعمنا المتميزة
              </p>
            </div>
            
            {/* Status Bar */}
            <div className="inline-flex items-center gap-3 sm:gap-6 bg-white/80 backdrop-blur-sm px-3 py-2 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50">
              <div className="flex items-center gap-1 sm:gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-xs sm:text-sm text-gray-600">الوقت:</span>
                <span className="font-bold text-[#781220] text-xs sm:text-sm">{currentTime}</span>
              </div>
              <div className="w-px h-4 sm:h-6 bg-gray-300"></div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {isOpen ? 'مفتوح للطلبات' : 'مغلق حالياً'}
                </span>
              </div>
            </div>
            
            <div className="mt-2 text-xs sm:text-sm text-gray-500">
              ساعات العمل: من 11:00 صباحاً إلى 11:59 مساءً يومياً
            </div>
            
            {!isOpen && (
              <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-xs sm:text-sm max-w-md mx-auto">
                جميع المطاعم مغلقة حالياً • {getTimeUntilOpening() && `يفتح خلال ${getTimeUntilOpening()}`}
              </div>
            )}
          </div>

          {/* Restaurant Cards */}
          <div className="flex-1 flex flex-col sm:grid sm:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 max-w-5xl mx-auto min-h-0">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                onClick={() => onSelectRestaurant(restaurant)}
                className="group bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer transform hover:scale-[1.02] border border-gray-200/50 flex-1 sm:flex-none"
              >
                {/* Restaurant Header */}
                <div className={`relative p-4 sm:p-6 text-white ${
                  restaurant.id === 'mister-crispy' 
                    ? 'bg-gradient-to-br from-[#55421A] to-[#3d2f12]' 
                    : 'bg-gradient-to-br from-[#781220] to-[#5c0d18]'
                }`}>
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px),
                                       radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
                      backgroundSize: '30px 30px'
                    }}></div>
                  </div>
                  
                  <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl mb-2 sm:mb-3 backdrop-blur-sm">
                      <Store className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 drop-shadow-lg">
                      {restaurant.name}
                    </h3>
                    <div className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      isOpen 
                        ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                        : 'bg-red-500/20 text-red-100 border border-red-400/30'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        isOpen ? 'bg-green-300' : 'bg-red-300'
                      } animate-pulse`} />
                      {isOpen ? 'متاح للطلب' : 'مغلق مؤقتاً'}
                    </div>
                  </div>
                </div>

                {/* Restaurant Details */}
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {/* Branch Information */}
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      restaurant.id === 'mister-crispy' ? 'bg-[#55421A]/10' : 'bg-[#781220]/10'
                    }`}>
                      <MapPin className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        restaurant.id === 'mister-crispy' ? 'text-[#55421A]' : 'text-[#781220]'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-sm sm:text-base mb-1">الفروع المتاحة</h4>
                      <p className="text-gray-600 mb-2 text-xs sm:text-sm">
                        {restaurant.branches.length} {restaurant.branches.length === 1 ? 'فرع' : 'فروع'} في مواقع استراتيجية
                      </p>
                      <div className="space-y-1">
                        {restaurant.branches.map((branch) => (
                          <div key={branch.id} className="flex items-center gap-2 text-gray-700">
                            <div className={`w-2 h-2 rounded-full ${
                              restaurant.id === 'mister-crispy' ? 'bg-[#55421A]' : 'bg-[#781220]'
                            }`}></div>
                            <span className="font-medium text-xs sm:text-sm">{branch.area}</span>
                            <span className="text-gray-500 text-xs">• {branch.deliveryTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    disabled={!isOpen}
                    className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 relative overflow-hidden ${
                      !isOpen
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : `${restaurant.id === 'mister-crispy' ? 'bg-[#55421A] hover:bg-[#3d2f12]' : 'bg-[#781220] hover:bg-[#5c0d18]'} text-white shadow-lg hover:shadow-xl group-hover:scale-105`
                    }`}
                  >
                    <span className="relative z-10">
                      {!isOpen ? 'مغلق حالياً' : 'اختر هذا المطعم'}
                    </span>
                    {isOpen && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-4 sm:mt-8 text-gray-500 flex-shrink-0">
            <p className="text-xs sm:text-sm">
              © 2025 مطاعم المستر • جودة عالية وخدمة متميزة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};