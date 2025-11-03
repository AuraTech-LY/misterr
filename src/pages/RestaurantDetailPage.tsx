import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Star } from 'lucide-react';
import { restaurantService } from '../services/restaurantService';
import { RestaurantWithBranches, RestaurantBranch } from '../types/restaurant';

export const RestaurantDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<RestaurantWithBranches | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (slug) {
      fetchRestaurant();
      getUserLocation();
    }
  }, [slug]);

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const data = await restaurantService.getRestaurantBySlug(slug!);
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
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

  const handleBranchSelect = (branch: RestaurantBranch) => {
    navigate(`/restaurant/${slug}/branch/${branch.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#781220]"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">المطعم غير موجود</h1>
          <button
            onClick={() => navigate('/restaurants')}
            className="bg-[#781220] text-white px-6 py-3 rounded-full hover:bg-[#5c0d18] transition-colors"
          >
            العودة إلى قائمة المطاعم
          </button>
        </div>
      </div>
    );
  }

  const branchesWithDistance = restaurant.branches.map(branch => ({
    ...branch,
    distance: userLocation
      ? calculateDistance(userLocation.latitude, userLocation.longitude, branch.latitude, branch.longitude)
      : null
  })).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div
        className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900"
        style={{
          background: restaurant.banner_url
            ? `url(${restaurant.banner_url}) center/cover`
            : `linear-gradient(135deg, ${restaurant.primary_color} 0%, ${restaurant.primary_color}dd 100%)`
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden bg-white shadow-md flex-shrink-0"
            >
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-4xl">🍽️</div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">{restaurant.name}</h1>
              <p className="text-gray-600 mb-2">{restaurant.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{restaurant.rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-600">{restaurant.cuisine_type}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">اختر الفرع</h2>
          <div className="space-y-3">
            {branchesWithDistance.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleBranchSelect(branch)}
                className="w-full bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors text-right"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1">{branch.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{branch.address}</p>
                  </div>
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mr-2" />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    <span>{branch.phone}</span>
                  </div>
                  {branch.distance !== null && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{branch.distance.toFixed(1)} كم</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    التوصيل متاح
                  </span>
                  <span className="text-xs text-gray-600">
                    الحد الأدنى: {branch.min_order_amount} د.ل
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
