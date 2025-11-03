import React, { useState, useEffect, useRef } from 'react';
import { Bell, RefreshCw, Package, Clock, CheckCircle, XCircle, Truck, AlertCircle, Maximize, Minimize } from 'lucide-react';
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
  pending: { label: 'معلق', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'مؤكد', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  preparing: { label: 'قيد التحضير', color: 'bg-purple-100 text-purple-700', icon: Package },
  ready: { label: 'جاهز', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  out_for_delivery: { label: 'في الطريق', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  completed: { label: 'مكتمل', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export const CashierOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
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
          await fetchOrderItems(newOrder.id);
          playNotificationSound();
          showNotification(newOrder);
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

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      alert('حدث خطأ في تفعيل وضع ملء الشاشة');
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('المتصفح الخاص بك لا يدعم الإشعارات');
      return;
    }

    if (Notification.permission === 'granted') {
      alert('الإشعارات مفعلة بالفعل! ✅');
      return;
    }

    if (Notification.permission === 'denied') {
      alert('الإشعارات محظورة. يرجى تفعيلها من إعدادات المتصفح:\n\n1. انقر على أيقونة القفل بجانب عنوان الموقع\n2. ابحث عن "الإشعارات" أو "Notifications"\n3. اختر "السماح" أو "Allow"');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('تم تفعيل الإشعارات بنجاح! ✅');
        new Notification('طلبات مباشرة', {
          body: 'سيتم إشعارك بالطلبات الجديدة',
          icon: '/favicon.ico',
        });
      } else {
        alert('تم رفض الإشعارات. يمكنك تفعيلها لاحقاً من إعدادات المتصفح.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('حدث خطأ في طلب إذن الإشعارات');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
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
    <div className="space-y-6" dir="rtl">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">الطلبات المباشرة</h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            {filteredOrders.length} طلب
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            <span>{isFullscreen ? 'عادي' : 'ملء الشاشة'}</span>
          </button>
          <button
            onClick={requestNotificationPermission}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            تفعيل الإشعارات
          </button>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          الكل
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filterStatus === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          النشطة
        </button>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === status
                ? config.color
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOrders.map(order => {
          const statusConfig = STATUS_CONFIG[order.status];
          const StatusIcon = statusConfig.icon;
          const nextStatus = getNextStatus(order.status);
          const items = orderItems[order.id] || [];

          return (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-md border-2 border-gray-200 hover:shadow-lg transition-shadow p-4"
            >
              {/* Order Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{order.order_number}</h3>
                  <p className="text-sm text-gray-600">{order.restaurant_name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${statusConfig.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig.label}
                </span>
              </div>

              {/* Customer Info */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-800">{order.customer_name}</p>
                <p className="text-sm text-gray-600">{order.customer_phone}</p>
                {order.delivery_method === 'delivery' && (
                  <p className="text-sm text-gray-600 mt-1">
                    {order.delivery_area} - {order.delivery_address}
                  </p>
                )}
                {order.delivery_method === 'pickup' && (
                  <p className="text-sm text-blue-600 font-semibold mt-1">استلام من الفرع</p>
                )}
              </div>

              {/* Order Items */}
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">العناصر:</p>
                <div className="space-y-1">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.quantity}x {item.item_name}
                      </span>
                      <span className="text-gray-600">{item.subtotal.toFixed(2)} د.ل</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="mb-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">المجموع الفرعي:</span>
                  <span className="text-gray-700">{order.items_total.toFixed(2)} د.ل</span>
                </div>
                {order.delivery_price > 0 && (
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">التوصيل:</span>
                    <span className="text-gray-700">{order.delivery_price.toFixed(2)} د.ل</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-gray-800">المجموع:</span>
                  <span className="text-gray-900">{order.total_amount.toFixed(2)} د.ل</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  الدفع: {order.payment_method === 'cash' ? 'نقداً' : 'بطاقة'}
                </p>
              </div>

              {/* Time */}
              <p className="text-xs text-gray-500 mb-3">
                {new Date(order.created_at).toLocaleString('ar-LY')}
              </p>

              {/* Actions */}
              {nextStatus && (
                <button
                  onClick={() => updateOrderStatus(order.id, nextStatus)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  تحويل إلى: {STATUS_CONFIG[nextStatus].label}
                </button>
              )}
              {order.status === 'pending' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'cancelled')}
                  className="w-full mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  إلغاء الطلب
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">لا توجد طلبات</p>
        </div>
      )}
    </div>
  );
};
