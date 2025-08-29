import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { Branch } from '../types';
import { isWithinOperatingHours } from '../utils/timeUtils';

interface BranchSelectorProps {
  branches: Branch[];
  selectedBranch: Branch | null;
  onBranchSelect: (branch: Branch) => void;
  restaurantName?: string;
  onBackToRestaurants?: () => void;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
  branches,
  selectedBranch,
  onBranchSelect,
  restaurantName,
  onBackToRestaurants,
}) => {
  const isOpen = isWithinOperatingHours();

  const handleBranchSelect = (branch: Branch) => {
    // Update browser theme color based on branch
    if (window.updateThemeColorForRestaurant) {
      window.updateThemeColorForRestaurant(branch.name);
    }
    onBranchSelect(branch);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Simple Header */}
      <div className="bg-white px-6 py-6">
        {onBackToRestaurants && (
          <button
            onClick={onBackToRestaurants}
            className={`flex items-center gap-2 mb-4 ${
              restaurantName?.includes('مستر كريسبي') ? 'text-[#55421A]' : 'text-[#781220]'
            }`}
          >
            <ArrowRight className="w-5 h-5" />
            <span>العودة</span>
          </button>
        )}
        
        <div className="text-center">
          <div className={`w-12 h-12 ${restaurantName?.includes('مستر كريسبي') ? 'bg-[#55421A]' : 'bg-[#781220]'} rounded-xl mx-auto mb-3 flex items-center justify-center`}>
            <img 
              src="/New Element 88 [8BACFE9].png" 
              alt={restaurantName || "المستر"}
              className="w-8 h-8 object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-1">
            {restaurantName || "المستر"}
          </h1>
          <p className="text-gray-600 text-sm">اختر الفرع الأقرب إليك</p>
        </div>
      </div>

      {/* Branch Buttons */}
      <div className="flex-1 px-6 py-6 space-y-6 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:max-w-6xl md:mx-auto">
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => handleBranchSelect(branch)}
            disabled={!isOpen}
            className={`relative w-full p-6 md:p-8 rounded-2xl text-white font-semibold transition-all duration-300 active:scale-[0.98] md:hover:scale-[1.02] overflow-hidden group transform-gpu ${
              branch.name?.includes('مستر كريسبي') 
                ? 'bg-gradient-to-r from-[#55421A] to-[#4a3817]' 
                : 'bg-gradient-to-r from-[#781220] to-[#651018]'
            } ${!isOpen ? 'opacity-50' : 'shadow-2xl hover:shadow-3xl hover:brightness-110 active:brightness-125 active:shadow-inner'} md:min-h-[140px] md:flex md:items-center`}
          >
            {/* Interactive background overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-500 ease-out"></div>
            
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full group-active:translate-x-full transition-transform duration-1000 ease-out"></div>
            
            {/* Subtle accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 group-hover:bg-white/40 group-active:bg-white/60 transition-all duration-300"></div>
            
            {/* Mobile touch ripple effect */}
            <div className="absolute inset-0 bg-white/0 group-active:bg-white/10 transition-all duration-150 ease-out rounded-2xl"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 group-hover:scale-110 group-active:scale-105 group-active:bg-white/30 transition-all duration-300">
                  <MapPin className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div className="text-right md:text-center md:flex-1">
                  <div className="text-xl md:text-2xl font-bold mb-1 group-hover:scale-105 group-active:scale-102 transition-transform duration-300">{branch.name}</div>
                  <div className="text-sm md:text-base opacity-80 font-normal">{branch.area}</div>
                </div>
              </div>
              
              {!isOpen && (
                <div className="bg-black/20 text-white px-3 py-1.5 rounded-full text-sm md:text-base font-medium backdrop-blur-sm">
                  مغلق حالياً
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Status */}
      <div className="px-6 py-6 text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          isOpen 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-gray-100 text-gray-600 border border-gray-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          {isOpen ? 'مفتوح للطلبات الآن' : 'مغلق • يفتح من 11:00 ص إلى 11:59 م'}
        </div>
      </div>
    </div>
  );
};