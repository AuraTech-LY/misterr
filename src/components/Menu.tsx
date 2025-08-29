import React from 'react';
import { MenuItem } from './MenuItem';
import { MenuItem as MenuItemType } from '../types';

interface MenuProps {
  items: MenuItemType[];
  onAddToCart: (item: MenuItemType) => void;
  branchId?: string;
  cartItems?: any[];
  categories?: { id: string; name: string }[];
  selectedCategory?: string;
}

export const Menu: React.FC<MenuProps> = ({ 
  items, 
  onAddToCart, 
  branchId, 
  cartItems = [], 
  categories = [],
  selectedCategory = 'الكل'
}) => {
  // If a specific category is selected, show items in grid
  if (selectedCategory !== 'الكل') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {items.map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            onAddToCart={onAddToCart}
            branchId={branchId}
            cartItems={cartItems}
          />
        ))}
      </div>
    );
  }

  // When showing all categories, group items by category in the admin-defined order
  const groupedItems = categories.reduce((acc, category) => {
    const categoryItems = items.filter(item => item.category === category.name);
    if (categoryItems.length > 0) {
      acc[category.name] = categoryItems;
    }
    return acc;
  }, {} as Record<string, MenuItemType[]>);

  return (
    <div className="space-y-12">
      {categories.map((category) => {
        const categoryItems = groupedItems[category.name];
        if (!categoryItems || categoryItems.length === 0) return null;

        return (
          <div key={category.id} className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl md:text-2xl font-black text-gray-800 mb-2">
                {category.name}
              </h3>
              <div className="w-16 h-1 bg-gradient-to-r from-[#781220] to-[#55421A] mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              {categoryItems.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  onAddToCart={onAddToCart}
                  branchId={branchId}
                  cartItems={cartItems}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};