import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Clock, ChevronDown, ChevronUp, Search, Filter, ExternalLink, AlertCircle } from 'lucide-react';
import { OrderWithItems, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import { usePermission } from '../hooks/usePermission';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-[#fcb946]/10 text-[#f5a623]',
  preparing: 'bg-[#fcb946]/20 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
  out_for_delivery: 'في الطريق',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { canViewOrders, canUpdateOrderStatus, canDeleteOrders, loading: permissionLoading } = usePermission();

  useEffect(() => {
    fetchOrders();
    const unsubscribe = orderService.subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const data = await orderService.getOrders();
    setOrders(data);
    setLoading(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!canUpdateOrderStatus()) {
      alert('ليس لديك صلاحية لتحديث حالة الطلب');
      return;
    }

    setUpdatingStatus(orderId);
    const success = await orderService.updateOrderStatus(orderId, newStatus);
    if (success) {
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus }
            : order
        )
      );
    } else {
      alert('حدث خطأ في تحديث حالة الطلب');
    }
    setUpdatingStatus(null);
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesSearch =
      searchTerm === '' ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-LY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    const statusFlow: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['out_for_delivery', 'completed', 'cancelled'],
      out_for_delivery: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    return statusFlow[currentStatus] || [];
  };

  if (permissionLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A1120]"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  if (!canViewOrders()) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center bg-red-50 border-2 border-red-200 rounded-lg p-8">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-2">ليس لديك صلاحية</h3>
          <p className="text-red-600">ليس لديك صلاحية لعرض الطلبات. يرجى التواصل مع المسؤول.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="البحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-full focus:border-[#7A1120] transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OrderStatus | 'all')}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-full focus:border-[#7A1120] transition-all bg-white"
            >
              <option value="all">جميع الطلبات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="confirmed">مؤكد</option>
              <option value="preparing">قيد التحضير</option>
              <option value="ready">جاهز</option>
              <option value="out_for_delivery">في الطريق</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
            <div className="text-xl sm:text-2xl font-bold text-yellow-800">
              {orders.filter(o => o.status === 'pending').length}
            </div>
            <div className="text-xs sm:text-sm text-yellow-600">قيد الانتظار</div>
          </div>
          <div className="bg-[#fcb946]/5 p-3 sm:p-4 rounded-lg sm:rounded-xl">
            <div className="text-xl sm:text-2xl font-bold text-[#f5a623]">
              {orders.filter(o => o.status === 'confirmed' || o.status === 'preparing').length}
            </div>
            <div className="text-xs sm:text-sm text-[#fcb946]">قيد التحضير</div>
          </div>
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
            <div className="text-xl sm:text-2xl font-bold text-green-800">
              {orders.filter(o => o.status === 'ready' || o.status === 'out_for_delivery').length}
            </div>
            <div className="text-xs sm:text-sm text-green-600">جاهز/في الطريق</div>
          </div>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
            <div className="text-xl sm:text-2xl font-bold text-gray-800">
              {orders.filter(o => o.status === 'completed').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">مكتمل</div>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12 text-center">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <p className="text-gray-500 text-base sm:text-lg">لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
              <div
                className="p-3 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800">{order.order_number}</h3>
                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-left">
                      <div className="text-xl sm:text-2xl font-black text-[#7A1120]">
                        {Math.round(order.total_amount)}
                        <span className="text-sm sm:text-base font-normal text-gray-600"> د.ل</span>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">{order.items.length} عناصر</div>
                    </div>
                    {expandedOrderId === order.id ? (
                      <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedOrderId === order.id && (
                <div className="border-t border-gray-200 p-3 sm:p-6 bg-gray-50">
                  <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">معلومات العميل</h4>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-gray-700">الاسم:</span>
                          <span className="text-gray-600">{order.customer_name}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                          <a href={`tel:${order.customer_phone}`} className="text-[#fcb946] hover:underline">
                            {order.customer_phone}
                          </a>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-gray-700">طريقة الاستلام:</span>
                          <span className="text-gray-600">
                            {order.delivery_method === 'delivery' ? 'توصيل' : 'استلام من الفرع'}
                          </span>
                        </div>
                        {order.delivery_method === 'delivery' && (
                          <>
                            {order.delivery_area && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                                <span className="text-gray-600">{order.delivery_area}</span>
                              </div>
                            )}
                            {order.customer_latitude && order.customer_longitude && (
                              <div className="flex items-start gap-2">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${order.customer_latitude},${order.customer_longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#fcb946] hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  عرض الموقع على الخريطة
                                </a>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">تفاصيل الطلب</h4>
                      <div className="space-y-1.5 sm:space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.quantity}x {item.item_name}
                            </span>
                            <span className="font-semibold text-gray-800">
                              {Math.round(item.subtotal)} د.ل
                            </span>
                          </div>
                        ))}
                        <div className="border-t border-gray-300 pt-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">المجموع الجزئي</span>
                            <span className="font-semibold">{Math.round(order.items_total)} د.ل</span>
                          </div>
                          {order.delivery_price > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">التوصيل</span>
                              <span className="font-semibold">{Math.round(order.delivery_price)} د.ل</span>
                            </div>
                          )}
                          <div className="flex justify-between text-base font-bold text-[#7A1120] mt-2">
                            <span>المجموع الكلي</span>
                            <span>{Math.round(order.total_amount)} د.ل</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {getNextStatuses(order.status).length > 0 && (
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-300">
                      <h4 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">تحديث حالة الطلب</h4>
                      <div className="flex flex-wrap gap-2">
                        {getNextStatuses(order.status).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(order.id, status)}
                            disabled={updatingStatus === order.id}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm transition-all ${
                              updatingStatus === order.id
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-[#7A1120] text-white hover:bg-[#5c0d18] shadow-lg hover:shadow-xl transform hover:scale-105'
                            }`}
                          >
                            {updatingStatus === order.id ? 'جاري التحديث...' : `${statusLabels[status]}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
