import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { Branch } from '../types';
import { isWithinOperatingHours } from '../utils/timeUtils';

interface BranchSelectorProps {
  branches: Branch[];
  selectedBranch: Branch | null;
  onBranchSelect: (branch: Branch) => void;
  restaurantName?: string;
  onBackToRestaurants?: () => void;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
  branches,
  selectedBranch,
  onBranchSelect,
  restaurantName,
  onBackToRestaurants,
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [branchStatuses, setBranchStatuses] = React.useState<Record<string, boolean>>({});
  const [hasAnyOpenBranch, setHasAnyOpenBranch] = React.useState(false);
  const [isCheckingHours, setIsCheckingHours] = React.useState(true);

  // Trigger loading animation
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check operating hours for each branch
  React.useEffect(() => {
    const checkBranchHours = async () => {
      setIsCheckingHours(true);
      const statuses: Record<string, boolean> = {};
      let anyOpen = false;
      
      for (const branch of branches) {
        const isOpen = await isWithinOperatingHours(branch.id);
        statuses[branch.id] = isOpen;
        if (isOpen) anyOpen = true;
      }
      
      setBranchStatuses(statuses);
      setHasAnyOpenBranch(anyOpen);
      setIsCheckingHours(false);
    };

    checkBranchHours();
    
    // Update every minute
    const interval = setInterval(checkBranchHours, 60000);
    return () => clearInterval(interval);
  }, [branches]);
  
  const handleBranchSelect = (branch: Branch) => {
    // Update browser theme color based on branch
    if (window.updateThemeColorForRestaurant) {
      window.updateThemeColorForRestaurant(branch.name);
    }
    onBranchSelect(branch);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Simple Header */}
      <div className={`bg-white px-6 py-6 transition-all duration-700 ease-out ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        {onBackToRestaurants && (
          <button
            onClick={onBackToRestaurants}
            className={`flex items-center gap-2 mb-4 ${
              restaurantName?.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'
            }`}
          >
            <ArrowRight className="w-5 h-5" />
            <span>العودة</span>
          </button>
        )}
        
        <div className="text-center">
          {restaurantName?.includes('مستر كريسبي') ? (
            <img 
              src="/mr-Krispy.png" 
              alt="مستر كريسبي"
              className="w-36 h-36 object-contain mx-auto mb-1"
            />
          ) : restaurantName?.includes('مستر برجريتو') ? (
            <img 
               src="https://arabic-fast-food-res-p61a.bolt.host/mr-burgerito.png" 
              alt="مستر برجريتو"
              className="w-36 h-36 object-contain mx-auto mb-1"
            />
          ) : (
            <img 
              src="/Mr-Sheesh.png" 
              alt={restaurantName || "المستر"}
              className="w-36 h-36 object-contain mx-auto mb-1"
            />
          )}
          <h1 className="text-xl font-bold text-gray-800 mb-1">
            {restaurantName || "المستر"}
          </h1>
          <p className="text-gray-600 text-sm mt-0">اختر الفرع الأقرب إليك</p>
        </div>
      </div>

      {/* Branch Buttons */}
      <div className="flex-1 px-6 py-6 space-y-6 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:max-w-6xl md:mx-auto">
        {branches.map((branch, index) => {
          const isBranchOpen = !isCheckingHours && (branchStatuses[branch.id] ?? false);
          const showAsDisabled = isCheckingHours || !isBranchOpen;
          return (
          <button
            key={branch.id}
            onClick={() => handleBranchSelect(branch)}
            disabled={showAsDisabled}
            className={`relative w-full p-6 md:p-8 rounded-2xl text-white font-semibold transition-all duration-300 active:scale-[0.98] md:hover:scale-[1.02] overflow-hidden group transform-gpu ${
              branch.name?.includes('مستر كريسبي') 
                ? 'bg-gradient-to-r from-[#55421A] to-[#4a3817]' 
                : branch.name?.includes('مستر برجريتو')
                  ? 'bg-gradient-to-r from-[#E59F49] to-[#cc8a3d]'
                : 'bg-gradient-to-r from-[#781220] to-[#651018]'
            } ${showAsDisabled ? 'opacity-50' : 'shadow-2xl hover:shadow-3xl hover:brightness-110 active:brightness-125 active:shadow-inner'} md:min-h-[140px] md:flex md:items-center ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{
              transitionDelay: isLoaded ? `${index * 120}ms` : '0ms',
              transitionDuration: '600ms'
            }}
          >
            {/* Interactive background overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-500 ease-out"></div>
            
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full group-active:translate-x-full transition-transform duration-1000 ease-out"></div>
            
            {/* Subtle accent line */}
            
            {/* Mobile touch ripple effect */}
            <div className="absolute inset-0 bg-white/0 group-active:bg-white/10 transition-all duration-150 ease-out rounded-2xl"></div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 group-hover:scale-110 group-active:scale-105 group-active:bg-white/30 transition-all duration-300">
                <MapPin className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="text-right md:text-center md:flex-1">
                <div className="text-xl md:text-2xl font-bold mb-1 group-hover:scale-105 group-active:scale-102 transition-transform duration-300">{branch.name}</div>
                <div className="text-sm md:text-base opacity-80 font-normal">{branch.area}</div>
              </div>
              {isCheckingHours ? (
                <div className="bg-black/20 text-white px-3 py-1.5 rounded-full text-sm md:text-base font-medium backdrop-blur-sm flex items-center gap-2">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري التحقق...
                </div>
              ) : !isBranchOpen && (
                <div className="bg-black/20 text-white px-3 py-1.5 rounded-full text-sm md:text-base font-medium backdrop-blur-sm">
                  مغلق حالياً
                </div>
              )}
            </div>
          </button>
          );
        })}
      </div>

      {/* Status */}
      <div className={`px-6 py-6 text-center transition-all duration-700 ease-out ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`} style={{ transitionDelay: isLoaded ? '250ms' : '0ms' }}>
        {isCheckingHours ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            جاري التحقق من أوقات العمل...
          </div>
        ) : (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            hasAnyOpenBranch 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${hasAnyOpenBranch ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            {hasAnyOpenBranch ? 'يوجد فروع مفتوحة للطلبات' : 'جميع الفروع مغلقة حالياً'}
          </div>
        )}
      </div>
    </div>
  );
};