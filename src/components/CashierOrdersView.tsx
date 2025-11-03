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
  pending: { label: 'معلق', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock, nextLabel: 'تأكيد', buttonColor: 'from-amber-600 to-amber-500', activeColor: 'bg-amber-600' },
  confirmed: { label: 'مؤكد', color: 'bg-sky-50 text-sky-800 border-sky-200', icon: CheckCircle, nextLabel: 'بدء التحضير', buttonColor: 'from-sky-600 to-sky-500', activeColor: 'bg-sky-600' },
  preparing: { label: 'قيد التحضير', color: 'bg-violet-50 text-violet-800 border-violet-200', icon: Package, nextLabel: 'جاهز', buttonColor: 'from-violet-600 to-violet-500', activeColor: 'bg-violet-600' },
  ready: { label: 'جاهز', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle, nextLabel: 'في الطريق', buttonColor: 'from-emerald-600 to-emerald-500', activeColor: 'bg-emerald-600' },
  out_for_delivery: { label: 'في الطريق', color: 'bg-cyan-50 text-cyan-800 border-cyan-200', icon: Truck, nextLabel: 'مكتمل', buttonColor: 'from-cyan-600 to-cyan-500', activeColor: 'bg-cyan-600' },
  completed: { label: 'مكتمل', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: CheckCircle, nextLabel: '', buttonColor: 'from-slate-600 to-slate-500', activeColor: 'bg-slate-600' },
  cancelled: { label: 'ملغي', color: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle, nextLabel: '', buttonColor: 'from-rose-600 to-rose-500', activeColor: 'bg-rose-600' },
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
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [notificationOrder, setNotificationOrder] = useState<Order | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    fetchOrders();
    subscribeToOrders();
    requestNotificationPermission();

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
          showOnScreenNotification(newOrder);
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
      audioRef.current.play().catch(err => {
        console.log('Could not play audio file, using beep:', err);
        playBeepSound();
      });
    } else {
      playBeepSound();
    }
  };

  const playBeepSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);

      setTimeout(() => {
        const oscillator2 = ctx.createOscillator();
        const gainNode2 = ctx.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(ctx.destination);
        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';
        gainNode2.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator2.start(ctx.currentTime);
        oscillator2.stop(ctx.currentTime + 0.5);
      }, 200);
    } catch (err) {
      console.error('Could not play beep sound:', err);
    }
  };

  const showNotification = (order: Order) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🔔 طلب جديد!', {
        body: `طلب رقم ${order.order_number} من ${order.customer_name}\nالمجموع: ${order.total_amount.toFixed(0)} د.ل`,
        icon: '/favicon.ico',
        tag: order.id,
        requireInteraction: true,
        vibrate: [200, 100, 200],
      });

      notification.onclick = () => {
        window.focus();
        setSelectedOrder(order);
        notification.close();
      };
    }
  };

  const showOnScreenNotification = (order: Order) => {
    setNotificationOrder(order);
    setShowNotificationBanner(true);
    setTimeout(() => {
      setShowNotificationBanner(false);
    }, 8000);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('✅ Notification permission granted');
        } else if (permission === 'denied') {
          console.warn('⚠️ Notification permission denied');
        }
      } catch (err) {
        console.error('Error requesting notification permission:', err);
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
          <p className="text-slate-600">جاري تحميل الطلبات...</p>
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
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* On-Screen Notification Banner */}
      {showNotificationBanner && notificationOrder && (
        <div className="fixed top-20 left-4 right-4 z-50 animate-slide-down">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-4 border-2 border-emerald-400">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-6 h-6 animate-bounce" />
                  <h3 className="text-xl font-black">طلب جديد!</h3>
                </div>
                <p className="text-lg font-bold mb-1">{notificationOrder.order_number}</p>
                <p className="text-sm opacity-90">{notificationOrder.customer_name}</p>
                <p className="text-sm opacity-90">{notificationOrder.customer_phone}</p>
                <p className="text-2xl font-black mt-2">{notificationOrder.total_amount.toFixed(0)} د.ل</p>
              </div>
              <button
                onClick={() => {
                  setShowNotificationBanner(false);
                  setSelectedOrder(notificationOrder);
                }}
                className="bg-white text-emerald-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors"
              >
                عرض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-Optimized Sticky Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
        <div className="px-3 py-3">
          {/* Top Row - Title and Count */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-2 rounded-lg">
                <Bell className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">الطلبات المباشرة</h1>
                <p className="text-xs text-slate-500">{filteredOrders.length} طلب نشط</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-slate-100 rounded-lg active:bg-slate-200 transition-colors"
                title={isFullscreen ? 'خروج' : 'ملء الشاشة'}
              >
                {isFullscreen ? <Minimize className="w-5 h-5 text-slate-700" /> : <Maximize className="w-5 h-5 text-slate-700" />}
              </button>
              <button
                onClick={fetchOrders}
                className="p-2 bg-slate-800 rounded-lg active:bg-slate-900 transition-colors"
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
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap text-xs flex-shrink-0 transition-colors ${
                filterStatus === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap text-xs flex-shrink-0 transition-colors ${
                filterStatus === 'active' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              النشطة
            </button>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap text-xs flex-shrink-0 transition-colors ${
                  filterStatus === status ? config.activeColor + ' text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List - Optimized for Touch */}
      <div className="p-3 space-y-3 bg-slate-50">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">لا توجد طلبات</p>
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
                className={`bg-white rounded-xl shadow-sm border-2 p-4 transition-all hover:shadow-md ${
                  isNew
                    ? 'border-emerald-400 shadow-emerald-100 animate-pulse'
                    : 'border-slate-200'
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{order.order_number}</h3>
                    <p className="text-sm text-slate-600">{order.restaurant_name}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusConfig.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{statusConfig.label}</span>
                  </span>
                </div>

                {/* Customer Info - Compact */}
                <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-800">{order.customer_name}</span>
                    <a
                      href={`tel:${order.customer_phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-slate-700 bg-slate-200 px-2 py-1 rounded-lg font-medium text-xs hover:bg-slate-300 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>اتصال</span>
                    </a>
                  </div>
                  <p className="text-xs text-slate-600">{order.customer_phone}</p>
                  {order.delivery_method === 'delivery' && order.delivery_area && (
                    <p className="text-xs text-slate-600 mt-1">📍 {order.delivery_area}</p>
                  )}
                  {order.delivery_method === 'pickup' && (
                    <p className="text-xs text-slate-700 font-semibold mt-1 bg-slate-200 inline-block px-2 py-0.5 rounded">🏪 استلام من الفرع</p>
                  )}
                </div>

                {/* Items Count & Total - Prominent */}
                <div className="flex items-center justify-between mb-3 p-3 bg-slate-100 rounded-lg border border-slate-200">
                  <div>
                    <p className="text-xs text-slate-600">المجموع</p>
                    <p className="text-2xl font-black text-slate-900">{order.total_amount.toFixed(0)} <span className="text-base font-normal text-slate-600">د.ل</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">العناصر</p>
                    <p className="text-lg font-bold text-slate-800">{items.length}</p>
                  </div>
                </div>

                {/* Time */}
                <p className="text-xs text-slate-500 mb-3">
                  ⏰ {new Date(order.created_at).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}
                </p>

                {/* Action Button - Large Touch Target */}
                {nextStatus && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, nextStatus);
                    }}
                    className={`w-full py-3.5 bg-gradient-to-r ${STATUS_CONFIG[nextStatus].buttonColor} text-white rounded-xl font-bold text-base active:scale-98 transform transition-all shadow-sm hover:shadow-md`}
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
                    className="w-full mt-2 py-2.5 border-2 border-rose-600 text-rose-600 rounded-xl font-semibold text-sm active:scale-98 transform transition-all hover:bg-rose-50"
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
              <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
            </div>

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedOrder.order_number}</h3>
                  <p className="text-sm text-slate-600">{selectedOrder.restaurant_name}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-slate-400" />
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
              <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-2">معلومات العميل</h4>
                <p className="text-lg font-semibold text-slate-900">{selectedOrder.customer_name}</p>
                <a href={`tel:${selectedOrder.customer_phone}`} className="text-slate-700 font-medium flex items-center gap-2 mt-1 hover:text-slate-900 transition-colors">
                  <Phone className="w-4 h-4" />
                  {selectedOrder.customer_phone}
                </a>
                {selectedOrder.delivery_method === 'delivery' && selectedOrder.delivery_area && (
                  <p className="text-sm text-slate-600 mt-2">📍 {selectedOrder.delivery_area}</p>
                )}
              </div>

              {/* Items */}
              <div className="mb-4">
                <h4 className="font-bold text-slate-800 mb-3">العناصر</h4>
                <div className="space-y-2">
                  {(orderItems[selectedOrder.id] || []).map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-medium text-slate-800">
                        {item.quantity}x {item.item_name}
                      </span>
                      <span className="font-bold text-slate-900">{item.subtotal.toFixed(0)} د.ل</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="mb-6 p-4 bg-slate-100 rounded-xl border-2 border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-800">المجموع الكلي</span>
                  <span className="text-3xl font-black text-slate-900">{selectedOrder.total_amount.toFixed(0)} <span className="text-xl text-slate-600">د.ل</span></span>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-slate-600">
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
                    className={`w-full py-4 bg-gradient-to-r ${STATUS_CONFIG[nextStatus].buttonColor} text-white rounded-xl font-bold text-lg active:scale-98 transform transition-all shadow-sm hover:shadow-md`}
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
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.4s ease-out;
        }
      `}} />
    </div>
  );
};
