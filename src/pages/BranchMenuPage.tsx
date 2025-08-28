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
  const [isOpen, setIsOpen] = useState(isWithinOperatingHours());

  // Load branch-specific cart when component mounts
  useEffect(() => {
    loadBranchCart(branchId);
    // Also save the branch to localStorage for consistency
    if (branch) {
      localStorage.setItem('selectedBranch', JSON.stringify(branch));
    }
  }, [branchId, loadBranchCart, branch]);

  // Update operating status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOpen(isWithinOperatingHours());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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

  // Create categories array with "الكل" option
  const categoryOptions = ['الكل', ...categories.map(cat => cat.name)];

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
        '--brand-color': branch?.name?.includes('مستر كريسبي') ? '#55421A' : '#781220',
        '--brand-color-hover': branch?.name?.includes('مستر كريسبي') ? '#3d2f12' : '#5c0d18'
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
              isOpen ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {isOpen ? 'متوفر للطلب الآن' : 'مغلق حالياً'}
            </span>
          </div>
          
          {!isOpen && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-full text-sm max-w-md mx-auto">
              {getTimeUntilOpening() && `سيفتح خلال ${getTimeUntilOpening()}`}
            </div>
          )}
        </div>

        <CategoryFilter
          categories={categoryOptions}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedRestaurant={restaurant}
        />

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#781220]"></div>
            <p className="mt-4 text-gray-600">جاري تحميل القائمة...</p>
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
          <Menu
            items={filteredItems}
            onAddToCart={addToCart}
            branchId={branchId}
          />
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

      <footer className="bg-black text-white py-12 mt-16">
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
              <h4 className={`font-bold mb-2 ${branch.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'}`}>الفرع الحالي</h4>
              <p className="text-gray-300">{branch.name}</p>
              <p className="text-gray-400 text-sm">{branch.address}</p>
            </div>
            <div>
              <h4 className={`font-bold mb-2 ${branch.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'}`}>ساعات العمل</h4>
              <p className="text-gray-300">يومياً من 10:00 ص إلى 12:00 م</p>
            </div>
            <div>
              <h4 className={`font-bold mb-2 ${branch.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'}`}>الهاتف</h4>
              <p className="text-gray-300">{branch.phone}</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-500">© 2025 المستر. جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </div>
  );
};