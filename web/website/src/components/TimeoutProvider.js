import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../backend/firebase/FirebaseConfig"; 
import SessionTimeoutModal from './customs/SessionTimeoutModal';

export function TimeoutProvider({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const timeoutRef = useRef();
    const [isModalVisible, setIsModalVisible] = useState(false); 
    const SESSION_TIMEOUT = 900000;
    const exemptedRoutes = ['/', '/signup'];

    useEffect(() => {
        if (exemptedRoutes.includes(location.pathname)) return;

        const handleActivity = () => {
            clearTimeout(timeoutRef.current);
            setIsModalVisible(false);
            timeoutRef.current = setTimeout(() => {
                logoutUser();
                setIsModalVisible(true);
                navigate('/'); 
            }, SESSION_TIMEOUT);
        };

        // Add event listeners for user activity
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);

        // Start the session timeout
        handleActivity();

        // Cleanup event listeners and timeout on component unmount
        return () => {
            clearTimeout(timeoutRef.current);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [navigate, location.pathname]);

    const handleLogout = () => {
        // Clear user session and redirect to login
        localStorage.clear(); // Clear local storage
        navigate('/'); // Redirect to login page
    };

    const logoutUser = async () => {
        const userId = localStorage.getItem("userId");
        const userName = localStorage.getItem("userName") || "Unknown User";

        // Clear local storage and perform logout action
        localStorage.clear();

        // Log logout activity to Firestore
        if (userId) {
        try {
            await addDoc(collection(db, `accounts/${userId}/activitylog`), {
            action: "User Logged Out (Website)",
            userName,
            timestamp: serverTimestamp(),
            });
        } catch (error) {

        }
        }

        // Redirect to the home page or login page
        navigate("/", { replace: true });
    };

    const handleModalClose = () => {
        setIsModalVisible(false); // Close the modal
        handleLogout(); // Log out the user
    };

    return (
        <>
            {children}
            <SessionTimeoutModal
                isVisible={isModalVisible}
                onClose={handleModalClose}
            />
        </>
    );
}