import React, { useState, useEffect, useRef } from 'react';
import { Bell, RefreshCw, Package, Clock, CheckCircle, XCircle, Truck, AlertCircle, Maximize, Minimize, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Order {
  id: string;
  order_number: string;
  branch_id: string;
  restaurant_name: string;
  customer_name: string;
  customer_phone: string;
  delivery_method: 'delivery' | 'pickup';
  delivery_area?: string;
  delivery_address?: string;
  payment_method: 'cash' | 'card';
  items_total: number;
  delivery_price: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  subtotal: number;
}

const STATUS_CONFIG = {
  pending: { label: 'معلق', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock, nextLabel: 'تأكيد' },
  confirmed: { label: 'مؤكد', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: CheckCircle, nextLabel: 'بدء التحضير' },
  preparing: { label: 'قيد التحضير', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Package, nextLabel: 'جاهز' },
  ready: { label: 'جاهز', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle, nextLabel: 'في الطريق' },
  out_for_delivery: { label: 'في الطريق', color: 'bg-indigo-100 text-indigo-700 border-indigo-300', icon: Truck, nextLabel: 'مكتمل' },
  completed: { label: 'مكتمل', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: CheckCircle, nextLabel: '' },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle, nextLabel: '' },
};

export const CashierOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    fetchOrders();
    subscribeToOrders();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setOrders(data || []);

      if (data && data.length > 0) {
        const orderIds = data.map(o => o.id);
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;

        const itemsByOrder: Record<string, OrderItem[]> = {};
        items?.forEach(item => {
          if (!itemsByOrder[item.order_id]) {
            itemsByOrder[item.order_id] = [];
          }
          itemsByOrder[item.order_id].push(item);
        });
        setOrderItems(itemsByOrder);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'فشل في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      if (items) {
        setOrderItems(prev => ({
          ...prev,
          [orderId]: items,
        }));
      }
    } catch (err) {
      console.error('Error fetching order items:', err);
    }
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          console.log('🔔 New order received via realtime:', payload.new);
          const newOrder = payload.new as Order;
          setOrders(prev => [newOrder, ...prev]);
          setNewOrderIds(prev => new Set(prev).add(newOrder.id));
          setTimeout(() => {
            setNewOrderIds(prev => {
              const next = new Set(prev);
              next.delete(newOrder.id);
              return next;
            });
          }, 10000);
          await fetchOrderItems(newOrder.id);
          playNotificationSound();
          showNotification(newOrder);
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('📝 Order updated via realtime:', payload.new);
          const updatedOrder = payload.new as Order;
          setOrders(prev =>
            prev.map(order => (order.id === updatedOrder.id ? updatedOrder : order))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_items',
        },
        (payload) => {
          console.log('🛒 New order item received via realtime:', payload.new);
          const newItem = payload.new as OrderItem;
          setOrderItems(prev => ({
            ...prev,
            [newItem.order_id]: [...(prev[newItem.order_id] || []), newItem],
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'order_items',
        },
        (payload) => {
          console.log('✏️ Order item updated via realtime:', payload.new);
          const updatedItem = payload.new as OrderItem;
          setOrderItems(prev => ({
            ...prev,
            [updatedItem.order_id]: (prev[updatedItem.order_id] || []).map(item =>
              item.id === updatedItem.id ? updatedItem : item
            ),
          }));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to real-time orders');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to real-time orders');
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Real-time subscription timed out');
        } else {
          console.log('📡 Realtime subscription status:', status);
        }
      });

    channelRef.current = channel;
    return channel;
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('Could not play sound:', err));
    }
  };

  const showNotification = (order: Order) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('طلب جديد!', {
        body: `طلب رقم ${order.order_number} من ${order.customer_name}`,
        icon: '/favicon.ico',
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('تم تفعيل الإشعارات بنجاح!');
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(err instanceof Error ? err.message : 'فشل في تحديث حالة الطلب');
    }
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    const statusFlow: Record<Order['status'], Order['status'] | null> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'out_for_delivery',
      out_for_delivery: 'completed',
      completed: null,
      cancelled: null,
    };
    return statusFlow[currentStatus];
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') {
      return !['completed', 'cancelled'].includes(order.status);
    }
    return order.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 font-semibold">خطأ</p>
        </div>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchOrders}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Mobile-Optimized Sticky Header */}
      <div className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
        <div className="px-3 py-3">
          {/* Top Row - Title and Count */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">الطلبات المباشرة</h1>
                <p className="text-xs text-gray-500">{filteredOrders.length} طلب نشط</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-gray-100 rounded-lg active:bg-gray-200"
                title={isFullscreen ? 'خروج' : 'ملء الشاشة'}
              >
                {isFullscreen ? <Minimize className="w-5 h-5 text-gray-700" /> : <Maximize className="w-5 h-5 text-gray-700" />}
              </button>
              <button
                onClick={fetchOrders}
                className="p-2 bg-blue-600 rounded-lg active:bg-blue-700"
              >
                <RefreshCw className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Filter Pills - Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap text-xs flex-shrink-0 ${
                filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap text-xs flex-shrink-0 ${
                filterStatus === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              النشطة
            </button>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap text-xs flex-shrink-0 ${
                  filterStatus === status ? config.color.replace('100', '600').replace('text-', 'text-white ') : 'bg-gray-100 text-gray-700'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List - Optimized for Touch */}
      <div className="p-3 space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد طلبات</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const statusConfig = STATUS_CONFIG[order.status];
            const StatusIcon = statusConfig.icon;
            const nextStatus = getNextStatus(order.status);
            const items = orderItems[order.id] || [];
            const isNew = newOrderIds.has(order.id);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-xl shadow-sm border-2 p-4 transition-all ${
                  isNew
                    ? 'border-green-400 shadow-green-100 animate-pulse'
                    : statusConfig.color.includes('border-') ? statusConfig.color : 'border-gray-200'
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{order.order_number}</h3>
                    <p className="text-sm text-gray-600">{order.restaurant_name}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusConfig.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{statusConfig.label}</span>
                  </span>
                </div>

                {/* Customer Info - Compact */}
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800">{order.customer_name}</span>
                    <a
                      href={`tel:${order.customer_phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-blue-600 font-medium text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      <span>اتصال</span>
                    </a>
                  </div>
                  <p className="text-xs text-gray-600">{order.customer_phone}</p>
                  {order.delivery_method === 'delivery' && order.delivery_area && (
                    <p className="text-xs text-gray-600 mt-1">📍 {order.delivery_area}</p>
                  )}
                  {order.delivery_method === 'pickup' && (
                    <p className="text-xs text-blue-600 font-semibold mt-1">🏪 استلام من الفرع</p>
                  )}
                </div>

                {/* Items Count & Total - Prominent */}
                <div className="flex items-center justify-between mb-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600">المجموع</p>
                    <p className="text-2xl font-black text-blue-600">{order.total_amount.toFixed(0)} د.ل</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">العناصر</p>
                    <p className="text-lg font-bold text-gray-800">{items.length}</p>
                  </div>
                </div>

                {/* Time */}
                <p className="text-xs text-gray-500 mb-3">
                  ⏰ {new Date(order.created_at).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}
                </p>

                {/* Action Button - Large Touch Target */}
                {nextStatus && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, nextStatus);
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold text-base active:scale-98 transform transition-transform shadow-md"
                  >
                    {statusConfig.nextLabel} ←
                  </button>
                )}

                {order.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('هل تريد إلغاء هذا الطلب?')) {
                        updateOrderStatus(order.id, 'cancelled');
                      }
                    }}
                    className="w-full mt-2 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm active:scale-98 transform transition-transform"
                  >
                    ✕ إلغاء الطلب
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Order Details Bottom Sheet */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedOrder.order_number}</h3>
                  <p className="text-sm text-gray-600">{selectedOrder.restaurant_name}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Status */}
              <div className="mb-4">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${STATUS_CONFIG[selectedOrder.status].color}`}>
                  {React.createElement(STATUS_CONFIG[selectedOrder.status].icon, { className: 'w-5 h-5' })}
                  {STATUS_CONFIG[selectedOrder.status].label}
                </span>
              </div>

              {/* Customer */}
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-bold text-gray-800 mb-2">معلومات العميل</h4>
                <p className="text-lg font-semibold text-gray-800">{selectedOrder.customer_name}</p>
                <a href={`tel:${selectedOrder.customer_phone}`} className="text-blue-600 font-medium flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4" />
                  {selectedOrder.customer_phone}
                </a>
                {selectedOrder.delivery_method === 'delivery' && selectedOrder.delivery_area && (
                  <p className="text-sm text-gray-600 mt-2">📍 {selectedOrder.delivery_area}</p>
                )}
              </div>

              {/* Items */}
              <div className="mb-4">
                <h4 className="font-bold text-gray-800 mb-3">العناصر</h4>
                <div className="space-y-2">
                  {(orderItems[selectedOrder.id] || []).map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">
                        {item.quantity}x {item.item_name}
                      </span>
                      <span className="font-bold text-gray-900">{item.subtotal.toFixed(0)} د.ل</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">المجموع الكلي</span>
                  <span className="text-3xl font-black text-blue-600">{selectedOrder.total_amount.toFixed(0)} د.ل</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                  <span>{selectedOrder.payment_method === 'cash' ? '💵 نقداً' : '💳 بطاقة'}</span>
                  {selectedOrder.delivery_price > 0 && (
                    <span>توصيل: {selectedOrder.delivery_price.toFixed(0)} د.ل</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {(() => {
                const nextStatus = getNextStatus(selectedOrder.status);
                return nextStatus && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, nextStatus);
                      setSelectedOrder(null);
                    }}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold text-lg active:scale-98 transform transition-transform shadow-lg"
                  >
                    {STATUS_CONFIG[selectedOrder.status].nextLabel} ←
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}} />
    </div>
  );
};
