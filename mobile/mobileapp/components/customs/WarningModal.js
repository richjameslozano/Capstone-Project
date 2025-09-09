import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const WarningModal = ({
  visible,
  onOk,
  onCancel,
  dateRequired,
  daysDifference
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Icon name="alert-circle" size={25} color="#ff4d4f" />
            <Text style={styles.title}>Warning!</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>
              You're requesting items for <Text style={styles.bold}>{dateRequired}</Text>, which is only <Text style={styles.bold}>{daysDifference} day{daysDifference !== 1 ? 's' : ''}</Text> from today.
            </Text>
            
            <Text style={styles.subMessage}>
              Please note that requests with less than 7 days notice may not be processed in time. 
              Consider selecting a date at least 7 days in advance for better processing.
            </Text>

            <View style={styles.recommendationBox}>
              <Text style={styles.recommendationText}>
                <Text style={styles.bold}>Recommendation:</Text> Choose a date 7 days or more from today for optimal processing time.
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Change Date</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.continueButton} onPress={onOk}>
              <Text style={styles.continueButtonText}>Continue Anyway</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4d4f',
    marginLeft: 10,
  },
  content: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 22,
  },
  subMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  recommendationBox: {
    backgroundColor: '#fff2f0',
    borderWidth: 1,
    borderColor: '#ffccc7',
    borderRadius: 6,
    padding: 12,
  },
  recommendationText: {
    fontSize: 13,
    color: '#a8071a',
    lineHeight: 18,
  },
  bold: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#ff4d4f',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  continueButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});

export default WarningModal;
