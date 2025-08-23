import { Branch } from '../types';
import { isWithinOperatingHours } from '../utils/timeUtils';

export const branches: Branch[] = [
  {
    id: 'airport',
    name: 'فرع طريق المطار',
    area: 'طريق المطار',
    address: 'طريق المطار، بجانب محطة الوقود الليبية',
    phone: '091-2345678',
    deliveryTime: '25-35 دقيقة',
    isOpen: isWithinOperatingHours()
  },
  {
    id: 'dollar',
    name: 'فرع حي الدولار',
    area: 'حي الدولار',
    address: 'حي الدولار، شارع الجمهورية الرئيسي',
    phone: '091-3456789',
    deliveryTime: '20-30 دقيقة',
    isOpen: isWithinOperatingHours()
  },
  {
    id: 'balaoun',
    name: 'فرع بلعون',
    area: 'بلعون',
    address: 'منطقة بلعون، قرب السوق المركزي',
    phone: '091-4567890',
    deliveryTime: '30-40 دقيقة',
    isOpen: isWithinOperatingHours()
  }
];