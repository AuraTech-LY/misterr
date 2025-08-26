import { Restaurant } from '../types';
import { isWithinOperatingHours } from '../utils/timeUtils';

export const restaurants: Restaurant[] = [
  {
    id: 'mister-shish',
    name: 'مستر شيش',
    branches: [
      {
        id: 'airport',
        name: 'مستر شيش - طريق المطار',
        area: 'طريق المطار',
        address: 'طريق المطار مقابل مدرسة المهاجرين',
        phone: '093-0625795',
        deliveryTime: '25-35 دقيقة',
        isOpen: isWithinOperatingHours()
      },
      {
        id: 'balaoun',
        name: 'مستر شيش - بلعون',
        area: 'بلعون',
        address: 'بلعون بجوار جامعة العرب الطبية',
        phone: '092-0006227',
        deliveryTime: '30-40 دقيقة',
        isOpen: isWithinOperatingHours()
      }
    ]
  },
  {
    id: 'mister-crispy',
    name: 'مستر كريسبي',
    branches: [
      {
        id: 'dollar',
        name: 'مستر كريسبي',
        area: 'بلعون',
        address: 'بلعون مقابل جامعة العرب الطبية',
        phone: '094-2075555',
        deliveryTime: '20-30 دقيقة',
        isOpen: isWithinOperatingHours()
      }
    ]
  }
];

// Helper functions
export const getRestaurantById = (id: string): Restaurant | undefined => {
  return restaurants.find(restaurant => restaurant.id === id);
};

export const getBranchById = (branchId: string): { restaurant: Restaurant; branch: any } | undefined => {
  for (const restaurant of restaurants) {
    const branch = restaurant.branches.find(b => b.id === branchId);
    if (branch) {
      return { restaurant, branch };
    }
  }
  return undefined;
};

export const getAllBranches = () => {
  return restaurants.flatMap(restaurant => restaurant.branches);
};