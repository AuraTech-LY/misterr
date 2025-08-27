import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RestaurantSelector } from '../components/RestaurantSelector';
import { BranchSelector } from '../components/BranchSelector';
import { restaurants } from '../data/restaurantsData';
import { Restaurant, Branch } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setSelectedBranch(null);
  };

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    // Navigate to the branch menu page
    navigate(`/branch/${branch.id}`);
  };

  const handleBack = () => {
    if (selectedBranch) {
      setSelectedBranch(null);
    } else if (selectedRestaurant) {
      setSelectedRestaurant(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!selectedRestaurant ? (
        <RestaurantSelector
          restaurants={restaurants}
          onSelectRestaurant={handleRestaurantSelect}
        />
      ) : (
        <BranchSelector
          restaurant={selectedRestaurant}
          onSelect={handleBranchSelect}
          onBack={handleBack}
        />
      )}
    </div>
  );
};