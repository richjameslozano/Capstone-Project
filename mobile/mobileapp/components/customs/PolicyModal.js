import React from 'react';
import { Modal, View, Text, ScrollView, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
  import { StatusBar } from 'react-native';
const TermsModal = ({ visible, onClose }) => {
  return (
<Modal
  animationType="fade"
  transparent={true}
  visible={visible}
  onRequestClose={onClose}
>

<StatusBar
  backgroundColor="rgba(0,0,0,0.5)" // same as modalOverlay
  translucent={true}
  barStyle="light-content" // or 'dark-content' depending on your overlay brightness
/>

  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20, paddingRight: 10 }}>
        <Text style={styles.modalTitle}>Terms and Conditions</Text>

        <Text style={styles.modalText}>
            These are the terms and policies governing the use of our platform. Please read them carefully before proceeding.
        </Text>

        <Text style={styles.modalText}>
          Welcome to the NU MOA Laboratory System. These Terms and Conditions govern your access to and use of the service, provided through our web and mobile application. By using the Platform, you agree to be bound by these Terms.
        </Text>

        <Button mode="contained" onPress={onClose} style={styles.closeButton}>
          Close
        </Button>
      </ScrollView>
    </View>
  </View>
</Modal>

  );
};

export default TermsModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '85%',
    paddingRight: 15
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 6,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
    marginBottom: 6,
  },
  closeButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#6e9fc1',
    borderRadius: 5
  },
});
