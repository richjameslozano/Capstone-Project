import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Login from './Login';
import LayoutMain from './LayoutMain';
import ProtectedRoute from './ProtectedRoute'; 
import SessionTimeout from './SessionTimeout'; 
import PrivacyPolicy from './PrivacyPolicy';


const AppWrapper = () => {
  const location = useLocation();

  const handleSignOut = () => {
    localStorage.clear();
  };

  const shouldShowTimeout = location.pathname !== '/';

  return (
    <>
      {shouldShowTimeout && <SessionTimeout onLogout={handleSignOut} />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/main/*" element={<LayoutMain />} />
        </Route>
      </Routes>
    </>
  );
};

const AppControllers = () => (
  <BrowserRouter>
    <AppWrapper />
  </BrowserRouter>
);

export default AppControllers;