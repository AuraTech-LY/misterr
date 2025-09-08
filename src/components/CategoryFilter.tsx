import React from 'react';

interface CategoryFilterProps {
  categories: { id: string; name: string }[];
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
  const brandColor = selectedRestaurant?.name?.includes('مستر كريسبي') ? '#55421A' : selectedRestaurant?.name?.includes('مستر برجريتو') ? '#E59F49' : '#781220';
  const brandColorHover = selectedRestaurant?.name?.includes('مستر كريسبي') ? '#3d2f12' : selectedRestaurant?.name?.includes('مستر برجريتو') ? '#cc8a3d' : '#5c0d18';

  // Create ordered category names array, preserving the database order
  const orderedCategoryNames = ['الكل', ...categories.map(cat => cat.name)];
  
  return (
    <div className="mb-8">
      <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide px-4 sm:px-2 py-2">
        {orderedCategoryNames.map((categoryName) => (
          <button
            key={categoryName}
            onClick={() => onCategoryChange(categoryName)}
            className={`px-6 py-3 sm:px-8 sm:py-4 rounded-full font-semibold whitespace-nowrap transition-all duration-300 text-sm sm:text-base ${
              selectedCategory === categoryName
                ? 'text-white shadow-lg transform scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg hover:scale-105'
            }`}
            style={{
              backgroundColor: selectedCategory === categoryName ? brandColor : undefined
            }}
          >
            {categoryName}
          </button>
        ))}
      </div>
    </div>
  );
};