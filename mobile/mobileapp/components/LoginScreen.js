
import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { TextInput, Text, Card, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from './customs/CustomButton';
import ForgotPasswordModal from './ForgotPasswordModal';
import styles from './styles/LoginStyle';
import { useAuth } from '../components/contexts/AuthContext';  

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isForgotPasswordVisible, setForgotPasswordVisible] = useState(false);

  const accounts = [
    { 
      email: 'mikmik@nu-moa.edu.ph', 
      password: '123456', 
      name: 'Mik Mik', 
      department: 'IT', 
      role: 'admin' },

    { 
      email: 'dubu@nu-moa.edu.ph', 
      password: '123456', 
      name: 'Dubu', 
      department: 'Marketing', 
      role: 'user' },
  ];

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setLoading(true);

    const account = accounts.find(acc => acc.email === email && acc.password === password);

    setTimeout(() => {
      setLoading(false);
      if (account) {
        login(account);
        navigation.replace(account.role === 'admin' ? 'Admin2Dashboard' : 'UserDashboard');
      } else {
        setError('Invalid email or password');
      }
    }, 2000);
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
