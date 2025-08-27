import React from 'react';
import { MenuItem } from './MenuItem';
import { MenuItem as MenuItemType } from '../types';

interface MenuProps {
  items: MenuItemType[];
  onAddToCart: (item: MenuItemType) => void;
  brandColors?: {
    primary: string;
    dark: string;
  };
}

export const Menu: React.FC<MenuProps> = ({ items, onAddToCart, brandColors }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
      {items.map((item) => (
        <MenuItem
          key={item.id}
          item={item}
          onAddToCart={onAddToCart}
          brandColors={brandColors}
        />
      ))}
    </div>
  );
};