import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { TextInput, Text, Card, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from './customs/CustomButton';
import ForgotPasswordModal from './ForgotPasswordModal';
import styles from './styles/LoginStyle';
import { useAuth } from '../components/contexts/AuthContext';  
import { db } from '../backend/firebase/FirebaseConfig';  
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
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
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
  
      // Get extra user data from Firestore
      const q = query(collection(db, 'accounts'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        setError('User not found in database.');
        setLoading(false);
        return;
      }
  
      let userData = null;
      querySnapshot.forEach(doc => {
        userData = { id: doc.id, ...doc.data() };
      });
  
      login(userData); // Your context method to save the user
  
      if (userData.role === "Admin1" || userData.role === "Admin2") {
        navigation.replace("Admin2Dashboard");
      } else {
        navigation.replace("UserDashboard");
      }
  
    } catch (error) {
      console.error('Login Error:', error);
      setError('Invalid email or password.');
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
