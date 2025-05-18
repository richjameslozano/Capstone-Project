import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const QuantityModal = ({ visible, onClose, onSubmit, itemName }) => {
  const [quantity, setQuantity] = useState('');

  const handleConfirm = () => {
    const num = parseInt(quantity);
    if (isNaN(num) || num <= 0) {
      alert("Please enter a valid positive number");
      return;
    }
    onSubmit(num);
    setQuantity('');
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Add Quantity</Text>
          <Text style={styles.label}>Item: {itemName}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Enter quantity"
            value={quantity}
            onChangeText={setQuantity}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.buttonCancel} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonConfirm} onPress={handleConfirm}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default QuantityModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 10,
  },

  title: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },

  label: {
    marginBottom: 10,
  },
  
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  buttonCancel: {
    marginRight: 10,
    padding: 10,
    backgroundColor: '#bbb',
    borderRadius: 6,
  },

  buttonConfirm: {
    padding: 10,
    backgroundColor: '#2196F3',
    borderRadius: 6,
  },

  buttonText: {
    color: '#fff',
  },
});
