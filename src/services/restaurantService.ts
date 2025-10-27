import { supabase } from '../lib/supabase';
import { Restaurant, RestaurantBranch, RestaurantWithBranches, RestaurantCuisineType } from '../types/restaurant';

// Helper function to convert numeric strings to numbers (PostgreSQL numeric type returns strings)
const processBranch = (branch: any): RestaurantBranch => ({
  ...branch,
  latitude: typeof branch.latitude === 'string' ? parseFloat(branch.latitude) : branch.latitude,
  longitude: typeof branch.longitude === 'string' ? parseFloat(branch.longitude) : branch.longitude,
  delivery_radius_km: typeof branch.delivery_radius_km === 'string' ? parseFloat(branch.delivery_radius_km) : branch.delivery_radius_km,
  min_order_amount: typeof branch.min_order_amount === 'string' ? parseFloat(branch.min_order_amount) : branch.min_order_amount,
  base_delivery_fee: typeof branch.base_delivery_fee === 'string' ? parseFloat(branch.base_delivery_fee) : branch.base_delivery_fee,
});

export const restaurantService = {
  async getAllRestaurants(): Promise<RestaurantWithBranches[]> {
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false });

    if (restaurantsError) {
      console.error('Error fetching restaurants:', restaurantsError);
      throw restaurantsError;
    }

    const restaurantsWithBranches: RestaurantWithBranches[] = [];

    for (const restaurant of restaurants || []) {
      const { data: branches, error: branchesError } = await supabase
        .from('restaurant_branches')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true);

      if (branchesError) {
        console.error('Error fetching branches:', branchesError);
        continue;
      }

      if (branches && branches.length > 0) {
        restaurantsWithBranches.push({
          ...restaurant,
          branches: branches.map(processBranch)
        });
      }
    }

    return restaurantsWithBranches;
  },

  async getRestaurantById(id: string): Promise<RestaurantWithBranches | null> {
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (restaurantError || !restaurant) {
      console.error('Error fetching restaurant:', restaurantError);
      return null;
    }

    const { data: branches, error: branchesError } = await supabase
      .from('restaurant_branches')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true);

    if (branchesError) {
      console.error('Error fetching branches:', branchesError);
      return { ...restaurant, branches: [] };
    }

    return {
      ...restaurant,
      branches: (branches || []).map(processBranch)
    };
  },

  async getRestaurantBySlug(slug: string): Promise<RestaurantWithBranches | null> {
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (restaurantError || !restaurant) {
      console.error('Error fetching restaurant:', restaurantError);
      return null;
    }

    const { data: branches, error: branchesError } = await supabase
      .from('restaurant_branches')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true);

    if (branchesError) {
      console.error('Error fetching branches:', branchesError);
      return { ...restaurant, branches: [] };
    }

    return {
      ...restaurant,
      branches: (branches || []).map(processBranch)
    };
  },

  async getBranchById(branchId: string): Promise<{ restaurant: Restaurant; branch: RestaurantBranch } | null> {
    const { data: branch, error: branchError } = await supabase
      .from('restaurant_branches')
      .select('*')
      .eq('id', branchId)
      .eq('is_active', true)
      .single();

    if (branchError || !branch) {
      console.error('Error fetching branch:', branchError);
      return null;
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', branch.restaurant_id)
      .eq('is_active', true)
      .single();

    if (restaurantError || !restaurant) {
      console.error('Error fetching restaurant:', restaurantError);
      return null;
    }

    // Convert numeric strings to numbers (PostgreSQL numeric type returns strings)
    return { restaurant, branch: processBranch(branch) };
  },

  async getRestaurantsByLocation(latitude: number, longitude: number, radiusKm: number = 50): Promise<RestaurantWithBranches[]> {
    const restaurants = await this.getAllRestaurants();

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const restaurantsWithDistance = restaurants.map(restaurant => {
      const branchesWithDistance = restaurant.branches
        .map(branch => ({
          ...branch,
          distance: calculateDistance(latitude, longitude, branch.latitude, branch.longitude)
        }))
        .filter(branch => branch.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      return {
        ...restaurant,
        branches: branchesWithDistance,
        minDistance: branchesWithDistance.length > 0 ? branchesWithDistance[0].distance : Infinity
      };
    });

    return restaurantsWithDistance
      .filter(r => r.branches.length > 0)
      .sort((a, b) => a.minDistance - b.minDistance) as RestaurantWithBranches[];
  },

  async getRestaurantsByCuisine(cuisineType: string): Promise<RestaurantWithBranches[]> {
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('cuisine_type', cuisineType)
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (restaurantsError) {
      console.error('Error fetching restaurants by cuisine:', restaurantsError);
      throw restaurantsError;
    }

    const restaurantsWithBranches: RestaurantWithBranches[] = [];

    for (const restaurant of restaurants || []) {
      const { data: branches, error: branchesError } = await supabase
        .from('restaurant_branches')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true);

      if (branchesError) {
        console.error('Error fetching branches:', branchesError);
        continue;
      }

      restaurantsWithBranches.push({
        ...restaurant,
        branches: branches || []
      });
    }

    return restaurantsWithBranches;
  },

  async getCuisineTypes(): Promise<RestaurantCuisineType[]> {
    const { data, error } = await supabase
      .from('restaurant_cuisine_types')
      .select('*')
      .order('display_order');

    if (error) {
      console.error('Error fetching cuisine types:', error);
      throw error;
    }

    return data || [];
  },

  async searchRestaurants(query: string): Promise<RestaurantWithBranches[]> {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,cuisine_type.ilike.%${query}%`)
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error searching restaurants:', error);
      throw error;
    }

    const restaurantsWithBranches: RestaurantWithBranches[] = [];

    for (const restaurant of restaurants || []) {
      const { data: branches, error: branchesError } = await supabase
        .from('restaurant_branches')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true);

      if (branchesError) {
        console.error('Error fetching branches:', branchesError);
        continue;
      }

      restaurantsWithBranches.push({
        ...restaurant,
        branches: branches || []
      });
    }

    return restaurantsWithBranches;
  },

  async getBranchOperatingHours(branchId: string) {
    const { data, error } = await supabase
      .from('branch_operating_hours')
      .select('*')
      .eq('branch_id', branchId)
      .order('day_of_week');

    if (error) {
      console.error('Error fetching operating hours:', error);
      throw error;
    }

    return data || [];
  },

  async getOldBranchIdMapping(oldBranchId: string) {
    const { data, error } = await supabase
      .from('branch_id_mapping')
      .select('*')
      .eq('old_branch_id', oldBranchId)
      .single();

    if (error) {
      console.error('Error fetching branch mapping:', error);
      return null;
    }

    return data;
  }
};
