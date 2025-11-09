import { supabase } from '../lib/supabase';
import { Order, OrderItem, OrderWithItems, CartItem, OrderStatus } from '../types';

export interface CreateOrderData {
  branchId: string;
  restaurantName: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: 'delivery' | 'pickup';
  deliveryArea?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  customerLatitude?: number;
  customerLongitude?: number;
  paymentMethod: 'cash' | 'card';
  itemsTotal: number;
  deliveryPrice: number;
  totalAmount: number;
  items: CartItem[];
}

export const orderService = {
  async createOrder(orderData: CreateOrderData): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {
    try {
      const itemIds = orderData.items.map(item => item.id);

      const { data: menuItems, error: availabilityError } = await supabase
        .from('menu_items')
        .select('id, name, is_available')
        .in('id', itemIds);

      if (availabilityError) {
        console.error('Error checking item availability:', availabilityError);
        return { success: false, error: 'فشل في التحقق من توفر المنتجات' };
      }

      const unavailableItems = menuItems?.filter(item => !item.is_available) || [];

      if (unavailableItems.length > 0) {
        const itemNames = unavailableItems.map(item => item.name).join('، ');
        return {
          success: false,
          error: `المنتجات التالية غير متوفرة: ${itemNames}`
        };
      }

      const orderNumber = await this.generateOrderNumber();
      const orderId = crypto.randomUUID();

      const orderRecord = {
        id: orderId,
        order_number: orderNumber,
        branch_id: orderData.branchId,
        restaurant_name: orderData.restaurantName,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        delivery_method: orderData.deliveryMethod,
        delivery_area: orderData.deliveryArea,
        delivery_address: orderData.deliveryAddress,
        delivery_notes: orderData.deliveryNotes,
        customer_latitude: orderData.customerLatitude,
        customer_longitude: orderData.customerLongitude,
        payment_method: orderData.paymentMethod,
        items_total: orderData.itemsTotal,
        delivery_price: orderData.deliveryPrice,
        total_amount: orderData.totalAmount,
        status: 'pending' as OrderStatus,
        status_history: [{
          status: 'pending' as OrderStatus,
          timestamp: new Date().toISOString(),
        }],
      };

      console.log('Attempting to insert order:', orderRecord);

      const { error: orderError } = await supabase
        .from('orders')
        .insert([orderRecord]);

      if (orderError) {
        console.error('Error creating order:', orderError);
        console.error('Order data that failed:', orderRecord);
        return { success: false, error: orderError.message };
      }

      console.log('Order created successfully with ID:', orderId);

      const orderItems = orderData.items.map(item => ({
        order_id: orderId,
        menu_item_id: item.id,
        item_name: item.name,
        item_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }));

      console.log('Attempting to insert order items:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        console.error('Order items that failed:', orderItems);
        await supabase.from('orders').delete().eq('id', orderId);
        return { success: false, error: itemsError.message };
      }

      console.log('Order items created successfully');

      return { success: true, orderId: orderId, orderNumber: orderNumber };
    } catch (error) {
      console.error('Error in createOrder:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  async generateOrderNumber(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_order_number');

    if (error || !data) {
      const timestamp = Date.now();
      return `ORD-${timestamp}`;
    }

    return data;
  },

  async getOrders(filters?: {
    branchId?: string;
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<OrderWithItems[]> {
    try {
      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (filters?.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }

      return (data || []).map(order => ({
        ...order,
        items: order.order_items || [],
      }));
    } catch (error) {
      console.error('Error in getOrders:', error);
      return [];
    }
  },

  async getOrderById(orderId: string): Promise<OrderWithItems | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        return null;
      }

      return {
        ...data,
        items: data.order_items || [],
      };
    } catch (error) {
      console.error('Error in getOrderById:', error);
      return null;
    }
  },

  async updateOrderStatus(orderId: string, newStatus: OrderStatus, notes?: string): Promise<boolean> {
    try {
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('status_history')
        .eq('id', orderId)
        .single();

      const statusHistory = currentOrder?.status_history || [];
      statusHistory.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        notes,
      });

      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          status_history: statusHistory,
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      return false;
    }
  },

  async addOrderNote(orderId: string, note: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ notes: note })
        .eq('id', orderId);

      if (error) {
        console.error('Error adding order note:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addOrderNote:', error);
      return false;
    }
  },

  subscribeToOrders(callback: (orders: OrderWithItems[]) => void) {
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        async () => {
          const orders = await this.getOrders();
          callback(orders);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
