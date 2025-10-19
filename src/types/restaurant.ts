export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  banner_url: string;
  cuisine_type: string;
  rating: number;
  total_reviews: number;
  is_active: boolean;
  is_featured: boolean;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  primary_color: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantBranch {
  id: string;
  restaurant_id: string;
  name: string;
  area: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  delivery_radius_km: number;
  min_order_amount: number;
  base_delivery_fee: number;
  created_at: string;
  updated_at: string;
}

export interface BranchOperatingHours {
  id: string;
  branch_id: string;
  day_of_week: number;
  opening_time: string;
  closing_time: string;
  is_closed: boolean;
  is_24_hours: boolean;
  created_at: string;
  updated_at: string;
}

export interface RestaurantCuisineType {
  id: string;
  name: string;
  icon: string;
  display_order: number;
  created_at: string;
}

export interface RestaurantWithBranches extends Restaurant {
  branches: RestaurantBranch[];
}
