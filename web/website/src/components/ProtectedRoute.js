// import React from 'react';
// import { Navigate } from 'react-router-dom';

// const ProtectedRoute = ({ element, ...rest }) => {
//   const userEmail = localStorage.getItem("userEmail");

//   return userEmail ? element : <Navigate to="/" replace />;
// };

// export default ProtectedRoute;

// import { Navigate, Outlet } from "react-router-dom";

// const ProtectedRoute = ({ allowedRoles = ["user", "admin", "super-admin", "super-user"] }) => {
//   const userEmail = localStorage.getItem("userEmail");
//   const userRole = (localStorage.getItem("userPosition") || "").trim().toLowerCase();


//   if (!userEmail || !userRole) {
//     return <Navigate to="/" replace />;
//   }
  
//   if (!Array.isArray(allowedRoles)) {
//     return <Navigate to="/not-authorized" replace />;
//   }
  
//   return allowedRoles.includes(userRole) ? <Outlet /> : <Navigate to="/main/not-authorized" replace />;
  
// };

// export default ProtectedRoute;


import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles = ["user", "admin", "super-admin", "super-user"] }) => {
  const userEmail = localStorage.getItem("userEmail");
  const userRole = (localStorage.getItem("userPosition") || "").trim().toLowerCase();

  // Check for session timeout
  const sessionTimeout = localStorage.getItem("sessionTimeout");
  console.log("ProtectedRoute: sessionTimeout check", sessionTimeout);
  
  if (sessionTimeout) {
    const timeoutTime = parseInt(sessionTimeout);
    console.log("ProtectedRoute: timeoutTime", timeoutTime, "currentTime", Date.now());
    
    // If sessionTimeout is 0, it means the session has expired and modal was shown
    // On page refresh, we should immediately logout since the modal won't be mounted
    if (timeoutTime === 0) {
      // Session has expired, clear all data and redirect to login
      console.log("ProtectedRoute: Session expired (timeout=0), redirecting to login");
      localStorage.clear();
      return <Navigate to="/" replace />;
    } else if (Date.now() >= timeoutTime) {
      // Session has expired, clear all data and redirect to login
      console.log("ProtectedRoute: Session expired, redirecting to login");
      localStorage.clear();
      return <Navigate to="/" replace />;
    }
  }

  if (!userEmail || !userRole) {
    return <Navigate to="/" replace />;
  }
  
  if (!Array.isArray(allowedRoles)) {
    return <Navigate to="/not-authorized" replace />;
  }
  
  return allowedRoles.includes(userRole) ? <Outlet /> : <Navigate to="/main/not-authorized" replace />;
};

export default ProtectedRoute;
