import React from 'react';
import { Modal, View, Text, ScrollView, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

const TermsModal = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView>
            <Text style={styles.modalTitle}>Terms and Conditions</Text>
            <Text style={styles.modalText}>
              {/* Replace with actual terms */}
              By using this app, you agree to follow all the guidelines and rules of usage...
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
    alignItems: 'center',
  },
  
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  modalText: {
    fontSize: 14,
    color: '#333',
  },

  closeButton: {
    marginTop: 20,
  },
});
