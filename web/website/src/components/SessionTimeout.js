import React, { useState, useEffect, useRef } from "react";
import { Modal, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../backend/firebase/FirebaseConfig"; 

const SessionTimeout = ({ onLogout }) => {
  const timerRef = useRef(null);
  const modalTimerRef = useRef(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();

  const timeoutDuration = 2 * 60 * 1000; // 2 minutes
  const modalAutoCloseDuration = 30 * 1000; // 30 seconds for modal auto-close

  const logoutUser = async () => {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || "Unknown User";

    console.log("SessionTimeout: Logging out user", userId, userName);

    // Clear local storage and perform logout action
    localStorage.clear();
    onLogout();
    
    // Debug: Check if localStorage is actually cleared
    console.log("SessionTimeout: localStorage after clear:", Object.keys(localStorage));

    // Log logout activity to Firestore
    if (userId) {
      try {
        await addDoc(collection(db, `accounts/${userId}/activitylog`), {
          action: "User Logged Out (Website) - Session Timeout",
          userName,
          timestamp: serverTimestamp(),
        });
        console.log("SessionTimeout: Logged logout activity to Firestore");
      } catch (error) {
        console.error("Error logging logout activity:", error);
      }
    }

    // Redirect to the home page or login page
    console.log("SessionTimeout: Redirecting to login page");
    navigate("/", { replace: true });
  };

  const showSessionTimeoutModal = () => {
    console.log("SessionTimeout: Showing modal, setting sessionTimeout to 0");
    setIsModalVisible(true);
    
    // Mark session as expired immediately when modal shows
    localStorage.setItem('sessionTimeout', '0');
    console.log("SessionTimeout: sessionTimeout set to 0");
    
    // Set a timer to automatically logout if user doesn't respond
    modalTimerRef.current = setTimeout(() => {
      console.log("SessionTimeout: Modal auto-close timer expired, logging out");
      logoutUser();
      setIsModalVisible(false);
    }, modalAutoCloseDuration);
  };

  const resetTimeout = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (modalTimerRef.current) {
      clearTimeout(modalTimerRef.current);
    }

    // Store the timeout timestamp in localStorage
    const timeoutTimestamp = Date.now() + timeoutDuration;
    localStorage.setItem('sessionTimeout', timeoutTimestamp.toString());

    timerRef.current = setTimeout(() => {
      console.log("SessionTimeout: Main timeout expired, showing modal");
      showSessionTimeoutModal();
    }, timeoutDuration);
  };

  // Check for existing timeout on component mount
  useEffect(() => {
    const existingTimeout = localStorage.getItem('sessionTimeout');
    if (existingTimeout) {
      const timeoutTime = parseInt(existingTimeout);
      
      if (timeoutTime === 0 || Date.now() >= timeoutTime) {
        // Session has already expired, logout immediately
        logoutUser();
        return;
      } else {
        // Session is still valid, set timer for remaining time
        const remainingTime = timeoutTime - Date.now();
        timerRef.current = setTimeout(() => {
          showSessionTimeoutModal();
        }, remainingTime);
      }
    } else {
      // No existing timeout, start fresh
      resetTimeout();
    }

    // Cleanup function to clear timeout when component unmounts
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleActivity = () => {
      resetTimeout();
    };

    // Add event listeners for user activity
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, check if session expired while hidden
        const existingTimeout = localStorage.getItem('sessionTimeout');
        if (existingTimeout) {
          const timeoutTime = parseInt(existingTimeout);
          
          if (timeoutTime === 0 || Date.now() >= timeoutTime) {
            logoutUser();
            return;
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
      }
    };
  }, []);

  const handleOk = () => {
    if (modalTimerRef.current) {
      clearTimeout(modalTimerRef.current);
    }
    logoutUser();
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    if (modalTimerRef.current) {
      clearTimeout(modalTimerRef.current);
    }
    setIsModalVisible(false);
    resetTimeout();
  };



  return (
    <Modal
      title="Session Timeout"
      open={isModalVisible}
      zIndex={1042}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Stay Logged In
        </Button>,
        <Button key="ok" type="primary" onClick={handleOk}>
          Logout
        </Button>,
      ]}
      closable={false}
      maskClosable={false}
      onCancel={handleCancel}
    >
      <p>Your session will expire in 30 seconds due to inactivity. Click "Stay Logged In" to continue or "Logout" to sign out now.</p>
    </Modal>
  );
};

export default SessionTimeout;
