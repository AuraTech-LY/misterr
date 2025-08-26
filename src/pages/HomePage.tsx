import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { CategoryFilter } from '../components/CategoryFilter';
import { Menu } from '../components/Menu';
import { Cart } from '../components/Cart';
import { useMenu } from '../hooks/useMenu';
import { useCart } from '../hooks/useCart';
import { branches } from '../data/branchData';
import { Branch } from '../types';
import { isWithinOperatingHours, getTimeUntilOpening } from '../utils/timeUtils';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(() => {
    // Load selected branch from localStorage
    const saved = localStorage.getItem('selectedBranch');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const { menuItems, categories, loading, error } = useMenu(selectedBranch?.id);
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
  } = useCart(selectedBranch?.id);
  const [isOpen, setIsOpen] = useState(isWithinOperatingHours());

  // Load branch-specific cart when branch changes
  React.useEffect(() => {
    if (selectedBranch?.id) {
      loadBranchCart(selectedBranch.id);
    }
  }, [selectedBranch?.id, loadBranchCart]);

  // Update operating status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOpen(isWithinOperatingHours());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Show branch selector if no branch is selected
  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center p-3 sm:p-4" dir="rtl">
        <div className="max-w-2xl w-full mx-auto text-center">
          {/* Header */}
          <div className="mb-8">
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
                <p className="text-base sm:text-lg text-gray-600">مطعم الوجبات السريعة</p>
              </div>
            </div>
            <h2 className="text-lg sm:text-3xl font-bold text-gray-800 mb-4 px-4">مرحباً بك في مطعم المستر</h2>
            <p className="text-sm sm:text-xl text-gray-600 leading-relaxed px-4 mb-8">
              يرجى اختيار الفرع الأقرب إليك للمتابعة
            </p>
          </div>

          {/* Action Button */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg">
            <Link
              to="/branches"
              className="w-full bg-[#781220] hover:bg-[#5c0d18] text-white py-4 px-8 rounded-full font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 inline-block"
            >
              اختيار الفرع
            </Link>
            <p className="text-gray-500 text-sm mt-4">
              لدينا 3 فروع في أفضل المواقع لخدمتك
            </p>
          </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir="rtl">
      <Header
        cartItemCount={getTotalItems()}
        onCartClick={openCart}
        selectedBranch={selectedBranch}
        onBranchChange={() => setSelectedBranch(null)}
        onBranchChange={() => navigate('/branches')}
        cartTotal={getTotalPrice()}
      />

      <main className="container mx-auto px-4 py-4 sm:py-8">
        {/* Add bottom padding for mobile navigation */}
        <div className="pb-20 sm:pb-0">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-black text-gray-800 mb-4">قائمة الطعام</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-2 text-[#781220]">ساعات العمل</h4>
              <p className="text-gray-300">يومياً من 10:00 ص إلى 12:00 م</p>
            </div>
            <div>
              <h4 className="font-bold mb-2 text-[#781220]">الهاتف</h4>
              <p className="text-gray-300">{selectedBranch?.phone || '091-2345678'}</p>
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