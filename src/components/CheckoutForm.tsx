import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Truck, Store, ArrowRight } from 'lucide-react';
import { CartItem } from '../types';
import { CustomSelect } from './CustomSelect';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface CheckoutFormProps {
  total: number;
  itemCount: number;
  items: CartItem[];
  onSubmit: (orderData: OrderData, cartItems: CartItem[]) => void;
  onBack: () => void;
  isTransitioning?: boolean;
  selectedBranch?: any;
}

interface OrderData {
  customerInfo: {
    name: string;
    phone: string;
  };
  deliveryMethod: 'delivery' | 'pickup';
  deliveryInfo?: {
    address: string;
    area: string;
    notes?: string;
  };
  customerLocation?: {
    latitude: number;
    longitude: number;
  };
  paymentMethod: 'cash' | 'card';
  preferredTime: 'now' | 'later';
  scheduledTime?: string;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  total, 
  itemCount, 
  items, 
  onSubmit, 
  onBack, 
  isTransitioning = false,
  selectedBranch
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OrderData>({
    customerInfo: { name: '', phone: '' },
    deliveryMethod: 'delivery',
    paymentMethod: 'cash',
    preferredTime: 'now'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [customerLocation, setCustomerLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [deliveryPrice, setDeliveryPrice] = useState<number | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  // Smart defaults based on common patterns
  const popularAreas = ['المدينة القديمة', 'الحدائق', 'الجامعة', 'السوق المركزي', 'الكورنيش'];
  
  // Handle geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('الموقع الجغرافي غير مدعوم في هذا المتصفح. يرجى استخدام متصفح يدعم تحديد الموقع.');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = { latitude, longitude };
        
        setCustomerLocation(location);
        setFormData(prev => ({
          ...prev,
          customerLocation: location
        }));
        setIsLocating(false);
        setLocationError(''); // Clear any previous errors on success
        
        // Calculate road distance if branch coordinates are available
        if (selectedBranch?.latitude && selectedBranch?.longitude) {
          calculateRoadDistance(selectedBranch.latitude, selectedBranch.longitude, latitude, longitude);
        }
      },
      (error) => {
        setIsLocating(false);
        setCustomerLocation(null);
        setFormData(prev => ({
          ...prev,
          customerLocation: undefined
        }));
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('تم رفض الوصول للموقع. يرجى السماح بالوصول للموقع لإتمام الطلب');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('الموقع غير متاح. يرجى المحاولة مرة أخرى');
            break;
          case error.TIMEOUT:
            setLocationError('انتهت مهلة تحديد الموقع. يرجى المحاولة مرة أخرى');
            break;
          default:
            setLocationError('حدث خطأ في تحديد الموقع. يرجى المحاولة مرة أخرى');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Calculate road distance using Geoapify Routing API
  const calculateRoadDistance = async (branchLat: number, branchLon: number, customerLat: number, customerLon: number) => {
    try {
      setIsCalculatingDistance(true);
      console.log(`Calculating route from branch (${branchLat}, ${branchLon}) to customer (${customerLat}, ${customerLon})`);
      
      const { data, error } = await supabase.functions.invoke('geoapify-distance', {
        body: { 
          origin_lat: branchLat,
          origin_lon: branchLon,
          destination_lat: customerLat,
          destination_lon: customerLon
        }
      });

      if (error) {
        console.warn("Distance calculation service unavailable:", error);
        setDeliveryPrice(null);
        return;
      }

      if (data && typeof data.distance_km === 'number') {
        // Calculate delivery price: floor of distance with minimum 5 د.ل
        const priceFromDistance = Math.max(Math.floor(data.distance_km), 5);
        setDeliveryPrice(priceFromDistance);
        console.log(`Distance calculated: ${data.distance_km} km`);
      } else {
        console.warn("No distance data available:", data);
        setDeliveryPrice(null);
      }
    } catch (error) {
      console.warn('Distance calculation service unavailable:', error);
      setDeliveryPrice(null);
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'الاسم مطلوب';
        } else if (value.trim().length < 2) {
          newErrors.name = 'الاسم قصير جداً';
        } else {
          delete newErrors.name;
        }
        break;
      case 'phone':
        const phoneRegex = /^(091|092|093|094|095)\d{7}$/;
        if (!value) {
          newErrors.phone = 'رقم الهاتف مطلوب';
        } else if (!phoneRegex.test(value)) {
          newErrors.phone = 'رقم الهاتف غير صحيح (مثال: 0912345678)';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'address':
        if (formData.deliveryMethod === 'delivery' && !value.trim()) {
          newErrors.address = 'العنوان مطلوب للتوصيل';
        } else if (value.trim().length < 10) {
          newErrors.address = 'يرجى إدخال عنوان مفصل أكثر';
        } else {
          delete newErrors.address;
        }
        break;
      case 'area':
        if (formData.deliveryMethod === 'delivery' && !value.trim()) {
          newErrors.area = 'المنطقة مطلوبة للتوصيل';
        } else if (value.trim().length < 2) {
          newErrors.area = 'يرجى إدخال اسم المنطقة';
        } else {
          delete newErrors.area;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof OrderData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    updateFormData(field, value);
    validateField(field.split('.').pop() || field, value);
  };

  const canProceedToStep2 = () => {
    return formData.customerInfo.name.trim().length >= 2 && 
           /^(091|092|093|094|095)\d{7}$/.test(formData.customerInfo.phone) &&
           formData.deliveryInfo?.area?.trim() &&
           !errors.name && !errors.phone;
  };

  const canSubmit = () => {
    const basicValid = canProceedToStep2();
    if (formData.deliveryMethod === 'delivery') {
      // Require location to be captured for delivery
      const hasLocation = formData.customerLocation?.latitude && formData.customerLocation?.longitude;
      const hasArea = formData.deliveryInfo?.area?.trim();
      
      return basicValid && hasLocation && hasArea;
    }
    return basicValid;
  };

  const handleSubmit = () => {
    setIsValidating(true);
    
    // Final validation
    validateField('name', formData.customerInfo.name);
    validateField('phone', formData.customerInfo.phone);
    validateField('area', formData.deliveryInfo?.area || '');
    if (formData.deliveryMethod === 'delivery') {
    }

    setTimeout(() => {
      if (canSubmit()) {
        // Add delivery price to form data before submitting
        const finalFormData = {
          ...formData,
          deliveryPrice: formData.deliveryMethod === 'delivery' ? deliveryPrice : null
        };
        onSubmit(finalFormData, items);
      }
      setIsValidating(false);
    }, 500);
  };

  const [isAnimating, setIsAnimating] = React.useState(false);

  // Animation on mount
  React.useEffect(() => {
    setTimeout(() => setIsAnimating(true), 10);
  }, []);

  // Auto-format phone number
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers;
    }
    return numbers.slice(0, 10);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className={`max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col mx-2 sm:mx-0 transition-all duration-300 transform ${
        isAnimating && !isTransitioning
          ? 'scale-100 opacity-100 translate-x-0'
          : isTransitioning
          ? 'scale-95 opacity-0 translate-x-8'
          : 'scale-95 opacity-0 -translate-x-8'
      }`}>
        {/* Progress Indicator */}
        <div className={`p-3 sm:p-4 flex-shrink-0 ${
          selectedBranch?.name?.includes('مستر كريسبي') ? 'bg-[#55421A]' : 'bg-[#781220]'
        }`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <h2 className="text-lg sm:text-xl font-bold">إتمام الطلب</h2>
            </div>
            <div className="flex gap-2">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white bg-opacity-30'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white bg-opacity-30'}`} />
            </div>
          </div>
          <div className="mt-2 text-xs sm:text-sm opacity-90 text-white">
            <span>المجموع: </span>
            <span className="font-bold">{Math.round(total)}</span>
            <span className="font-normal text-xs opacity-70"> د.ل</span>
            <span> • {itemCount} عنصر</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Step 1: Customer Info */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeInUp">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#781220]" />
                  معلومات العميل
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="الاسم الكامل"
                      value={formData.customerInfo.name}
                      onChange={(e) => handleInputChange('customerInfo.name', e.target.value)}
                      className={`w-full p-4 border-2 rounded-full text-right transition-all ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#7A1120]'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1 animate-fadeInUp">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="رقم الهاتف (0912345678)"
                        value={formData.customerInfo.phone}
                        onChange={(e) => handleInputChange('customerInfo.phone', formatPhoneNumber(e.target.value))}
                        className={`w-full p-4 pl-12 border-2 rounded-full text-right transition-all ${
                          errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#7A1120]'
                        }`}
                        maxLength={10}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1 animate-fadeInUp">{errors.phone}</p>
                    )}
                    {formData.customerInfo.phone && !errors.phone && (
                      <p className="text-green-600 text-xs sm:text-sm mt-1">✓ رقم صحيح</p>
                    )}
                  </div>

                  <div className="mt-4">
                    <textarea
                      placeholder="أدخل اسم المنطقة أو الحي (مثل: حي السلام، الحدائق، بلعون)"
                      value={formData.deliveryInfo?.area || ''}
                      onChange={(e) => handleInputChange('deliveryInfo.area', e.target.value)}
                      rows={2}
                      className={`w-full p-4 border-2 rounded-xl text-right resize-none transition-all ${
                        errors.area ? 'border-red-300 bg-red-50' : `border-gray-200 focus:border-${selectedBranch?.name?.includes('مستر كريسبي') ? '[#55421A]' : '[#781220]'}`
                      }`}
                    />
                    {errors.area && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1 animate-fadeInUp">{errors.area}</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2()}
                className={`w-full py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all ${
                  canProceedToStep2()
                    ? `${selectedBranch?.name?.includes('مستر كريسبي') ? 'bg-[#55421A] hover:bg-[#3d2f12]' : 'bg-[#781220] hover:bg-[#5c0d18]'} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                التالي
              </button>
            </div>
          )}

          {/* Step 2: Delivery & Payment */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeInUp">
              {/* Delivery Method */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#781220]" />
                  طريقة الاستلام
                </h3>
                
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    onClick={() => updateFormData('deliveryMethod', 'delivery')}
                    className={`p-3 sm:p-4 rounded-full border-2 transition-all ${
                      formData.deliveryMethod === 'delivery'
                        ? 'border-[#55421A] bg-red-50 text-[#55421A]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Truck className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-semibold text-sm sm:text-base">توصيل</div>
                  </button>
                  
                  <button
                    onClick={() => updateFormData('deliveryMethod', 'pickup')}
                    className={`p-3 sm:p-4 rounded-full border-2 transition-all ${
                      formData.deliveryMethod === 'pickup'
                        ? 'border-[#55421A] bg-red-50 text-[#55421A]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Store className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-semibold text-sm sm:text-base">استلام</div>
                  </button>
                </div>
              </div>

              {/* Progressive Disclosure: Delivery Address */}
              {formData.deliveryMethod === 'delivery' && (
                <div className="space-y-4 animate-fadeInUp">
                  {/* Location Detection Card */}
                  {!customerLocation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="text-center">
                        <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-blue-800 mb-2">تحديد موقعك للتوصيل</h4>
                        <p className="text-blue-700 text-sm mb-4">نحتاج لموقعك لحساب سعر التوصيل</p>
                        
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={isLocating}
                          className={`w-full py-3 rounded-full font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                            isLocating
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          }`}
                        >
                          {isLocating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              جاري تحديد الموقع...
                            </>
                          ) : (
                            <>
                              <MapPin className="w-4 h-4" />
                              تحديد موقعي الآن
                            </>
                          )}
                        </button>
                        
                        {locationError && (
                          <div className="mt-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                            <p className="font-semibold mb-1">خطأ في تحديد الموقع:</p>
                            <p>{locationError}</p>
                            <button
                              type="button"
                              onClick={handleGetLocation}
                              className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              المحاولة مرة أخرى
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Summary Invoice */}
                  {customerLocation && (
                    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                      {/* Header */}
                      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                        <div className="text-center">
                          <h3 className="text-lg font-bold text-gray-800 mb-1">ملخص الطلب</h3>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-700 font-medium">تم تحديد الموقع بنجاح</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Receipt Body */}
                      <div className="p-4">
                        {/* Items Line */}
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-300">
                          <span className="text-gray-700 font-medium">المنتجات ({itemCount} عنصر)</span>
                          <div className="text-gray-900">
                            <span className="text-lg font-bold">{Math.round(total)}</span>
                            <span className="text-sm text-gray-600"> د.ل</span>
                          </div>
                        </div>
                        
                        {/* Delivery Line */}
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-300">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Truck className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">سعر التوصيل</span>
                          </div>
                          <div className="text-gray-900">
                            {isCalculatingDistance ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">جاري الحساب...</span>
                              </div>
                            ) : deliveryPrice !== null ? (
                              <>
                                <span className="text-lg font-bold">{deliveryPrice}</span>
                                <span className="text-sm text-gray-600"> د.ل</span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500">غير محدد</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Total Line */}
                        <div className="flex justify-between items-center py-3 mt-2">
                          <span className="text-xl font-bold text-gray-800">المجموع الكلي</span>
                          <div className={`text-xl ${selectedBranch?.name?.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'}`}>
                            <span className="font-black">
                              {deliveryPrice !== null ? Math.round(total + deliveryPrice) : Math.round(total)}
                            </span>
                            <span className="text-lg text-gray-600"> د.ل</span>
                          </div>
                        </div>
                        
                        {/* Footer Note */}
                        <div className="mt-4 pt-3 border-t border-dashed border-gray-300">
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span>سيتم إرسال رابط الموقع مع الطلب</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Area Input - Required */}
                  <div className="mt-4">
                    <textarea
                      placeholder="عنوان مفصل للتوصيل (اسم الشارع، رقم المبنى، معالم مميزة)"
                      value={formData.deliveryInfo?.address || ''}
                      onChange={(e) => handleInputChange('deliveryInfo.address', e.target.value)}
                      rows={3}
                      className={`w-full p-4 border-2 rounded-xl text-right resize-none transition-all ${
                        errors.address ? 'border-red-300 bg-red-50' : `border-gray-200 focus:border-${selectedBranch?.name?.includes('مستر كريسبي') ? '[#55421A]' : '[#781220]'}`
                      }`}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1 animate-fadeInUp">{errors.address}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 rounded-full font-bold hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base"
                >
                  السابق
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit() || isValidating}
                  className={`flex-1 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base transition-all duration-300 ${
                    canSubmit() && !isValidating
                      ? `${selectedBranch?.name?.includes('مستر كريسبي') ? 'bg-[#55421A] hover:bg-[#3d2f12]' : 'bg-[#781220] hover:bg-[#5c0d18]'} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isValidating ? 'جاري المعالجة...' : 'تأكيد الطلب'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};