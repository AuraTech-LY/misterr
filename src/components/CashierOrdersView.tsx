import React, { useState, useEffect, useRef } from 'react';
import { Bell, RefreshCw, Package, Clock, CheckCircle, XCircle, Truck, AlertCircle, Phone } from 'lucide-react';
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
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [notificationOrder, setNotificationOrder] = useState<Order | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isClosing, setIsClosing] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    console.log('🚀 CashierOrdersView mounted, initializing...');

    const initializeView = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 Session check:', session?.user?.email || 'Not authenticated');

      await fetchOrders();
      subscribeToOrders();
      requestNotificationPermission();
    };

    initializeView();

    return () => {
      console.log('🛑 CashierOrdersView unmounting, cleaning up...');
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
    console.log('📶 Setting up realtime subscription...');
    const channel = supabase
      .channel('orders-realtime-channel', {
        config: {
          broadcast: { self: true },
          presence: { key: 'cashier' },
        },
      })
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
      .subscribe(async (status, err) => {
        console.log('📡 Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to real-time orders');
          console.log('📊 Listening for:', {
            orders: 'INSERT, UPDATE',
            order_items: 'INSERT, UPDATE'
          });
          const { data: { session } } = await supabase.auth.getSession();
          console.log('🔑 User authenticated:', session?.user?.email || 'Not authenticated');
          console.log('🌐 WebSocket URL:', import.meta.env.VITE_SUPABASE_URL?.replace('https://', 'wss://') + '/realtime/v1');
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to real-time orders:', err);
          setRealtimeStatus('disconnected');
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Real-time subscription timed out');
          console.log('🔄 Attempting to reconnect...');
          setRealtimeStatus('disconnected');
          setTimeout(() => {
            if (channelRef.current) {
              channelRef.current.unsubscribe();
            }
            subscribeToOrders();
          }, 5000);
        } else if (status === 'CLOSED') {
          console.warn('🔌 Real-time connection closed');
          setRealtimeStatus('disconnected');
        }
      });

    channelRef.current = channel;
    return channel;
  };

  const handleCloseDrawer = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedOrder(null);
      setIsClosing(false);
      setDragOffset(0);
    }, 300);
  };

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStartY === null) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = clientY - dragStartY;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleDragEnd = () => {
    if (dragOffset > 150) {
      handleCloseDrawer();
    } else {
      setDragOffset(0);
    }
    setDragStartY(null);
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

      {/* On-Screen Notification Banner - Always on top */}
      {showNotificationBanner && notificationOrder && (
        <div
          className="fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100%-2rem)] max-w-md animate-slide-down pointer-events-auto"
          style={{ zIndex: 10000 }}
        >
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-5 border-4 border-emerald-300 drop-shadow-2xl">
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
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
        <div className="px-3 py-3">
          {/* Top Row - Title and Count */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-2 rounded-lg relative">
                <Bell className="w-5 h-5 text-slate-700" />
                {realtimeStatus === 'connected' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse border-2 border-white" title="متصل مباشرة"></div>
                )}
                {realtimeStatus === 'disconnected' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" title="غير متصل"></div>
                )}
                {realtimeStatus === 'connecting' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse border-2 border-white" title="جاري الاتصال"></div>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">الطلبات المباشرة</h1>
                <p className="text-xs text-slate-500">
                  {filteredOrders.length} طلب نشط
                  {realtimeStatus === 'connected' && ' • متصل'}
                  {realtimeStatus === 'disconnected' && ' • غير متصل'}
                  {realtimeStatus === 'connecting' && ' • جاري الاتصال...'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
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
      <div className="p-2 space-y-2 bg-slate-50">
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
                className={`bg-white rounded-lg shadow-sm border-2 p-3 transition-all hover:shadow-md cursor-pointer ${
                  isNew
                    ? 'border-emerald-400 shadow-emerald-100 animate-pulse'
                    : 'border-slate-200'
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                {/* Header: Order ID, Time, Status */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{order.order_number}</h3>
                    <span className="text-xs text-slate-500">⏰ {new Date(order.created_at).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 flex-shrink-0 ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                  </span>
                </div>

                {/* Mini Receipt: Items Preview */}
                <div className="mb-2 space-y-1">
                  {items.slice(0, 3).map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-slate-700 truncate flex-1">{item.quantity}x {item.item_name}</span>
                      <span className="text-slate-600 font-medium ml-2">{item.subtotal.toFixed(0)}</span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className="text-xs text-slate-500 italic">... و {items.length - 3} عناصر أخرى</div>
                  )}
                </div>

                {/* Order Info: Type, Payment, Delivery Area */}
                <div className="flex items-center gap-2 mb-2 text-xs flex-wrap">
                  <span className={`px-2 py-0.5 rounded font-semibold ${
                    order.delivery_method === 'pickup'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-sky-100 text-sky-800'
                  }`}>
                    {order.delivery_method === 'pickup' ? '🏪 استلام' : '🚚 توصيل'}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-semibold ${
                    order.payment_method === 'cash'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {order.payment_method === 'cash' ? '💵 نقداً' : '💳 بطاقة'}
                  </span>
                  {order.delivery_method === 'delivery' && order.delivery_area && (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold truncate max-w-[140px]">
                      📍 {order.delivery_area}
                    </span>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between mb-2 pt-2 border-t border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">المجموع:</span>
                  <span className="text-lg font-black text-slate-900">{order.total_amount.toFixed(0)} <span className="text-xs font-normal text-slate-600">د.ل</span></span>
                </div>

                {/* Action Button - Compact */}
                {nextStatus && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, nextStatus);
                    }}
                    className={`w-full py-2 bg-gradient-to-r ${STATUS_CONFIG[nextStatus].buttonColor} text-white rounded-lg font-bold text-sm active:scale-98 transform transition-all shadow-sm hover:shadow-md`}
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
                    className="w-full mt-1.5 py-1.5 border border-rose-600 text-rose-600 rounded-lg font-semibold text-xs active:scale-98 transform transition-all hover:bg-rose-50"
                  >
                    ✕ إلغاء
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
          className="fixed inset-0 bg-black z-50 flex items-end transition-all duration-300 ease-out"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${isClosing ? 0 : 0.5})`,
            opacity: isClosing ? 0 : 1
          }}
          onClick={handleCloseDrawer}
        >
          <div
            className="bg-white w-full rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto transition-all duration-300 ease-out touch-none"
            style={{
              transform: `translateY(${isClosing ? '100%' : `${dragOffset}px`})`,
              animation: isClosing ? 'none' : 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            {/* Drag Handle */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onTouchStart={handleDragStart}
              onMouseDown={handleDragStart}
            >
              <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
            </div>

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedOrder.order_number}</h3>
                </div>
                <button
                  onClick={handleCloseDrawer}
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
