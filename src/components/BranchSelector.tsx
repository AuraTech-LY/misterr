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
      <div className="flex-1 px-6 py-4 space-y-3">
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => onBranchSelect(branch)}
            disabled={!isOpen}
            className={`w-full p-4 rounded-2xl text-white font-bold transition-all active:scale-95 ${
              branch.name?.includes('مستر كريسبي') 
                ? 'bg-[#55421A]' 
                : 'bg-[#781220]'
            } ${!isOpen ? 'opacity-50' : 'shadow-lg'}`}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <MapPin className="w-5 h-5" />
              <span className="text-lg">{branch.name}</span>
            </div>
            <div className="text-sm opacity-90 mb-1">
              {branch.area}
            </div>
            <div className="text-xs opacity-75">
              {isOpen ? 'متاح للطلب' : 'مغلق حالياً'}
            </div>
          </button>
        ))}
      </div>

      {/* Simple Status */}
      <div className="px-6 py-4 text-center text-gray-500 text-sm">
        {isOpen ? 'مفتوح للطلبات الآن' : 'مغلق • يفتح من 11:00 ص إلى 11:59 م'}
      </div>
    </div>
  );
};