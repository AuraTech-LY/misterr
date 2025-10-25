export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  popular?: boolean;
  image_brightness?: number;
  image_contrast?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface OrderSummary {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface Branch {
  id: string;
  name: string;
  area: string;
  address: string;
  phone: string;
  deliveryTime: string;
  latitude: number;
  longitude: number;
}

export interface Restaurant {
  id: string;
  name: string;
  branches: Branch[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  notes?: string;
}

export interface Order {
  id: string;
  order_number: string;
  branch_id: string;
  restaurant_name: string;
  customer_name: string;
  customer_phone: string;
  delivery_method: 'delivery' | 'pickup';
  delivery_area?: string;
  delivery_address?: string;
  delivery_notes?: string;
  customer_latitude?: number;
  customer_longitude?: number;
  payment_method: 'cash' | 'card';
  items_total: number;
  delivery_price: number;
  total_amount: number;
  status: OrderStatus;
  status_history: StatusHistoryEntry[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  item_name: string;
  item_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// Global window interface for theme color function
declare global {
  interface Window {
    updateThemeColorForRestaurant?: (restaurantName: string) => void;
  }
}