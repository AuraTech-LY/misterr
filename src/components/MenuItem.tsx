import React from 'react';
import { Plus, Star, X, Minus, Trash2 } from 'lucide-react';
import { MenuItem as MenuItemType } from '../types';
import { isWithinOperatingHours } from '../utils/timeUtils';
import { getBranchById } from '../data/restaurantsData';

interface MenuItemProps {
  item: MenuItemType;
  onAddToCart: (item: MenuItemType) => void;
  onRemoveFromCart?: (id: string) => void;
  branchId?: string;
  cartItems?: any[];
}

export const MenuItem: React.FC<MenuItemProps> = ({ item, onAddToCart, onRemoveFromCart, branchId, cartItems = [] }) => {
  const [showMobilePopup, setShowMobilePopup] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [quantity, setQuantity] = React.useState(1);
  const [desktopQuantity, setDesktopQuantity] = React.useState(1);
  const [isOpen, setIsOpen] = React.useState(isWithinOperatingHours());
  const [isHighlighted, setIsHighlighted] = React.useState(false);
  const [isAppearing, setIsAppearing] = React.useState(false);
  const [hasAppeared, setHasAppeared] = React.useState(false);
  const [showTrashAnimation, setShowTrashAnimation] = React.useState(false);
  const [isPressing, setIsPressing] = React.useState(false);
  const [isQuickAddPressing, setIsQuickAddPressing] = React.useState(false);

  // Check if this item is in the cart
  const cartItem = cartItems.find(cartItem => cartItem.id === item.id);
  const isInCart = !!cartItem;
  const cartQuantity = cartItem?.quantity || 0;

  // Trigger trash button animation when item is added to cart
  React.useEffect(() => {
    if (isInCart && !showTrashAnimation) {
      setShowTrashAnimation(true);
    } else if (!isInCart) {
      setShowTrashAnimation(false);
    }
  }, [isInCart, showTrashAnimation]);

  // Determine if this is a Mister Crispy branch
  const branchData = branchId ? getBranchById(branchId) : null;
  const isMisterCrispy = branchData?.branch?.name?.includes('مستر كريسبي') || false;

  // Trigger appearing animation on mount
  React.useEffect(() => {
    const timer = setTimeout(() => setHasAppeared(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Update operating status every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsOpen(isWithinOperatingHours());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleMobileItemClick = () => {
    if (!isOpen) return;
    
    setShowMobilePopup(true);
    setIsClosing(false);
    setIsAppearing(false);
    setQuantity(1);
    // Trigger appearing animation after popup is mounted
    setTimeout(() => setIsAppearing(true), 10);
  };

  const handleClosePopup = () => {
    setIsClosing(true);
    setIsAppearing(false);
    setTimeout(() => {
      setShowMobilePopup(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(item);
    }
    handleClosePopup();
    setQuantity(1);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleDesktopQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setDesktopQuantity(newQuantity);
    }
  };

  const handleDesktopAddToCart = () => {
    // Trigger press animation if item is already in cart
    if (isInCart) {
      setIsPressing(true);
      setTimeout(() => setIsPressing(false), 200);
    }
    
    for (let i = 0; i < desktopQuantity; i++) {
      onAddToCart(item);
    }
    setDesktopQuantity(1);
  };

  const handleMobileQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Trigger press animation for the whole item
    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 150);
    
    onAddToCart(item);
    
  };


  const handleRemoveFromCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFromCart) {
      onRemoveFromCart(item.id);
    }
  };
  return (
    <>
      {/* Mobile Layout - Horizontal/Rectangular */}
      <div 
        className={`md:hidden bg-white shadow-lg rounded-2xl overflow-hidden group w-full relative transition-all duration-150 transform ${
          isPressing 
            ? 'scale-95' 
            : 'scale-100'
        } ${
          isOpen ? 'hover:shadow-xl cursor-pointer' : 'opacity-60 cursor-not-allowed'
        } ${
          isHighlighted || isInCart
            ? `ring-2 ${isMisterCrispy ? 'ring-[#55421A]' : 'ring-[#781220]'} ring-opacity-50 ${isMisterCrispy ? 'bg-gradient-to-r from-[#55421A]/5 to-transparent' : 'bg-gradient-to-r from-[#781220]/5 to-transparent'} shadow-xl`
            : ''
        } ${
          hasAppeared ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        onClick={handleMobileItemClick}
      >
        {/* Trash button for items in cart - Mobile */}
        {isInCart && onRemoveFromCart && (
          <button
            onClick={handleRemoveFromCart}
            className={`absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 z-10 ${
              showTrashAnimation ? 'animate-fadeInScale' : ''
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center p-4 gap-4 h-32 min-w-0">
          {/* Price Section - Left */}
          <div className="flex flex-col items-center justify-center min-w-[70px] flex-shrink-0">
            <div className={`text-xl whitespace-nowrap ${
              isMisterCrispy ? 'text-[#55421A]' : 'text-[#781220]'
            }`}>
              <span className="font-black">{Math.round(item.price)}</span>
              <span className="font-normal text-sm opacity-70"> د.ل</span>
            </div>
          </div>

          {/* Content Section - Middle */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-800 truncate flex-1 min-w-0">{item.name}</h3>
              {item.popular && (
                <div className="bg-[#781220] text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ml-2 flex-shrink-0">
                  <Star className="w-3 h-3 fill-current" />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed flex-1 overflow-hidden">{item.description}</p>
          </div>

          {/* Image Section - Right */}
          <div className="relative w-24 h-24 sm:w-24 sm:h-24 flex-shrink-0">
            {/* Item count badge - Mobile */}
            {cartQuantity > 0 && (
              <div className={`absolute -top-1 -left-1 w-6 h-6 ${
                isMisterCrispy ? 'bg-[#55421A]' : 'bg-[#781220]'
              } text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg z-10`}>
                {cartQuantity}
              </div>
            )}
            <img
              src={item.image}
              alt={item.name}
              className="w-24 h-24 object-cover rounded-xl"
            />
            <button
              onClick={handleMobileQuickAdd}
              disabled={!isOpen}
              className={`absolute -bottom-1 -left-1 w-8 h-8 bg-white rounded-full shadow-lg transition-all duration-150 flex items-center justify-center z-10 ${
                isOpen 
                  ? 'hover:shadow-xl transform hover:scale-110 active:scale-95 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <Plus className={`w-4 h-4 ${
                isMisterCrispy ? 'text-[#55421A]' : 'text-[#781220]'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Popup Modal */}
      {showMobilePopup && (
        <div className={`md:hidden fixed inset-0 bg-black z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
          isClosing ? 'bg-opacity-0' : 'bg-opacity-50'
        }`}>
          <div className={`bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden transition-all duration-300 ease-out transform ${
            isClosing 
              ? 'translate-y-8 opacity-0' 
              : isAppearing 
                ? 'translate-y-0 opacity-100' 
                : '-translate-y-8 opacity-0'
          }`}>
            {/* Header with close button */}
            <div className="relative">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={handleClosePopup}
                className="absolute top-3 left-3 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              {item.popular && (
                <div className="absolute top-3 right-3 bg-[#781220] text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current" />
                  <span>الأكثر طلباً</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">{item.name}</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">{item.description}</p>
              <div className="mb-4">
                <div className={`text-2xl ${
                  isMisterCrispy ? 'text-[#55421A]' : 'text-[#781220]'
                }`}>
                  <span className="font-black">{Math.round(item.price)}</span>
                  <span className="font-normal text-lg opacity-70"> د.ل</span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-semibold text-gray-800">الكمية:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className={`w-10 h-10 ${
                      isMisterCrispy
                        ? 'bg-[#55421A] hover:bg-[#3d2f12]'
                        : 'bg-[#781220] hover:bg-[#5c0d18]'
                    } text-white rounded-full flex items-center justify-center transition-colors`}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Total Price */}
              <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-xl">
                <span className="text-lg font-semibold text-gray-800">المجموع:</span>
                <div className={`text-xl ${
                  isMisterCrispy ? 'text-[#55421A]' : 'text-[#781220]'
                }`}>
                  <span className="font-black">{Math.round(item.price * quantity)}</span>
                  <span className="font-normal text-lg opacity-70"> د.ل</span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!isOpen}
                className={`w-full px-4 py-4 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg text-base ${
                  isOpen
                    ? isMisterCrispy
                      ? 'bg-[#55421A] hover:bg-[#3d2f12] text-white hover:shadow-xl transform hover:scale-105 active:scale-95'
                      : 'bg-[#781220] hover:bg-[#5c0d18] text-white hover:shadow-xl transform hover:scale-105 active:scale-95'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isOpen ? 'إضافة إلى السلة' : 'مغلق حالياً'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop/Tablet Layout - Vertical Cards */}
      <div className={`hidden md:block bg-white rounded-2xl shadow-lg transition-all duration-300 overflow-hidden group h-80 flex flex-col ${
        isOpen ? 'hover:shadow-2xl transform hover:-translate-y-2' : 'opacity-60'
      } ${
        isInCart 
          ? `ring-2 ${isMisterCrispy ? 'ring-[#55421A]' : 'ring-[#781220]'} ring-opacity-50 ${isMisterCrispy ? 'bg-gradient-to-b from-[#55421A]/5 to-transparent' : 'bg-gradient-to-b from-[#781220]/5 to-transparent'} shadow-xl`
          : ''
      } ${
        isPressing ? 'scale-95 shadow-inner bg-gray-50' : ''
      } ${
        hasAppeared ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        {/* Trash button for items in cart - Desktop */}
        {isInCart && onRemoveFromCart && (
          <button
            onClick={handleRemoveFromCart}
            className={`absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 z-20 ${
              showTrashAnimation ? 'animate-fadeInScale' : ''
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Item count badge - Desktop */}
        {cartQuantity > 0 && (
          <div className={`absolute -top-1 -left-1 w-6 h-6 ${
            isMisterCrispy ? 'bg-[#55421A]' : 'bg-[#781220]'
          } text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg z-10`}>
            {cartQuantity}
          </div>
        )}

        <div className="relative">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500"
            style={{ minHeight: '128px' }}
          />
          {item.popular && (
            <div className="absolute top-2 right-2 bg-[#781220] text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" />
              <span>الأكثر طلباً</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-gray-800 mb-2 h-7 overflow-hidden">{item.name}</h3>
          <p className="text-sm text-gray-600 mb-3 leading-relaxed h-10 overflow-hidden text-ellipsis line-clamp-2">{item.description}</p>
          
          <div className="mb-3 h-6">
            <div className={`text-xl ${
              isMisterCrispy ? 'text-[#55421A]' : 'text-[#781220]'
            }`}>
              <span className="font-black">{Math.round(item.price)}</span>
              <span className="font-normal text-base opacity-70"> د.ل</span>
            </div>
          </div>

          {/* Quantity Selector */}
          {/* Add Button */}
          <div className="flex items-center justify-between mb-3 h-8">
            <button
              onClick={() => {
                // Trigger press animation if item is already in cart
                if (isInCart) {
                  setIsPressing(true);
                  setTimeout(() => setIsPressing(false), 200);
                }
                onAddToCart(item);
              }}
              disabled={!isOpen}
              className={`w-full px-4 py-2 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg text-sm ${
                isOpen
                  ? isMisterCrispy
                    ? 'bg-[#55421A] hover:bg-[#3d2f12] text-white hover:shadow-xl transform hover:scale-105 active:scale-95'
                    : 'bg-[#781220] hover:bg-[#5c0d18] text-white hover:shadow-xl transform hover:scale-105 active:scale-95'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isOpen ? 'إضافة إلى السلة' : 'مغلق حالياً'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};