import React from 'react';
import { X, Minus, Plus, ShoppingBag, CheckCircle } from 'lucide-react';
import { CartItem } from '../types';
import { CheckoutForm } from './CheckoutForm';
import { orderService } from '../services/orderService';
import { useTheme } from '../contexts/ThemeContext';

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
  const { primaryColor } = useTheme();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [showCheckout, setShowCheckout] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [shouldRender, setShouldRender] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [orderNumber, setOrderNumber] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      // Don't prevent scrolling to avoid layout shifts
      // document.body.style.overflow = 'hidden';
    } else {
      // document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      // document.body.style.overflow = 'unset';
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

  const handleOrderSubmit = async (orderData: any, cartItems: CartItem[]) => {
    setIsSubmitting(true);

    try {
      const { unavailableItems, availableItems } = await orderService.checkItemsAvailability(cartItems);

      if (unavailableItems.length > 0) {
        setIsSubmitting(false);
        setUnavailableItemsModal({
          show: true,
          unavailableItems,
          availableItems,
          orderData,
        });
        return;
      }

      await submitOrderWithItems(orderData, cartItems);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(`حدث خطأ في حفظ الطلب: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      setIsSubmitting(false);
    }
  };

  const submitOrderWithItems = async (orderData: any, cartItems: CartItem[]) => {
    setIsSubmitting(true);

    try {
      const restaurantName = selectedBranch?.name?.includes('مستر شيش') ? 'مستر شيش' :
                            selectedBranch?.name?.includes('مستر كريسبي') ? 'مستر كريسبي' :
                            selectedBranch?.name?.includes('مستر برجريتو') ? 'مستر برجريتو' : 'المستر';

      const itemsTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const deliveryPrice = orderData.deliveryMethod === 'delivery' ? (orderData.deliveryPrice || 0) : 0;
      const totalAmount = itemsTotal + deliveryPrice;

      const result = await orderService.createOrder({
        branchId: selectedBranch?.id || 'unknown',
        restaurantName,
        customerName: orderData.customerInfo.name,
        customerPhone: orderData.customerInfo.phone,
        deliveryMethod: orderData.deliveryMethod,
        deliveryArea: orderData.deliveryInfo?.area,
        deliveryAddress: orderData.deliveryInfo?.address,
        deliveryNotes: orderData.deliveryInfo?.notes,
        customerLatitude: orderData.customerLocation?.latitude,
        customerLongitude: orderData.customerLocation?.longitude,
        paymentMethod: orderData.paymentMethod,
        itemsTotal,
        deliveryPrice,
        totalAmount,
        items: cartItems,
      });

      if (result.success && result.orderNumber) {
        setOrderNumber(result.orderNumber);
        setShowCheckout(false);
        setShowSuccessModal(true);
        unavailableItemsModal.unavailableItems.forEach(unavailableItem => {
          onRemoveItem(unavailableItem.id);
        });
        if (cartItems.length === 0) {
          onClearCart();
        }
      } else {
        console.error('Order creation failed:', result.error);
        alert(`حدث خطأ في حفظ الطلب: ${result.error || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(`حدث خطأ في حفظ الطلب: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsSubmitting(false);
    }
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

  // Show unavailable items modal
  if (unavailableItemsModal.show) {
    const { unavailableItems, availableItems, orderData } = unavailableItemsModal;
    const allItemsUnavailable = availableItems.length === 0;

    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-all duration-300 bg-black bg-opacity-50 backdrop-blur-sm`}>
        <div className={`bg-white rounded-2xl max-w-md w-full shadow-2xl mx-2 sm:mx-0 p-6 sm:p-8 animate-fadeInUp`}>
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            {allItemsUnavailable ? 'المنتج غير متوفر' : 'بعض المنتجات غير متوفرة'}
          </h2>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <p className="font-semibold text-orange-800 mb-2">المنتجات غير المتوفرة:</p>
            <ul className="space-y-1">
              {unavailableItems.map(item => (
                <li key={item.id} className="text-orange-700 text-sm">• {item.name}</li>
              ))}
            </ul>
          </div>

          {!allItemsUnavailable && (
            <p className="text-gray-600 text-center mb-6">
              هل تريد إكمال الطلب بالمنتجات المتوفرة فقط؟
            </p>
          )}

          <div className="space-y-3">
            {!allItemsUnavailable && (
              <button
                onClick={() => {
                  setUnavailableItemsModal({ show: false, unavailableItems: [], availableItems: [], orderData: null });
                  submitOrderWithItems(orderData, availableItems);
                }}
                className="w-full py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all text-white shadow-lg hover:shadow-xl transform hover:scale-105 hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                نعم، أكمل الطلب
              </button>
            )}

            <button
              onClick={() => {
                setUnavailableItemsModal({ show: false, unavailableItems: [], availableItems: [], orderData: null });
                setShowCheckout(false);
              }}
              className="w-full py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all border-2 hover:bg-gray-50"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              {allItemsUnavailable ? 'حسناً' : 'إلغاء'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show success modal
  if (showSuccessModal) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-all duration-300 bg-black bg-opacity-50 backdrop-blur-sm`}>
        <div className={`bg-white rounded-2xl max-w-md w-full shadow-2xl mx-2 sm:mx-0 p-6 sm:p-8 text-center animate-fadeInUp`}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">تم استلام طلبك بنجاح!</h2>
          <p className="text-gray-600 mb-4">رقم الطلب</p>
          <div className={`text-3xl font-black mb-6 ${
            selectedBranch?.name?.includes('مستر كريسبي') ? 'text-[#55421A]' :
            selectedBranch?.name?.includes('مستر برجريتو') ? 'text-[#E59F49]' : 'text-[#781220]'
          }`}>
            {orderNumber}
          </div>
          <p className="text-gray-600 mb-6">سيتم التواصل معك قريباً لتأكيد الطلب</p>
          <button
            onClick={() => {
              setShowSuccessModal(false);
              onClose();
            }}
            className="w-full py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all text-white shadow-lg hover:shadow-xl transform hover:scale-105 hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            العودة للقائمة
          </button>
        </div>
      </div>
    );
  }

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
        isSubmitting={isSubmitting}
      />
    );
  }
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-all duration-300 overflow-hidden ${
      isAnimating ? 'bg-black bg-opacity-50 backdrop-blur-sm' : 'bg-black bg-opacity-0 backdrop-blur-none'
    }`}>
      <div className={`bg-white rounded-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl mx-2 sm:mx-0 flex flex-col transition-all duration-300 transform min-w-0 ${
        isAnimating && !isTransitioning
          ? 'scale-100 opacity-100 translate-y-0'
          : isTransitioning
          ? 'scale-95 opacity-0 translate-x-8'
          : 'scale-95 opacity-0 translate-y-4'
      }`}>
        <div className="text-white p-4 sm:p-6 flex-shrink-0" style={{ backgroundColor: primaryColor }}>
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
                    <div className={`text-sm sm:text-base ${selectedBranch?.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : selectedBranch?.name?.includes('مستر برجريتو') ? 'text-[#E59F49]' : 'text-[#781220]'} whitespace-nowrap`}>
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
                     className="w-7 h-7 sm:w-8 sm:h-8 text-white rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                     style={{ backgroundColor: primaryColor }}
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
              <div className={`text-xl sm:text-2xl ${selectedBranch?.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : selectedBranch?.name?.includes('مستر برجريتو') ? 'text-[#E59F49]' : 'text-[#781220]'}`}>
                <span className="font-black">{Math.round(total)}</span>
                <span className="font-normal text-lg sm:text-xl opacity-70"> د.ل</span>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4 text-sm sm:text-base">
              <span className="text-gray-600">عدد العناصر: {itemCount}</span>
            </div>
            <button 
              onClick={handleCheckout}
             className="w-full text-white py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 hover:opacity-90"
             style={{ backgroundColor: primaryColor }}
            >
              المتابعة للدفع
            </button>
          </div>
        )}
      </div>
    </div>
  );
};