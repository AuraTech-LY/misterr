import { Branch } from '../types';
import { isWithinOperatingHours } from '../utils/timeUtils';

export const branches: Branch[] = [
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
    id: 'dollar',
    name: 'مستر كريسبي',
    area: 'بلعون',
    address: 'بلعون مقابل جامعة العرب الطبية',
    phone: '094-2075555',
    deliveryTime: '20-30 دقيقة',
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
];