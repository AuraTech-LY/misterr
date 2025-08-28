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
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden" dir="rtl">
      <div className="flex flex-col h-full p-3 sm:p-8">
        <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        {/* Header */}
        <div className="text-center mb-3 sm:mb-8 flex-shrink-0">
          {/* Back Button */}
          <div className="flex justify-start mb-2 sm:mb-4">
            <button
              onClick={onBackToRestaurants}
              className="flex items-center gap-2 text-[#781220] hover:text-[#5c0d18] font-semibold transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              العودة للمطاعم
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-6">
            <div className="w-8 h-8 sm:w-16 sm:h-16 flex items-center justify-center bg-gradient-to-br from-[#781220] to-[#5c0d18] rounded-xl sm:rounded-2xl shadow-xl border-2 border-white/20 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
              <img 
                src="/New Element 88 [8BACFE9].png" 
                alt={restaurantName}
                className="w-6 h-6 sm:w-12 sm:h-12 object-contain filter drop-shadow-lg"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-5xl font-black text-gray-800">{restaurantName}</h1>
              <p className="text-xs sm:text-lg text-gray-600">مطعم الوجبات السريعة</p>
            </div>
          </div>
          <h2 className="text-base sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 px-4">اختر الفرع الأقرب إليك</h2>
          <p className="text-xs sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            فروع {restaurantName} في أفضل المواقع لخدمتك بأسرع وقت ممكن
          </p>
          
          {/* Current Time Display */}
          <div className="mt-2 sm:mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
            <span>الوقت الحالي في ليبيا:</span>
            <span className={`font-bold ${restaurantName?.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'}`}>{currentTime}</span>
          </div>
          
          {/* Operating Hours */}
          <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
            ساعات العمل: من 11:00 صباحاً إلى 11:59 مساءً
          </div>
          
          {!isOpen && (
            <div className="mt-2 sm:mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm max-w-md mx-auto">
              جميع الفروع مغلقة حالياً • {getTimeUntilOpening() && `يفتح خلال ${getTimeUntilOpening()}`}
            </div>
          )}
        </div>

        {/* Branch Cards */}
        <div className="flex-1 flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8 px-2 sm:px-4 justify-items-center max-w-5xl mx-auto min-h-0">
          {branches.map((branch) => (
            <div
              key={branch.id}
              onClick={() => onBranchSelect(branch)}
              className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105 w-full max-w-sm min-w-0 flex-1 sm:flex-none ${
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
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                    <CheckCircle className="w-5 h-5 text-white fill-current" />
                  </div>
                )}
                <div className="text-center">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 sm:mb-3" />
                  <h3 className="text-sm sm:text-xl font-bold mb-1 sm:mb-2">{branch.name}</h3>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm ${
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
              <div className="p-3 sm:p-6 space-y-2 sm:space-y-4 flex-1 flex flex-col">
                <div className="flex items-start gap-2 sm:gap-3 flex-1">
                  <MapPin className={`w-5 h-5 ${branch.name.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'} mt-0.5 flex-shrink-0`} />
                  <div>
                    <p className="font-semibold text-gray-800 text-xs sm:text-sm">العنوان</p>
                    <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">{branch.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <Phone className={`w-5 h-5 ${branch.name.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'}`} />
                  <div>
                    <p className="font-semibold text-gray-800 text-xs sm:text-sm">الهاتف</p>
                    <p className="text-gray-600 text-xs sm:text-sm">{branch.phone}</p>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  disabled={!isOpen}
                  className={`w-full py-2 sm:py-3 rounded-full font-bold text-xs sm:text-base transition-all duration-300 mt-auto ${
                    !isOpen
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : selectedBranch?.id === branch.id
                      ? `${branch.name.includes('مستر كريسبي') ? 'bg-[#55421A]' : 'bg-[#781220]'} text-white shadow-lg`
                      : `bg-gray-100 text-gray-700 ${branch.name.includes('مستر كريسبي') ? 'hover:bg-[#55421A]' : 'hover:bg-[#781220]'} hover:text-white`
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
          <div className="text-center mt-3 sm:mt-12 animate-fadeInUp px-4 flex-shrink-0">
            <div className="bg-white rounded-xl p-3 sm:p-6 shadow-lg max-w-md mx-auto">
              <p className="text-gray-600 mb-2 sm:mb-4 text-xs sm:text-base">
                تم اختيار <span className={`font-bold ${selectedBranch.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'}`}>{selectedBranch.name}</span>
              </p>
              <button
                onClick={() => onBranchSelect(selectedBranch)}
                className={`block w-full ${selectedBranch.name?.includes('مستر كريسبي') ? 'bg-[#55421A] hover:bg-[#3d2f12]' : 'bg-[#781220] hover:bg-[#5c0d18]'} text-white py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-center`}
              >
                تصفح القائمة
              </button>
            </div>
          </div>
        )}
        
        {selectedBranch && !isOpen && (
          <div className="text-center mt-3 sm:mt-12 animate-fadeInUp px-4 flex-shrink-0">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-6 shadow-lg max-w-md mx-auto">
              <p className="text-red-700 mb-1 sm:mb-2 text-sm sm:text-base font-semibold">
                الفرع مغلق حالياً
              </p>
              <p className="text-red-600 text-xs sm:text-sm">
                {getTimeUntilOpening() && `سيفتح خلال ${getTimeUntilOpening()}`}
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};