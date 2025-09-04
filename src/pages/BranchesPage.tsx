import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BranchSelector } from '../components/BranchSelector';
import { getAllBranches } from '../data/restaurantsData';
import { Branch } from '../types';

export const BranchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    // Store selected branch ID in localStorage for the main app
    localStorage.setItem('selectedBranchId', branch.id);
    // Navigate to home page with the selected branch
    navigate('/');
  };

  return (
    <BranchSelector
      branches={getAllBranches()}
      selectedBranch={selectedBranch}
      onBranchSelect={handleBranchSelect}
    />
  );
};