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
            className="flex items-center gap-2 text-[#781220] mb-4"
          >
            <ArrowRight className="w-5 h-5" />
            <span>العودة</span>
          </button>
        )}
        
        <div className="text-center">
          <div className="w-12 h-12 bg-[#781220] rounded-xl mx-auto mb-3 flex items-center justify-center">
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
      <div className="flex-1 px-6 py-6 space-y-6">
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => handleBranchSelect(branch)}
            disabled={!isOpen}
            className={`relative w-full p-8 rounded-3xl text-white font-bold transition-all duration-300 active:scale-95 overflow-hidden group ${
              branch.name?.includes('مستر كريسبي') 
                ? 'bg-gradient-to-br from-[#55421A] to-[#3d2f12]' 
                : 'bg-gradient-to-br from-[#781220] to-[#5c0d18]'
            } ${!isOpen ? 'opacity-50' : 'shadow-2xl hover:shadow-3xl'}`}
          >
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-20 h-20 rounded-full border border-white/20"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full border border-white/10"></div>
            </div>
            
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative flex items-center justify-center gap-4 mb-3">
              <MapPin className="w-5 h-5" />
              <span className="text-2xl font-black tracking-wide">{branch.name}</span>
            </div>
            <div className="relative text-base opacity-90 font-medium mb-2">
              {branch.area}
            </div>
            {!isOpen && (
              <div className="relative text-sm mt-3 opacity-75 bg-black/20 px-3 py-1 rounded-full inline-block">مغلق حالياً</div>
            )}
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