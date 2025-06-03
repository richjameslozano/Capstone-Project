import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

const QuantityModal = ({ visible, onClose, onSubmit, itemName, category, dateOfExpiry }) => {
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);

  const isChemicalOrReagent = category === "Chemical" || category === "Reagent";
  const today = new Date().toISOString().split('T')[0];

  // const handleConfirm = () => {
  //   const num = parseInt(quantity);
  //   if (isNaN(num) || num <= 0) {
  //     alert("Please enter a valid positive number");
  //     return;
  //   }
  //   onSubmit(num);
  //   setQuantity('');
  // };

  const handleConfirm = () => {
    const num = parseInt(quantity);
    if (isNaN(num) || num <= 0) {
      alert("Please enter a valid positive number");
      return;
    }

    // if (isChemicalOrReagent && !expiryDate) {
    //   alert("Please enter an expiry date");
    //   return;
    // }

    onSubmit(num, expiryDate || null); // pass expiryDate
    setQuantity('');
    setExpiryDate('');
  };

const shouldShowCalendar = isChemicalOrReagent && (dateOfExpiry !== null && dateOfExpiry !== undefined);
console.log('category:', category, 'dateOfExpiry:', dateOfExpiry, 'shouldShowCalendar:', shouldShowCalendar);



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

          {/* {isChemicalOrReagent && (
            <TextInput
              style={styles.input}
              placeholder="Enter expiry date (YYYY-MM-DD)"
              value={expiryDate}
              onChangeText={setExpiryDate}
            />
          )} */}

          {shouldShowCalendar && (
            <>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setCalendarVisible(true)}
              >
                <Text style={{ color: expiryDate ? 'black' : '#aaa' }}>
                  {expiryDate || "Select expiry date"}
                </Text>
              </TouchableOpacity>

              <Modal
                animationType="fade"
                transparent={true}
                visible={calendarVisible}
                onRequestClose={() => setCalendarVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Calendar
                      onDayPress={(day) => {
                        setExpiryDate(day.dateString);
                        setCalendarVisible(false);
                      }}
                      markedDates={{
                        [expiryDate]: { selected: true, selectedColor: '#00796B' }
                      }}
                      minDate={today}
                    />
                    <TouchableOpacity onPress={() => setCalendarVisible(false)} style={styles.closeButton}>
                      <Text style={{ color: 'white' }}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </>
          )}


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

  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 10,
  },

  closeButton: {
    backgroundColor: '#00796B',
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
});
