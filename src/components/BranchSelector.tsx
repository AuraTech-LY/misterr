import React from 'react';
import { MapPin, Phone, CheckCircle, ArrowRight } from 'lucide-react';
import { Branch } from '../types';
import { getFormattedLibyaTime, getTimeUntilOpening, isWithinOperatingHours } from '../utils/timeUtils';

interface BranchSelectorProps {
  branches: Branch[];
  selectedBranch: Branch | null;
  onBranchSelect: (branch: Branch) => void;
  restaurantName: string;
  onBackToRestaurants: () => void;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
  branches,
  selectedBranch,
  onBranchSelect,
  restaurantName,
  onBackToRestaurants,
}) => {
  const [currentTime, setCurrentTime] = React.useState(getFormattedLibyaTime());
  const [isOpen, setIsOpen] = React.useState(isWithinOperatingHours());

  // Update time every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getFormattedLibyaTime());
      setIsOpen(isWithinOperatingHours());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center p-3 sm:p-4" dir="rtl">
      <div className="max-w-6xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          {/* Back Button */}
          <div className="flex justify-start mb-4">
            <button
              onClick={onBackToRestaurants}
              className="flex items-center gap-2 text-[#781220] hover:text-[#5c0d18] font-semibold transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              العودة للمطاعم
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-gradient-to-br from-[#781220] to-[#5c0d18] rounded-2xl shadow-xl border-2 border-white/20 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
              <img 
                src="/New Element 88 [8BACFE9].png" 
                alt={restaurantName}
                className="w-8 h-8 sm:w-12 sm:h-12 object-contain filter drop-shadow-lg"
              />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-gray-800">{restaurantName}</h1>
              <p className="text-base sm:text-lg text-gray-600">مطعم الوجبات السريعة</p>
            </div>
          </div>
          <h2 className="text-lg sm:text-3xl font-bold text-gray-800 mb-2 px-4">اختر الفرع الأقرب إليك</h2>
          <p className="text-sm sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            فروع {restaurantName} في أفضل المواقع لخدمتك بأسرع وقت ممكن
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
              جميع الفروع مغلقة حالياً • {getTimeUntilOpening() && `يفتح خلال ${getTimeUntilOpening()}`}
            </div>
          )}
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 px-2 sm:px-4 justify-items-center max-w-5xl mx-auto">
          {branches.map((branch) => (
            <div
              key={branch.id}
              onClick={() => onBranchSelect(branch)}
              className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105 w-full max-w-sm min-w-0 ${
                selectedBranch?.id === branch.id
                  ? 'ring-2 ring-[#7A1120] ring-opacity-50'
                  : ''
              }`}
            >
              {/* Branch Header */}
              <div className={`text-white p-4 sm:p-6 relative ${
                branch.name.includes('مستر كريسبي') ? 'bg-[#55421A]' : 'bg-[#781220]'
              }`}>
                {selectedBranch?.id === branch.id && (
                  <div className="absolute top-3 left-3">
                    <CheckCircle className="w-5 h-5 text-white fill-current" />
                  </div>
                )}
                <div className="text-center">
                  <MapPin className="w-6 h-6 mx-auto mb-3" />
                  <h3 className="text-lg sm:text-xl font-bold mb-2">{branch.name}</h3>
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

              {/* Branch Details */}
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#781220] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">العنوان</p>
                    <p className="text-gray-600 leading-relaxed text-sm">{branch.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#781220]" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">الهاتف</p>
                    <p className="text-gray-600 text-sm">{branch.phone}</p>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  disabled={!isOpen}
                  className={`w-full py-3 rounded-full font-bold text-base transition-all duration-300 ${
                    !isOpen
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : selectedBranch?.id === branch.id
                      ? 'bg-[#781220] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-[#781220] hover:text-white'
                  }`}
                >
                  {!isOpen 
                    ? 'مغلق حالياً' 
                    : selectedBranch?.id === branch.id 
                    ? 'تم الاختيار' 
                    : 'اختر هذا الفرع'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        {selectedBranch && isOpen && (
          <div className="text-center mt-6 sm:mt-12 animate-fadeInUp px-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg max-w-md mx-auto">
              <p className="text-gray-600 mb-4 text-base">
                تم اختيار <span className="font-bold text-[#781220]">{selectedBranch.name}</span>
              </p>
              <button
                onClick={() => onBranchSelect(selectedBranch)}
                className="block w-full bg-[#781220] hover:bg-[#5c0d18] text-white py-3 rounded-full font-bold text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-center"
              >
                تصفح القائمة
              </button>
            </div>
          </div>
        )}
        
        {selectedBranch && !isOpen && (
          <div className="text-center mt-6 sm:mt-12 animate-fadeInUp px-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 shadow-lg max-w-md mx-auto">
              <p className="text-red-700 mb-2 text-base font-semibold">
                الفرع مغلق حالياً
              </p>
              <p className="text-red-600 text-sm">
                {getTimeUntilOpening() && `سيفتح خلال ${getTimeUntilOpening()}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};