import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ImageBackground, TouchableOpacity, UIManager, LayoutAnimation, StatusBar, Image, BackHandler, Alert, Modal } from 'react-native';
import { Input, Text, Icon } from 'react-native-elements';
import { TextInput, Card, HelperText, Menu, Provider, Button } from 'react-native-paper';
import { useAuth } from '../components/contexts/AuthContext';
import { db, auth } from '../backend/firebase/FirebaseConfig';
import { collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp, Timestamp, setDoc, doc, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, getAuth, updatePassword, sendEmailVerification } from 'firebase/auth';
import styles from './styles/LoginStyle';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from './customs/CustomButton';
import ForgotPasswordModal from './ForgotPasswordModal';
import TermsModal from './customs/TermsModal';
import {Animated} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { registerForPushNotificationsAsync } from '../utils/RegisterPushToken';
import { color } from 'react-native-elements/dist/helpers';

export default function LoginScreen({navigation}) {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isForgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [isSignup, setIsSignup] = useState(null);
  const [employeeID, setEmployeeID] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [jobMenuVisible, setJobMenuVisible] = useState(false);
  const [deptMenuVisible, setDeptMenuVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsModalVisible, setTermsModalVisible] = useState(false);
  const [deptOptions, setDeptOptions] = useState([]);
  const [departmentsAll, setDepartmentsAll] = useState([]);
  const [isLoginSignup, setIsLoginSignup] = useState(false)
  const [emailError, setEmailError] = useState('');
  const nameBorderAnim = useRef(new Animated.Value(0)).current;
  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const employeeIDBorderAnim = useRef(new Animated.Value(0)).current;
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;
  const confirmPasswordBorderAnim = useRef(new Animated.Value(0)).current;
  const [jobTitleError, setJobTitleError] = useState('');
  const [departmentError, setDepartmentError] = useState('');
  const [nameError, setNameError] = useState('');
  const [signUpEmailError, setSignUpEmailError] = useState('');
  const [employeeIDError, setEmployeeIDError] = useState('');
  const [signUpPasswordError, setSignUpPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // Password reset modal states
  const [isPasswordResetModalVisible, setIsPasswordResetModalVisible] = useState(false);
  const [passwordResetData, setPasswordResetData] = useState({
    newPassword: "",
    confirmNewPassword: ""
  });
  const [passwordResetError, setPasswordResetError] = useState("");
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  const [focusStates, setFocusStates] = useState({
  name: false,
  email: false,
  employeeID: false,
  password: false,
  confirmPassword: false,
});

useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "departments"),
    (snapshot) => {
      const depts = snapshot.docs
        .map((doc) => doc.data().name)
        .sort((a, b) => a.localeCompare(b));
      setDepartmentsAll(depts);
    },
    (error) => {
      console.error("Error fetching departments:", error);
    }
  );

  return () => unsubscribe();
}, []);

// useEffect(() => {
//   if (!jobTitle) {
//     setDeptOptions([]);
//     return;
//   }

//   if (jobTitle === "Faculty") {
//     setDeptOptions(departmentsAll); 

//   } else if (jobTitle === "Program Chair") {
//     setDeptOptions(departmentsAll.filter((dept) => dept !== "SHS"));

//   } else if (jobTitle === "Dean") {
//     setDeptOptions(["SAH", "SAS", "SOO", "SOD"]); 
    
//   } else {
//     setDeptOptions([]); // default
//   }

//   setDepartment(""); 
// }, [jobTitle, departmentsAll]);

useEffect(() => {
  if (!jobTitle) {
    setDeptOptions([]);
    setDepartment("");
    return;
  }

  if (jobTitle === "Faculty") {
    setDeptOptions(departmentsAll);
    setDepartment("");
    
  } else if (jobTitle === "Program Chair") {
    setDeptOptions(departmentsAll.filter((dept) => dept !== "SHS"));
    setDepartment("");

  } else if (jobTitle === "Dean") {
    setDeptOptions(["SAH", "SAS", "SOO", "SOD"]);
    setDepartment("");

  } else if (jobTitle === "Laboratory Custodian") {
    setDeptOptions(["SAH"]);
    setDepartment("SAH");

  } else {
    setDeptOptions([]);
    setDepartment("");
  }
}, [jobTitle, departmentsAll]);

const validateFields = () => {
  let valid = true;

  if (!jobTitle) {
    setJobTitleError('Job Title is required.');
    valid = false;

  } else {
    setJobTitleError('');
  }

  if (!department) {
    setDepartmentError('Department is required.');
    valid = false;

  } else {
    setDepartmentError('');
  }

  return valid;
};

const handleFocus = (field) => {
  setFocusStates((prev) => ({ ...prev, [field]: true }));
  animateBorder(field, 1);
};

const handleBlur = (field) => {
  setFocusStates((prev) => ({ ...prev, [field]: false }));
  animateBorder(field, 0);
};

