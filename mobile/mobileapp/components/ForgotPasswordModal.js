import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { TextInput, Text, Card, HelperText, Button } from 'react-native-paper';
import styles from './styles/ForgotPasswrodStyle';

export default function ForgotPasswordModal({ visible, onClose, onResetPassword }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleReset = () => {
    if (!email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    onResetPassword(email);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.title}>Forgot Password</Text>
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  mode="outlined"
                  style={styles.input}
                />
                <HelperText type="error" visible={!!error}>{error}</HelperText>

                <Button mode="contained" onPress={handleReset} style={styles.button}>
                  Reset Password
                </Button>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.cancel}>Cancel</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
