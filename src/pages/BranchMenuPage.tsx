import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { CategoryFilter } from '../components/CategoryFilter';
import { Menu } from '../components/Menu';
import { Cart } from '../components/Cart';
import { useMenu } from '../hooks/useMenu';
import { useCart } from '../hooks/useCart';
import { getBranchById } from '../data/restaurantsData';
import { Branch } from '../types';
import { isWithinOperatingHours, getTimeUntilOpening } from '../utils/timeUtils';

interface BranchMenuPageProps {
  branchId: string;
}

export const BranchMenuPage: React.FC<BranchMenuPageProps> = ({ branchId }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  
  // Find the branch data
  const branchData = getBranchById(branchId);
  const branch = branchData?.branch;
  const restaurant = branchData?.restaurant;
  
  const { menuItems, categories, loading, error } = useMenu(branchId);
  const {
    cartItems,
    isCartOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    getTotalItems,
    getTotalPrice,
    openCart,
    closeCart,
    clearCart,
    loadBranchCart,
  } = useCart(branchId);
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [timeUntilOpening, setTimeUntilOpening] = useState<string | null>(null);

  // Load branch-specific cart when component mounts
  useEffect(() => {
    loadBranchCart(branchId);
    // Also save the branch to localStorage for consistency
    if (branch) {
      localStorage.setItem('selectedBranch', JSON.stringify(branch));
    }
  }, [branchId, loadBranchCart, branch]);

  // Update operating status every minute with branch-specific hours
  useEffect(() => {
    const updateStatus = async () => {
      const branchIsOpen = await isWithinOperatingHours(branchId);
      const timeUntilOpen = await getTimeUntilOpening(branchId);
      setIsOpen(branchIsOpen);
      setTimeUntilOpening(timeUntilOpen);
    };
    
    updateStatus();
    const interval = setInterval(() => {
      updateStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, [branchId]);

  // Redirect to branches page if branch not found
  if (!branch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center p-4" dir="rtl">
        <div className="max-w-md w-full mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">الفرع غير موجود</h1>
          <p className="text-gray-600 mb-6">الفرع المطلوب غير متوفر حالياً</p>
          <Link
            to="/branches"
            className="bg-[#781220] hover:bg-[#5c0d18] text-white py-3 px-6 rounded-full font-bold transition-all duration-300 inline-block"
          >
            اختيار فرع آخر
          </Link>
        </div>
      </div>
    );
  }

  // Filter menu items by category
  const filteredItems = selectedCategory === 'الكل'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);


  const handleBackToRestaurants = () => {
    // Clear both restaurant and branch selection
    localStorage.removeItem('selectedRestaurantId');
    localStorage.removeItem('selectedBranchId');
    navigate('/');
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" 
      dir="rtl"
      style={{
        '--brand-color': branch?.name?.includes('مستر كريسبي') ? '#55421A' : branch?.name?.includes('مستر برجريتو') ? '#E59F49' : '#781220',
        '--brand-color-hover': branch?.name?.includes('مستر كريسبي') ? '#3d2f12' : branch?.name?.includes('مستر برجريتو') ? '#cc8a3d' : '#5c0d18'
      } as React.CSSProperties}
    >
      <Header
        cartItemCount={getTotalItems()}
        onCartClick={openCart}
        selectedRestaurant={restaurant}
        selectedBranch={branch}
        onBranchChange={() => navigate('/branches')}
        cartTotal={getTotalPrice()}
        showBackButton={true}
        onBackClick={handleBackToRestaurants}
      />

      <main className="container mx-auto px-4 py-4 sm:py-8 lg:px-16 xl:px-32 2xl:px-48">
        {/* Add bottom padding for mobile navigation */}
        <div className="pb-20 sm:pb-0">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-black text-gray-800 mb-4">قائمة الطعام</h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            اكتشف أشهى الوجبات السريعة من {branch.name}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              isOpen === true ? 'bg-green-500' : isOpen === false ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {isOpen === true ? 'متوفر للطلب الآن' : isOpen === false ? 'مغلق حالياً' : 'جاري التحقق...'}
            </span>
          </div>
          
          {isOpen === false && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-full text-sm max-w-md mx-auto">
              {timeUntilOpening && `سيفتح خلال ${timeUntilOpening}`}
            </div>
          )}
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedRestaurant={restaurant}
        />

        {loading && (
          <div className="space-y-12">
            {/* Skeleton Category Filters */}
            <div className="mb-8">
              <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide px-4 sm:px-2 py-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-gray-200 animate-pulse rounded-full px-6 py-3 sm:px-8 sm:py-4 whitespace-nowrap">
                    <div className="h-4 w-16 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Skeleton Menu Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                  {/* Mobile Layout Skeleton */}
                  <div className="md:hidden flex items-center p-4 gap-4 h-32">
                    <div className="flex flex-col items-center justify-center min-w-[70px] flex-shrink-0">
                      <div className="h-6 w-12 bg-gray-300 rounded"></div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-1 w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="w-20 h-20 bg-gray-300 rounded-xl flex-shrink-0"></div>
                  </div>
                  
                  {/* Desktop Layout Skeleton */}
                  <div className="hidden md:block h-80">
                    <div className="h-32 bg-gray-300"></div>
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="h-5 bg-gray-300 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-1 w-full"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3 w-2/3"></div>
                      <div className="h-6 bg-gray-300 rounded mb-3 w-1/2"></div>
                      <div className="h-10 bg-gray-300 rounded-full w-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 bg-[#781220] text-white px-6 py-2 rounded-lg hover:bg-[#5c0d18] transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="animate-fadeInUp">
            <Menu
              items={filteredItems}
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
              branchId={branchId}
              cartItems={cartItems}
              categories={categories}
              selectedCategory={selectedCategory}
            />
          </div>
        )}
        </div>
      </main>

      <Cart
        isOpen={isCartOpen}
        onClose={closeCart}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        selectedBranch={branch}
      />

      <footer className="bg-black text-white py-12 mt-16" style={{ borderTopLeftRadius: '3rem', borderTopRightRadius: '3rem' }}>
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 flex items-center justify-center">
              <img 
                src="/New Element 88 [8BACFE9].png" 
                alt="مطعم المستر" 
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-2xl font-black">المستر</h3>
          </div>
          <p className="text-gray-400 text-lg mb-6">مطعم الوجبات السريعة الأفضل في المدينة</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className={`font-bold mb-2 ${branch.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : branch.name?.includes('مستر برجريتو') ? 'text-[#E59F49]' : 'text-[#781220]'}`}>الفرع الحالي</h4>
              <p className="text-gray-300">{restaurant?.name}</p>
              <p className="text-gray-400 text-sm">{branch.address}</p>
            </div>
            <div>
              <h4 className={`font-bold mb-2 ${branch.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : branch.name?.includes('مستر برجريتو') ? 'text-[#E59F49]' : 'text-[#781220]'}`}>ساعات العمل</h4>
              <p className="text-gray-300">يومياً من 10:00 ص إلى 12:00 م</p>
            </div>
            <div>
              <h4 className={`font-bold mb-2 ${branch.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : branch.name?.includes('مستر برجريتو') ? 'text-[#E59F49]' : 'text-[#781220]'}`}>الهاتف</h4>
              <p className="text-gray-300">{branch.phone}</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6">
            {/* Developer Mark */}
            <div className="flex flex-col items-center justify-center text-gray-400 text-base mb-4" dir="ltr">
              <a 
                href="https://www.instagram.com/auratech.ly/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity duration-300"
              >
                <img 
                  src="/Aura-tech.png" 
                  alt="Aura Tech" 
                  className="w-12 h-12 object-contain"
                />
              </a>
              <span>Made by Aura itself</span>
            </div>
            <p className="text-gray-500">© 2025 المستر. جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </div>
  );
};