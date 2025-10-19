import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Clock, ChevronRight } from 'lucide-react';
import { restaurantService } from '../services/restaurantService';
import { RestaurantWithBranches, RestaurantCuisineType } from '../types/restaurant';

export const RestaurantListPage: React.FC = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<RestaurantWithBranches[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<RestaurantWithBranches[]>([]);
  const [cuisineTypes, setCuisineTypes] = useState<RestaurantCuisineType[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    fetchData();
    getUserLocation();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [restaurants, selectedCuisine, searchQuery, userLocation]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [restaurantsData, cuisineData] = await Promise.all([
        restaurantService.getAllRestaurants(),
        restaurantService.getCuisineTypes()
      ]);
      setRestaurants(restaurantsData);
      setCuisineTypes(cuisineData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

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

  const filterRestaurants = () => {
    let filtered = [...restaurants];

    if (selectedCuisine !== 'all') {
      filtered = filtered.filter(r => r.cuisine_type === selectedCuisine);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.cuisine_type.toLowerCase().includes(query)
      );
    }

    if (userLocation) {
      filtered = filtered.map(restaurant => {
        const branchesWithDistance = restaurant.branches.map(branch => ({
          ...branch,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            branch.latitude,
            branch.longitude
          )
        }));

        const minDistance = Math.min(...branchesWithDistance.map(b => b.distance));

        return {
          ...restaurant,
          branches: branchesWithDistance,
          minDistance
        };
      }).sort((a, b) => (a.minDistance || 0) - (b.minDistance || 0));
    }

    setFilteredRestaurants(filtered);
  };

  const handleRestaurantClick = (restaurant: RestaurantWithBranches) => {
    if (restaurant.branches.length === 1) {
      navigate(`/restaurant/${restaurant.slug}/branch/${restaurant.branches[0].id}`);
    } else {
      navigate(`/restaurant/${restaurant.slug}`);
    }
  };

  const getMinDistance = (restaurant: RestaurantWithBranches): number | null => {
    if (!userLocation || restaurant.branches.length === 0) return null;

    const distances = restaurant.branches.map(branch =>
      calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        branch.latitude,
        branch.longitude
      )
    );

    return Math.min(...distances);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#781220] rounded-xl flex items-center justify-center">
              <img
                src="/New Element 88 [8BACFE9].png"
                alt="Logo"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">المطاعم</h1>
              <p className="text-sm text-gray-600">اكتشف أفضل المطاعم بالقرب منك</p>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث عن مطعم أو نوع طعام..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#781220] focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCuisine('all')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCuisine === 'all'
                  ? 'bg-[#781220] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل
            </button>
            {cuisineTypes.map((cuisine) => (
              <button
                key={cuisine.id}
                onClick={() => setSelectedCuisine(cuisine.name)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedCuisine === cuisine.name
                    ? 'bg-[#781220] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cuisine.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                <div className="flex gap-4 p-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg">لا توجد مطاعم متطابقة</p>
            <p className="text-gray-500 text-sm">جرب البحث بكلمات أخرى</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRestaurants.map((restaurant) => {
              const minDistance = getMinDistance(restaurant);
              return (
                <button
                  key={restaurant.id}
                  onClick={() => handleRestaurantClick(restaurant)}
                  className="w-full bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="flex gap-4 p-4">
                    <div
                      className="w-24 h-24 rounded-xl flex-shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: `${restaurant.primary_color}15` }}
                    >
                      {restaurant.logo_url ? (
                        <img
                          src={restaurant.logo_url}
                          alt={restaurant.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-3xl">🍽️</div>
                      )}
                    </div>
                    <div className="flex-1 text-right">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-1">{restaurant.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-1">{restaurant.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mr-2" />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{restaurant.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {restaurant.branches.length} {restaurant.branches.length === 1 ? 'فرع' : 'فروع'}
                          </span>
                        </div>
                        {minDistance !== null && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <span>{minDistance.toFixed(1)} كم</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          {restaurant.cuisine_type}
                        </span>
                        {restaurant.is_featured && (
                          <span className="text-xs bg-[#781220] bg-opacity-10 text-[#781220] px-2 py-1 rounded-full">
                            مميز
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
