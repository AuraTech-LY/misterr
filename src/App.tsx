import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { BranchesPage } from './pages/BranchesPage';
import { BranchMenuPage } from './pages/BranchMenuPage';
import { AdminPage } from './pages/AdminPage';
import { RestaurantListPage } from './pages/RestaurantListPage';
import { RestaurantDetailPage } from './pages/RestaurantDetailPage';

function App() {
  const location = useLocation();

  // Dispatch custom event when route changes to update theme color
  React.useEffect(() => {
    const event = new CustomEvent('routechange');
    window.dispatchEvent(event);
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<RestaurantListPage />} />
      <Route path="/restaurants" element={<RestaurantListPage />} />
      <Route path="/restaurant/:slug" element={<RestaurantDetailPage />} />
      <Route path="/restaurant/:slug/branch/:branchId" element={<BranchMenuPage />} />
      <Route path="/branches" element={<BranchesPage />} />
      <Route path="/sheesh" element={<HomePage />} />
      <Route path="/krispy" element={<HomePage />} />
      <Route path="/burgerito" element={<HomePage />} />
      <Route path="/sheesh/airport-road" element={<BranchMenuPage />} />
      <Route path="/sheesh/beloun" element={<BranchMenuPage />} />
      <Route path="/krispy/beloun" element={<BranchMenuPage />} />
      <Route path="/burgerito/airport-road" element={<BranchMenuPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;