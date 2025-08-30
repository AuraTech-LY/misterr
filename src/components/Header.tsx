import React from 'react';
import { ShoppingBag, Star, MapPin, ChevronDown, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Branch } from '../types';
import { getAllBranches } from '../data/restaurantsData';
import { CustomSelect } from './CustomSelect';
import { isWithinOperatingHours, getTimeUntilClosing } from '../utils/timeUtils';

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
  selectedRestaurant?: { id: string; name: string };
  selectedBranch?: Branch;
  onBranchChange?: () => void;
  cartTotal?: number;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  cartItemCount, 
  onCartClick, 
  selectedRestaurant,
  selectedBranch,
  onBranchChange,
  cartTotal = 0,
  showBackButton = false,
  onBackClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChangingBranch, setIsChangingBranch] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(isWithinOperatingHours());
  const [timeUntilClosing, setTimeUntilClosing] = React.useState(getTimeUntilClosing());
  const [isMoneyAnimating, setIsMoneyAnimating] = React.useState(false);
  const [prevCartTotal, setPrevCartTotal] = React.useState(cartTotal);

  // Trigger money animation when cart total changes
  React.useEffect(() => {
    if (cartTotal !== prevCartTotal && cartTotal > 0) {
      setIsMoneyAnimating(true);
      setTimeout(() => setIsMoneyAnimating(false), 600);
    }
    setPrevCartTotal(cartTotal);
  }, [cartTotal, prevCartTotal]);

  // Update operating status every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsOpen(isWithinOperatingHours());
      setTimeUntilClosing(getTimeUntilClosing());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleBranchChange = () => {
    // Always navigate to branches page when button is clicked
    navigate('/branches');
  };

  return (
    <>
      {/* Back Button - Above Navigation */}
      {showBackButton && (
        <div className="bg-gray-50 px-3 sm:px-4 py-2 lg:px-16 xl:px-32 2xl:px-48">
          <div className="container mx-auto">
            <button
              onClick={(e) => {
                e.preventDefault();
                // Clear both restaurant and branch to go to restaurant selector
                localStorage.removeItem('selectedRestaurantId');
                localStorage.removeItem('selectedBranchId');
                window.location.href = '/';
              }}
              className={`flex items-center gap-2 text-gray-600 transition-colors duration-300 py-2 ${
                selectedRestaurant?.name?.includes('مستر كريسبي') 
                  ? 'hover:text-[#55421A]' 
                  : 'hover:text-[#781220]'
              }`}
            >
              <ArrowRight className="w-5 h-5" />
              <span className="text-sm font-medium">العودة إلى اختيار المطعم</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Main Navigation Bar */}
      <div className="sticky top-0 z-40 px-3 sm:px-4 py-3 sm:py-4 lg:px-16 xl:px-32 2xl:px-48">
      <div className="container mx-auto">
        <div className={`text-white rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-lg border border-white border-opacity-10 px-4 sm:px-6 py-3 sm:py-4 ${
          selectedRestaurant?.name?.includes('مستر كريسبي') ? 'bg-[#55421A]' : 'bg-[#781220]'
        }`}>
        <div className="flex justify-between items-center">
          <button 
            onClick={(e) => {
              e.preventDefault();
              // Clear both restaurant and branch to go to restaurant selector
              localStorage.removeItem('selectedRestaurantId');
              localStorage.removeItem('selectedBranchId');
             window.location.href = '/';
            }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-300"
          >
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
              {!isOpen && (
                <p className="text-xs sm:text-sm opacity-75 text-red-200 leading-tight text-right">مغلق حالياً</p>
              )}
              {isOpen && timeUntilClosing && (
                <p className="text-xs sm:text-sm opacity-75 leading-tight text-right">يغلق خلال {timeUntilClosing}</p>
              )}
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            {selectedBranch && (
              <div className="relative">
                <BranchDropdown
                  selectedBranch={selectedBranch}
                  isChangingBranch={isChangingBranch}
                  onBranchChanging={setIsChangingBranch}
                  onBranchSelect={(branch) => {
                    setIsChangingBranch(true);
                    
                    // Save the selected branch
                    localStorage.setItem('selectedBranch', JSON.stringify(branch));
                    
                    const branchRoutes: Record<string, string> = {
                      'airport': '/airport-menu',
                      'dollar': '/dollar-menu',
                      'balaoun': '/balaoun-menu'
                    };
                    
                    const targetRoute = branchRoutes[branch.id];
                    
                    // Add smooth transition delay
                    setTimeout(() => {
                      if (targetRoute) {
                        window.location.href = targetRoute;
                      } else {
                        window.location.href = '/';
                      }
                    }, 300);
                  }}
                />
              </div>
            )}
            
            <button
              onClick={onCartClick}
              disabled={!isOpen}
              className={`hidden sm:flex relative px-2 py-1.5 sm:px-6 sm:py-3 rounded-full font-semibold transition-all duration-300 items-center gap-1 sm:gap-2 shadow-lg text-xs sm:text-base backdrop-blur-sm ${
                !isOpen
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : `bg-white ${selectedRestaurant?.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'} hover:bg-gray-100 hover:shadow-xl transform hover:scale-105`
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden sm:inline">{!isOpen ? 'مغلق' : 'السلة'}</span>
              {cartItemCount > 0 && (
                <span className={`absolute -top-1 -left-1 sm:-top-2 sm:-left-2 ${selectedRestaurant?.name?.includes('مستر كريسبي') ? 'bg-[#55421A]' : 'bg-[#781220]'} text-white text-xs w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold animate-pulse shadow-lg border-2 border-white`}>
                  {cartItemCount}
                </span>
              )}
            </button>
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
            disabled={cartItemCount === 0 || !isOpen}
            className={`w-full py-3 rounded-full font-semibold text-base transition-all duration-300 shadow-md flex items-center justify-center gap-2 ${
              !isOpen
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : cartItemCount === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : selectedRestaurant?.name?.includes('مستر كريسبي') 
                  ? 'bg-[#55421A] hover:bg-[#3d2f12] text-white hover:shadow-xl'
                  : 'bg-[#781220] hover:bg-[#5c0d18] text-white hover:shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              {/* Item Count - Right Side */}
              <div className="flex-shrink-0 w-16 text-left">
                {cartItemCount > 0 && (
                  <span className="text-white text-xl font-bold">
                    {cartItemCount}
                  </span>
                )}
              </div>
              
              {/* Cart Icon and Text - Fixed Center */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <ShoppingBag className="w-5 h-5" />
                <span>{!isOpen ? 'مغلق حالياً' : 'عرض السلة'}</span>
              </div>
              
              {/* Total Price - Left Side */}
              <div className="flex-shrink-0 w-20 text-right">
                {cartItemCount > 0 && isOpen && (
                  <div className={`text-white text-xl whitespace-nowrap transition-all duration-300 ${
                    isMoneyAnimating ? 'animate-pulse scale-110' : 'scale-100'
                  }`}>
                    <span className="font-bold">{Math.round(cartTotal)}</span>
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

interface BranchDropdownProps {
  selectedBranch: Branch;
  onBranchSelect: (branch: Branch) => void;
  isChangingBranch: boolean;
  onBranchChanging: (changing: boolean) => void;
}

const BranchDropdown: React.FC<BranchDropdownProps> = ({ 
  selectedBranch, 
  onBranchSelect, 
  isChangingBranch,
  onBranchChanging 
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (isOpen) {
      // Closing animation
      setIsAnimating(false);
      setTimeout(() => setIsOpen(false), 200);
    } else {
      // Opening animation
      setIsOpen(true);
      setTimeout(() => setIsAnimating(true), 10);
    }
  };

  const handleSelect = (branch: Branch) => {
    setIsAnimating(false);
    onBranchSelect(branch);
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isChangingBranch}
        className={`text-white px-2 py-1.5 sm:px-6 sm:py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-1 sm:gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 text-xs sm:text-base backdrop-blur-sm border border-white border-opacity-20 ${
          selectedBranch?.name?.includes('مستر كريسبي')
            ? 'bg-[#55421A] bg-opacity-20 hover:bg-opacity-30'
            : 'bg-white bg-opacity-20 hover:bg-opacity-30'
        } ${
          isOpen ? 'bg-opacity-30' : ''
        } ${
         isChangingBranch || !isWithinOperatingHours() ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <MapPin className="w-4 h-4" />
        <span>{selectedBranch.area}</span>
        {isChangingBranch ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-300 ${
              isOpen ? 'transform rotate-180' : ''
            }`} 
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50" dir="ltr">
          <div 
            className={`bg-white border-2 border-gray-200 rounded-2xl shadow-2xl overflow-hidden w-80 max-w-[90vw] transition-all duration-200 ease-out transform origin-top-right ${
              isAnimating 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 -translate-y-2'
            }`}
          >
          {getAllBranches().map((branch) => (
            <button
              key={branch.id}
              type="button"
              disabled={isChangingBranch}
              onClick={() => handleSelect(branch)}
              className={`w-full p-3 text-right flex items-center gap-3 transition-all duration-200 ${
                selectedBranch.id === branch.id 
                  ? 'bg-red-50 text-[#781220] font-semibold' 
                  : 'text-gray-700'
              } ${
                branch.name?.includes('مستر كريسبي')
                  ? 'hover:bg-[#55421A]'
                  : 'hover:bg-[#7A1120]'
              } hover:text-white hover:scale-[1.02] active:scale-[0.98]`}
            >
              {isChangingBranch && selectedBranch.id !== branch.id && (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              )}
              <MapPin className={`w-4 h-4 ${
                selectedBranch.id === branch.id 
                  ? branch.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'
                  : 'text-gray-400'
              }`} />
              <div className="flex-1 text-right">
                <div className="font-semibold">{branch.name}</div>
                <div className="text-xs opacity-75">{branch.area}</div>
              </div>
              {selectedBranch.id === branch.id && (
                <div className={`w-2 h-2 rounded-full ${
                  branch.name?.includes('مستر كريسبي') ? 'bg-[#55421A]' : 'bg-[#781220]'
                }`}></div>
              )}
            </button>
          ))}
          </div>
        </div>
      )}
    </div>
  );
};