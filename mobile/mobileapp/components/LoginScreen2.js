import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ImageBackground, TouchableOpacity, UIManager, LayoutAnimation, StatusBar, Image, BackHandler, Alert, Modal } from 'react-native';
import { Input, Text, Icon } from 'react-native-elements';
import { TextInput, Card, HelperText, Menu, Provider, Button } from 'react-native-paper';
import { useAuth } from '../components/contexts/AuthContext';
import { db, auth } from '../backend/firebase/FirebaseConfig';
import { collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp, Timestamp, setDoc, doc, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, getAuth } from 'firebase/auth';
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
            userDoc = superAdminSnapshot.docs[0];
            userData = userDoc.data();
            isSuperAdmin = true;
          }
        }
    
        if (!userData) {
          setLoginError("User not found. Please contact admin.");
          setLoading(false);
          return;
        }
    
        if (userData.disabled) {
          setLoginError("Your account has been disabled.");
          await signOut(auth);
          setLoading(false);
          return;
        }
    
        // If password not set yet (new user)
        if (!isSuperAdmin && !userData.uid) {
          setLoginError("Password not set. Please login through website first.");
          setLoading(false);
          return;
        }
    
        // Block check
        // if (userData.isBlocked && userData.blockedUntil) {
        //   const now = Timestamp.now().toMillis();
        //   const blockedUntil = userData.blockedUntil.toMillis();
    
        //   if (now < blockedUntil) {
        //     const remainingTime = Math.ceil((blockedUntil - now) / 1000);
        //     setError(`Account is blocked. Try again after ${remainingTime} seconds.`);
        //     setLoading(false);
        //     return;
  
        //   } else {
        //     await updateDoc(userDoc.ref, {
        //       isBlocked: false,
        //       loginAttempts: 0,
        //       blockedUntil: null,
        //     });
  
        //     console.log("Account unblocked.");
        //   }
        // }
    
        if (isSuperAdmin) {
          if (userData.password === password) {
            await updateDoc(userDoc.ref, { loginAttempts: 0 });
    
            login({ ...userData, id: userDoc.id, role: "Super Admin" });
    
            navigation.replace("SuperAdminDashboard");
    
          } else {
            // const newAttempts = (userData.loginAttempts || 0) + 1;
    
            // if (newAttempts >= 4) {
            //   const unblockTime = Timestamp.now().toMillis() + 30 * 60 * 1000;
            //   await updateDoc(userDoc.ref, {
            //     isBlocked: true,
            //     blockedUntil: Timestamp.fromMillis(unblockTime),
            //   });
    
            //   setError("Account blocked for 30 minutes.");
  
            // } else {
            //   await updateDoc(userDoc.ref, { loginAttempts: newAttempts });
            //   setError(`Invalid password. ${4 - newAttempts} attempts left.`);
            // }
            
            setLoginError(`Invalid password.`);
            setLoading(false);
            return;
          }
    
        } else {
          // ✅ Firebase Auth login for regular users/admins
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const signedInUser = userCredential.user;
            
            // await signInWithEmailAndPassword(auth, email, password);
            // await updateDoc(userDoc.ref, { loginAttempts: 0 });
    
            // const role = (userData.role || "user").toLowerCase();
            // login({ ...userData, id: userDoc.id });

            // console.log("Login Succesfull!")
    
            // await addDoc(collection(db, `accounts/${userDoc.id}/activitylog`), {
            //   action: "User Logged In (Mobile)",
            //   userName: userData.name || "User",
            //   timestamp: serverTimestamp(),
              
            // });

            // 🔁 Force reload to ensure latest email verification status
            await signedInUser.reload();
            const refreshedUser = auth.currentUser;

            if (!refreshedUser || !refreshedUser.emailVerified) {
              await signOut(auth);
              setLoginError("Please verify your email before logging in.");
              setLoading(false);
              return;
            }

            await updateDoc(userDoc.ref, { loginAttempts: 0 });

            const role = (userData.role || "user").toLowerCase();
            login({ ...userData, id: userDoc.id });

            console.log("Login Successful!");

            await addDoc(collection(db, `accounts/${userDoc.id}/activitylog`), {
              action: "User Logged In (Mobile)",
              userName: userData.name || "User",
              timestamp: serverTimestamp(),
            });


            try {
              const token = await registerForPushNotificationsAsync(userDoc.id, role); // ⬅️ Pass role here
              if (token) {
                console.log("✅ Push token registered and saved.");

              } else {
                console.log("⚠️ Push token registration failed or permission denied.");
              }

            } catch (err) {
              console.error("🔥 Push token registration crashed:", err.message);
            }
    
            switch (role) {
              case "admin1":
              case "admin2":
              case "admin":
                // try {
                //   await registerForPushNotificationsAsync(userDoc.id, userData.role);
                //   console.log("Push token registered.");

                // } catch (e) {
                //   console.log("Push token registration failed:", e);
                // }

                navigation.replace("Admin");
                console.log("Login Successful!");
                break;

              case "super-user":
                // try {
                //   await registerForPushNotificationsAsync(userDoc.id, userData.role);
                //   console.log("Push token registered.");
                  
                // } catch (e) {
                //   console.log("Push token registration failed:", e);
                // }

                navigation.replace("Super-User");
                console.log("Login Succesfull!")
                break;
  
              case "user":
                navigation.replace('User')
                console.log("Login Succesfull!")
                break;
  
              default:
                setLoginError("Unknown role. Contact admin.");
            }
    
          } catch (authError) {
            // console.error("Auth login failed:", authError.message);
    
            // const newAttempts = (userData.loginAttempts || 0) + 1;
    
            // if (newAttempts >= 4) {
            //   const unblockTime = Timestamp.now().toMillis() + 30 * 60 * 1000;
            //   await updateDoc(userDoc.ref, {
            //     isBlocked: true,
            //     blockedUntil: Timestamp.fromMillis(unblockTime),
            //   });
    
            //   setError("Account blocked after 4 failed attempts.");
              
            // } else {
            //   await updateDoc(userDoc.ref, { loginAttempts: newAttempts });
            //   setError(`Invalid password. ${4 - newAttempts} attempts left.`);
            // }
    
            setLoginError(`Invalid password.`);
            setLoading(false);
            return;
          }
        }
    
      } catch (error) {
        console.error("Login error:", error);
        setLoginError("Unexpected error. Try again.");
  
      } finally {
        setLoading(false);
      }
    };

    const sendEmail = async (email, name) => {
      try {
        const response = await fetch('https://webnuls.onrender.com/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: email.trim().toLowerCase(),
            subject: 'Account Registration - Pending Approval',
            text: `Hi ${name},\n\nThank you for registering. Your account is now pending approval.\n\nRegards,\nNU MOA NULS Team`,
            html: `<p>Hi ${name},</p><p>Thank you for registering. Your account is now <strong>pending approval</strong> from the NULS.</p><p>Regards,<br>NU MOA NULS Team</p>`,
          }),
        });

        const result = await response.json();
        if (result.success) {
          console.log('✅ Email sent successfully!');
          
        } else {
          console.error('❌ Email failed:', result.error);
        }
        
      } catch (err) {
        console.error('❌ Error sending email:', err.message);
      }
    };

    const handleSignup = async () => {
        setLoading(true);
      
        // Clear all previous errors
        setNameError('');
        setSignUpEmailError('');
        setEmployeeIDError('');
        setSignUpPasswordError('');
        setConfirmPasswordError('');
        setJobTitleError('');
        setDepartmentError('');
        setError('');
      
        // Use individual state variables instead of signUpData
        const email = signUpEmail;
        const employeeId = employeeID;
        const password = signUpPassword;
      
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

        if (!password.trim()) {
          setSignUpPasswordError('Password is required.');
          setLoading(false);
          return;
        }

        if (!confirmPassword.trim()) {
          setConfirmPasswordError('Confirm Password is required.');
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

        // Step 2: Password match check
        if (password !== confirmPassword) {
          setConfirmPasswordError("Passwords do not match.");
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
          // Step 4: Check if employeeId or email exists
          const [employeePendingSnap, employeeAccountSnap, emailPendingSnap, emailAccountSnap] = await Promise.all([
            getDocs(query(collection(db, "pendingaccounts"), where("employeeId", "==", employeeId.trim()))),
            getDocs(query(collection(db, "accounts"), where("employeeId", "==", employeeId.trim()))),
            getDocs(query(collection(db, "pendingaccounts"), where("email", "==", email.trim().toLowerCase()))),
            getDocs(query(collection(db, "accounts"), where("email", "==", email.trim().toLowerCase()))),
          ]);
      
          if (!employeePendingSnap.empty || !employeeAccountSnap.empty) {
            setError("This employee ID is already registered.");
            setLoading(false);
            return;
          }
      
          if (!emailPendingSnap.empty || !emailAccountSnap.empty) {
            setError("This email is already registered.");
            setLoading(false);
            return;
          }
      
          // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          // const firebaseUser = userCredential.user;
      
          // let role = "user";
          // if (jobTitle.toLowerCase() === "dean") {
          //   role = "admin";

          // } else if (jobTitle.toLowerCase() === "program chair") {
          //   role = "admin";

          // } else if (jobTitle.toLowerCase().includes("custodian")) {
          //   role = "super-user";

          // } else if (jobTitle.toLowerCase() === "faculty") {
          //   role = "user";
          // }

          let role = "user";

          if (jobTitle.toLowerCase() === "dean") {
            if (department.toLowerCase() === "sah") {
              role = "admin";

            } else {
              role = "user";
            }

          } else if (jobTitle.toLowerCase() === "program chair") {
            role = "admin";

          } else if (jobTitle.toLowerCase().includes("custodian")) {
            role = "super-user";

          } else if (jobTitle.toLowerCase() === "faculty") {
            role = "user";
          }

          const sanitizedData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            employeeId: employeeId.trim().replace(/[^\d-]/g, ""),
            jobTitle,
            department,
            role,
            createdAt: serverTimestamp(),
            status: "pending",
            // uid: firebaseUser.uid,
          };
      
          await addDoc(collection(db, "pendingaccounts"), sanitizedData);

          sendEmail(email, name);      
      
          // Reset state variables
          setName("");
          setSignUpEmail("");
          setEmployeeID("");
          setSignUpPassword("");
          setConfirmPassword("");
          setJobTitle("");
          setDepartment("");
          setError("");
          // Clear all error states
          setNameError("");
          setSignUpEmailError("");
          setEmployeeIDError("");
          setSignUpPasswordError("");
          setConfirmPasswordError("");
          setJobTitleError("");
          setDepartmentError("");

          setModalMessage("Successfully Registered! Please check your junk email. Your account is pending approval.");
          setIsModalVisible(true);

          // Alert.alert("Sign Up Succesfull!");
      
        } catch (error) {
          console.error("Sign up error:", error.message);
          if (error.code === "auth/email-already-in-use") {
            setError("Email already in use.");
    
          } else {
            setError("Failed to create account. Try again.");
          }
    
        } finally {
          setLoading(false);
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

                <Text style={styles.label}>Password:<Text style={{color:'red'}}>*</Text></Text>
                <Animated.View style={[styles.animatedInputContainer, { borderColor: passwordBorderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#ccc', '#395a7f']
                }), width: '100%' }]}>
                  <Input
                    placeholder="Enter Password"
                    value={signUpPassword}
                    onChangeText={(text) => {
                      setSignUpPassword(text);
                      // Clear error when user starts typing
                      if (signUpPasswordError) setSignUpPasswordError('');
                    }}
                    secureTextEntry={true}
                    mode="outlined"
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                    inputContainerStyle={[styles.inputContainer, { paddingTop: 3 }]}
                    inputStyle={styles.inputText}
                  />
                </Animated.View>
                {signUpPasswordError !== '' && (
                  <HelperText type="error" style={{ marginTop: -10, marginBottom: 10 }}>
                    {signUpPasswordError}
                  </HelperText>
                )}

                <Text style={styles.label}>Confirm Password:<Text style={{color:'red'}}>*</Text></Text>
                <Animated.View style={[styles.animatedInputContainer, { borderColor: confirmPasswordBorderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#ccc', '#395a7f']
                }), width: '100%' }]}>
                  <Input
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      // Clear error when user starts typing
                      if (confirmPasswordError) setConfirmPasswordError('');
                    }}
                    secureTextEntry={true}
                    mode="outlined"
                    onFocus={() => handleFocus('confirmPassword')}
                    onBlur={() => handleBlur('confirmPassword')}
                    inputContainerStyle={[styles.inputContainer, { paddingTop: 3 }]}
                    inputStyle={styles.inputText}
                  />
                </Animated.View>
                {confirmPasswordError !== '' && (
                  <HelperText type="error" style={{ marginTop: -10, marginBottom: 10 }}>
                    {confirmPasswordError}
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

          
        </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
            </>
          )}

</View>
  );
}

