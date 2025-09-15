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

  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData({ ...formData, [name]: value });
  // };

  // const handleChange = async (e) => {
  //   const { name, value } = e.target;

  //   // Update form data first
  //   if (name === "confirmPassword") {
  //     setConfirmPassword(value);

  //   } else {
  //     setFormData((prev) => ({ ...prev, [name]: value }));
  //   }

  //   // EMAIL CHECK
  //   if (name === "email") {
  //     const isValidEmail = /\S+@\S+\.\S+/.test(value);
  //     if (!isValidEmail) {
  //       setIsNewUser(false);
  //       return;
  //     }

  //     try {
  //       const usersRef = collection(db, "accounts");
  //       const q = query(usersRef, where("email", "==", value));
  //       const querySnapshot = await getDocs(q);

  //       if (!querySnapshot.empty) {
  //         const userDoc = querySnapshot.docs[0];
  //         const userData = userDoc.data();
  //         setIsNewUser(!userData.uid);

  //       } else {
  //         setIsNewUser(true); // new user
  //       }

  //     } catch (err) {
  //       console.error("Error checking user:", err.message);
  //     }
  //   }

  //   // PASSWORD VALIDATION
  //   if (name === "password") {
  //     const passwordRegex =
  //       /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

  //     if (!passwordRegex.test(value)) {
  //       setError(
  //         "Password must be at least 8 characters long and include a letter, a number, and a special character."
  //       );
  //       return;

  //     } else {
  //       setError("");
  //     }

  //     // check match with confirmPassword
  //     if (confirmPassword && value !== confirmPassword) {
  //       setError("Passwords do not match.");

  //     } else {
  //       setError("");
  //     }
  //   }

  //   if (name === "confirmPassword") {
  //     // Check match after password and confirmPassword are both typed
  //     if (value !== formData.password) {
  //       setError("Passwords do not match.");

  //     } else {
  //       setError("");
  //     }
  //   }
  // };

  // const handleChange = async (e) => {
  //   const { name, value } = e.target;

  //   // Update form data first
  //   if (name === "confirmPassword") {
  //     setConfirmPassword(value);

  //   } else {
  //     setFormData((prev) => ({ ...prev, [name]: value }));
  //   }

  //   // EMAIL CHECK
  //   if (name === "email") {
  //     const isValidEmail = /\S+@\S+\.\S+/.test(value);
  //     if (!isValidEmail) {
  //       setIsNewUser(false);
  //       setEmailChecked(false); // ❗ reset email checked
  //       return;
  //     }

  //     try {
  //       const usersRef = collection(db, "accounts");
  //       const q = query(usersRef, where("email", "==", value));
  //       const querySnapshot = await getDocs(q);

  //       if (!querySnapshot.empty) {
  //         const userDoc = querySnapshot.docs[0];
  //         const userData = userDoc.data();
  //         setIsNewUser(!userData.uid);
  //         setEmailChecked(true); // ✅ mark email as checked

  //       } else {
  //         setIsNewUser(true); // new user
  //         setEmailChecked(true); // ✅ mark email as checked
  //       }

  //     } catch (err) {
  //       console.error("Error checking user:", err.message);
  //     }
  //   }

  //   // PASSWORD VALIDATION
  //   if (name === "password") {
  //     const passwordRegex =
  //       /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

  //     // if (!passwordRegex.test(value)) {
  //     //   setError(
  //     //     "Password must be at least 8 characters long and include a letter, a number, and a special character."
  //     //   );
  //     //   return;
  //     // } else {
  //     //   setError("");
  //     // }

  //     // check match with confirmPassword
  //     if (confirmPassword && value !== confirmPassword) {
  //       setError("Passwords do not match.");

  //     } else {
  //       setError("");
  //     }
  //   }

  //   if (name === "confirmPassword") {
  //     // Check match after password and confirmPassword are both typed
  //     if (value !== formData.password) {
  //       setError("Passwords do not match.");

  //     } else {
  //       setError("");
  //     }
  //   }
  // };

  //  const handleChange = async (e) => {
  //   const { name, value } = e.target;

  //   // Update form data first
  //   if (name === "confirmPassword") {
  //     setConfirmPassword(value);

  //   } else {
  //     setFormData((prev) => ({ ...prev, [name]: value }));
  //   }

  //   // EMAIL CHECK
  //   if (name === "email") {
  //     const trimmedValue = value.trim();
  //     const isValidEmail = /\S+@\S+\.\S+/.test(trimmedValue);
      
  //     setEmailChecked(false); 
      
  //     // if (!isValidEmail) {
  //     //   setIsNewUser(false);
  //     //   setEmailChecked(false); // ❗ reset email checked
  //     //   return;
  //     // }

  //     if (emailDebounceRef.current) {
  //       clearTimeout(emailDebounceRef.current);
  //     }

  //   emailDebounceRef.current = setTimeout(async () => {
  //     if (!isValidEmail) {
  //       setIsNewUser(false);
  //       setEmailChecked(false);
  //       return;
  //     }

  //     try {
  //       const usersRef = collection(db, "accounts");
  //       const q = query(usersRef, where("email", "==", value));
  //       const querySnapshot = await getDocs(q);

  //       if (!querySnapshot.empty) {
  //         const userDoc = querySnapshot.docs[0];
  //         const userData = userDoc.data();
  //         setIsNewUser(!userData.uid);
  //         setEmailChecked(true); // ✅ mark email as checked

  //       } else {
  //         setIsNewUser(true); // new user
  //         setEmailChecked(true); // ✅ mark email as checked
  //       }
  //     } catch (err) {
  //       console.error("Error checking user:", err.message);
  //     }
  //     }, 700); // Debounce time (ms)
  // }

  //   // PASSWORD VALIDATION
  //   if (name === "password") {
  //     const passwordRegex =
  //       /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

  //     // if (!passwordRegex.test(value)) {
  //     //   setError(
  //     //     "Password must be at least 8 characters long and include a letter, a number, and a special character."
  //     //   );
  //     //   return;
  //     // } else {
  //     //   setError("");
  //     // }

  //     // check match with confirmPassword
  //     if (confirmPassword && value !== confirmPassword) {
  //       setError("Passwords do not match.");
  //     } else {
  //       setError("");
  //     }
  //   }

  //   if (name === "confirmPassword") {
  //     // Check match after password and confirmPassword are both typed
  //     if (value !== formData.password) {
  //       setError("Passwords do not match.");
  //     } else {
  //       setError("");
  //     }
  //   }
  // };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    // Update form data first
    if (name === "confirmPassword") {
      setConfirmPassword(value);

    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // EMAIL CHECK
    if (name === "email") {
      const trimmedValue = value.trim();
      const isValidEmail = /\S+@\S+\.\S+/.test(trimmedValue);
      
      setEmailChecked(false); 
      
      // if (!isValidEmail) {
      //   setIsNewUser(false);
      //   setEmailChecked(false); // ❗ reset email checked
      //   return;
      // }

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

  // const handleSignUpChange = (e) => {
  //   const { name, value } = e.target;

  //   if (name === "jobTitle") {
  //     let filteredDepts = [];

  //     if (value === "Faculty") {
  //       filteredDepts = departmentsAll.map((dept) => dept.name);

  //     } else if (value === "Program Chair") {
  //       filteredDepts = departmentsAll
  //         .map((dept) => dept.name)
  //         .filter((name) => name !== "SHS");

  //     } else {
  //       filteredDepts = departmentOptionsByJobTitle[value] || [];
  //     }

  //     const autoDept = value === "Laboratory Custodian" ? "SAH" : "";

  //     setSignUpData({
  //       ...signUpData,
  //       jobTitle: value,
  //       department: autoDept, 
  //     });

  //     setCurrentDepartments(filteredDepts);

  //   } else {
  //     // Set the field value
  //     setSignUpData({
  //       ...signUpData,
  //       [name]: value
  //     });

  //     // If the changed field is email, validate the domain
  //     if (name === "email") {
  //       const validDomains = ["nu-moa.edu.ph", "students.nu-moa.edu.ph"];
  //       const parts = value.split("@");
  //       const emailDomain = parts.length > 1 ? parts[1] : "";

  //       if (!validDomains.includes(emailDomain)) {
  //         setError("Only @nu-moa.edu.ph and @students.nu-moa.edu.ph emails are allowed.");

  //       } else {
  //         setError(""); // Clear error if valid
  //       }
  //     }
  //   }
  // };

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
  
  // FRONTEND
  // const checkUserAndLogin = async () => {
  //   setIsLoading(true);
  
  //   try {
  //     const { email, password } = formData;
  //     const usersRef = collection(db, "accounts");
  //     const q = query(usersRef, where("email", "==", email));
  //     const querySnapshot = await getDocs(q);
  
  //     let userDoc, userData, isSuperAdmin = false;
  
  //     // 🔎 First check regular accounts
  //     if (!querySnapshot.empty) {
  //       userDoc = querySnapshot.docs[0];
  //       userData = userDoc.data();

  //     } else {
  //       // 🔎 Then check if it's a super-admin
  //       const superAdminRef = collection(db, "super-admin");
  //       const superAdminQuery = query(superAdminRef, where("email", "==", email));
  //       const superAdminSnapshot = await getDocs(superAdminQuery);
  
  //       if (!superAdminSnapshot.empty) {
  //         userDoc = superAdminSnapshot.docs[0];
  //         userData = userDoc.data();
  //         isSuperAdmin = true;
  //       }
  //     }
  
  //     if (!userData) {
  //       setError("User not found. Please contact admin.");
  //       setIsLoading(false);
  //       return;
  //     }

  //     if (userData.disabled) {
  //       setError("Your account has been disabled.");
  //       await signOut(auth);
  //       setIsLoading(false);
  //       return;
  //     }
  
  //     // 🧷 If password not set yet (new user)
  //     if (!isSuperAdmin && !userData.uid) {
  //       setIsNewUser(true);
  //       setIsLoading(false);
  //       return;
  //     }
  
  //     // 🔒 Block check
  //     // if (userData.isBlocked && userData.blockedUntil) {
  //     //   const now = Timestamp.now().toMillis();
  //     //   const blockedUntil = userData.blockedUntil.toMillis();
  
  //     //   if (now < blockedUntil) {
  //     //     const remainingTime = Math.ceil((blockedUntil - now) / 1000);
  //     //     setError(`Account is blocked. Try again after ${remainingTime} seconds.`);
  //     //     setIsLoading(false);
  //     //     return;

  //     //   } else {
  //     //     await updateDoc(userDoc.ref, {
  //     //       isBlocked: false,
  //     //       loginAttempts: 0,
  //     //       blockedUntil: null,
  //     //     });
          
  //     //   }
  //     // }
  
  //     // 🧠 Super-admin login (Firestore password)
  //     if (isSuperAdmin) {
  //       if (userData.password === password) {
  //         await updateDoc(userDoc.ref, { loginAttempts: 0 });
  
  //         const userName = userData.name || "Super Admin";
  //         localStorage.setItem("userId", userDoc.id);
  //         localStorage.setItem("userEmail", userData.email);
  //         localStorage.setItem("userName", userName);
  //         localStorage.setItem("userDepartment", userData.department || "Admin");
  //         localStorage.setItem("userPosition", "super-admin");
  //         localStorage.setItem("userJobTitle", userData.jobTitle || "User");
  
  //         navigate("/main/accounts", { state: { loginSuccess: true, role: "super-admin" } });
  
  //       } else {
  //         // const newAttempts = (userData.loginAttempts || 0) + 1;
  
  //         // if (newAttempts >= 4) {
  //         //   const unblockTime = Timestamp.now().toMillis() + 30 * 60 * 1000; // 30 minutes
  //         //   await updateDoc(userDoc.ref, {
  //         //     isBlocked: true,
  //         //     blockedUntil: Timestamp.fromMillis(unblockTime),
  //         //   });
  
  //         //   setError("Super Admin account blocked. Try again after 30 minutes.");

  //         // } else {
  //         //   await updateDoc(userDoc.ref, { loginAttempts: newAttempts });
  //         //   setError(`Invalid password. ${4 - newAttempts} attempts remaining.`);
  //         // }
  //         setError(`Invalid password.`);
  //       }
  
  //     } else {
  //       // ✅ Firebase Auth login for regular users/admins
  //       try {
  //         await signInWithEmailAndPassword(auth, email, password);
  
  //         await updateDoc(userDoc.ref, { loginAttempts: 0 });
  
  //         let role = (userData.role || "user").toLowerCase().trim().replace(/[\s_]/g, '-');
  //         if (role === "admin1" || role === "admin2") {
  //           role = "admin";
  //         }
  
  //         const userName = userData.name || "User";
  //         localStorage.setItem("userId", userDoc.id);
  //         localStorage.setItem("userEmail", userData.email);
  //         localStorage.setItem("userName", userName);
  //         localStorage.setItem("userDepartment", userData.department || "");
  //         // localStorage.setItem("userPosition", userData.role || "User");
  //         localStorage.setItem("userPosition", role);
  //         localStorage.setItem("userJobTitle", userData.jobTitle || "User");

  //         await addDoc(collection(db, `accounts/${userDoc.id}/activitylog`), {
  //           action: "User Logged In (Website)",
  //           userName: userData.name || "User",
  //           timestamp: serverTimestamp(),
  //         });          
  
  //         switch (role) {
  //           case "admin":
  //             navigate("/main/dashboard", { state: { loginSuccess: true, role } });
  //             break;

  //           case "super-user":
  //             navigate("/main/dashboard", { state: { loginSuccess: true, role } });
  //             break;

  //           case "user":
  //             navigate("/main/requisition", { state: { loginSuccess: true, role } });
  //             break;

  //           default:
  //             setError("Unknown role. Please contact admin.");
  //             break;
  //         }
  
  //       } catch (authError) {
  
  //         const newAttempts = (userData.loginAttempts || 0) + 1;
  
  //         // if (newAttempts >= 4) {
  //         //   const unblockTime = Timestamp.now().toMillis() + 30 * 60 * 1000;
  //         //   await updateDoc(userDoc.ref, {
  //         //     isBlocked: true,
  //         //     blockedUntil: Timestamp.fromMillis(unblockTime),
  //         //   });
  
  //         //   setError("Account blocked after 4 failed attempts. Try again after 30 minutes.");

  //         // } else {
  //         //   await updateDoc(userDoc.ref, { loginAttempts: newAttempts });
  //         //   setError(`Invalid password. ${4 - newAttempts} attempts remaining.`);
  //         // }
  //         setError(`Invalid password.`);
  //         setIsLoading(false);
  //       }
  //     }
  
  //   } catch (error) {
  //     setError("Unexpected error. Please try again.");

  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // LOGIN WITH VERIFICATION
  // const checkUserAndLogin = async () => {
  //   setIsLoading(true);

  //   try {
  //     const { email, password } = formData;
  //     const usersRef = collection(db, "accounts");
  //     const q = query(usersRef, where("email", "==", email));
  //     const querySnapshot = await getDocs(q);

  //     let userDoc, userData, isSuperAdmin = false;

  //     // Check regular accounts
  //     if (!querySnapshot.empty) {
  //       userDoc = querySnapshot.docs[0];
  //       userData = userDoc.data();
  //     } else {
  //       // Check super-admin
  //       const superAdminRef = collection(db, "super-admin");
  //       const superAdminQuery = query(superAdminRef, where("email", "==", email));
  //       const superAdminSnapshot = await getDocs(superAdminQuery);

  //       if (!superAdminSnapshot.empty) {
  //         userDoc = superAdminSnapshot.docs[0];
  //         userData = userDoc.data();
  //         isSuperAdmin = true;
  //       }
  //     }

  //     if (!userData) {
  //       setError("User not found. Please contact admin.");
  //       setIsLoading(false);
  //       return;
  //     }

  //     if (userData.disabled) {
  //       setError("Your account has been disabled.");
  //       await signOut(auth);
  //       setIsLoading(false);
  //       return;
  //     }

  //     // New user without password set yet
  //     if (!isSuperAdmin && !userData.uid) {
  //       setIsNewUser(true);
  //       setIsLoading(false);
  //       return;
  //     }

  //     if (isSuperAdmin) {
  //       // Super-admin login using Firestore-stored password
  //       if (userData.password === password) {
  //         await updateDoc(userDoc.ref, { loginAttempts: 0 });

  //         const userName = userData.name || "Super Admin";
  //         localStorage.setItem("userId", userDoc.id);
  //         localStorage.setItem("userEmail", userData.email);
  //         localStorage.setItem("userName", userName);
  //         localStorage.setItem("userDepartment", userData.department || "Admin");
  //         localStorage.setItem("userPosition", "super-admin");
  //         localStorage.setItem("userJobTitle", userData.jobTitle || "User");

  //         navigate("/main/accounts", { state: { loginSuccess: true, role: "super-admin" } });

  //       } else {
  //         setError("Invalid password.");
  //       }

  //     } else {
  //       // Firebase Auth login for regular users/admins
  //       try {
  //         const userCredential = await signInWithEmailAndPassword(auth, email, password);
  //         const signedInUser = userCredential.user;

  //         // Force reload to ensure latest email verification status
  //         await signedInUser.reload();
  //         const refreshedUser = auth.currentUser;

  //         if (!refreshedUser || !refreshedUser.emailVerified) {
  //           await signOut(auth);
  //           setError("Please verify your email before logging in.");
  //           setIsLoading(false);
  //           return;
  //         }

  //         await updateDoc(userDoc.ref, { loginAttempts: 0 });

  //         let role = (userData.role || "user").toLowerCase().trim().replace(/[\s_]/g, '-');
  //         if (role === "admin1" || role === "admin2") {
  //           role = "admin";
  //         }

  //         const userName = userData.name || "User";
  //         localStorage.setItem("userId", userDoc.id);
  //         localStorage.setItem("userEmail", userData.email);
  //         localStorage.setItem("userName", userName);
  //         localStorage.setItem("userDepartment", userData.department || "");
  //         localStorage.setItem("userPosition", role);
  //         localStorage.setItem("userJobTitle", userData.jobTitle || "User");

  //         await addDoc(collection(db, `accounts/${userDoc.id}/activitylog`), {
  //           action: "User Logged In (Website)",
  //           userName,
  //           timestamp: serverTimestamp(),
  //         });

  //         switch (role) {
  //           case "admin":
  //           case "super-user":
  //             navigate("/main/dashboard", { state: { loginSuccess: true, role } });
  //             break;
              
  //           case "user":
  //             navigate("/main/requisition", { state: { loginSuccess: true, role } });
  //             break;

  //           default:
  //             setError("Unknown role. Please contact admin.");
  //             break;
  //         }

  //       } catch (authError) {
  //         console.error("Firebase Auth login failed:", authError.message);
  //         setError("Invalid password.");
  //       }
  //     }

  //   } catch (error) {
  //     console.error("Error during login:", error.message);
  //     setError("Unexpected error. Please try again.");

  //   } finally {
  //       setIsLoading(false);
  //     }
  //   };

  // BACKEND LOGIN
  const checkUserAndLogin = async () => {
    setIsLoading(true);
    try {
      const { email, password } = formData;
      
      // Don't use client-side Firebase auth - let backend handle all authentication
      // This prevents Firebase from auto-verifying emails on successful sign-in
      
      const response = await axios.post("https://webnuls.onrender.com/login", { email, password });
      const data = response.data;
      const user = data.user;

      if (!user) {
        setError("Invalid response from server.");
        setIsLoading(false);
        return;
      }
      console.log("User role from backend:", user.role);

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

      console.log("User role from backend:", user.role);

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

  // const handleRegisterPassword = async () => {
  //   const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

  //   if (!passwordRegex.test(formData.password)) {
  //     setError("Password must be at least 8 characters long and include at least one letter, one number, and one special character.");
  //     return;
  //   }

  //   if (formData.password !== confirmPassword) {
  //     setError("Passwords do not match.");
  //     return;
  //   }

  //   setIsLoading(true)
  
  //   try {
  //     const { email, password } = formData;
  //     const usersRef = collection(db, "accounts");
  //     const q = query(usersRef, where("email", "==", email.trim().toLowerCase()));
  //     const querySnapshot = await getDocs(q);
  
  //     if (!querySnapshot.empty) {
  //       const userDoc = querySnapshot.docs[0];
  //       const userData = userDoc.data();
  //       const role = (userData.role || "user").toLowerCase();
  //       const normalizedRole = role === "admin1" || role === "admin2" ? "admin" : role;
  

  //       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  //       const firebaseUser = userCredential.user;
  

  //       await updateDoc(userDoc.ref, {
  //         uid: firebaseUser.uid
  //         // ❌ remove this: password: password
  //       });
  
  //       const userName = userData.name || "User";
  //       localStorage.setItem("userEmail", userData.email);
  //       localStorage.setItem("userName", userName);
  //       localStorage.setItem("userDepartment", userData.department || "Unknown");
  //       localStorage.setItem("userPosition", userData.role || "User");
  //       localStorage.setItem("userJobTitle", userData.jobTitle || "User");
  
  //       switch (normalizedRole) {
  //         case "super-admin":
  //           navigate("/main/accounts", { state: { loginSuccess: true, role: "super-admin" } });
  //           break;

  //         case "admin":
  //           navigate("/main/dashboard", { state: { loginSuccess: true, role: "admin" } });
  //           break;

  //         case "super-user":
  //           navigate("/main/dashboard", { state: { loginSuccess: true, role: "admin" } });
  //           break;

  //         case "user":
  //           navigate("/main/requisition", { state: { loginSuccess: true, role: "user" } });
  //           break;

  //         default:
  //           setError("Unknown role. Please contact admin.");
  //           return;
  //       }
  
  //       setIsNewUser(false);
  
  //     } else {
  //       setError("User record not found in Firestore.");
  //       setIsLoading(false);
  //     }
  
  //   } catch (error) {
  //     if (error.code === "auth/email-already-in-use") {
  //       setError("Email already in use. Try logging in instead.");
  //       setIsLoading(false);

  //     } else {
  //       setError("Failed to set password. Try again.");
  //       setIsLoading(false);
  //     }

  //   } finally {
  //     setIsLoading(false); 
  //   }
  // };

  const handleRegisterPassword = async () => {
    // This function is no longer needed since Firebase Auth users are created during signup
    // Users should use the normal signup flow instead
    setError("Please use the signup form to create a new account.");
  };

  // FRONTEND
  // const handleSignUp = async () => {
  //   const { name, email, employeeId, password, confirmPassword, jobTitle, department } = signUpData;
  //   const auth = getAuth();
  //   setIsLoading(true)

  //   const formattedName = capitalizeWords(name);

  //   if (!termsChecked) {
  //     setError("You must accept the terms and conditions before signing up.");
  //     setIsLoading(false);
  //     return;
  //   }

  //   // Step 0: Validate employee ID format
  //   const employeeIdPattern = /^\d{2}-\d{4}$/;
  //   if (!employeeIdPattern.test(employeeId.trim())) {
  //     setError("Invalid employee ID format. Please use the format ##-#### (e.g., 12-3456).");
  //     setIsLoading(false);
  //     return;
  //   }
  
  //   // Step 1: Ensure the email domain is valid
  //   const validDomains = ["nu-moa.edu.ph", "students.nu-moa.edu.ph"];
  //   const emailDomain = email.split('@')[1];
  
  //   if (!validDomains.includes(emailDomain)) {
  //     setError("Invalid email domain. Only @nu-moa.edu.ph and @students.nu-moa.edu.ph are allowed.");
  //     setIsLoading(false);
  //     return;
  //   }
  
  //   // Step 2: Ensure passwords match
  //   if (password !== confirmPassword) {
  //     setError("Passwords do not match.");
  //     setIsLoading(false);
  //     return;
  //   }

  //   // Step 2.1: Validate department if jobTitle is not 'Laboratory Custodian'
  //   if (
  //     jobTitle.toLowerCase() !== "laboratory custodian" &&
  //     (!department || department.trim() === "")
  //   ) {
  //     setError("Please select a department.");
  //     setIsLoading(false);
  //     return;
  //   }

  //   try {
  //     // Step 3: Check if the employeeId already exists in Firestore in both 'pendingaccounts' and 'accounts'
  //     const employeeQueryPending = query(
  //       collection(db, "pendingaccounts"),
  //       where("employeeId", "==", employeeId.trim())
  //     );
  //     const employeeQueryAccounts = query(
  //       collection(db, "accounts"),
  //       where("employeeId", "==", employeeId.trim())
  //     );
  
  //     const emailQueryPending = query(
  //       collection(db, "pendingaccounts"),
  //       where("email", "==", email.trim().toLowerCase())
  //     );
      
  //     const emailQueryAccounts = query(
  //       collection(db, "accounts"),
  //       where("email", "==", email.trim().toLowerCase())
  //     );
  
  //     const [
  //       employeeSnapshotPending,
  //       employeeSnapshotAccounts,
  //       emailSnapshotPending,
  //       emailSnapshotAccounts,
  //     ] = await Promise.all([
  //       getDocs(employeeQueryPending),
  //       getDocs(employeeQueryAccounts),
  //       getDocs(emailQueryPending),
  //       getDocs(emailQueryAccounts),
  //     ]);
  
  //     if (!employeeSnapshotPending.empty || !employeeSnapshotAccounts.empty) {
  //       setError("This employee ID is already registered.");
  //       setIsLoading(false);
  //       return;
  //     }
  
  //     if (!emailSnapshotPending.empty || !emailSnapshotAccounts.empty) {
  //       setError("This email is already registered.");
  //       setIsLoading(false);
  //       return;
  //     }
  
  //     // Step 5: Determine the role based on the job title
  //     // let role = "user"; 
  //     // if (jobTitle.toLowerCase() === "dean") {
  //     //   role = "admin";

  //     // } else if (jobTitle.toLowerCase() === "program chair") {
  //     //   role = "admin";

  //     // } else if (jobTitle.toLowerCase().includes("custodian")) {
  //     //   role = "super-user";

  //     // } else if (jobTitle.toLowerCase() === "faculty") {
  //     //   role = "user";
  //     // }

  //     // Step 5: Determine the role based on the job title and department
  //     let role = "user"; 

  //     if (jobTitle.toLowerCase() === "dean") {
  //       if (department.toLowerCase() === "sah") {
  //         role = "admin";

  //       } else {
  //         role = "user";
  //       }
  //     } else if (jobTitle.toLowerCase() === "program chair") {
  //       role = "admin";

  //     } else if (jobTitle.toLowerCase().includes("custodian")) {
  //       role = "super-user";

  //     } else if (jobTitle.toLowerCase() === "faculty") {
  //       role = "user";
  //     }

  //       // Save data to 'pendingaccounts' collection without creating the Firebase Auth user
  //     const sanitizedData = {
  //       // name: name.trim().toLowerCase(),
  //       name: formattedName,
  //       email: email.trim().toLowerCase(),
  //       employeeId: employeeId.trim().replace(/[^\d-]/g, ''),
  //       jobTitle,
  //       department,
  //       role, // Function to determine role based on job title
  //       createdAt: serverTimestamp(),
  //       status: "pending",
  //       // password, // Include password here temporarily for approval process
  //     };

  //     await addDoc(collection(db, "pendingaccounts"), sanitizedData);

  //    // Step 6.1: Send confirmation email
  //     await fetch('https://sendemail-guopzbbmca-uc.a.run.app', {  // Use your deployed URL here
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         to: email.trim().toLowerCase(),
  //         subject: "Account Registration - Pending Approval",
  //         text: `Hi ${name},\n\nThank you for registering. Your account is now pending approval from the ITSO.\n\nRegards,\nNU MOA ITSO Team`,
  //         html: `<p>Hi ${name},</p><p>Thank you for registering. Your account is now <strong>pending approval</strong> from the ITSO.</p><p>Regards,<br>NU MOA ITSO Team</p>`,
  //       }),
  //     });
  
  //     // Step 7: Set the modal message and show the modal
  //     setModalMessage("Successfully Registered! Please check your email junk for the status. Your account is pending approval from the ITSO.");
  //     setIsModalVisible(true); // Open the modal
  
  //     // Clear input fields after successful registration
  //     setSignUpData({
  //       name: "",
  //       email: "",
  //       employeeId: '',
  //       password: "",
  //       confirmPassword: "",
  //       jobTitle: "",
  //       department: "",
  //     });
  
  //   } catch (error) {


  //     if (error.code === "auth/email-already-in-use") {
  //       setError("Email already in use.");
  //       setIsLoading(false);

  //     } else {
  //       setError("Failed to create account. Try again.");
  //       setIsLoading(false);
  //     }
      
  //   } finally{
  //     setIsLoading(false)
  //     setSignUpMode(false)
  //   }
  // };

  // BACKEND
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
          {/* <div className="image-div">
            <img src={trybg2} alt="This is the image" />
              
          </div> */}

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
                    {/* <input
                      type="text"
                      name="name"
                      value={signUpData.name}
                      onChange={handleSignUpChange}
                      placeholder="enter name"
                      required
                    /> */}

                    
                    {/* <input
                      type="text"
                      name="name"
                      value={signUpData.name}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // Allow letters and spaces only
                        handleSignUpChange({ target: { name: "name", value } });
                      }}
                      onKeyDown={(e) => {
                        // Block numbers and special characters (but allow backspace, tab, etc.)
                        const allowedKeys = [
                          "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete", " ", // space
                        ];
                        const isLetter = /^[a-zA-Z]$/.test(e.key);
                        if (!isLetter && !allowedKeys.includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="enter name"
                      required
                    /> */}

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

                  {/* <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={signUpData.email}
                      onChange={handleSignUpChange}
                      placeholder="enter email (NU account)"
                      required
                    />
                    {error && <p className="error-message">{error}</p>}
                  </div> */}

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
                    {/* <select
                      name="department"
                      value={signUpData.department}
                      onChange={handleSignUpChange}
                      required={signUpData.jobTitle !== "Laboratory Custodian"}
                      disabled={!signUpData.jobTitle || signUpData.jobTitle === "Laboratory Custodian"}
                      style={{width: '100%'}}
                    >
                      <option value="">Select Department</option>
                        {currentDepartments.map((dept) => (
                          <option key={dept} value={dept}>{dept}
                      </option>
                      ))}
                    </select> */}

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
                  
                  {/* <div className="form-group password-group">
                    <label>Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={signUpData.password}
                        placeholder="create password"
                        onChange={handleSignUpChange}
                        required
                      />
                      <span
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "🔒" : "👁️"}
                      </span>
                    </div>
                  </div>
  
                  <div className="form-group password-group">
                    <label>Confirm Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={signUpData.confirmPassword}
                        placeholder="re-enter password"
                        onChange={handleSignUpChange}
                        required
                      />
                      <span
                        className="toggle-password"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? "🔒" : "👁️"}
                      </span>
                    </div>
                  </div> */}
  
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

                    {/* {error && <p className="error-message">{error}</p>} */}
                  </div>
                </>
              ) : (
                <>

                  {/* Login Fields */}
                  {/* <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email"
                    />
                  </div> */}

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
  
                  {/* {isNewUser && (
                    <div className="form-group password-group">
                      <label>Confirm Password</label>
                      <div className="password-wrapper">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Confirm your password"
                        />
                        <span
                          className="toggle-password"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? "🔒" : "👁️"}
                        </span>
                      </div>
                        <small className="password-hint" style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>
                          Password must be at least 8 characters and include a letter, a number, and a special character.
                        </small>
                    </div>
                  )}
                </>
              )} */}

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
              <div className="password-validation" style={{
                marginTop: "10px",
                padding: "10px",
                backgroundColor: "#f8f9fa",
                borderRadius: "5px",
                border: "1px solid #e9ecef"
              }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "500", color: "#495057" }}>
                  Password Requirements:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: passwordResetValidation.hasLength ? "#28a745" : "#dc3545" }}>
                      {passwordResetValidation.hasLength ? "✓" : "✗"}
                    </span>
                    <span style={{ fontSize: "13px", color: passwordResetValidation.hasLength ? "#28a745" : "#6c757d" }}>
                      At least 8 characters
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: passwordResetValidation.hasUppercase ? "#28a745" : "#dc3545" }}>
                      {passwordResetValidation.hasUppercase ? "✓" : "✗"}
                    </span>
                    <span style={{ fontSize: "13px", color: passwordResetValidation.hasUppercase ? "#28a745" : "#6c757d" }}>
                      One uppercase letter
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: passwordResetValidation.hasLowercase ? "#28a745" : "#dc3545" }}>
                      {passwordResetValidation.hasLowercase ? "✓" : "✗"}
                    </span>
                    <span style={{ fontSize: "13px", color: passwordResetValidation.hasLowercase ? "#28a745" : "#6c757d" }}>
                      One lowercase letter
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: passwordResetValidation.hasNumber ? "#28a745" : "#dc3545" }}>
                      {passwordResetValidation.hasNumber ? "✓" : "✗"}
                    </span>
                    <span style={{ fontSize: "13px", color: passwordResetValidation.hasNumber ? "#28a745" : "#6c757d" }}>
                      One number
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: passwordResetValidation.hasSpecial ? "#28a745" : "#dc3545" }}>
                      {passwordResetValidation.hasSpecial ? "✓" : "✗"}
                    </span>
                    <span style={{ fontSize: "13px", color: passwordResetValidation.hasSpecial ? "#28a745" : "#6c757d" }}>
                      One special character (@$!%*#?&)
                    </span>
                  </div>
                  {passwordResetData.confirmNewPassword && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: passwordResetValidation.matches ? "#28a745" : "#dc3545" }}>
                        {passwordResetValidation.matches ? "✓" : "✗"}
                      </span>
                      <span style={{ fontSize: "13px", color: passwordResetValidation.matches ? "#28a745" : "#6c757d" }}>
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
