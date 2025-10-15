import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles = ["user", "admin", "super-admin", "super-user"] }) => {
  const userEmail = localStorage.getItem("userEmail");
  const userRole = (localStorage.getItem("userPosition") || "").trim().toLowerCase();

  // Check for session timeout
  const sessionTimeout = localStorage.getItem("sessionTimeout");
  
  if (sessionTimeout) {
    const timeoutTime = parseInt(sessionTimeout);
    
    // If sessionTimeout is 0, it means the session has expired and modal was shown
    // On page refresh, we should immediately logout since the modal won't be mounted
    if (timeoutTime === 0) {
      localStorage.clear();
      return <Navigate to="/" replace />;
    } else if (Date.now() >= timeoutTime) {
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
