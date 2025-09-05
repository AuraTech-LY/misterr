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
  const [isOpen, setIsOpen] = React.useState<boolean | null>(null);
  const [timeUntilOpening, setTimeUntilOpening] = React.useState<string | null>(null);

  // Load branch-specific cart when branch changes
  React.useEffect(() => {
    if (selectedBranch?.id) {
      loadBranchCart(selectedBranch.id);
    }
  }, [selectedBranch?.id, loadBranchCart]);

  // Update operating status every minute with branch-specific hours
  useEffect(() => {
    const updateStatus = async () => {
      const branchIsOpen = await isWithinOperatingHours(selectedBranch?.id);
      const timeUntilOpen = await getTimeUntilOpening(selectedBranch?.id);
      setIsOpen(branchIsOpen);
      setTimeUntilOpening(timeUntilOpen);
    };
    
    updateStatus();
    const interval = setInterval(() => {
      updateStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedBranch?.id]);

  // Handle restaurant selection
  const handleRestaurantSelect = (restaurant: Restaurant) => {
    // Update browser theme color immediately
    if (window.updateThemeColorForRestaurant) {
      window.updateThemeColorForRestaurant(restaurant.name);
    }
    setSelectedRestaurant(restaurant);
    localStorage.setItem('selectedRestaurantId', restaurant.id);
    // Clear branch selection when restaurant changes
    setSelectedBranch(null);
    localStorage.removeItem('selectedBranchId');
  };

  // Handle branch selection
  const handleBranchSelect = (branch: Branch) => {
    // Update browser theme color based on branch
    if (window.updateThemeColorForRestaurant) {
      window.updateThemeColorForRestaurant(branch.name);
    }
    setSelectedBranch(branch);
    localStorage.setItem('selectedBranchId', branch.id);
  };

  const handleBackToRestaurants = () => {
    setSelectedRestaurant(null);
    setSelectedBranch(null);
    localStorage.removeItem('selectedRestaurantId');
    localStorage.removeItem('selectedBranchId');
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


  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" 
      dir="rtl"
      style={{
        '--brand-color': selectedRestaurant?.name?.includes('مستر كريسبي') ? '#55421A' : '#781220',
        '--brand-color-hover': selectedRestaurant?.name?.includes('مستر كريسبي') ? '#3d2f12' : '#5c0d18'
      } as React.CSSProperties}
    >
      <Header
        cartItemCount={getTotalItems()}
        onCartClick={openCart}
        selectedRestaurant={selectedRestaurant}
        selectedBranch={selectedBranch}
        onBranchChange={() => {
          setSelectedBranch(null);
          localStorage.removeItem('selectedBranchId');
        }}
        cartTotal={getTotalPrice()}
        showBackButton={true}
        onBackClick={handleBackToRestaurants}
      />

      <main className="container mx-auto px-4 py-4 sm:py-8 lg:px-16 xl:px-32 2xl:px-48">
        {/* Add bottom padding for mobile navigation */}
        <div className="pb-20 sm:pb-0">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-black text-gray-800 mb-4">قائمة الطعام</h2>
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
              {timeUntilOpening && timeUntilOpening !== 'مغلق' ? `سيفتح خلال ${timeUntilOpening}` : 'مغلق'}
            </div>
          )}
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedRestaurant={selectedRestaurant}
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
              branchId={selectedBranch?.id}
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
        selectedBranch={selectedBranch}
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
            <h3 className="text-2xl font-black">{selectedRestaurant.name}</h3>
          </div>
          <p className="text-gray-400 text-lg mb-6">مطعم الوجبات السريعة الأفضل في المدينة</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className={`font-bold mb-2 ${selectedRestaurant.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'}`}>ساعات العمل</h4>
              <p className="text-gray-300">يومياً من 10:00 ص إلى 12:00 م</p>
            </div>
            <div>
              <h4 className={`font-bold mb-2 ${selectedRestaurant.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'}`}>الهاتف</h4>
              <p className="text-gray-300">{selectedBranch?.phone || '091-2345678'}</p>
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
            <p className="text-gray-500">© 2025 {selectedRestaurant.name}. جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </div>
  );
};