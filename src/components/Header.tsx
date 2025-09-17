import React from 'react';
import { ShoppingBag, Star, MapPin, ChevronDown, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Branch } from '../types';
import { getAllBranches, getBranchById } from '../data/restaurantsData';
import { CustomSelect } from './CustomSelect';
import { isWithinOperatingHours, getTimeUntilClosing } from '../utils/timeUtils';

// Custom hook for count-up animation
const useCountUp = (endValue: number, duration: number = 600) => {
  const [currentValue, setCurrentValue] = React.useState(endValue);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const previousValueRef = React.useRef(endValue);

  React.useEffect(() => {
    if (endValue !== previousValueRef.current) {
      setIsAnimating(true);
      const startValue = previousValueRef.current;
      const difference = endValue - startValue;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentAnimatedValue = startValue + (difference * easeOutQuart);
        
        setCurrentValue(Math.round(currentAnimatedValue));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCurrentValue(endValue);
          setIsAnimating(false);
          previousValueRef.current = endValue;
        }
      };

      requestAnimationFrame(animate);
    }
  }, [endValue, duration]);

  return { value: currentValue, isAnimating };
};

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
  selectedRestaurant?: { id: string; name: string };
  selectedBranch?: Branch;
  onBranchChange?: () => void;
  cartTotal?: number;
  isCartOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  cartItemCount, 
  onCartClick, 
  selectedRestaurant,
  selectedBranch,
  onBranchChange,
  cartTotal = 0,
  isCartOpen = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChangingBranch, setIsChangingBranch] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState<boolean | null>(null);
  const [timeUntilClosing, setTimeUntilClosing] = React.useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  
  // Count-up animation for cart total
  const { value: animatedTotal, isAnimating } = useCountUp(Math.round(cartTotal));
  
  // Count-up animation for cart item count
  const { value: animatedItemCount, isAnimating: isItemCountAnimating } = useCountUp(cartItemCount);

  // Update operating status every minute with branch-specific hours
  React.useEffect(() => {
    const updateStatus = async () => {
      // Clear cache for debugging - remove this in production
      if (selectedBranch?.id === 'burgerito-airport') {
        const { clearOperatingHoursCache } = await import('../utils/timeUtils');
        clearOperatingHoursCache();
      }
      
      const branchIsOpen = await isWithinOperatingHours(selectedBranch?.id);
      const timeUntilClose = await getTimeUntilClosing(selectedBranch?.id);
      setIsOpen(branchIsOpen);
      setTimeUntilClosing(timeUntilClose);
    };
    
    updateStatus();
    const interval = setInterval(() => {
      updateStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedBranch?.id]);

  const handleBranchChange = () => {
    // Always navigate to branches page when button is clicked
    navigate('/branches');
  };

  const handleBranchSelect = (branch: Branch) => {
    console.log('Branch selected:', branch.id, 'Current:', selectedBranch?.id);
    
    // Don't do anything if same branch is selected
    if (branch.id === selectedBranch?.id) {
      setIsDropdownOpen(false);
      return;
    }
    
    setIsChangingBranch(true);
    setIsDropdownOpen(false);
    
    // Update localStorage
    localStorage.setItem('selectedBranchId', branch.id);
    
    // Find the restaurant for this branch
    const branchData = getBranchById(branch.id);
    if (branchData) {
      localStorage.setItem('selectedRestaurantId', branchData.restaurant.id);
    }
    
    // Update browser theme color based on branch
    if (window.updateThemeColorForRestaurant) {
      window.updateThemeColorForRestaurant(branch.name);
    }
    
    // Navigate to the correct branch URL with page refresh
    const branchRoutes: Record<string, string> = {
      'airport': '/sheesh/airport-road',
      'balaoun': '/sheesh/beloun', 
      'dollar': '/krispy/beloun',
      'burgerito-airport': '/burgerito/airport-road'
    };
    
    const targetRoute = branchRoutes[branch.id];
    console.log('Navigating to:', targetRoute);
    
    if (targetRoute) {
      // Force page refresh to ensure everything reloads
      window.location.href = targetRoute;
    } else {
      console.error('No route found for branch:', branch.id);
      setIsChangingBranch(false);
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <>
      <div className="fixed top-0 z-40 w-full">
        <div className="px-3 sm:px-4 py-3 sm:py-4 lg:px-16 xl:px-32 2xl:px-48 w-full">
          <div className="container mx-auto">
            <div className={`text-white rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-lg border border-white border-opacity-10 px-4 sm:px-6 py-3 sm:py-4 ${
              selectedRestaurant?.name?.includes('مستر كريسبي') ? 'bg-[#55421A]' : selectedRestaurant?.name?.includes('مستر برجريتو') ? 'bg-[#E59F49]' : 'bg-[#781220]'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                    <img 
                      src="/New Element 88 [8BACFE9].png" 
                      alt="مطعم المستر" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col justify-center text-right">
                    <h1 className="text-xl sm:text-3xl font-black">
                      {selectedRestaurant?.name || 'المستر'}
                    </h1>
                    {isOpen === false && (
                      <p className="text-xs sm:text-sm opacity-75 text-red-200 leading-tight text-right">مغلق حالياً</p>
                    )}
                    {isOpen === true && timeUntilClosing && (
                      <p className="text-xs sm:text-sm opacity-75 leading-tight text-right">يغلق خلال {timeUntilClosing}</p>
                    )}
                    {isOpen === null && (
                      <p className="text-xs sm:text-sm opacity-75 text-yellow-200 leading-tight text-right">جاري التحقق...</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                  {selectedBranch && (
                    <div className="relative">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          disabled={isChangingBranch}
                          className={`text-white px-2 py-1.5 sm:px-6 sm:py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-1 sm:gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 text-xs sm:text-base backdrop-blur-sm border border-white border-opacity-20 ${
                            selectedRestaurant?.name?.includes('مستر كريسبي')
                              ? 'bg-[#55421A] bg-opacity-20 hover:bg-opacity-30'
                              : selectedRestaurant?.name?.includes('مستر برجريتو')
                                ? 'bg-[#E59F49] bg-opacity-20 hover:bg-opacity-30'
                                : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                          } ${
                            isDropdownOpen ? 'bg-opacity-30' : ''
                          } ${
                           isChangingBranch ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <MapPin className="w-4 h-4" />
                          <span>{selectedBranch.area}</span>
                          {isChangingBranch ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <ChevronDown 
                              className={`w-4 h-4 transition-transform duration-300 ${
                                isDropdownOpen ? 'transform rotate-180' : ''
                              }`} 
                            />
                          )}
                        </button>

                        {isDropdownOpen && (
                          <div className="absolute top-full left-0 mt-2 z-50" dir="ltr">
                            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-2xl overflow-hidden w-80 max-w-[90vw] animate-fadeInUp">
                              {getAllBranches().map((branch) => (
                                <button
                                  key={branch.id}
                                  type="button"
                                  disabled={isChangingBranch}
                                  onClick={() => handleBranchSelect(branch)}
                                  className={`w-full p-3 text-right flex items-center gap-3 transition-all duration-200 ${
                                    selectedBranch.id === branch.id 
                                      ? `bg-red-50 font-semibold ${
                                          branch.name?.includes('مستر كريسبي') 
                                            ? 'text-[#55421A]' 
                                            : branch.name?.includes('مستر برجريتو')
                                              ? 'text-[#E59F49]'
                                              : 'text-[#781220]'
                                        }`
                                      : 'text-gray-700'
                                  } ${
                                    branch.name?.includes('مستر كريسبي')
                                      ? 'hover:bg-[#55421A]'
                                      : branch.name?.includes('مستر برجريتو')
                                        ? 'hover:bg-[#E59F49]'
                                        : 'hover:bg-[#7A1120]'
                                  } hover:text-white hover:scale-[1.02] active:scale-[0.98]`}
                                >
                                  <MapPin className={`w-4 h-4 ${
                                    selectedBranch.id === branch.id 
                                      ? branch.name?.includes('مستر كريسبي') 
                                          ? 'text-[#55421A]' 
                                          : branch.name?.includes('مستر برجريتو')
                                            ? 'text-[#E59F49]'
                                            : 'text-[#781220]'
                                      : 'text-gray-400'
                                  }`} />
                                  <div className="flex-1 text-right">
                                    <div className="font-semibold">
                                      {branch.name?.includes('مستر كريسبي') 
                                        ? 'مستر كريسبي' 
                                        : branch.name?.includes('مستر برجريتو')
                                          ? 'مستر برجريتو'
                                          : 'مستر شيش'
                                      }
                                    </div>
                                    <div className="text-xs opacity-75">{branch.area}</div>
                                  </div>
                                  {selectedBranch.id === branch.id && (
                                    <div className={`w-2 h-2 rounded-full ${
                                      branch.name?.includes('مستر كريسبي') 
                                        ? 'bg-[#55421A]' 
                                        : branch.name?.includes('مستر برجريتو')
                                          ? 'bg-[#E59F49]'
                                          : 'bg-[#781220]'
                                    }`}></div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={onCartClick}
                    disabled={isOpen !== true}
                    className={`hidden sm:flex relative px-2 py-1.5 sm:px-6 sm:py-3 rounded-full font-semibold transition-all duration-300 items-center gap-1 sm:gap-2 shadow-lg text-xs sm:text-base backdrop-blur-sm ${
                      isOpen !== true
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : `bg-white ${selectedRestaurant?.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : selectedRestaurant?.name?.includes('مستر برجريتو') ? 'text-[#E59F49]' : 'text-[#781220]'} hover:bg-gray-100 hover:shadow-xl transform hover:scale-105`
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span className="hidden sm:inline">{isOpen === false ? 'مغلق' : isOpen === null ? 'جاري التحقق...' : 'السلة'}</span>
                    {cartItemCount > 0 && (
                      <span className={`absolute -top-1 -left-1 sm:-top-2 sm:-left-2 ${selectedRestaurant?.name?.includes('مستر كريسبي') ? 'bg-[#55421A]' : selectedRestaurant?.name?.includes('مستر برجريتو') ? 'bg-[#E59F49]' : 'bg-[#781220]'} text-white text-xs w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold animate-pulse shadow-lg border-2 border-white`}>
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Branch Switching Overlay */}
      {isChangingBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl animate-fadeInUp">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#781220] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">جاري تغيير الفرع...</h3>
              <p className="text-gray-600">يرجى الانتظار</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
        <div className="px-3 py-2">
          <button
            onClick={onCartClick}
            disabled={cartItemCount === 0 || isOpen !== true}
            className={`w-full py-3 rounded-full font-semibold text-base transition-all duration-300 shadow-md flex items-center justify-center gap-2 ${
              isOpen !== true
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : cartItemCount === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : selectedRestaurant?.name?.includes('مستر كريسبي') 
                  ? 'bg-[#55421A] hover:bg-[#3d2f12] text-white hover:shadow-xl'
                  : selectedRestaurant?.name?.includes('مستر برجريتو')
                    ? 'bg-[#E59F49] hover:bg-[#cc8a3d] text-white hover:shadow-xl'
                    : 'bg-[#781220] hover:bg-[#5c0d18] text-white hover:shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              {/* Item Count - Right Side */}
              <div className="flex-shrink-0 w-16 text-left">
                {cartItemCount > 0 && (
                  <span className="text-white text-xl font-bold">
                    {animatedItemCount}
                  </span>
                )}
              </div>
              
              {/* Cart Icon and Text - Fixed Center */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <ShoppingBag className="w-5 h-5" />
                <span>{isOpen === false ? 'مغلق حالياً' : isOpen === null ? 'جاري التحقق...' : 'عرض السلة'}</span>
              </div>
              
              {/* Total Price - Left Side */}
              <div className="flex-shrink-0 w-20 text-right">
                {cartItemCount > 0 && isOpen === true && (
                  <div className="text-white text-xl whitespace-nowrap">
                    <span className="font-bold">{animatedTotal}</span>
                    <span className="font-normal text-sm opacity-70"> د.ل</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};
