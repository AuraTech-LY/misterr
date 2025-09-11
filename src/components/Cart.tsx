import React from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';
import { CheckoutForm } from './CheckoutForm';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  selectedBranch?: any;
}

export const Cart: React.FC<CartProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  selectedBranch,
}) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [showCheckout, setShowCheckout] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [shouldRender, setShouldRender] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // Handle animation states
  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready for animation
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);
  // Prevent background scrolling when cart is open
  React.useEffect(() => {
    if (shouldRender) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  const handleCheckout = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowCheckout(true);
      setIsTransitioning(false);
    }, 300);
  };

  const handleOrderSubmit = (orderData: any, cartItems: CartItem[]) => {
    // Generate WhatsApp message
    const customerName = orderData.customerInfo.name;
    const customerPhone = orderData.customerInfo.phone;
    const deliveryMethod = orderData.deliveryMethod === 'delivery' ? 'توصيل' : 'استلام';
    const restaurantName = selectedBranch?.name?.includes('مستر شيش') ? 'مستر شيش' : 
                          selectedBranch?.name?.includes('مستر كريسبي') ? 'مستر كريسبي' : 'المستر';
    const branchName = selectedBranch?.name || 'غير محدد';
    
    let message = `🍔 *طلب جديد من ${restaurantName}*\n\n`;
    message += `🏪 *الفرع:* ${branchName}\n`;
    message += `👤 *اسم العميل:* ${customerName}\n`;
    message += `📱 *رقم الهاتف:* ${customerPhone}\n\n`;
    
    message += `📋 *تفاصيل الطلب:*\n`;
    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n`;
      message += `   الكمية: ${item.quantity}\n`;
      message += `   السعر: ${item.price.toFixed(2)} د.ل\n`;
      message += `   المجموع: ${(item.price * item.quantity).toFixed(2)} د.ل\n\n`;
    });
    
    message += `💰 *المجموع الكلي:* ${total.toFixed(2)} د.ل\n\n`;
    message += `🚚 *طريقة الاستلام:* ${deliveryMethod}\n`;
    
    // Add delivery price if it's a delivery order
    if (orderData.deliveryMethod === 'delivery' && orderData.deliveryPrice) {
      message += `💵 *سعر التوصيل:* ${orderData.deliveryPrice} د.ل\n`;
      message += `💰 *المجموع مع التوصيل:* ${(total + orderData.deliveryPrice).toFixed(2)} د.ل\n\n`;
    } else {
      message += `\n`;
    }
    
    if (orderData.deliveryMethod === 'delivery') {
      // Add location information if available
      if (orderData.customerLocation?.latitude && orderData.customerLocation?.longitude) {
        const { latitude, longitude } = orderData.customerLocation;
        const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        message += `📍 *موقع العميل (خريطة جوجل):*\n${googleMapsLink}\n\n`;
      }
      
      // Add manual address if provided
      if (orderData.deliveryInfo?.area) {
        message += `🏘️ *المنطقة:* ${orderData.deliveryInfo.area}\n`;
      }
      if (orderData.deliveryInfo?.address) {
        message += `📍 *العنوان:* ${orderData.deliveryInfo.address}\n`;
      }
      if (orderData.deliveryInfo?.notes) {
        message += `📝 *ملاحظات:* ${orderData.deliveryInfo.notes}\n`;
      }
      message += `\n`;
    }
    
    message += `شكراً لاختياركم ${restaurantName}! 🙏`;
    
    // Encode message for URL
    // Clean phone number: remove spaces, dashes, and leading zero
    const cleanPhone = selectedBranch?.phone?.replace(/[\s-]/g, '').replace(/^0/, '') || '';
    const fullPhoneNumber = `218${cleanPhone}`;
    
    console.log('Branch phone:', selectedBranch?.phone);
    console.log('Clean phone:', cleanPhone);
    console.log('Full phone number:', fullPhoneNumber);
    
    // Create WhatsApp URLs for different platforms
    const encodedMessage = encodeURIComponent(message);
    const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${fullPhoneNumber}&text=${encodedMessage}`;
    const whatsappAppUrl = `https://wa.me/${fullPhoneNumber}?text=${encodedMessage}`;
    
    console.log('WhatsApp Web URL:', whatsappWebUrl);
    console.log('WhatsApp App URL:', whatsappAppUrl);
    
    // Detect device type and use appropriate URL
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    let finalUrl = whatsappAppUrl; // Default to app URL
    
    // For iOS devices, try the app URL first, then fallback
    if (isIOS) {
      // Try to open WhatsApp app directly
      const whatsappScheme = `whatsapp://send?phone=${fullPhoneNumber}&text=${encodedMessage}`;
      
      // Create a temporary link to test if WhatsApp app is available
      const tempLink = document.createElement('a');
      tempLink.href = whatsappScheme;
      
      // Try to open WhatsApp app
      try {
        window.location.href = whatsappScheme;
        
        // Fallback to web version after a short delay if app doesn't open
        setTimeout(() => {
          window.open(whatsappWebUrl, '_blank');
        }, 1000);
      } catch (error) {
        // If app scheme fails, use web version
        window.open(whatsappWebUrl, '_blank');
      }
    } else if (isMobile) {
      // For Android and other mobile devices, use app URL
      window.open(whatsappAppUrl, '_blank');
    } else {
      // For desktop, use web version
      window.open(whatsappWebUrl, '_blank');
    }
    
    // Clear cart and close modals
    onClearCart();
    onClose();
    setShowCheckout(false);
  };

  const handleBackToCart = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowCheckout(false);
      setIsAnimating(false);
      setIsTransitioning(false);
      // Trigger cart opening animation after checkout closes
      setTimeout(() => setIsAnimating(true), 10);
    }, 300);
  };

  // Show checkout form
  if (showCheckout) {
    return (
      <CheckoutForm
        total={total}
        itemCount={itemCount}
        items={items}
        onSubmit={handleOrderSubmit}
        onBack={handleBackToCart}
        isTransitioning={isTransitioning}
        selectedBranch={selectedBranch}
      />
    );
  }
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-all duration-300 overflow-hidden ${
      isAnimating ? 'bg-black bg-opacity-50' : 'bg-black bg-opacity-0'
    }`}>
      <div className={`bg-white rounded-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl mx-2 sm:mx-0 flex flex-col transition-all duration-300 transform min-w-0 ${
        isAnimating && !isTransitioning
          ? 'scale-100 opacity-100 translate-y-0'
          : isTransitioning
          ? 'scale-95 opacity-0 translate-x-8'
          : 'scale-95 opacity-0 translate-y-4'
      }`}>
        <div className={`text-white p-4 sm:p-6 flex-shrink-0 ${
          selectedBranch?.name?.includes('مستر كريسبي') ? 'bg-[#55421A]' : selectedBranch?.name?.includes('مستر برجريتو') ? 'bg-[#E59F49]' : 'bg-[#781220]'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <ShoppingBag className="w-6 h-6" />
              <h2 className="text-lg sm:text-xl font-bold truncate">سلة التسوق</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-base sm:text-lg">السلة فارغة</p>
              <p className="text-gray-400">أضف بعض العناصر لتبدأ طلبك</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 sm:gap-4 bg-gray-50 p-3 sm:p-4 rounded-xl">
                  <img
                    src={item.image}
                    alt={item.name}
                   className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
                   style={{
                     filter: `brightness(${item.image_brightness || 1.2}) contrast(${item.image_contrast || 1.1})`
                   }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{item.name}</h3>
                    <div className={`text-sm sm:text-base ${selectedBranch?.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'} whitespace-nowrap`}>
                      <span className="font-bold">{Math.round(item.price * item.quantity)}</span>
                      <span className="font-normal text-xs sm:text-sm opacity-70"> د.ل</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                     className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                     className={`w-7 h-7 sm:w-8 sm:h-8 ${selectedBranch?.name?.includes('مستر كريسبي') ? 'bg-[#55421A] hover:bg-[#3d2f12]' : selectedBranch?.name?.includes('مستر برجريتو') ? 'bg-[#E59F49] hover:bg-[#cc8a3d]' : 'bg-[#781220] hover:bg-[#5c0d18]'} text-white rounded-full flex items-center justify-center transition-colors`}
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-700 p-1 transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 sm:p-6 bg-gray-50 mt-auto flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="text-base sm:text-lg font-semibold">المجموع الكلي:</span>
              <div className={`text-xl sm:text-2xl ${selectedBranch?.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'}`}>
                <span className="font-black">{Math.round(total)}</span>
                <span className="font-normal text-lg sm:text-xl opacity-70"> د.ل</span>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4 text-sm sm:text-base">
              <span className="text-gray-600">عدد العناصر: {itemCount}</span>
            </div>
            <button 
              onClick={handleCheckout}
             className={`w-full ${selectedBranch?.name?.includes('مستر كريسبي') ? 'bg-[#55421A] hover:bg-[#3d2f12]' : selectedBranch?.name?.includes('مستر برجريتو') ? 'bg-[#E59F49] hover:bg-[#cc8a3d]' : 'bg-[#781220] hover:bg-[#5c0d18]'} text-white py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95`}
            >
              المتابعة للدفع
            </button>
          </div>
        )}
      </div>
    </div>
  );
};