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

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ total, itemCount, items, onSubmit, onBack, isTransitioning = false }) => {
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
  const [autoDetectedArea, setAutoDetectedArea] = useState('');
  const [showAreaConfirmation, setShowAreaConfirmation] = useState(false);
  const [areaConfirmed, setAreaConfirmed] = useState(false);
  const [manualAreaRequired, setManualAreaRequired] = useState(false);
  const [geoApiLoading, setGeoApiLoading] = useState(false);

  // Smart defaults based on common patterns
  const popularAreas = ['المدينة القديمة', 'الحدائق', 'الجامعة', 'السوق المركزي', 'الكورنيش'];
  
  // Handle geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('الموقع الجغرافي غير مدعوم في هذا المتصفح. يرجى استخدام متصفح يدعم تحديد الموقع.');
      setManualAreaRequired(true);
      return;
    }

    setIsLocating(true);
    setLocationError('');
    setAutoDetectedArea('');
    setShowAreaConfirmation(false);
    setAreaConfirmed(false);

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
        
        // Call Geoapify reverse geocoding via Edge Function
        await reverseGeocode(latitude, longitude);
      },
      (error) => {
        setIsLocating(false);
        setCustomerLocation(null);
        setManualAreaRequired(true);
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

  // Reverse geocoding using Supabase Edge Function
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      setGeoApiLoading(true);
      
      // Try to use Edge Function first, with fallback to manual input
      try {
        const response = await supabase.functions.invoke('geoapify-reverse-geocode', {
          body: { latitude, longitude }
        });

        if (response.error) {
          console.error('Edge function error:', response.error);
          throw new Error(response.error.message || 'Edge function failed');
        }

        if (response.data?.neighborhood) {
          setAutoDetectedArea(response.data.neighborhood);
          setShowAreaConfirmation(true);
          setLocationError('');
          return;
        } else {
          console.log('No neighborhood found in response:', response.data);
          throw new Error('No neighborhood data returned');
        }
      } catch (edgeFunctionError) {
        console.warn('Edge function failed, falling back to manual input:', edgeFunctionError);
        
        // Fallback: Skip auto-detection and go straight to manual input
        setManualAreaRequired(true);
        setLocationError('تم تحديد موقعك بنجاح. يرجى إدخال اسم المنطقة يدوياً.');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setManualAreaRequired(true);
      setLocationError('تم تحديد موقعك بنجاح. يرجى إدخال اسم المنطقة يدوياً.');
    } finally {
      setGeoApiLoading(false);
    }
  };

  // Handle area confirmation
  const handleAreaConfirmation = (confirmed: boolean) => {
    if (confirmed) {
      // User confirmed the auto-detected area
      setFormData(prev => ({
        ...prev,
        deliveryInfo: {
          ...prev.deliveryInfo,
          area: autoDetectedArea
        }
      }));
      setAreaConfirmed(true);
      setShowAreaConfirmation(false);
    } else {
      // User denied the auto-detected area
      setManualAreaRequired(true);
      setShowAreaConfirmation(false);
      setAutoDetectedArea('');
      setFormData(prev => ({
        ...prev,
        deliveryInfo: {
          ...prev.deliveryInfo,
          area: ''
        }
      }));
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
           !errors.name && !errors.phone;
  };

  const canSubmit = () => {
    const basicValid = canProceedToStep2();
    if (formData.deliveryMethod === 'delivery') {
      // Require location to be captured for delivery
      const hasLocation = formData.customerLocation?.latitude && formData.customerLocation?.longitude;
      const hasArea = areaConfirmed || (manualAreaRequired && formData.deliveryInfo?.area?.trim());
      
      return basicValid && hasLocation && hasArea;
    }
    return basicValid;
  };

  const handleSubmit = () => {
    setIsValidating(true);
    
    // Final validation
    validateField('name', formData.customerInfo.name);
    validateField('phone', formData.customerInfo.phone);
    if (formData.deliveryMethod === 'delivery') {
      validateField('area', formData.deliveryInfo?.area || '');
    }

    setTimeout(() => {
      if (canSubmit()) {
        onSubmit(formData, items);
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
        <div className="bg-[#781220] p-3 sm:p-4 flex-shrink-0">
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
            المجموع: {total.toFixed(2)} د.ل • {itemCount} عنصر
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

                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2()}
                className={`w-full py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all ${
                  canProceedToStep2()
                    ? 'bg-[#7A1120] hover:bg-[#5c0d18] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
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
                        ? 'border-[#781220] bg-red-50 text-[#781220]'
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
                        ? 'border-[#781220] bg-red-50 text-[#781220]'
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
                  {/* Mandatory Location Detection */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-red-800 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        تحديد الموقع (مطلوب)
                      </h4>
                      {customerLocation && (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          تم تحديد الموقع
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-3 text-sm text-red-700">
                      <p>⚠️ تحديد الموقع مطلوب لإتمام عملية التوصيل</p>
                    </div>
                    
                    {!customerLocation && (
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
                            {geoApiLoading ? 'جاري تحديد المنطقة...' : 'جاري تحديد الموقع...'}
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4" />
                            تحديد موقعي الآن
                          </>
                        )}
                      </button>
                    )}

                    {/* Area Confirmation Prompt */}
                    {showAreaConfirmation && autoDetectedArea && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 animate-fadeInUp">
                        <div className="text-center">
                          <h4 className="font-semibold text-blue-800 mb-3">تأكيد المنطقة</h4>
                          <p className="text-blue-700 mb-4">
                            هل أنت في <span className="font-bold">{autoDetectedArea}</span>؟
                          </p>
                          <div className="flex gap-3 justify-center">
                            <button
                              type="button"
                              onClick={() => handleAreaConfirmation(true)}
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
                            >
                              نعم
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAreaConfirmation(false)}
                              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
                            >
                              لا
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {customerLocation && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                        <p className="text-green-800 text-sm mb-2">✓ تم تحديد موقعك بنجاح</p>
                        <p className="text-green-600 text-xs">
                          سيتم إرسال رابط خريطة جوجل مع الطلب لتسهيل الوصول إليك
                        </p>
                      </div>
                    )}

                    {locationError && (
                      <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm mt-3">
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
                  
                  {/* Manual Area Input */}
                  {customerLocation && (areaConfirmed || manualAreaRequired) && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {areaConfirmed ? 'المنطقة المؤكدة' : 'المنطقة (مطلوب)'}
                      </label>
                      <textarea
                        placeholder={areaConfirmed ? '' : "أدخل اسم المنطقة أو الحي (مثل: المدينة القديمة، الحدائق، الجامعة)"}
                        value={areaConfirmed ? autoDetectedArea : (formData.deliveryInfo?.area || '')}
                        onChange={(e) => {
                          if (!areaConfirmed) {
                            handleInputChange('deliveryInfo.area', e.target.value);
                          }
                        }}
                        disabled={areaConfirmed}
                        rows={2}
                        className={`w-full p-4 border-2 rounded-xl text-right resize-none transition-all ${
                          errors.area 
                            ? 'border-red-300 bg-red-50' 
                            : areaConfirmed 
                            ? 'border-green-300 bg-green-50 text-green-800' 
                            : 'border-gray-200 focus:border-[#781220]'
                        }`}
                      />
                      {areaConfirmed && (
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-green-600 text-xs sm:text-sm">✓ تم تأكيد المنطقة تلقائياً</p>
                          <button
                            type="button"
                            onClick={() => {
                              setAreaConfirmed(false);
                              setManualAreaRequired(true);
                              setAutoDetectedArea('');
                              setFormData(prev => ({
                                ...prev,
                                deliveryInfo: { ...prev.deliveryInfo, area: '' }
                              }));
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs underline"
                          >
                            تعديل المنطقة
                          </button>
                        </div>
                      )}
                      {errors.area && (
                        <p className="text-red-500 text-xs sm:text-sm mt-1 animate-fadeInUp">{errors.area}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Optional Notes */}
                  {customerLocation && (areaConfirmed || manualAreaRequired) && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ملاحظات إضافية (اختياري)
                      </label>
                      <textarea
                        placeholder="أي ملاحظات إضافية لتسهيل الوصول إليك (مثل: الطابق، رقم الشقة، معالم مميزة)"
                        value={formData.deliveryInfo?.notes || ''}
                        onChange={(e) => handleInputChange('deliveryInfo.notes', e.target.value)}
                        rows={2}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#781220] text-right resize-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 rounded-full font-bold hover:bg-gray-50 transition-all text-sm sm:text-base"
                >
                  السابق
                </button>
                
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit() || isValidating}
                  className={`flex-1 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-lg transition-all ${
                    canSubmit() && !isValidating
                      ? 'bg-[#781220] hover:bg-[#5c0d18] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
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