import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { CategoryFilter } from '../components/CategoryFilter';
import { Menu } from '../components/Menu';
import { Cart } from '../components/Cart';
import { RestaurantSelector } from '../components/RestaurantSelector';
import { BranchSelector } from '../components/BranchSelector';
import { useMenu } from '../hooks/useMenu';
import { useCart } from '../hooks/useCart';
import { restaurants, getRestaurantById, getBranchById } from '../data/restaurantsData';
import { Branch, Restaurant } from '../types';
import { isWithinOperatingHours, getTimeUntilOpening } from '../utils/timeUtils';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Load selected restaurant and branch from localStorage
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(() => {
    const savedRestaurantId = localStorage.getItem('selectedRestaurantId');
    return savedRestaurantId ? getRestaurantById(savedRestaurantId) || null : null;
  });
  
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(() => {
    const savedBranchId = localStorage.getItem('selectedBranchId');
    if (savedBranchId) {
      const branchData = getBranchById(savedBranchId);
      return branchData ? branchData.branch : null;
    }
    return null;
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

  // Handle restaurant selection
  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    localStorage.setItem('selectedRestaurantId', restaurant.id);
    // Clear branch selection when restaurant changes
    setSelectedBranch(null);
    localStorage.removeItem('selectedBranchId');
  };

  // Handle branch selection
  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    localStorage.setItem('selectedBranchId', branch.id);
  };

  // Show restaurant selector if no restaurant is selected
  if (!selectedRestaurant) {
    return (
      <RestaurantSelector
        restaurants={restaurants}
        onSelectRestaurant={handleRestaurantSelect}
      />
    );
  }

  // Show branch selector if restaurant is selected but no branch is selected
  if (selectedRestaurant && !selectedBranch) {
    return (
      <BranchSelector
        branches={selectedRestaurant.branches}
        selectedBranch={selectedBranch}
        onBranchSelect={handleBranchSelect}
        restaurantName={selectedRestaurant.name}
        onBackToRestaurants={() => {
          setSelectedRestaurant(null);
          localStorage.removeItem('selectedRestaurantId');
        }}
      />
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
        selectedRestaurant={selectedRestaurant}
        selectedRestaurant={selectedRestaurant}
        selectedBranch={selectedBranch}
        onBranchChange={() => {
          setSelectedBranch(null);
          localStorage.removeItem('selectedBranchId');
        }}
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
          selectedRestaurant={selectedRestaurant}
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
        selectedBranch={selectedBranch}
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
            <h3 className="text-2xl font-black">{selectedRestaurant.name}</h3>
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
            <p className="text-gray-500">© 2025 {selectedRestaurant.name}. جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </div>
  );
};