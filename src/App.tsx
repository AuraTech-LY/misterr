import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { BranchesPage } from './pages/BranchesPage';
import { BranchMenuPage } from './pages/BranchMenuPage';
import { AdminPage } from './pages/AdminPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/branches" element={<BranchesPage />} />
      <Route path="/airport-menu" element={<BranchMenuPage branchId="airport" />} />
      <Route path="/dollar-menu" element={<BranchMenuPage branchId="dollar" />} />
      <Route path="/balaoun-menu" element={<BranchMenuPage branchId="balaoun" />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;