import React from 'react';
import { Restaurant } from '../types';
import { MapPin } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center p-3 sm:p-4" dir="rtl">
      <div className="max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-gradient-to-br from-[#781220] to-[#5c0d18] rounded-2xl shadow-xl border-2 border-white/20 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
              <img 
                src="/New Element 88 [8BACFE9].png" 
                alt="مطعم المستر" 
                className="w-8 h-8 sm:w-12 sm:h-12 object-contain filter drop-shadow-lg"
              />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-gray-800">المستر</h1>
              <p className="text-base sm:text-lg text-gray-600">مطاعم الوجبات السريعة</p>
            </div>
          </div>
          
          <h2 className="text-lg sm:text-3xl font-bold text-gray-800 mb-2 px-4">اختر المطعم المفضل لديك</h2>
          <p className="text-sm sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            لدينا مطاعم متميزة تقدم أشهى الوجبات السريعة
          </p>
          
          {/* Current Time Display */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
            <span>الوقت الحالي في ليبيا:</span>
            <span className="font-bold text-[#781220]">{currentTime}</span>
          </div>
          
          {/* Operating Hours */}
          <div className="mt-2 text-sm text-gray-500">
            ساعات العمل: من 11:00 صباحاً إلى 11:59 مساءً
          </div>
          
          {!isOpen && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-full text-sm max-w-md mx-auto">
              جميع المطاعم مغلقة حالياً • {getTimeUntilOpening() && `يفتح خلال ${getTimeUntilOpening()}`}
            </div>
          )}
        </div>


        {/* Restaurant Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 px-2 sm:px-4 justify-items-center max-w-4xl mx-auto">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              onClick={() => onSelectRestaurant(restaurant)}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105 w-full max-w-sm"
            >
              {/* Restaurant Header */}
              <div className={`text-white p-6 relative flex-shrink-0 ${
                restaurant.id === 'mister-crispy' 
                  ? 'bg-[#55421A]' 
                  : 'bg-[#781220]'
              }`}>
                <div className="text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-4" />
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 drop-shadow-lg">{restaurant.name}</h3>
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                    isOpen 
                      ? 'bg-green-500 bg-opacity-20 text-green-100' 
                      : 'bg-red-500 bg-opacity-20 text-red-100'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isOpen ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    {isOpen ? 'مفتوح الآن' : 'مغلق'}
                  </div>
                </div>
              </div>

              {/* Restaurant Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    restaurant.id === 'mister-crispy' ? 'bg-[#55421A]/20' : 'bg-[#781220]/20'
                  }`}>
                    <MapPin className={`w-5 h-5 ${
                      restaurant.id === 'mister-crispy' ? 'text-[#55421A]' : 'text-[#781220]'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">عدد الفروع</p>
                    <p className="text-gray-600 text-sm">{restaurant.branches.length} فرع متاح</p>
                  </div>
                </div>

                {/* Branch List */}
                <div className="space-y-2">
                  <p className="font-semibold text-gray-800 text-sm">الفروع المتاحة:</p>
                  {restaurant.branches.map((branch) => (
                    <div key={branch.id} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className={`w-2 h-2 rounded-full ${
                        restaurant.id === 'mister-crispy' ? 'bg-[#55421A]' : 'bg-[#781220]'
                      }`}></div>
                      <span>{branch.area}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  disabled={!isOpen}
                  className={`w-full py-3 rounded-full font-bold text-base transition-all duration-300 ${
                    !isOpen
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : `${restaurant.id === 'mister-crispy' ? 'bg-[#55421A] hover:bg-[#3d2f12]' : 'bg-[#781220] hover:bg-[#5c0d18]'} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
                  }`}
                >
                  {!isOpen ? 'مغلق حالياً' : 'اختر هذا المطعم'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};