import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../backend/firebase/FirebaseConfig'; // Adjust path as needed
import Login from './Login';
import Dashboard from './Dashboard';
import Inventory from './admin/Inventory';
import PendingRequest from './admin/PendingRequest';
import BorrowCatalog from './admin/BorrowCatalog';
import History from './admin/History';
import Profile from './Profile';
import AccountManagement from './superAdmin/AccountManagement';
import Requisition from './users/Requisition';
import RequestList from './users/RequestList';
import ActivityLog from './users/ActivityLog';
import SearchItems from './users/SearchItems';
import CapexRequest from './users/CapexRequest';
import ReturnItems from './users/ReturnItems';
import LayoutMain from './LayoutMain';

const PrivateRoute = ({ element }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
        });

        return () => unsubscribe(); 
    }, []);

    return isLoggedIn ? element : <Navigate to="/" />;
}

const AppController = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
                <Route path="/inventory" element={<PrivateRoute element={<Inventory />} />} />
                <Route path="/pending-request" element={<PrivateRoute element={<PendingRequest />} />} />
                <Route path="/borrow-catalog" element={<PrivateRoute element={<BorrowCatalog />} />} />
                <Route path="/history" element={<PrivateRoute element={<History />} />} />
                <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />
                <Route path="/accounts" element={<PrivateRoute element={<AccountManagement />} />} />
                <Route path="/requisition" element={<PrivateRoute element={<Requisition />} />} />
                <Route path="/request-list" element={<PrivateRoute element={<RequestList />} />} />
                <Route path="/activity-log" element={<PrivateRoute element={<ActivityLog />} />} />
                <Route path="/search-items" element={<PrivateRoute element={<SearchItems />} />} />
                <Route path="/capex-request" element={<PrivateRoute element={<CapexRequest />} />} />
                <Route path="/return-items" element={<PrivateRoute element={<ReturnItems />} />} />
                <Route path="/main/*" element={<PrivateRoute element={<LayoutMain />} />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppController;
