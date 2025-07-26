import React, { useState } from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { TextInput, Text, Button, HelperText } from 'react-native-paper';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../backend/firebase/FirebaseConfig';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../backend/firebase/FirebaseConfig';
import styles from './styles/ForgotPasswordStyle';

export default function ForgotPasswordModal({ visible, onClose }) {
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError("Please enter your email.");
      return;
    }

    try {
      const usersRef = collection(db, "accounts");
      const q = query(usersRef, where("email", "==", forgotPasswordEmail.trim()));
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
      console.error("Error sending reset email:", error.message);
      setForgotPasswordError("Failed to send reset link. Please check the email.");
      setForgotPasswordSuccess("");
      setTimeout(() => {
        setForgotPasswordEmail("");
      }, 50);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Forgot Password</Text>
          <Text style={styles.modalText}>Enter your email to receive a reset link.</Text>

          {/* <TextInput
            label="Email"
            value={forgotPasswordEmail}
            onChangeText={setForgotPasswordEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            style={styles.input}
          /> */}

          <TextInput
            label="Email"
            value={forgotPasswordEmail}
            onChangeText={(text) => setForgotPasswordEmail(text.replace(/\s/g, ""))}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            style={styles.input}
          />

          <HelperText type="error" visible={!!forgotPasswordError}>
            {forgotPasswordError}
          </HelperText>

          {forgotPasswordSuccess ? (
            <Text style={styles.successText}>{forgotPasswordSuccess}</Text>
          ) : null}

          <Button mode="contained" onPress={handleForgotPassword} style={styles.modalButton}>
            Send Reset Link
          </Button>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
