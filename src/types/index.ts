export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  popular?: boolean;
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
  isOpen: boolean;
  latitude: number;
  longitude: number;
}

export interface Restaurant {
  id: string;
  name: string;
  branches: Branch[];
}

// Global window interface for theme color function
declare global {
  interface Window {
    updateThemeColorForRestaurant?: (restaurantName: string) => void;
  }
}