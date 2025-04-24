import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { TextInput, Text, Card, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from './customs/CustomButton';
import ForgotPasswordModal from './ForgotPasswordModal';
import styles from './styles/LoginStyle';
import { useAuth } from '../components/contexts/AuthContext';  
import { db } from '../backend/firebase/FirebaseConfig';  
import { collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../backend/firebase/FirebaseConfig'; // Make sure you import auth

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isForgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  
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
  
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Login</Text>

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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <CustomButton title="Login" onPress={handleLogin} icon="login" loading={loading} />

          <TouchableOpacity onPress={() => setForgotPasswordVisible(true)}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      <ForgotPasswordModal visible={isForgotPasswordVisible} onClose={() => setForgotPasswordVisible(false)} />
    </View>
  );
}
