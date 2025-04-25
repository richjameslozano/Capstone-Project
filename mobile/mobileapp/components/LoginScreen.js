import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { TextInput, Text, Card, HelperText, Menu, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from './customs/CustomButton';
import ForgotPasswordModal from './ForgotPasswordModal';
import styles from './styles/LoginStyle';
import { useAuth } from '../components/contexts/AuthContext';
import { db, auth } from '../backend/firebase/FirebaseConfig';
import { collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp, Timestamp, setDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, getAuth } from 'firebase/auth';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isForgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [employeeID, setEmployeeID] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [jobMenuVisible, setJobMenuVisible] = useState(false);
  const [deptMenuVisible, setDeptMenuVisible] = useState(false);

  const jobOptions = ['Dean', 'Laboratory Custodian', 'Faculty'];
  const deptOptions = ['Medical Technology', 'Nursing', 'Dentistry', 'Optometry'];

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
  
    setError('');
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
        setError("User not found. Please contact admin.");
        setLoading(false);
        return;
      }
  
      if (userData.disabled) {
        setError("Your account has been disabled.");
        await signOut(auth);
        setLoading(false);
        return;
      }
  
      // If password not set yet (new user)
      if (!isSuperAdmin && !userData.uid) {
        setError("Password not set. Please login through website first.");
        setLoading(false);
        return;
      }
  
      // Block check
      if (userData.isBlocked && userData.blockedUntil) {
        const now = Timestamp.now().toMillis();
        const blockedUntil = userData.blockedUntil.toMillis();
  
        if (now < blockedUntil) {
          const remainingTime = Math.ceil((blockedUntil - now) / 1000);
          setError(`Account is blocked. Try again after ${remainingTime} seconds.`);
          setLoading(false);
          return;

        } else {
          await updateDoc(userDoc.ref, {
            isBlocked: false,
            loginAttempts: 0,
            blockedUntil: null,
          });

          console.log("Account unblocked.");
        }
      }
  
      if (isSuperAdmin) {
        if (userData.password === password) {
          await updateDoc(userDoc.ref, { loginAttempts: 0 });
  
          login({ ...userData, id: userDoc.id, role: "Super Admin" });
  
          navigation.replace("SuperAdminDashboard");
  
        } else {
          const newAttempts = (userData.loginAttempts || 0) + 1;
  
          if (newAttempts >= 4) {
            const unblockTime = Timestamp.now().toMillis() + 30 * 60 * 1000;
            await updateDoc(userDoc.ref, {
              isBlocked: true,
              blockedUntil: Timestamp.fromMillis(unblockTime),
            });
  
            setError("Account blocked for 30 minutes.");

          } else {
            await updateDoc(userDoc.ref, { loginAttempts: newAttempts });
            setError(`Invalid password. ${4 - newAttempts} attempts left.`);
          }
  
          setLoading(false);
          return;
        }
  
      } else {
        // ✅ Firebase Auth login for regular users/admins
        try {
          await signInWithEmailAndPassword(auth, email, password);
          await updateDoc(userDoc.ref, { loginAttempts: 0 });
  
          const role = (userData.role || "user").toLowerCase();
          login({ ...userData, id: userDoc.id });
  
          await addDoc(collection(db, `accounts/${userDoc.id}/activitylog`), {
            action: "User Logged In (Mobile)",
            userName: userData.name || "User",
            timestamp: serverTimestamp(),
          });
  
          switch (role) {
            case "admin1":
            case "admin2":
            case "admin":
              navigation.replace("Admin");
              break;

            case "super-user":
              navigation.replace("Admin");
              break;

            case "user":
              navigation.replace('User')
              break;

            default:
              setError("Unknown role. Contact admin.");
          }
  
        } catch (authError) {
          // console.error("Auth login failed:", authError.message);
  
          const newAttempts = (userData.loginAttempts || 0) + 1;
  
          if (newAttempts >= 4) {
            const unblockTime = Timestamp.now().toMillis() + 30 * 60 * 1000;
            await updateDoc(userDoc.ref, {
              isBlocked: true,
              blockedUntil: Timestamp.fromMillis(unblockTime),
            });
  
            setError("Account blocked after 4 failed attempts.");
            
          } else {
            await updateDoc(userDoc.ref, { loginAttempts: newAttempts });
            setError(`Invalid password. ${4 - newAttempts} attempts left.`);
          }
  
          setLoading(false);
          return;
        }
      }
  
    } catch (error) {
      console.error("Login error:", error);
      setError("Unexpected error. Try again.");

    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    const { name, email, employeeId, password, confirmPassword, jobTitle, department } = signUpData;
    const auth = getAuth();
  
    // Step 1: Validate email domain
    const validDomains = ["nu-moa.edu.ph", "students.nu-moa.edu.ph"];
    const emailDomain = email.split("@")[1];
  
    if (!validDomains.includes(emailDomain)) {
      setError("Invalid email domain. Only @nu-moa.edu.ph and @students.nu-moa.edu.ph are allowed.");
      return;
    }
  
    // Step 2: Password match check
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
  
    try {
      // Step 3: Check if employeeId or email exists
      const [employeePendingSnap, employeeAccountSnap, emailPendingSnap, emailAccountSnap] = await Promise.all([
        getDocs(query(collection(db, "pendingaccounts"), where("employeeId", "==", employeeId.trim()))),
        getDocs(query(collection(db, "accounts"), where("employeeId", "==", employeeId.trim()))),
        getDocs(query(collection(db, "pendingaccounts"), where("email", "==", email.trim().toLowerCase()))),
        getDocs(query(collection(db, "accounts"), where("email", "==", email.trim().toLowerCase()))),
      ]);
  
      if (!employeePendingSnap.empty || !employeeAccountSnap.empty) {
        setError("This employee ID is already registered.");
        return;
      }
  
      if (!emailPendingSnap.empty || !emailAccountSnap.empty) {
        setError("This email is already registered.");
        return;
      }
  
      // Step 4: Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
  
      // Step 5: Assign role based on job title
      let role = "user";
      if (jobTitle.toLowerCase() === "dean") role = "admin";
      else if (jobTitle.toLowerCase().includes("custodian")) role = "super-user";
      else if (jobTitle.toLowerCase() === "faculty") role = "user";
  
      // Step 6: Save to Firestore
      const sanitizedData = {
        name: name.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        employeeId: employeeId.trim().replace(/[^\d-]/g, ""),
        jobTitle,
        department,
        role,
        createdAt: serverTimestamp(),
        status: "pending",
        uid: firebaseUser.uid,
      };
  
      await addDoc(collection(db, "pendingaccounts"), sanitizedData);
  
      // Step 7: Show modal and reset
      setModalMessage("Successfully Registered! Please check your email. Your account is pending ITSO approval.");
      setIsModalVisible(true);
  
      setSignUpData({
        name: "",
        email: "",
        employeeId: "",
        password: "",
        confirmPassword: "",
        jobTitle: "",
        department: "",
      });
  
    } catch (error) {
      console.error("Sign up error:", error.message);
  
      if (error.code === "auth/email-already-in-use") {
        setError("Email already in use.");

      } else {
        setError("Failed to create account. Try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>{isSignup ? "Sign Up" : "Login"}</Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            style={styles.input}
          />
          <HelperText type="error" visible={email.length > 0 && !email.includes('@')}>
            Enter a valid email address.
          </HelperText>

          {isSignup && (
            <>
              <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
              />


              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                style={styles.input}
              />
              <HelperText type="error" visible={email.length > 0 && !email.includes('@')}>
                Enter a valid email address.
              </HelperText>

              <TextInput
                label="Employee ID"
                value={employeeID}
                onChangeText={setEmployeeID}
                mode="outlined"
                style={styles.input}
              />

              <Menu
                visible={jobMenuVisible}
                onDismiss={() => setJobMenuVisible(false)}
                anchor={
                  <Button mode="outlined" onPress={() => setJobMenuVisible(true)} style={styles.input}>
                    {jobTitle || 'Select Job Title'}
                  </Button>
                }
              >
                {jobOptions.map(option => (
                  <Menu.Item key={option} onPress={() => { setJobTitle(option); setJobMenuVisible(false); }} title={option} />
                ))}
              </Menu>
              <Menu
                visible={deptMenuVisible}
                onDismiss={() => setDeptMenuVisible(false)}
                anchor={
                  <Button mode="outlined" onPress={() => setDeptMenuVisible(true)} style={styles.input}>
                    {department || 'Select Department'}
                  </Button>
                }
              >
                {deptOptions.map(option => (
                  <Menu.Item key={option} onPress={() => { setDepartment(option); setDeptMenuVisible(false); }} title={option} />
                ))}
              </Menu>
            </>
          )}

          <View style={styles.passwordContainer}>
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
              mode="outlined"
              style={[styles.input, styles.passwordInput]}
            />
            <TouchableOpacity
              onPress={() => setSecureTextEntry(!secureTextEntry)}
              style={styles.iconContainer}
            >
              <MaterialCommunityIcons
                name={secureTextEntry ? 'eye-off' : 'eye'}
                size={24}
                color="gray"
              />
            </TouchableOpacity>
          </View>

          {isSignup && (
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              mode="outlined"
              style={styles.input}
            />
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <CustomButton
            title={isSignup ? "Sign Up" : "Login"}
            onPress={isSignup ? handleSignup : handleLogin}
            icon={isSignup ? "account-plus" : "login"}
            loading={loading}
          />

          {!isSignup && (
            <TouchableOpacity onPress={() => setForgotPasswordVisible(true)}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
            <Text style={styles.switchText}>
              {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      <ForgotPasswordModal
        visible={isForgotPasswordVisible}
        onClose={() => setForgotPasswordVisible(false)}
      />
    </View>
  );
}
