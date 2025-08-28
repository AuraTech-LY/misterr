import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedRestaurant?: { id: string; name: string };
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedRestaurant,
}) => {
  const brandColor = selectedRestaurant?.name?.includes('مستر كريسبي') ? '#55421A' : '#781220';
  const brandColorHover = selectedRestaurant?.name?.includes('مستر كريسبي') ? '#3d2f12' : '#5c0d18';

  return (
    <div className="mb-8">
      <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide px-2 sm:px-0">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full font-semibold whitespace-nowrap transition-all duration-300 text-sm sm:text-base ${
              selectedCategory === category
                ? `text-white shadow-lg transform scale-105`
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg hover:scale-105'
            }`}
            style={selectedCategory === category ? { backgroundColor: brandColor } : {}}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};