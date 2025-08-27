import React from 'react';
import { Plus, Star, X, Minus } from 'lucide-react';
import { MenuItem as MenuItemType } from '../types';
import { isWithinOperatingHours } from '../utils/timeUtils';

interface MenuItemProps {
  item: MenuItemType;
  onAddToCart: (item: MenuItemType) => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({ item, onAddToCart }) => {
  const [showMobilePopup, setShowMobilePopup] = React.useState(false);
  const [quantity, setQuantity] = React.useState(1);
  const [desktopQuantity, setDesktopQuantity] = React.useState(1);
  const [isOpen, setIsOpen] = React.useState(isWithinOperatingHours());

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
    setQuantity(1);
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(item);
    }
    setShowMobilePopup(false);
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
    for (let i = 0; i < desktopQuantity; i++) {
      onAddToCart(item);
    }
    setDesktopQuantity(1);
  };
  return (
    <>
      {/* Mobile Layout - Horizontal/Rectangular */}
      <div 
        className={`md:hidden bg-white rounded-2xl shadow-lg transition-all duration-300 overflow-hidden group w-full ${
          isOpen ? 'hover:shadow-xl cursor-pointer' : 'opacity-60 cursor-not-allowed'
        }`}
        onClick={handleMobileItemClick}
      >
        <div className="flex items-center p-4 gap-4 h-32 min-w-0">
          {/* Price Section - Left */}
          <div className="flex flex-col items-center justify-center min-w-[70px] flex-shrink-0">
            <span className="text-xl font-black text-[#781220] whitespace-nowrap">
              {item.price.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">د.ل</span>
          </div>

          {/* Content Section - Middle */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-base font-bold text-gray-800 truncate flex-1 min-w-0">{item.name}</h3>
              {item.popular && (
                <div className="bg-[#781220] text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ml-2 flex-shrink-0">
                  <Star className="w-3 h-3 fill-current" />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed flex-1 overflow-hidden">{item.description}</p>
          </div>

          {/* Image Section - Right */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-500"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isOpen) return;
                onAddToCart(item);
              }}
              disabled={!isOpen}
              className={`absolute bottom-1 left-1 w-8 h-8 bg-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center z-10 ${
                isOpen 
                  ? 'hover:shadow-xl transform hover:scale-110 active:scale-95 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 text-[#781220]" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Popup Modal */}
      {showMobilePopup && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-fadeInUp">
            {/* Header with close button */}
            <div className="relative">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => setShowMobilePopup(false)}
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
              
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-black text-[#781220]">
                  {item.price.toFixed(2)} د.ل
                </span>
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
                    className="w-10 h-10 bg-[#781220] hover:bg-[#5c0d18] text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Total Price */}
              <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-xl">
                <span className="text-lg font-semibold text-gray-800">المجموع:</span>
                <span className="text-xl font-black text-[#781220]">
                  {(item.price * quantity).toFixed(2)} د.ل
                </span>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!isOpen}
                className={`w-full py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-lg ${
                  isOpen
                    ? 'bg-[#781220] hover:bg-[#5c0d18] text-white hover:shadow-xl transform hover:scale-105 active:scale-95'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isOpen ? `إضافة إلى السلة (${quantity})` : 'مغلق حالياً'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop/Tablet Layout - Vertical Cards */}
      <div className={`hidden md:block bg-white rounded-2xl shadow-lg transition-all duration-300 overflow-hidden group flex flex-col ${
        isOpen ? 'hover:shadow-2xl transform hover:-translate-y-2' : 'opacity-60'
      }`}>
        <div className="relative">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-32 lg:h-40 object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {item.popular && (
            <div className="absolute top-2 right-2 lg:top-3 lg:right-3 bg-[#781220] text-white px-2 py-1 lg:px-3 lg:py-1 rounded-full text-xs lg:text-sm font-semibold flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" />
              <span>الأكثر طلباً</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
        </div>
        
        <div className="p-3 lg:p-4 flex flex-col flex-grow">
          <h3 className="text-base lg:text-lg font-bold text-gray-800 mb-2">{item.name}</h3>
          <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-2 flex-grow">{item.description}</p>
          
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg lg:text-xl font-black text-[#781220]">
              {item.price.toFixed(2)} د.ل
            </span>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">الكمية:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDesktopQuantityChange(desktopQuantity - 1)}
                className="w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center font-bold text-sm">{desktopQuantity}</span>
              <button
                onClick={() => handleDesktopQuantityChange(desktopQuantity + 1)}
                className="w-7 h-7 bg-[#781220] hover:bg-[#5c0d18] text-white rounded-full flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Total Price and Add Button */}
          <div className="flex justify-between items-center mb-1">
            <div className="text-center">
              <div className="text-xs text-gray-500">المجموع</div>
              <div className="text-lg font-black text-[#781220]">
                {(item.price * desktopQuantity).toFixed(2)} د.ل
              </div>
            </div>

            <button
              onClick={handleDesktopAddToCart}
              disabled={!isOpen}
              className={`px-3 py-2 lg:px-4 lg:py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg text-sm ${
                isOpen
                  ? 'bg-[#781220] hover:bg-[#5c0d18] text-white hover:shadow-xl transform hover:scale-105 active:scale-95'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{isOpen ? `إضافة (${desktopQuantity})` : 'مغلق'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};