import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth, db } from "../backend/firebase/FirebaseConfig";
import { collection, query, where, getDocs, updateDoc, onSnapshot } from "firebase/firestore";
import { message } from "antd";
import "./styles/Login.css";
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import axios from "axios";
import NotificationModal from "./customs/NotificationModal";
import TermsModal from "./customs/TermsModal";
import { MdEmail } from 'react-icons/md';
import nulsLogo from './images/NULS LOGO.png'

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false); 
  const [isTermModalVisible, setIsTermModalVisible] = useState(false); 
  const [modalMessage, setModalMessage] = useState("");
  const [signUpMode, setSignUpMode] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [isVerifiedWithoutPassword, setIsVerifiedWithoutPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
    matches: false
  });
  const [passwordSetSuccess, setPasswordSetSuccess] = useState(false);
  const [isPasswordResetModalVisible, setIsPasswordResetModalVisible] = useState(false);
  const [passwordResetData, setPasswordResetData] = useState({
    newPassword: "",
    confirmNewPassword: ""
  });
  const [passwordResetError, setPasswordResetError] = useState("");
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetValidation, setPasswordResetValidation] = useState({
    hasLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
    matches: false
  });
  const [signUpData, setSignUpData] = useState({
    
    name: "",
    email: "",
    employeeId: '',
    password: "",
    jobTitle: "",
    department: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  
  const navigate = useNavigate();
  const openTermsModal = () => setIsTermModalVisible(true);
  const closeTermsModal = () => setIsTermModalVisible(false);
  const [departmentsAll, setDepartmentsAll] = useState([]);
  const [currentDepartments, setCurrentDepartments] = useState([]);
  const [animateInputs, setAnimateInputs] = useState(false);
  const emailDebounceRef = useRef(null); 

  const departmentOptionsByJobTitle = {
    Dean: ["SAH", "SAS", "SOO", "SOD"],
    "Program Chair": ["Nursing", "Medical Technology", "Psychology", "Optometry", "Dentistry", "Physical Therapy"],
    Faculty: ["SHS", "Nursing", "Medical Technology", "Psychology", "Dentistry", "Optometry", "Physical Therapy"],
    "Laboratory Custodian": []  // If no departments or fixed options
  };

     useEffect(() => {
    const handleBackButton = (event) => {
      event.preventDefault();
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, []);

  useEffect(() => {
    const departmentsCollection = collection(db, "departments");
    const unsubscribe = onSnapshot(
      departmentsCollection,
      (querySnapshot) => {
        const deptList = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setDepartmentsAll(deptList);
      },
      (error) => {
     
        message.error("Failed to load departments.");
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isNewUser && confirmPassword) {
      if (formData.password !== confirmPassword) {
        setError("Passwords do not match.");
      } else {
        setError(""); // clear error if they match
      }
    }
  }, [formData.password, confirmPassword, isNewUser]);

  // Check if user is already logged in and redirect accordingly
  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const userRole = localStorage.getItem("userPosition");
    const userId = localStorage.getItem("userId");

    if (userEmail && userRole && userId) {
      // User is already logged in, redirect to appropriate dashboard
      switch (userRole.toLowerCase()) {
        case "admin":
        case "super-user":
          navigate("/main/dashboard", { replace: true });
          break;
        case "user":
          navigate("/main/requisition", { replace: true });
          break;
        default:
          // If role is unknown, clear localStorage and stay on login page
          localStorage.clear();
          break;
      }
    }
  }, [navigate]);

  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (name === "confirmPassword") {
      setConfirmPassword(value);

    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "email") {
      const trimmedValue = value.trim();
      const isValidEmail = /\S+@\S+\.\S+/.test(trimmedValue);
      
      setEmailChecked(false); 

      if (emailDebounceRef.current) {
        clearTimeout(emailDebounceRef.current);
      }

    emailDebounceRef.current = setTimeout(async () => {
      if (!isValidEmail) {
        setIsNewUser(false);
        setEmailChecked(false);
        return;
      }

      try {
        const usersRef = collection(db, "accounts");
        const q = query(usersRef, where("email", "==", value));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();

          const hasUid = !!userData.uid;
          const hasPassword = !!userData.password; // assuming you store password hashes
          const isVerified = userData.verified === true; // adapt if your field is named differently

          setIsNewUser(!hasUid); // Still used for general logic
          setEmailChecked(hasUid);

          if (!hasUid) {
                  setIsNewUser(false);
                  setIsVerifiedWithoutPassword(true); // ✅ User exists but has no UID/password
                  setEmailChecked(true); // ✅ Mark that check is done, so form shows
                  
                } else {
                  setIsNewUser(false);
                  setIsVerifiedWithoutPassword(false);
                  setEmailChecked(true); // ✅ Verified user
                }

        } else {
          setIsNewUser(true);
                setIsVerifiedWithoutPassword(false);
                setEmailChecked(true);
        }
      } catch (err) {
        console.error("Error checking user:", err.message);
      }
    }, 700); // Debounce time (ms)
    }

      // LIVE PASSWORD VALIDATION
      if (name === "password") {
        // Update password validation state
        setPasswordValidation({
          hasLength: value.length >= 8,
          hasUppercase: /[A-Z]/.test(value),
          hasLowercase: /[a-z]/.test(value),
          hasNumber: /\d/.test(value),
          hasSpecial: /[@$!%*#?&]/.test(value),
          matches: confirmPassword ? value === confirmPassword : false
        });

        // check match with confirmPassword
        if (confirmPassword && value !== confirmPassword) {
          setError("Passwords do not match.");
        } else {
          setError("");
        }
      }

    if (name === "confirmPassword") {
      // Update password match validation
      setPasswordValidation(prev => ({
        ...prev,
        matches: value === formData.password
      }));

      // Check match after password and confirmPassword are both typed
      if (value !== formData.password) {
        setError("Passwords do not match.");
      } else {
        setError("");
      }
    }
  };

  const handleSignUpChange = (e) => {
    const { name, value } = e.target;

    if (name === "jobTitle") {
      let filteredDepts = [];

      if (value === "Faculty") {
        filteredDepts = departmentsAll.map((dept) => dept.name);
      } else if (value === "Program Chair") {
        filteredDepts = departmentsAll
          .map((dept) => dept.name)
          .filter((name) => name !== "SHS");
      } else {
        filteredDepts = departmentOptionsByJobTitle[value] || [];
      }

      const autoDept = value === "Laboratory Custodian" ? "SAH" : "";

      setSignUpData((prev) => ({
        ...prev,
        jobTitle: value,
        department: autoDept, // Automatically set department to "SAH" for Lab Custodian
      }));

      setCurrentDepartments(filteredDepts);

    } else {
      setSignUpData((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (name === "email") {
        const validDomains = ["nu-moa.edu.ph", "students.nu-moa.edu.ph"];
        const parts = value.split("@");
        const emailDomain = parts.length > 1 ? parts[1] : "";

        if (!validDomains.includes(emailDomain)) {
          setError("Only @nu-moa.edu.ph and @students.nu-moa.edu.ph emails are allowed.");
        } else {
          setError(""); // Clear error if valid
        }
      }
    }
  };

  const signUpAnimate = (e) =>{
    if(signUpMode === true){
      setSignUpMode(false)

      setAnimateInputs(true);
      setTimeout(() => setAnimateInputs(false), 1000);
    }
    else if(signUpMode ===false){
      setSignUpMode(true)
      setAnimateInputs(true);
      setTimeout(() => setAnimateInputs(false), 1000);
    }
  }

  const capitalizeWords = (str) =>
    str.trim().toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  
  const checkUserAndLogin = async () => {
    setIsLoading(true);
    try {
      const { email, password } = formData;
      
      const response = await axios.post("https://webnuls.onrender.com/login", { email, password });
      const data = response.data;
      const user = data.user;

      if (!user) {
        setError("Invalid response from server.");
        setIsLoading(false);
        return;
      }

      // Check if password reset is required (first-time login with temporary password)
      if (user.requiresPasswordReset) {
        // Save user info to localStorage temporarily
        localStorage.setItem("userId", user.userId);
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("userName", user.name);
        localStorage.setItem("userDepartment", user.department || "");
        localStorage.setItem("userPosition", user.role?.toLowerCase());
        localStorage.setItem("userJobTitle", user.jobTitle || "User");
        
        // Show password reset modal
        setIsPasswordResetModalVisible(true);
        setIsLoading(false);
        return;
      }

      // Save user info to localStorage
      localStorage.setItem("userId", user.userId);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userName", user.name);
      localStorage.setItem("userDepartment", user.department || "");
      localStorage.setItem("userPosition", user.role?.toLowerCase());
      localStorage.setItem("userJobTitle", user.jobTitle || "User");

      // Clear any existing session timeout to start fresh
      localStorage.removeItem("sessionTimeout");

      // Navigate based on role
      if (user.role?.toLowerCase() === "super-admin") {
        navigate("/main/accounts", { state: { loginSuccess: true, role: "super-admin" } });
      } else if (user.role?.toLowerCase() === "admin" || user.role?.toLowerCase() === "super-user") {
        navigate("/main/dashboard", { state: { loginSuccess: true, role: user.role.toLowerCase() } });
      } else if (user.role?.toLowerCase() === "user") {
        navigate("/main/requisition", { state: { loginSuccess: true, role: "user" } });
      } else {
        setError("Unknown role. Please contact admin.");
      }

    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);

      } else {
        setError("Unexpected error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    const { name, email, employeeId, password, confirmPassword, jobTitle, department } = signUpData;

    
    const formattedName = capitalizeWords(name);

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("https://webnuls.onrender.com/signup", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formattedName,
          email,
          employeeId,
          password,
          confirmPassword,
          jobTitle,
          department,
          termsChecked,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend returned error
        setError(data.error || "Something went wrong");
        setIsLoading(false);
        return;
      }

      // Success – show modal with temporary password
      let message = data.message || "Successfully registered!";
      if (data.temporaryPassword) {
        message += `\n\nYour temporary password is: ${data.temporaryPassword}\n\n${data.instructions || ''}`;
      }
      setModalMessage(message);
      setIsModalVisible(true);

      // Clear form
      setSignUpData({
        name: "",
        email: "",
        employeeId: "",
        password: "",
        confirmPassword: "",
        jobTitle: "",
        department: "",
      });

      setTermsChecked(false);

    } catch (err) {
      setError("Failed to register. Please try again later.");
      console.error("Sign-up error:", err);
      
    } finally {
      setIsLoading(false);
      setSignUpMode(false);
    }
  };
  
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setForgotPasswordError("Please enter your email.");
      return;
    }
  
    try {
      const usersRef = collection(db, "accounts");
      const q = query(usersRef, where("email", "==", forgotPasswordEmail));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        setForgotPasswordError("Email not found. Please check and try again.");
        setForgotPasswordSuccess(""); 
        return;
      }

      await sendPasswordResetEmail(auth, forgotPasswordEmail);
  
      setForgotPasswordSuccess("Password reset link sent! Please check your email.");
      setForgotPasswordError(""); 
      setTimeout(() => {
        setForgotPasswordEmail("");
      }, 50);

    } catch (error) {
      setForgotPasswordError("Failed to send reset link. Please check the email.");
      setForgotPasswordSuccess("");
      setTimeout(() => {
        setForgotPasswordEmail("");
      }, 50);
    }
  };

  const handlePasswordReset = async () => {
    const { newPassword, confirmNewPassword } = passwordResetData;
    const userEmail = localStorage.getItem("userEmail");

    if (!newPassword || !confirmNewPassword) {
      setPasswordResetError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordResetError("Passwords do not match.");
      return;
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordResetError("Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.");
      return;
    }

    setPasswordResetLoading(true);
    setPasswordResetError("");

    try {
      const response = await fetch("https://webnuls.onrender.com/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordResetError(data.error || "Failed to reset password.");
        setPasswordResetLoading(false);
        return;
      }

      // Success - close modal and show success message
      setIsPasswordResetModalVisible(false);
      setPasswordResetData({ newPassword: "", confirmNewPassword: "" });
      setPasswordResetValidation({
        hasLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
        matches: false
      });
      setModalMessage("Password set successfully! You can now log in with your new password.");
      setIsModalVisible(true);

      // Clear form
      setFormData({ email: "", password: "" });

    } catch (error) {
      console.error("Password reset error:", error);
      setPasswordResetError("Failed to reset password. Please try again.");
    } finally {
      setPasswordResetLoading(false);
    }
  };  

  return (
    <div className="login-container">
      <div className="login-box">
        
        <div className="container2">
          <div className="form-div">
             {!signUpMode && (
              <div style={{ display: 'flex', justifyContent: 'center', height: 'auto',justifySelf: 'flex-start'}}>
                <img src={nulsLogo} alt="NULS Logo" style={{maxHeight: '300px'}} />
              </div>
            )}

            <h2 className={signUpMode ? "create-account-title" : "login-title"}>
              {signUpMode
                ? "Create an Account"
                : "Sign in to your account"} 
            </h2>
            
            {/* Success message when password is set */}
            {passwordSetSuccess && (
              <div className="password-success-message" style={{
                backgroundColor: "#d4edda",
                border: "1px solid #c3e6cb",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "20px",
                textAlign: "center",
                color: "#155724"
              }}>
                <p>
                  ✓ Password set successfully! Redirecting to login...
                </p>
              </div>
            )}

            <form
              className={signUpMode ? "form-wrapper slide-in" : "form-wrapper slide-in2"}
              onSubmit={(e) => {
                e.preventDefault();
                if (!termsChecked && signUpMode) {
                  alert("You must agree to the terms and conditions.");
                  return;
                }
                 if (signUpMode) {
                    handleSignUp();
                  } else {
                    checkUserAndLogin();
                  }
              }}
            >
              {signUpMode ? (
                <>
                  <div className="form-group">
                    <label>Name</label>
                      <input
                        type="text"
                        name="name"
                        value={signUpData.name}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // Allow letters and spaces only

                          // Capitalize the first letter of each word
                          value = value
                          .toLowerCase()
                          .replace(/\b\w/g, (char) => char.toUpperCase());

                          handleSignUpChange({ target: { name: "name", value } });
                        }}
                        onKeyDown={(e) => {
                          const allowedKeys = [
                            "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete", " ", // space
                          ];
                          const isLetter = /^[a-zA-Z]$/.test(e.key);
                          if (!isLetter && !allowedKeys.includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="Enter name"
                        required
                      />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={signUpData.email}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, ""); // Remove all whitespace
                        handleSignUpChange({ target: { name: "email", value } });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === " ") {
                          e.preventDefault(); // Block spacebar
                        }
                      }}
                      placeholder="enter email (NU account)"
                      required
                    />
                   
                  </div>

                  <div className="form-group">
                    <label>Employee ID</label>
                    <input
                      type="text"
                      value={signUpData.employeeId}
                      onChange={(e) => {
                        let rawValue = e.target.value.replace(/\D/g, ''); // Remove all non-digits
                        if (rawValue.length > 6) rawValue = rawValue.slice(0, 6); // Limit to 6 digits

                        // Insert dash after the second digit
                        let formattedValue = rawValue;
                        if (rawValue.length > 2) {
                          formattedValue = rawValue.slice(0, 2) + '-' + rawValue.slice(2);
                        }

                        setSignUpData({ ...signUpData, employeeId: formattedValue });
                      }}
                      placeholder="e.g., 12-3456"
                      required
                    />
                  </div>
  
                <div className="dropdown-container">
                  <div className="form-group">
                    <label>Job Title</label>
                    <select
                      name="jobTitle"
                      value={signUpData.jobTitle}
                      onChange={handleSignUpChange}
                      style={{width: '100%'}}
                      required
                    >
                      <option value="">Select Job Title</option>
                      <option value="Dean">Dean</option>
                      <option value="Program Chair">Program Chair</option>
                      <option value="Laboratory Custodian">Laboratory Custodian</option>
                      <option value="Faculty">Faculty</option>
                    </select>
                  </div>
                </div>

                <div className="dropdown-container">
                  <div className="form-group">
                    <label>Department</label>

                    <select
                      name="department"
                      value={signUpData.department}
                      onChange={handleSignUpChange}
                      required={signUpData.jobTitle !== "Laboratory Custodian"}
                      disabled={signUpData.jobTitle === "Laboratory Custodian"}
                    >
                      <option value="">Select Department</option>
                      {signUpData.jobTitle === "Laboratory Custodian" ? (
                        <option value="SAH">SAH</option>
                      ) : (
                        currentDepartments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
  
                  <div className="terms-checkbox">
                    <input
                      type="checkbox"
                      name="termsChecked"
                      checked={termsChecked}
                      onChange={() => setTermsChecked(!termsChecked)}
                      required
                      id="termsCheckbox"
                    />
                    
                    <label htmlFor="termsCheckbox">
                      I agree to{' '}
                      <span onClick={openTermsModal} className="terms-link">
                        Terms & Conditions
                      </span>
                    </label>

                    {error && <p className="error-message">{error}</p>}
                  </div>
                </>
              ) : (
                <>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => {
                      // Prevent spaces from being part of the input value
                      const value = e.target.value.replace(/\s/g, "");
                      handleChange({ target: { name: "email", value } });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === " ") {
                        e.preventDefault(); // Block spacebar from typing
                      }
                    }}
                    required
                    placeholder="Enter your email"
                  />
                </div>

                  <div className="form-group" 
                 >
                     <label>Password</label>

                      <div className="password-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s/g, ""); 
                            handleChange({ target: { name: "password", value } });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === " ") {
                              e.preventDefault(); // Block spacebar
                            }
                          }}
                          required
                          placeholder="Enter your password"
                        />

                        <span
                          className="toggle-password"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeInvisibleOutlined/>:<EyeOutlined/>}
                        </span>
                      </div>

                    {error && <p className="error-message">{error}</p>}
                  </div>
                </>
              )}
  
              <div></div>
  
              <button type="submit" className={signUpMode ? "signup-btn" : "login-btn"}  disabled={isLoading || (signUpMode && !termsChecked)}>
                {isLoading ? (
                  <div className="loader"></div>
                ) : signUpMode ? (
                  "Sign Up"
                ) : (
                  "Login"
                )}
              </button>
               
            </form>
  
            <div className={signUpMode ? "bottom-label-div2" : "bottom-label-div"}>
              {!signUpMode && (
                <p
                  className="forgot-password-link"
                  style={{ marginTop: '20px', cursor: 'pointer' }}
                  onClick={() => setIsForgotPasswordModalVisible(true)}
                >
                  Forgot Password?
                </p>
              )}
  
              <p className="switch-mode">
                {signUpMode ? (
                  <>
                    Already have an account?{" "}
                    <span onClick={() => signUpAnimate()} style={{color: '#0a3e75', fontWeight: '700', cursor: 'pointer'}} className="link">Sign in here</span>
                  </>
                ) : (
                    <>
                    Don't have an account?{" "}
                      <span
                        onClick={() => signUpAnimate()}
                        style={{ color: '#0a3e75', fontWeight: '700', cursor: 'pointer' }}
                        className="link"
                      >
                        Sign up here
                      </span>
                    </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
  
      {/* Forgot Password Modal */}
      {isForgotPasswordModalVisible && (
          <div className="modal-overlay">
            <div className="modal-content-forgot">
              <h3>Forgot Password</h3>
              <p className="modal-instruction">Enter your email to receive a reset link</p>
          <div className="input-with-icon">
            <MdEmail className="email-icon" />
           <input
  type="email"
  value={forgotPasswordEmail}
  onChange={(e) => {
    const value = e.target.value;
    setForgotPasswordEmail(value);

    // Clear error message in real-time if the input is not empty
    if (value.trim() !== "") {
      setForgotPasswordError("");
    }
  }}
  placeholder="Enter email"
  required
/>
          </div>

              {forgotPasswordError && (
                <p className="error-message">{forgotPasswordError}</p>
              )}
              {forgotPasswordSuccess && (
                <p className="success-message">{forgotPasswordSuccess}</p>
              )}

              <div className="modal-actions-forgot">
                <button onClick={handleForgotPassword} className="modal-btn-send">
                  Send Reset Link
                </button>
                <button
                   onClick={() => {
    setIsForgotPasswordModalVisible(false);
    setForgotPasswordEmail(""); // Clear the email input
    setForgotPasswordError(""); // (Optional) Clear error
    setForgotPasswordSuccess("");}} // (Optional) Clear success message
                  className="modal-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

      )}

      {/* Password Reset Modal */}
      {isPasswordResetModalVisible && (
        <div className="modal-overlay">
          <div className="modal-content-forgot">
            <h3>Set Your Password</h3>
            <p className="modal-instruction">Please set a new password for your account</p>
            
            <div className="form-group">
              <label>New Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordResetData.newPassword}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, "");
                    setPasswordResetData(prev => ({ ...prev, newPassword: value }));
                    
                    // Real-time password validation
                    setPasswordResetValidation({
                      hasLength: value.length >= 8,
                      hasUppercase: /[A-Z]/.test(value),
                      hasLowercase: /[a-z]/.test(value),
                      hasNumber: /\d/.test(value),
                      hasSpecial: /[@$!%*#?&]/.test(value),
                      matches: passwordResetData.confirmNewPassword ? value === passwordResetData.confirmNewPassword : false
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " ") {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Enter new password"
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeInvisibleOutlined/> : <EyeOutlined/>}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordResetData.confirmNewPassword}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, "");
                    setPasswordResetData(prev => ({ ...prev, confirmNewPassword: value }));
                    
                    // Update password match validation
                    setPasswordResetValidation(prev => ({
                      ...prev,
                      matches: value === passwordResetData.newPassword
                    }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " ") {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Confirm new password"
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeInvisibleOutlined/> : <EyeOutlined/>}
                </span>
              </div>
            </div>

            {/* Password Validation Indicators */}
            {passwordResetData.newPassword && (
              <div className="password-validation">
                <p>Password Requirements:</p>
                <div className="validation-requirements">
                  <div className="validation-item">
                    <span style={{ color: passwordResetValidation.hasLength ? "#10b981" : "#ef4444" }}>
                      {passwordResetValidation.hasLength ? "✓" : "✗"}
                    </span>
                    <span style={{ color: passwordResetValidation.hasLength ? "#10b981" : "#6b7280" }}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="validation-item">
                    <span style={{ color: passwordResetValidation.hasUppercase ? "#10b981" : "#ef4444" }}>
                      {passwordResetValidation.hasUppercase ? "✓" : "✗"}
                    </span>
                    <span style={{ color: passwordResetValidation.hasUppercase ? "#10b981" : "#6b7280" }}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="validation-item">
                    <span style={{ color: passwordResetValidation.hasLowercase ? "#10b981" : "#ef4444" }}>
                      {passwordResetValidation.hasLowercase ? "✓" : "✗"}
                    </span>
                    <span style={{ color: passwordResetValidation.hasLowercase ? "#10b981" : "#6b7280" }}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="validation-item">
                    <span style={{ color: passwordResetValidation.hasNumber ? "#10b981" : "#ef4444" }}>
                      {passwordResetValidation.hasNumber ? "✓" : "✗"}
                    </span>
                    <span style={{ color: passwordResetValidation.hasNumber ? "#10b981" : "#6b7280" }}>
                      One number
                    </span>
                  </div>
                  <div className="validation-item">
                    <span style={{ color: passwordResetValidation.hasSpecial ? "#10b981" : "#ef4444" }}>
                      {passwordResetValidation.hasSpecial ? "✓" : "✗"}
                    </span>
                    <span style={{ color: passwordResetValidation.hasSpecial ? "#10b981" : "#6b7280" }}>
                      One special character (@$!%*#?&)
                    </span>
                  </div>
                  {passwordResetData.confirmNewPassword && (
                    <div className="validation-item">
                      <span style={{ color: passwordResetValidation.matches ? "#10b981" : "#ef4444" }}>
                        {passwordResetValidation.matches ? "✓" : "✗"}
                      </span>
                      <span style={{ color: passwordResetValidation.matches ? "#10b981" : "#6b7280" }}>
                        Passwords match
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {passwordResetError && (
              <p className="error-message">{passwordResetError}</p>
            )}

            <div className="modal-actions-forgot">
              <button 
                onClick={handlePasswordReset} 
                className="modal-btn-send"
                disabled={passwordResetLoading || !passwordResetValidation.hasLength || !passwordResetValidation.hasUppercase || !passwordResetValidation.hasLowercase || !passwordResetValidation.hasNumber || !passwordResetValidation.hasSpecial || !passwordResetValidation.matches}
              >
                {passwordResetLoading ? "Setting Password..." : "Set Password"}
              </button>
              <button
                onClick={() => {
                  setIsPasswordResetModalVisible(false);
                  setPasswordResetData({ newPassword: "", confirmNewPassword: "" });
                  setPasswordResetError("");
                  setPasswordResetValidation({
                    hasLength: false,
                    hasUppercase: false,
                    hasLowercase: false,
                    hasNumber: false,
                    hasSpecial: false,
                    matches: false
                  });
                  // Clear localStorage and redirect to login
                  localStorage.clear();
                }}
                className="modal-cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <TermsModal isVisible={isTermModalVisible} onClose={closeTermsModal} />
  
      <NotificationModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        message={modalMessage}
      />
    </div>
  );
  
};

export default Login;
