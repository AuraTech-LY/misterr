import { Branch } from '../types';
import { isWithinOperatingHours } from '../utils/timeUtils';

export const branches: Branch[] = [
  {
    id: 'airport',
    name: 'مستر شيش - طريق المطار',
    area: 'طريق المطار',
    address: 'طريق المطار مقابل مدرسة المهاجرين',
    phone: '091-2345678',
    deliveryTime: '25-35 دقيقة',
    isOpen: isWithinOperatingHours()
  },
  {
    id: 'dollar',
    name: 'مستر كرسبي',
    area: 'بلعون',
    address: 'بلعون مقابل جامعة العرب الطبية',
    phone: '091-3456789',
    deliveryTime: '20-30 دقيقة',
    isOpen: isWithinOperatingHours()
  },
  {
    id: 'balaoun',
    name: 'مستر شيش - بلعون',
    area: 'بلعون',
    address: 'بلعون بجوار جامعة العرب الطبية',
    phone: '091-4567890',
    deliveryTime: '30-40 دقيقة',
    isOpen: isWithinOperatingHours()
  }
];