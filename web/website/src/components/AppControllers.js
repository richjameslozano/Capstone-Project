// VERSION 1 WITH NO VERIFICATION
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
    // Clear all session data including session timeout
    localStorage.clear();

    // localStorage.removeItem("userId");  
    // localStorage.removeItem("userEmail");
    // localStorage.removeItem("userName");
    // localStorage.removeItem("userDepartment");
    // localStorage.removeItem("userPosition");
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

       {/* <TimeoutProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route element={<ProtectedRoute />}>
              <Route path="/main/*" element={<LayoutMain />} />
              
            </Route>
          </Routes>
      </TimeoutProvider> */}
    </>
  );
};

const AppControllers = () => (
  <BrowserRouter>
    <AppWrapper />
  </BrowserRouter>
);

export default AppControllers;


// VERSION 2 WITH VERIFICATION 
// import React, { useEffect } from 'react';
// import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
// import { onAuthStateChanged, signOut } from 'firebase/auth';
// import { auth } from '../backend/firebase/FirebaseConfig.js'; 

// // your other imports...
// import Login from './Login';
// import Dashboard from './Dashboard';
// import Inventory from './admin/Inventory';
// import PendingRequest from './admin/PendingRequest';
// import BorrowCatalog from './admin/BorrowCatalog';
// import History from './admin/History';
// import Profile from './Profile';
// import AccountManagement from './superAdmin/AccountManagement';
// import Requisition from './users/Requisition';
// import RequestList from './users/RequestList';
// import ActivityLog from './users/ActivityLog';
// import SearchItems from './users/SearchItems';
// import CapexRequest from './users/CapexRequest';
// import ReturnItems from './users/ReturnItems';
// import LayoutMain from './LayoutMain';
// import ProtectedRoute from './ProtectedRoute'; 
// import SessionTimeout from './SessionTimeout'; 
// import HistoryLog from './users/HistoryLog';
// import RequestLog from './admin/RequestLog';
// import AdminActivityLog from './admin/AdminActivityLog';

// const AppWrapper = () => {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const handleSignOut = () => {
//     localStorage.removeItem("userId");  
//     localStorage.removeItem("userEmail");
//     localStorage.removeItem("userName");
//     localStorage.removeItem("userDepartment");
//     localStorage.removeItem("userPosition");
//   };

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (user) {
//         try {
//           await user.reload(); // refresh the user data
//           const refreshedUser = auth.currentUser;

//           // Defensive check in case refreshedUser is null
//           if (!refreshedUser) {
//             // If no user found after reload, sign out and redirect
//             await signOut(auth);
//             handleSignOut();
//             navigate("/", {
//               replace: true,
//               state: { message: "Session expired, please login again." },
//             });
//             return;
//           }

//           if (!refreshedUser.emailVerified) {
//             await signOut(auth);
//             handleSignOut();
//             navigate("/", {
//               replace: true,
//               state: { message: "Please verify your email before logging in." },
//             });
//           }
//         } catch (error) {
//           console.error("Error reloading user:", error);
//           // In case of error, sign out and redirect
//           await signOut(auth);
//           handleSignOut();
//           navigate("/", {
//             replace: true,
//             state: { message: "Authentication error, please login again." },
//           });
//         }
//       } else {
//         // User is signed out, clear local storage
//         handleSignOut();
//       }
//     });

//     return () => unsubscribe();
//   }, [navigate]);

//   const shouldShowTimeout = location.pathname !== '/';

//   return (
//     <>
//       {shouldShowTimeout && <SessionTimeout onLogout={handleSignOut} />}
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route element={<ProtectedRoute />}>
//           <Route path="/main/*" element={<LayoutMain />} />
//         </Route>
//       </Routes>
//     </>
//   );
// };

// const AppController = () => (
//   <BrowserRouter>
//     <AppWrapper />
//   </BrowserRouter>
// );

// export default AppController;