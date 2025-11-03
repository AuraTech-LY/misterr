import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
      <Route path="/" element={<BranchMenuPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;