const animateBorder = (field, toValue) => {
  let animRef = null;

  switch (field) {
    case 'name': animRef = nameBorderAnim; break;
    case 'email': animRef = emailBorderAnim; break;
    case 'employeeID': animRef = employeeIDBorderAnim; break;
    case 'password': animRef = passwordBorderAnim; break;
    case 'confirmPassword': animRef = confirmPasswordBorderAnim; break;
  }

  if (animRef) {
    Animated.timing(animRef, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }
};


const nameBorderColor = nameBorderAnim.interpolate({
  inputRange: [0, 1],
  outputRange: ['#ccc', '#395a7f']
});

const emailBorderColor = emailBorderAnim.interpolate({
  inputRange: [0, 1],
  outputRange: ['#ccc', '#395a7f']
});

const employeeIDBorderColor = employeeIDBorderAnim.interpolate({
  inputRange: [0, 1],
  outputRange: ['#ccc', '#395a7f']
});

const passwordBorderColor = passwordBorderAnim.interpolate({
  inputRange: [0, 1],
  outputRange: ['#ccc', '#395a7f']
});

const confirmPasswordBorderColor = confirmPasswordBorderAnim.interpolate({
  inputRange: [0, 1],
  outputRange: ['#ccc', '#395a7f']
});

  const jobOptions = ['Dean', 'Program Chair', 'Laboratory Custodian', 'Faculty'];
  // const deptOptions = ['Medical Technology', 'Nursing', 'Dentistry', 'Optometry'];

  const handleLogin = async () => {
    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }
    
    setLoginError('');
    setLoading(true);
    
    try {
      // Use Firebase Auth directly for login
      const usersRef = collection(db, "accounts");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      let userDoc, userData, isSuperAdmin = false;

      // First check regular accounts
      if (!querySnapshot.empty) {
        userDoc = querySnapshot.docs[0];
        userData = userDoc.data();

      } else {
        // Then check if it's a super-admin
        const superAdminRef = collection(db, "super-admin");
        const superAdminQuery = query(superAdminRef, where("email", "==", email));
        const superAdminSnapshot = await getDocs(superAdminQuery);

        if (!superAdminSnapshot.empty) {
          isSuperAdmin = true;
          userDoc = superAdminSnapshot.docs[0];
          userData = userDoc.data();
        }
      }

      if (!userData) {
        setLoginError('User not found');
        setLoading(false);
        return;
      }

      if (userData.disabled) {
        setLoginError('Account is disabled');
        setLoading(false);
        return;
      }

      // Check if user is in pendingaccounts (not yet approved)
      const pendingRef = collection(db, "pendingaccounts");
      const pendingQuery = query(pendingRef, where("email", "==", email));
      const pendingSnapshot = await getDocs(pendingQuery);
      
      if (!pendingSnapshot.empty) {
        setLoginError('Account is pending approval from technical admin');
        setLoading(false);
        return;
      }

      // For super-admins, check password directly
      if (isSuperAdmin) {
        if (userData.password !== password) {
          setLoginError('Invalid password');
          setLoading(false);
          return;
        }

        // Super admin login successful
        login({
          id: userDoc.id,
          email: userData.email,
          name: userData.name || "Super Admin",
          department: userData.department || "Admin",
          role: "super-admin",
          jobTitle: userData.jobTitle || "User"
        });

        console.log("Super Admin Login Successful!");
        setLoading(false);
        return;
      }

      // For regular users, check if they have a temporary password
      if (userData.temporaryPassword && !userData.passwordSet) {
        if (userData.temporaryPassword === password) {
          // User is using temporary password - show password reset modal
          setPasswordResetData(prev => ({
            ...prev,
            userEmail: userData.email,
            userId: userDoc.id,
            userName: userData.name,
            userDepartment: userData.department || "",
            userRole: userData.role?.toLowerCase(),
            userJobTitle: userData.jobTitle || "User"
          }));
          
          setIsPasswordResetModalVisible(true);
          setLoading(false);
          return;
        } else {
          setLoginError('Invalid temporary password');
          setLoading(false);
          return;
        }
      }

      // For regular users with set passwords, use Firebase Auth
      if (!userData.uid) {
        setLoginError('User not found in system');
        setLoading(false);
        return;
      }

      // Use Firebase Auth to verify password
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const signedInUser = userCredential.user;

        // Force reload to ensure latest email verification status
        await signedInUser.reload();
        const refreshedUser = auth.currentUser;

        if (!refreshedUser || !refreshedUser.emailVerified) {
          await signOut(auth);
          setLoginError("Please verify your email before logging in. Check your email for the verification link.");
          setLoading(false);
          return;
        }
        
        // Firebase Auth successful and email verified - get user role and login
        const role = (userData.role || "user").toLowerCase();
        login({
          id: userDoc.id,
          email: userData.email,
          name: userData.name || "User",
          department: userData.department || "",
          role: role,
          jobTitle: userData.jobTitle || "User"
        });

        console.log("Login Successful!");
        
      } catch (authError) {
        // Handle Firebase Auth errors with user-friendly messages
        if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
          setLoginError('Invalid password');
        } else if (authError.code === 'auth/user-not-found') {
          setLoginError('User not found');
        } else if (authError.code === 'auth/too-many-requests') {
          setLoginError('Too many failed attempts. Please try again later.');
        } else if (authError.code === 'auth/invalid-email') {
          setLoginError('Invalid email address');
        } else if (authError.code === 'auth/user-disabled') {
          setLoginError('This account has been disabled');
        } else if (authError.code === 'auth/network-request-failed') {
          setLoginError('Network error. Please check your internet connection and try again.');
        } else if (authError.code === 'auth/operation-not-allowed') {
          setLoginError('Login is currently disabled. Please contact support.');
        } else {
          setLoginError('Login failed. Please try again.');
        }
      }

    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };


    const handleSignup = async () => {
        setLoading(true);
        setError("");

        // Clear all previous errors
        setNameError('');
        setSignUpEmailError('');
        setEmployeeIDError('');
        setSignUpPasswordError('');
        setConfirmPasswordError('');
        setJobTitleError('');
        setDepartmentError('');
      
        // Use individual state variables instead of signUpData
        const email = signUpEmail;
        const employeeId = employeeID;
      
        // Step 0: Validate all required fields
        if (!name.trim()) {
          setNameError('Full Name is required.');
          setLoading(false);
          return;
        }

        if (!email.trim()) {
          setSignUpEmailError('Email is required.');
          setLoading(false);
          return;
        }

        if (!employeeId.trim()) {
          setEmployeeIDError('Employee ID is required.');
          setLoading(false);
          return;
        }


        if (!jobTitle) {
          setJobTitleError('Job Title is required.');
          setLoading(false);
          return;
        }

        if (!department) {
          setDepartmentError('Department is required.');
          setLoading(false);
          return;
        }
      
        // Step 1: Validate email domain
        const validDomains = ["nu-moa.edu.ph", "students.nu-moa.edu.ph"];
        const emailDomain = email.split("@")[1];
      
        if (!validDomains.includes(emailDomain)) {
          setSignUpEmailError("Only @nu-moa.edu.ph or @students.nu-moa.edu.ph emails are allowed.");
          setLoading(false);
          return;
        }


        if (!agreedToTerms) {
          setError("You must agree to the Terms and Conditions.");
          setLoading(false);
          return;
        }        
    
        // Step 3: Validate employee ID format (e.g. 12-3456)
        const employeeIdPattern = /^\d{2}-\d{4}$/;
        if (!employeeIdPattern.test(employeeId.trim())) {
          setEmployeeIDError("Invalid employee ID format. Please use ##-#### format.");
          setLoading(false);
          return;
        }

        try {
          // Use Firebase directly for signup
          
          // Check if email already exists in accounts
          const accountsRef = collection(db, "accounts");
          const accountQuery = query(accountsRef, where("email", "==", email.trim().toLowerCase()));
          const accountSnapshot = await getDocs(accountQuery);
          
          if (!accountSnapshot.empty) {
            setError("Email is already registered.");
            setLoading(false);
            return;
          }

          // Check if email already exists in pendingaccounts
          const pendingRef = collection(db, "pendingaccounts");
          const pendingQuery = query(pendingRef, where("email", "==", email.trim().toLowerCase()));
          const pendingSnapshot = await getDocs(pendingQuery);
          
          if (!pendingSnapshot.empty) {
            setError("Email is already registered and pending approval.");
            setLoading(false);
            return;
          }

          // Check if employee ID already exists
          const empIdQuery = query(accountsRef, where("employeeId", "==", employeeId.trim()));
          const empIdSnapshot = await getDocs(empIdQuery);
          
          if (!empIdSnapshot.empty) {
            setError("Employee ID is already registered.");
            setLoading(false);
            return;
          }

          // Check if employee ID already exists in pendingaccounts
          const pendingEmpQuery = query(pendingRef, where("employeeId", "==", employeeId.trim()));
          const pendingEmpSnapshot = await getDocs(pendingEmpQuery);
          
          if (!pendingEmpSnapshot.empty) {
            setError("Employee ID is already registered and pending approval.");
            setLoading(false);
            return;
          }

          // Assign role based on jobTitle and department
          let role = "user";
          const jt = jobTitle.toLowerCase();
          const dept = department.trim().toLowerCase();

          if (jt === "dean" && dept === "sah") {
            role = "admin";
          } else if (jt === "dean") {
            role = "user";
          } else if (jt === "program chair") {
            role = "admin";
          } else if (jt.includes("custodian")) {
            role = "super-user";
          }

          // Generate temporary password
          const generateTemporaryPassword = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
            let password = '';
            // Ensure at least one of each required character type
            password += 'A'; // uppercase
            password += 'a'; // lowercase  
            password += '1'; // number
            password += '!'; // special char
            
            // Fill the rest randomly
            for (let i = 4; i < 12; i++) {
              password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            // Shuffle the password
            return password.split('').sort(() => Math.random() - 0.5).join('');
          };

          const temporaryPassword = generateTemporaryPassword();

          // Create Firebase Auth user
          const userCredential = await createUserWithEmailAndPassword(auth, email, temporaryPassword);
          const uid = userCredential.user.uid;

          // Send email verification
          try {
            await sendEmailVerification(userCredential.user);
            console.log("✅ Email verification sent");
          } catch (emailError) {
            console.error("❌ Failed to send email verification:", emailError.message);
            // Don't fail the signup if email verification fails
          }

          // Add user to pendingaccounts collection
          await addDoc(pendingRef, {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            employeeId: employeeId.trim(),
            jobTitle: jobTitle,
            department: department,
            role: role,
            temporaryPassword: temporaryPassword,
            passwordSet: false,
            uid: uid,
            createdAt: serverTimestamp(),
            termsChecked: agreedToTerms,
            disabled: false,
            loginAttempts: 0,
            status: "pending"
          });

          // Success – show modal with temporary password and email verification info
          const message = `Successfully registered!\n\n📧 Please check your email and verify your email address.\n\nAfter email verification, please wait for admin approval before you can log in.`;
          setModalMessage(message);
          setIsModalVisible(true);

          // Reset state variables
          setName("");
          setSignUpEmail("");
          setEmployeeID("");
          setJobTitle("");
          setDepartment("");
          setError("");
          // Clear all error states
          setNameError("");
          setSignUpEmailError("");
          setEmployeeIDError("");
          setJobTitleError("");
          setDepartmentError("");

          setAgreedToTerms(false);

        } catch (error) {
          console.error("Sign up error:", error.message);
          if (error.code === 'auth/email-already-in-use') {
            setError("Email is already registered.");
          } else if (error.code === 'auth/invalid-email') {
            setError("Invalid email address.");
          } else if (error.code === 'auth/weak-password') {
            setError("Password is too weak.");
          } else if (error.code === 'auth/network-request-failed') {
            setError("Network error. Please check your internet connection and try again.");
          } else if (error.code === 'auth/too-many-requests') {
            setError("Too many attempts. Please try again later.");
          } else if (error.code === 'auth/operation-not-allowed') {
            setError("Account creation is currently disabled. Please contact support.");
          } else {
            setError("Failed to create account. Please try again.");
          }
        } finally {
          setLoading(false);
        }
      };  

  const handlePasswordReset = async () => {
    const { newPassword, confirmNewPassword, userEmail, userId } = passwordResetData;

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
      // Get user document to check if they have a UID
      const userDocRef = doc(db, "accounts", userId);
      const userDoc = await getDocs(query(collection(db, "accounts"), where("email", "==", userEmail)));
      
      if (userDoc.empty) {
        setPasswordResetError("User not found.");
        setPasswordResetLoading(false);
        return;
      }

      const userData = userDoc.docs[0].data();

      if (!userData.uid) {
        setPasswordResetError("User not found in system.");
        setPasswordResetLoading(false);
        return;
      }

      // Update password in Firebase Auth
      try {
        // First, sign in with temporary password to get current user
        await signInWithEmailAndPassword(auth, userEmail, userData.temporaryPassword);
        
        // Update the password
        await updatePassword(auth.currentUser, newPassword);
        
        // Update user document in Firestore
        await updateDoc(userDocRef, {
          passwordSet: true,
          temporaryPassword: null, // Remove temporary password
          passwordResetAt: serverTimestamp(),
        });

        // Log the password reset action
        await addDoc(collection(db, `accounts/${userId}/activitylog`), {
          action: "Password Reset - Temporary Password Replaced",
          userName: userData.name || "User",
          timestamp: serverTimestamp(),
        });

        // Sign out the user so they can log in with new password
        await signOut(auth);

        // Success - close modal and show success message
        setIsPasswordResetModalVisible(false);
        setPasswordResetData({ 
          newPassword: "", 
          confirmNewPassword: "",
          userEmail: "",
          userId: "",
          userName: "",
          userDepartment: "",
          userRole: "",
          userJobTitle: ""
        });
        setModalMessage("Password set successfully! You can now log in with your new password.");
        setIsModalVisible(true);

        // Clear login form
        setEmail("");
        setPassword("");

      } catch (authError) {
        console.error("Firebase Auth password update error:", authError);
        if (authError.code === 'auth/requires-recent-login') {
          setPasswordResetError("Please log out and log back in before changing your password.");
        } else {
          setPasswordResetError("Failed to update password. Please try again.");
        }
      }

    } catch (error) {
      console.error("Password reset error:", error);
      setPasswordResetError("Failed to reset password. Please try again.");
    } finally {
      setPasswordResetLoading(false);
    }
  };

  return (
   
    <View style={[styles.container, {paddingBottom: !isLoginSignup ? 16: 0}]}>
      <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="dark-content" // or 'light-content' depending on your design
              />
      
      {!isLoginSignup && (
        <View style={styles.inner}>
          <View style={styles.header}>
            <Image source={require('./images/NULS_LOGO.png')} style={{height: '45%', width: '100%',marginBottom: 10}} resizeMode='contain'/>
            <Text style={styles.headerTitle}>Hello!</Text>
            <Text style={styles.subHeader}>Welcome to NU MOA Laboratory System</Text>

             <View style={styles.buttonContainer}>
              <Text style={{color: 'gray', marginTop: -30}}>Sign in to continue</Text>
          <TouchableOpacity style={{width: '100%',backgroundColor: '#134b5f', justifyContent: 'center', borderRadius: 30, padding: 10, paddingVertical: 13}}
            onPress={()=> {
              setIsLoginSignup(true);
              // Clear all errors when going to login
              setError('');
              setNameError('');
              setSignUpEmailError('');
              setEmployeeIDError('');
              setSignUpPasswordError('');
              setConfirmPasswordError('');
              setJobTitleError('');
              setDepartmentError('');
            }}
            >
            <Text style={{textAlign: 'center', color: 'white', fontSize: 18, fontWeight: 700}}>Login</Text>
          </TouchableOpacity>


          <TouchableOpacity style={{width: '100%',backgroundColor: 'transparent', justifyContent: 'center', borderRadius: 30, padding: 10, borderWidth: 3, borderColor: '#134b5f'}}
          onPress={() => {
            setIsLoginSignup(true);
            setIsSignup(true);
            // Clear all errors when switching to signup
            setError('');
            setNameError('');
            setSignUpEmailError('');
            setEmployeeIDError('');
            setSignUpPasswordError('');
            setConfirmPasswordError('');
            setJobTitleError('');
            setDepartmentError('');
          }}
          >
            <Text style={{textAlign: 'center', color: '#134b5f', fontSize: 18, fontWeight: 700}}>Sign Up</Text>
          </TouchableOpacity>
        </View>

          </View>
           
        </View>
      )}

          {isLoginSignup && (
            <>
            <KeyboardAvoidingView
              style={{ flex: 1}}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0} 
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <KeyboardAwareScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContainer}
                  keyboardShouldPersistTaps="handled"
                  extraScrollHeight={0}
                  enableOnAndroid={true}
                  enableAutomaticScroll={true}
                >

            {/* Sign Up Inputs */}  
            {isSignup 
            && (
              
              <View style={[styles.inner, {padding: 20}]}>
                <View style={{alignItems: 'center', paddingTop: 30, paddingBottom: 20, borderBottomWidth: 2, marginBottom: 25, borderColor: '#e9ecee'}}>
                  <Text style={{textAlign: 'center', color: 'black', fontSize: 28, fontWeight: 700}}>Signing Up</Text>
                  <Text style={{color: 'gray', marginTop: 5}}>Create your own account.</Text>
                </View>

                <Text style={styles.label}>Full Name:<Text style={{color:'red'}}>*</Text></Text>
              <Animated.View style={[styles.animatedInputContainer, { borderColor: nameBorderColor, width: '100%' }]}>


                <Input
                  placeholder="Enter Full Name"
                  value={name}
                  onChangeText={(text) => {
                    let formatted = text.replace(/[^a-zA-Z\s]/g, ""); // allow only letters and spaces

                    // Capitalize the first letter of each word
                    formatted = formatted.replace(/\b\w/g, (char) => char.toUpperCase());

                    setName(formatted);
                    // Clear error when user starts typing
                    if (nameError) setNameError('');
                  }}
                  mode="outlined"
                  onFocus={() => handleFocus('name')}
                  onBlur={() => handleBlur('name')}
                  inputContainerStyle={[styles.inputContainer, { paddingTop: 3 }]} // removes underline
                  inputStyle={styles.inputText}
                />
              </Animated.View>
              {nameError !== '' && (
                <HelperText type="error" style={{ marginTop: -10, marginBottom: 10 }}>
                  {nameError}
                </HelperText>
              )}
                
                <Text style={styles.label}>Email:<Text style={{color:'red'}}>*</Text></Text>
              <Animated.View style={[styles.animatedInputContainer, { borderColor: emailBorderColor, width: '100%' }]}>


                <Input
                  placeholder="Enter Email Address (NU account)"
                  value={signUpEmail}
                  onChangeText={(text) => {
                    const cleanedText = text.replace(/\s/g, "");
                    setSignUpEmail(cleanedText);

                    const validDomains = ["nu-moa.edu.ph", "students.nu-moa.edu.ph"];
                    const parts = cleanedText.split("@");
                    const domain = parts.length > 1 ? parts[1] : "";

                    if (!validDomains.includes(domain)) {
                      setSignUpEmailError("Only @nu-moa.edu.ph or @students.nu-moa.edu.ph emails are allowed.");
                      
                    } else {
                      setSignUpEmailError("");
                    }
                    // Clear error when user starts typing
                    if (signUpEmailError && !cleanedText.includes('@')) setSignUpEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email')}
                  inputContainerStyle={[styles.inputContainer, { paddingTop: 3 }]}
                  inputStyle={styles.inputText}
                />

                {/* {signUpEmail.length > 0 && !signUpEmail.includes('@') ? (
                <HelperText type="error" style={{ marginTop: '-25', marginBottom: '10'}}>Enter a valid email address.</HelperText>
                    ) : null} */}
                                         {signUpEmailError !== '' && (
                       <HelperText type="error" style={{ marginTop: -10, marginBottom: 10 }}>
                         {signUpEmailError}
                       </HelperText>
                     )}
              </Animated.View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}
                <Text style={styles.label}>Employee ID:<Text style={{color:'red'}}>*</Text></Text>

                <Animated.View style={[styles.animatedInputContainer, { borderColor: employeeIDBorderColor, width: '100%' }]}>
                <Input
                  placeholder="e.g., 30-0912"
                  value={employeeID}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/\D/g, "");
                    let formatted = cleaned;
                    if (cleaned.length > 2) {
                      formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}`;
                    }
                    setEmployeeID(formatted);
                    // Clear error when user starts typing
                    if (employeeIDError) setEmployeeIDError('');
                  }}
                  keyboardType="numeric"
                  maxLength={7}
                  mode="outlined"
                  onFocus={() => handleFocus('employeeID')}
                onBlur={() => handleBlur('employeeID')}
                  inputContainerStyle={[styles.inputContainer, {paddingTop: 3}]} // removes underline
                inputStyle={styles.inputText}
                />
                </Animated.View>
                {employeeIDError !== '' && (
                  <HelperText type="error" style={{ marginTop: -10, marginBottom: 10 }}>
                    {employeeIDError}
                  </HelperText>
                )}


                {/* Job Title Menu */}
              <Text style={styles.label}>Select Job Title<Text style={{color:'red'}}>*</Text></Text>
              {/* <View style={styles.menucontainer}> */}
              <Menu
                visible={jobMenuVisible}
                onDismiss={() => setJobMenuVisible(false)}
                statusBarHeight={50}
                type='elevated'
                anchor={
                  <Button
                  mode="outlined"
                  onPress={() => setJobMenuVisible(true)}
                    style={{
                    // borderWidth: 2,
                    // borderColor: '#395a7f',
                    borderRadius: 8,
                    marginBottom: 10,
                    height: 45,
                    justifyContent: 'center',
                    backgroundColor: '#1e7898',
           
                  }}
                  labelStyle={{
                    fontSize: 14,
                    color: '#fff', // Darker text
                  }}
                >
                  {jobTitle || 'Job Title'}
                </Button>
                
                }
              >
                {jobOptions.map(option => (
                  // <Menu.Item key={option} onPress={() => { setJobTitle(option); setJobMenuVisible(false); }} title={option} />
                  <Menu.Item
                    key={option}
                    onPress={() => {
                      setJobTitle(option);
                      setJobMenuVisible(false);
                      // Clear error when user selects job title
                      if (jobTitleError) setJobTitleError('');
                    }}
                    title={option}
                  />
                ))}
              </Menu>
              {jobTitleError !== '' && (
                <HelperText type="error" style={{ marginTop: -10, marginBottom: 10 }}>
                  {jobTitleError}
                </HelperText>
              )}

            {/* {error !== "" && (
              <Text style={{ color: "red", marginBottom: 10, textAlign: "center" }}>
                {error}
              </Text>
            )} */}

              <Text style={styles.label}>Select Department:<Text style={{color:'red'}}>*</Text></Text>
              <Menu
                visible={deptMenuVisible}
                onDismiss={() => setDeptMenuVisible(false)}
                anchor={
                  // <Button mode="outlined" onPress={() => setDeptMenuVisible(true)} 
                  // style={{
                  //   borderRadius: 8,
                  //   marginBottom: 10,
                  //   height: 45,
                  //   justifyContent: 'center',
                  //   backgroundColor: '#1e7898',
                
                  // }}
                  // labelStyle={{
                  //   fontSize: 14,
                  //   color: '#fff',
                  // }}>
                  //   {department || 'Department'}
                  // </Button>

                  <Button
                    mode="outlined"
                    onPress={() => {
                      if (jobTitle !== "Lab Tech") {
                        setDeptMenuVisible(true);
                      }
                    }}
                    disabled={jobTitle === "Lab Tech"}
                    style={{
                      borderRadius: 8,
                      marginBottom: 10,
                      height: 45,
                      justifyContent: 'center',
                      backgroundColor: jobTitle === "Lab Tech" ? '#ccc' : '#1e7898',
                    }}
                    labelStyle={{
                      fontSize: 14,
                      color: jobTitle === "Lab Tech" ? '#666' : '#fff',
                    }}
                  >
                    {department || 'Department'}
                  </Button>

                }
              >
                {/* {deptOptions.map(option => (
                  <Menu.Item key={option} onPress={() => { setDepartment(option); setDeptMenuVisible(false); }} title={option}/>
                ))} */}
                {deptOptions.map(option => (
                  <Menu.Item
                    key={option}
                    onPress={() => {
                      setDepartment(option);
                      setDeptMenuVisible(false);
                      // Clear error when user selects department
                      if (departmentError) setDepartmentError('');
                    }}
                    title={option}
                  />
                ))}
              </Menu>
              {departmentError !== '' && (
                <HelperText type="error" style={{ marginTop: -10, marginBottom: 10 }}>
                  {departmentError}
                </HelperText>
              )}

              {error !== "" && (
                <Text style={{ color: "red", marginBottom: 10, textAlign: "center" }}>
                  {error}
                </Text>
              )}


              
              {/* </View> */}
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <TouchableOpacity 
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      marginRight: 8
                    }}
                    onPress={() => setAgreedToTerms(!agreedToTerms)}
                    activeOpacity={0.7}
                  >
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: agreedToTerms ? '#1e7898' : '#ccc',
                      backgroundColor: agreedToTerms ? '#1e7898' : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 8
                    }}>
                      {agreedToTerms && (
                        <MaterialCommunityIcons 
                          name="check" 
                          size={14} 
                          color="white" 
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setTermsModalVisible(true)}>
                    <Text style={{ color: '#007BFF', textDecorationLine: 'underline' }}>
                      View Terms and Conditions
                    </Text>
                  </TouchableOpacity>

                  <TermsModal
                    visible={isTermsModalVisible}
                    onClose={() => setTermsModalVisible(false)}
                  />
                </View>

                <CustomButton
                    title={"Sign Up"}
                    onPress={handleSignup}
                    icon={"account-plus"}
                    loading={loading}
                    disabled={isSignup && !agreedToTerms}
                    style={[
                      !agreedToTerms && { backgroundColor: '#ccc' }, // Grey out when disabled
                    ]}
                    labelStyle={styles.loginButtonText}
                  />
                  <TouchableOpacity onPress={() => {
                    setIsSignup(!isSignup);
                    // Clear all errors when switching modes
                    setError('');
                    setNameError('');
                    setSignUpEmailError('');
                    setEmployeeIDError('');
                    setSignUpPasswordError('');
                    setConfirmPasswordError('');
                    setJobTitleError('');
                    setDepartmentError('');
                  }}>
              <Text style={styles.footerText}>
                {isSignup
                  ? "Already have an account? Login"
                  : `Don't have an account? Sign Up`}
              </Text>
            </TouchableOpacity>
             
              </View>
            )}

            {!isSignup && (
                <View style={styles.inner}>
          <View style={styles.header}>
            <Image source={require('./images/NULS_Favicon.png')} style={{height: '30%', width: '100%',marginBottom: 10}} resizeMode='contain'/>
            <Text style={styles.headerTitle}>Login</Text>
            <Text style={styles.subHeader}>Welcome to NU MOA Laboratory System</Text>
            {/* <Text style={{alignSelf: 'flex-start', marginLeft: 10, color: 'gray', marginBottom: 5}}>Login to your account</Text> */}

            <View style={{width: '100%', paddingHorizontal: 10}}>
            <Animated.View style={[styles.animatedInputContainer, { borderColor: emailBorderColor, width: '100%' }]}>
              {/* <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                onFocus={() => handleFocus('email')}
                onBlur={() => handleBlur('email')}
                inputContainerStyle={styles.inputContainer} 
                inputStyle={styles.inputText}
                leftIcon={{ type: 'material', name: 'email', color: '#9CA3AF' }}
              /> */}

              <Input
                placeholder="Email"
                value={email}
                onChangeText={(text) => setEmail(text.replace(/\s/g, ""))}
                onFocus={() => handleFocus('email')}
                onBlur={() => handleBlur('email')}
                inputContainerStyle={styles.inputContainer}
                inputStyle={styles.inputText}
                leftIcon={{ type: 'material', name: 'email', color: '#9CA3AF' }}
              />
              
            </Animated.View>

            <Animated.View style={[styles.animatedInputContainer, { borderColor: passwordBorderColor, width: '100%'}]}>

              <Input
                placeholder="Password"
                value={password}
                onChangeText={(text) => setPassword(text.replace(/\s/g, ""))}
                onFocus={() => handleFocus('password')}
                onBlur={() => handleBlur('password')}
                secureTextEntry={!showPassword}
                inputContainerStyle={styles.inputContainer}
                inputStyle={styles.inputText}
                leftIcon={{ type: 'material', name: 'lock', color: '#9CA3AF' }}
                rightIcon={
                  <Icon
                    type="material"
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    color="#9CA3AF"
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
            </Animated.View>

            {loginError ? <Text style={styles.error}>{loginError}</Text> : null}

                <TouchableOpacity onPress={() => setForgotPasswordVisible(true)}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </TouchableOpacity>

                  <CustomButton
                    title={isSignup ? "Sign Up" : "Login"}
                    onPress={isSignup ? handleSignup : handleLogin}
                    icon={isSignup ? "account-plus" : "login"}
                    loading={loading}
                    disabled={isSignup && !agreedToTerms}
                    style={[
                      styles.loginButton,
                      !agreedToTerms && { backgroundColor: '#ccc' }, // Grey out when disabled
                    ]}
                    labelStyle={styles.loginButtonText}
                  />
            
            </View>
  

                

           <TouchableOpacity onPress={() => {
             setIsSignup(!isSignup);
             // Clear all errors when switching modes
             setError('');
             setNameError('');
             setSignUpEmailError('');
             setEmployeeIDError('');
             setSignUpPasswordError('');
             setConfirmPasswordError('');
             setJobTitleError('');
             setDepartmentError('');
           }}>
              <Text style={styles.footerText}>
                {isSignup
                  ? "Already have an account? Login"
                  : `Don't have an account? Sign Up`}
              </Text>
            </TouchableOpacity>
                   
          </View>

              </View>
            )}
          <ForgotPasswordModal
            visible={isForgotPasswordVisible}
            onClose={() => setForgotPasswordVisible(false)}
          />

          <Modal
            visible={isModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
                <Text>{modalMessage}</Text>
                <Button onPress={() => setIsModalVisible(false)}>OK</Button>
              </View>
            </View>
          </Modal>

          {/* Password Reset Modal */}
          <Modal
            visible={isPasswordResetModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsPasswordResetModalVisible(false)}
          >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%', maxHeight: '80%' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
                  Set Your Password
                </Text>
                <Text style={{ marginBottom: 20, textAlign: 'center', color: '#666' }}>
                  Please set a new password for your account
                </Text>
                
                <Text style={styles.label}>New Password:</Text>
                <Animated.View style={[styles.animatedInputContainer, { borderColor: passwordBorderColor, width: '100%' }]}>
                  <Input
                    placeholder="Enter new password"
                    value={passwordResetData.newPassword}
                    onChangeText={(text) => {
                      const value = text.replace(/\s/g, "");
                      setPasswordResetData(prev => ({ ...prev, newPassword: value }));
                    }}
                    secureTextEntry={!showPassword}
                    mode="outlined"
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                    inputContainerStyle={[styles.inputContainer, { paddingTop: 3 }]}
                    inputStyle={styles.inputText}
                    rightIcon={
                      <Icon
                        type="material"
                        name={showPassword ? 'visibility' : 'visibility-off'}
                        color="#9CA3AF"
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                </Animated.View>

                <Text style={styles.label}>Confirm New Password:</Text>
                <Animated.View style={[styles.animatedInputContainer, { borderColor: confirmPasswordBorderColor, width: '100%' }]}>
                  <Input
                    placeholder="Confirm new password"
                    value={passwordResetData.confirmNewPassword}
                    onChangeText={(text) => {
                      const value = text.replace(/\s/g, "");
                      setPasswordResetData(prev => ({ ...prev, confirmNewPassword: value }));
                    }}
                    secureTextEntry={!showPassword}
                    mode="outlined"
                    onFocus={() => handleFocus('confirmPassword')}
                    onBlur={() => handleBlur('confirmPassword')}
                    inputContainerStyle={[styles.inputContainer, { paddingTop: 3 }]}
                    inputStyle={styles.inputText}
                    rightIcon={
                      <Icon
                        type="material"
                        name={showPassword ? 'visibility' : 'visibility-off'}
                        color="#9CA3AF"
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                </Animated.View>

                {passwordResetError && (
                  <Text style={{ color: 'red', marginTop: 10, marginBottom: 10, textAlign: 'center' }}>
                    {passwordResetError}
                  </Text>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#134b5f',
                      padding: 12,
                      borderRadius: 8,
                      flex: 1,
                      marginRight: 10,
                      alignItems: 'center'
                    }}
                    onPress={handlePasswordReset}
                    disabled={passwordResetLoading}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>
                      {passwordResetLoading ? "Setting Password..." : "Set Password"}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#ccc',
                      padding: 12,
                      borderRadius: 8,
                      flex: 1,
                      marginLeft: 10,
                      alignItems: 'center'
                    }}
                    onPress={() => {
                      setIsPasswordResetModalVisible(false);
                      setPasswordResetData({ 
                        newPassword: "", 
                        confirmNewPassword: "",
                        userEmail: "",
                        userId: "",
                        userName: "",
                        userDepartment: "",
                        userRole: "",
                        userJobTitle: ""
                      });
                      setPasswordResetError("");
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          
        </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
            </>
          )}

</View>
  );
}

