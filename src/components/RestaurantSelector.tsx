import React from 'react';
import { Restaurant } from '../types';
import { Store, Clock, MapPin } from 'lucide-react';
import { getFormattedLibyaTime, isWithinOperatingHours, getTimeUntilOpening } from '../utils/timeUtils';

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
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#781220] rounded-xl flex items-center justify-center shadow-lg">
            <img 
              src="/New Element 88 [8BACFE9].png" 
              alt="المستر" 
              className="w-8 h-8 object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-gray-800">المستر</h1>
            <p className="text-sm text-gray-600">مطاعم الوجبات السريعة الرائدة</p>
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-center text-gray-800 mb-3">
          اختر المطعم المناسب لك
        </h2>
        <p className="text-center text-gray-600 text-sm mb-4">
          استمتع بتجربة طعام استثنائية من خلال شبكة مطاعمنا المتميزة
        </p>
        
        {/* Status Bar */}
        <div className="flex items-center justify-center gap-4 bg-gray-50 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">الوقت: </span>
            <span className="font-bold text-[#781220] text-sm">{currentTime}</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-sm font-medium text-gray-700">
              {isOpen ? 'مفتوح للطلبات' : 'مغلق حالياً'}
            </span>
          </div>
        </div>
        
        <div className="text-center mt-2 text-xs text-gray-500">
          ساعات العمل: من 11:00 صباحاً إلى 11:59 مساءً يومياً
        </div>
        
        {!isOpen && (
          <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-sm text-center">
            جميع المطاعم مغلقة حالياً • {getTimeUntilOpening() && `يفتح خلال ${getTimeUntilOpening()}`}
          </div>
        )}
      </div>

      {/* Restaurant Cards */}
      <div className="px-4 py-6 space-y-4">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            onClick={() => onSelectRestaurant(restaurant)}
            className="bg-white rounded-2xl shadow-lg overflow-hidden active:scale-95 transition-transform duration-200"
          >
            {/* Restaurant Header */}
            <div className={`p-6 text-white text-center ${
              restaurant.id === 'mister-crispy' 
                ? 'bg-[#55421A]' 
                : 'bg-[#781220]'
            }`}>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-3">
                <Store className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {restaurant.name}
              </h3>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                isOpen 
                  ? 'bg-green-500/20 text-green-100' 
                  : 'bg-red-500/20 text-red-100'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isOpen ? 'bg-green-300' : 'bg-red-300'
                } animate-pulse`} />
                {isOpen ? 'متاح للطلب' : 'مغلق مؤقتاً'}
              </div>
            </div>

            {/* Restaurant Details */}
            <div className="p-6">
              {/* Branch Information */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  restaurant.id === 'mister-crispy' ? 'bg-[#55421A]/10' : 'bg-[#781220]/10'
                }`}>
                  <MapPin className={`w-5 h-5 ${
                    restaurant.id === 'mister-crispy' ? 'text-[#55421A]' : 'text-[#781220]'
                  }`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 mb-1">الفروع المتاحة</h4>
                  <p className="text-gray-600 mb-3 text-sm">
                    {restaurant.branches.length} {restaurant.branches.length === 1 ? 'فرع' : 'فروع'} في مواقع استراتيجية
                  </p>
                  <div className="space-y-2">
                    {restaurant.branches.map((branch) => (
                      <div key={branch.id} className="flex items-center gap-2 text-gray-700">
                        <div className={`w-2 h-2 rounded-full ${
                          restaurant.id === 'mister-crispy' ? 'bg-[#55421A]' : 'bg-[#781220]'
                        }`}></div>
                        <span className="font-medium text-sm">{branch.area}</span>
                        <span className="text-gray-500 text-xs">• {branch.deliveryTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                disabled={!isOpen}
                className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-300 ${
                  !isOpen
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : `${restaurant.id === 'mister-crispy' ? 'bg-[#55421A] hover:bg-[#3d2f12]' : 'bg-[#781220] hover:bg-[#5c0d18]'} text-white shadow-lg active:scale-95`
                }`}
              >
                {!isOpen ? 'مغلق حالياً' : 'اختر هذا المطعم'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-gray-500">
        <p className="text-sm">
          © 2025 مطاعم المستر • جودة عالية وخدمة متميزة
        </p>
      </div>
    </div>
  );
};