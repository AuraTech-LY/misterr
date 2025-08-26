import { MenuItem } from '../types';

// Base menu items that can be customized per branch
const baseMenuItems: MenuItem[] = [
  // برجر
  {
    id: '1',
    name: 'برجر المستر الفاخر',
    description: 'لحم بقري مشوي، جبن شيدر، خس، طماطم، صوص خاص',
    price: 25.50,
    image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'برجر',
    popular: true
  },
  {
    id: '2',
    name: 'برجر الدجاج المقرمش',
    description: 'قطعة دجاج مقرمشة، مايونيز، خس، مخلل',
    price: 22.00,
    image: 'https://images.pexels.com/photos/2282532/pexels-photo-2282532.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'برجر'
  },
  {
    id: '3',
    name: 'برجر اللحم المزدوج',
    description: 'قطعتان من اللحم البقري، جبن أمريكي، بصل مكرمل',
    price: 32.00,
    image: 'https://images.pexels.com/photos/3738730/pexels-photo-3738730.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'برجر',
    popular: true
  },
  
  // دجاج
  {
    id: '4',
    name: 'أجنحة الدجاج الحارة',
    description: '8 قطع من أجنحة الدجاج بالصوص الحار',
    price: 28.00,
    image: 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'دجاج',
    popular: true
  },
  {
    id: '5',
    name: 'قطع الدجاج المقرمشة',
    description: '6 قطع دجاج مقرمشة مع صوص الثوم',
    price: 24.50,
    image: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'دجاج'
  },
  {
    id: '6',
    name: 'دجاج مشوي بالأعشاب',
    description: 'نصف دجاجة مشوية مع البهارات والأعشاب',
    price: 35.00,
    image: 'https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'دجاج'
  },

  // مشروبات
  {
    id: '7',
    name: 'كوكا كولا',
    description: 'مشروب غازي منعش - حجم كبير',
    price: 4.50,
    image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'مشروبات'
  },
  {
    id: '8',
    name: 'عصير البرتقال الطبيعي',
    description: 'عصير برتقال طازج 100%',
    price: 8.00,
    image: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'مشروبات'
  },
  {
    id: '9',
    name: 'مياه معدنية',
    description: 'زجاجة مياه معدنية طبيعية',
    price: 2.50,
    image: 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'مشروبات'
  },

  // حلويات
  {
    id: '10',
    name: 'آيس كريم الفانيليا',
    description: 'كوب آيس كريم فانيليا كريمي',
    price: 12.00,
    image: 'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'حلويات'
  },
  {
    id: '11',
    name: 'كيك الشوكولاتة',
    description: 'قطعة كيك شوكولاتة غنية',
    price: 15.00,
    image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'حلويات',
    popular: true
  },
  {
    id: '12',
    name: 'دونتس مزجج',
    description: 'دونتس طازج مع السكر المزجج',
    price: 8.50,
    image: 'https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'حلويات'
  }
];

// Branch-specific menus with different items and prices
export const branchMenus: Record<string, MenuItem[]> = {
  airport: [
    ...baseMenuItems,
    // Airport branch exclusive items
    {
      id: 'airport-1',
      name: 'برجر المسافر الخاص',
      description: 'برجر مميز للمسافرين مع البطاطس والمشروب',
      price: 35.00,
      image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'برجر',
      popular: true
    },
    {
      id: 'airport-2',
      name: 'وجبة سريعة للسفر',
      description: 'وجبة مثالية للمسافرين - ساندويش + عصير + حلوى',
      price: 28.00,
      image: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'دجاج'
    }
  ],
  dollar: [
    ...baseMenuItems.map(item => ({
      ...item,
      // Slightly different prices for dollar district
      price: item.price * 0.95 // 5% discount
    })),
    // Dollar district exclusive items
    {
      id: 'dollar-1',
      name: 'برجر الدولار الذهبي',
      description: 'برجر فاخر مع اللحم المتبل والجبن الذهبي',
      price: 40.00,
      image: 'https://images.pexels.com/photos/3738730/pexels-photo-3738730.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'برجر',
      popular: true
    }
  ],
  balaoun: [
    ...baseMenuItems,
    // Balaoun branch exclusive items
    {
      id: 'balaoun-1',
      name: 'دجاج بلعون المشوي',
      description: 'دجاج مشوي على الطريقة التقليدية مع الأرز',
      price: 32.00,
      image: 'https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'دجاج',
      popular: true
    },
    {
      id: 'balaoun-2',
      name: 'حلوى بلعون التقليدية',
      description: 'حلوى محلية مميزة من منطقة بلعون',
      price: 18.00,
      image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'حلويات'
    }
  ]
};

export const menuData: MenuItem[] = baseMenuItems;