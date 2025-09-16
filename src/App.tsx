import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { BranchesPage } from './pages/BranchesPage';
import { BranchMenuPage } from './pages/BranchMenuPage';
import { AdminPage } from './pages/AdminPage';

function App() {
  const location = useLocation();

  // Dispatch custom event when route changes to update theme color
  React.useEffect(() => {
    const event = new CustomEvent('routechange');
    window.dispatchEvent(event);
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/branches" element={<BranchesPage />} />
      <Route path="/sheesh/airport-road" element={<BranchMenuPage branchId="airport" />} />
      <Route path="/sheesh/beloun" element={<BranchMenuPage branchId="balaoun" />} />
      <Route path="/krispy/beloun" element={<BranchMenuPage branchId="dollar" />} />
      <Route path="/burgerito/airport-road" element={<BranchMenuPage branchId="burgerito-airport" />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;