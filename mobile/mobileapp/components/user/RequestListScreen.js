import React, { useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Image, Modal, Alert, ScrollView, TextInput, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useRequestList } from '../../components/contexts/RequestListContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/userStyle/RequestListStyle';

export default function RequestListScreen({ navigation }) {
  const { requestList, setRequestList, removeFromRequestList } = useRequestList();
  const { moveToPendingRequests } = useRequestList();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reason, setReason] = useState('');
  const [updatedQuantities, setUpdatedQuantities] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [updatedQuantity, setUpdatedQuantity] = useState('');
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timePickerType, setTimePickerType] = useState('start');
  const [selectedStartTime, setSelectedStartTime] = useState({ hour: '10', minute: '00', period: 'AM' });
  const [selectedEndTime, setSelectedEndTime] = useState({ hour: '3', minute: '00', period: 'PM' });

  const today = new Date().toISOString().split('T')[0];

  const removeItem = (id) => {
    Alert.alert(
      'Confirm Removal',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromRequestList(id),
        },
      ]
    );
  };

  const updateQuantity = () => {
    const quantity = updatedQuantities[selectedRequest?.id];
    if (!quantity || parseInt(quantity, 10) <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity.');
      return;
    }
  
    const updatedList = requestList.map((item) =>
      item.id === selectedRequest.id ? { ...item, quantity: parseInt(quantity, 10) } : item
    );
  
    setRequestList(updatedList);
    setModalVisible(false);
  };

  const requestItems = () => {
    if (!selectedDate) {
      Alert.alert('Select Date', 'Please pick a borrow date before requesting.');
      return;
    }
  
    const invalidItems = requestList.filter(item => item.quantity <= 0);
    if (invalidItems.length > 0) {
      Alert.alert(
        'Invalid Request',
        'Some items have a quantity of 0. Please update the quantity before requesting.'
      );
      return;
    }  
  
    const startTime = convertTo24Hour(selectedStartTime);
    const endTime = convertTo24Hour(selectedEndTime);
    const duration = (endTime - startTime) / 60;
  
    if (startTime >= endTime) {
      Alert.alert('Invalid Time', 'Start time must be earlier than end time.');
      return;
    }
  
    if (duration > 5) {
      Alert.alert('Exceeds Time Limit', 'You can only borrow items for a maximum of 5 hours.');
      return;
    }
  
    if (!reason.trim()) {
      Alert.alert('Enter Reason', 'Please provide a reason for borrowing the items.');
      return;
    }
  
    Alert.alert(
      'Confirm Request',
      `Are you sure you want to request these items on ${selectedDate}?\nReason: ${reason}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: () => {
            moveToPendingRequests(
              requestList.map(item => ({
                ...item,
                date: selectedDate,
                reason,
                startTime: selectedStartTime || { hour: '10', minute: '00', period: 'AM' },
                endTime: selectedEndTime || { hour: '3', minute: '00', period: 'PM' }
              }))
            );            
            Alert.alert("Request Submitted", "Your request has been sent successfully!");
            navigation.navigate('RequestScreen');
            setReason("")

          },
        },
      ]
    );
  };
  
  const formatTime = ({ hour, minute, period }) => `${hour}:${minute} ${period}`;

  const convertTo24Hour = ({ hour, minute, period }) => {
    let hours = parseInt(hour);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + parseInt(minute);
  };

  const openTimePicker = (type) => {
    setTimePickerType(type);
    setTimeModalVisible(true);
  };

  const renderItem = ({ item, index }) => (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.index}>{index + 1}.)</Text>
        <Image source={require('../../assets/favicon.png')} style={styles.image} />
        <View style={styles.details}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.department}>
            Department: <Text style={styles.highlight}>{item.department}</Text>
          </Text>
          <Button mode="contained" style={styles.button} onPress={() => { setSelectedRequest(item); setModalVisible(true); }}>
            Add Quantity
          </Button>
        </View>
        <TouchableOpacity style={styles.removeIcon} onPress={() => removeItem(item.id)}>
          <Icon name="close-circle" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/favicon.png')} style={styles.logo} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Request List</Text>
          <Text style={styles.subtitle}>Manage your borrowed items</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Icon name="account-circle" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {requestList.length === 0 ? (
        <Text style={styles.emptyText}>No items in request list.</Text>
      ) : (
        <FlatList data={requestList} keyExtractor={(item) => item.id} renderItem={renderItem} />
      )}

      <TouchableOpacity style={styles.dateButton} onPress={() => setCalendarVisible(true)}>
        <Text style={styles.dateButtonText}>
          {selectedDate ? `Borrow Date: ${selectedDate}` : 'Pick Borrow Date'}
        </Text>
      </TouchableOpacity>

      {calendarVisible && (
        <Calendar
          onDayPress={(day) => { setSelectedDate(day.dateString); setCalendarVisible(false); }}
          markedDates={{ [selectedDate]: { selected: true, selectedColor: '#00796B' } }}
          minDate={today}
        />
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.timeButton} onPress={() => setTimeModalVisible(true)}>
          <Text style={styles.timeButtonText}>Start Time: {selectedStartTime.hour}:{selectedStartTime.minute} {selectedStartTime.period}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.timeButton} onPress={() => setTimeModalVisible(true)}>
          <Text style={styles.timeButtonText}>End Time: {selectedEndTime.hour}:{selectedEndTime.minute} {selectedEndTime.period}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.reasonInput}
        placeholder="Enter reason for borrowing..."
        value={reason}
        onChangeText={setReason}
        multiline
      />

      <TouchableOpacity style={styles.requestButton} onPress={requestItems}>
        <Text style={styles.requestButtonText}>Request Now</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedRequest && (
              <>
                <Text style={styles.modalTitle}>Item Details</Text>
                <Text style={styles.modalText}>Item Name: {selectedRequest.name}</Text>
                <Text style={styles.modalText}>Department: {selectedRequest.department}</Text>
                <Text style={styles.modalText}>Tag: {selectedRequest.tags}</Text>
                <Text style={styles.modalText}>Quantity:</Text>
                <TextInput
                  style={styles.input}
                  value={updatedQuantities[selectedRequest?.id] || ''}
                  onChangeText={(value) => setUpdatedQuantities(prev => ({ ...prev, [selectedRequest.id]: value }))}
                  keyboardType="numeric"
                  placeholder="Enter new quantity"
                />
                <View style={styles.modalButtons}>
                  <Button mode="contained" onPress={updateQuantity}>Update</Button>
                  <Button mode="outlined" onPress={() => setModalVisible(false)}>Close</Button>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>


      <Modal visible={timeModalVisible} transparent animationType="slide" onRequestClose={() => setTimeModalVisible(false)}>
      <TouchableWithoutFeedback onPress={() => setTimeModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select {timePickerType === 'start' ? 'Start' : 'End'} Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <ScrollView style={styles.timeScroll}>
                  {[...Array(12).keys()].map((h) => (
                    <TouchableOpacity
                      key={h + 1}
                      onPress={() => {
                        if (timePickerType === 'start') {
                          setSelectedStartTime({ ...selectedStartTime, hour: (h + 1).toString() });
                        } else {
                          setSelectedEndTime({ ...selectedEndTime, hour: (h + 1).toString() });
                        }
                      }}>
                      <Text style={styles.timeText}>{h + 1}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.colon}>:</Text>

                <ScrollView style={styles.timeScroll}>
                  {['00', '15', '30', '45'].map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => {
                        if (timePickerType === 'start') {
                          setSelectedStartTime({ ...selectedStartTime, minute: m });
                        } else {
                          setSelectedEndTime({ ...selectedEndTime, minute: m });
                        }
                      }}>
                      <Text style={styles.timeText}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.colon}> </Text>

                <ScrollView style={styles.timeScroll}>
                  {['AM', 'PM'].map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => {
                        if (timePickerType === 'start') {
                          setSelectedStartTime({ ...selectedStartTime, period: p });
                        } else {
                          setSelectedEndTime({ ...selectedEndTime, period: p });
                        }
                      }}>
                      <Text style={styles.timeText}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </ScrollView>

              <TouchableOpacity style={styles.okButton} onPress={() => setTimeModalVisible(false)}>
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
          </View>
      </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
