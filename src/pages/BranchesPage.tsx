import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BranchSelector } from '../components/BranchSelector';
import { branches } from '../data/branchData';
import { Branch } from '../types';

export const BranchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    // Store selected branch in localStorage for the main app
    localStorage.setItem('selectedBranch', JSON.stringify(branch));
    // Navigate to home page with the selected branch
    navigate('/');
  };

  return (
    <BranchSelector
      branches={branches}
      selectedBranch={selectedBranch}
      onBranchSelect={handleBranchSelect}
    />
  );
};