import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="mb-8">
      <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide px-2 sm:px-0">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full font-semibold whitespace-nowrap transition-all duration-300 text-sm sm:text-base ${
              selectedCategory === category
                ? 'bg-brand-red text-white shadow-lg transform scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg hover:scale-105'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};