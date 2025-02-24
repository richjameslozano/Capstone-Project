import React, { useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Image, Modal, Alert, ScrollView } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/userStyle/RequestListStyle';
import { useAuth } from '../contexts/AuthContext';

const requestList = [
  { id: '1', name: 'ITEM NAME', department: 'NURSING', quantity: 20, tag: 'INF223', reason: 'I have a class that needs this equipment. My students will use these' },
  { id: '2', name: 'ITEM NAME', department: 'NURSING', quantity: 10, tag: 'INF224', reason: 'Equipment needed for training' },
];

export default function RequestListScreen({ navigation }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
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
          onPress: () => console.log(`Removed item with ID: ${id}`),
        },
      ]
    );
  };

  const requestItems = () => {
    if (!selectedDate) {
      Alert.alert('Select Date', 'Please pick a borrow date before requesting.');
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
  
    Alert.alert(
      'Confirm Request',
      `Are you sure you want to request these items on ${selectedDate} from ${formatTime(selectedStartTime)} to ${formatTime(selectedEndTime)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: () => Alert.alert("Request Submitted", "Your request has been sent successfully!"),
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
            View Details
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

      <FlatList data={requestList} keyExtractor={(item) => item.id} renderItem={renderItem} />

      <Button mode="outlined" onPress={() => setCalendarVisible(true)}>
        {selectedDate ? `Borrow Date: ${selectedDate}` : 'Pick Borrow Date'}
      </Button>
      {calendarVisible && (
        <Calendar
          onDayPress={(day) => { setSelectedDate(day.dateString); setCalendarVisible(false); }}
          markedDates={{ [selectedDate]: { selected: true, selectedColor: '#00796B' } }}
          minDate={today}
        />
      )}

      <View style={styles.inputContainer}>
        <Button mode="outlined" onPress={() => openTimePicker('start')}>
          Start Time: {formatTime(selectedStartTime)}
        </Button>
        
        <Button mode="outlined" onPress={() => openTimePicker('end')}>
          End Time: {formatTime(selectedEndTime)}
        </Button>
      </View>

      <Button mode="contained" onPress={requestItems} style={styles.requestButton}>
        Request Now
      </Button>

      <Modal visible={timeModalVisible} transparent animationType="slide" onRequestClose={() => setTimeModalVisible(false)}>
        <View style={styles.modalContainer}>
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

            <Button onPress={() => setTimeModalVisible(false)} mode="contained" style={styles.okButton}>
              OK
            </Button>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image source={require('../../assets/favicon.png')} style={styles.modalImage} />
            
            <Text style={styles.modalTitle}>{selectedRequest?.name}</Text>
            <Text>Department: {selectedRequest?.department}</Text>
            <Text>Tag: {selectedRequest?.tag}</Text>
            <Text>Quantity: {selectedRequest?.quantity}</Text> 
            <Text>Reason: {selectedRequest?.reason}</Text>

            <Button onPress={() => setModalVisible(false)} mode="contained" style={styles.okButton}>
              Close
            </Button>
          </View>
        </View>
      </Modal>

    </View>
  );
}
