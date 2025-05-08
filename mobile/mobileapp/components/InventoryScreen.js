import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Image, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, ScrollView , Platform, Keyboard} from 'react-native';
import { getDocs, collection, onSnapshot, doc, setDoc, addDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../backend/firebase/FirebaseConfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import styles from './styles/InventoryStyle';
import { useAuth } from '../components/contexts/AuthContext';
import { useRequestList } from '../components/contexts/RequestListContext';
import { Calendar } from 'react-native-calendars';
import { useRequestMetadata } from './contexts/RequestMetadataContext';
import Header from './Header';

import Icon2 from 'react-native-vector-icons/Ionicons'; 
import { useFocusEffect } from '@react-navigation/native';

export default function InventoryScreen({ navigation }) {
  const { user } = useAuth();
  const [tempRequestCount, setTempRequestCount] = useState(0);
  const { transferToRequestList, requestList } = useRequestList();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [activeInputItemId, setActiveInputItemId] = useState(null);
  const [itemQuantities, setItemQuantities] = useState({});
  const [reason, setReason] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timePickerType, setTimePickerType] = useState('start');
  const [selectedUsageType, setSelectedUsageType] = useState('');
  const [usageTypes, setUsageTypes] = useState([]);
  const [selectedStartTime, setSelectedStartTime] = useState({ hour: '10', minute: '00', period: 'AM' });
  const [selectedEndTime, setSelectedEndTime] = useState({ hour: '3', minute: '00', period: 'PM' });
  const [program, setProgram] = useState('');
  const [room, setRoom] = useState('');
  const [selectedUsageTypeInput, setSelectedUsageTypeInput] = useState(''); 
  const today = new Date().toISOString().split('T')[0];
  const { metadata, setMetadata } = useRequestMetadata();
  const [isComplete, setIsComplete] = useState(false); 
  const [headerHeight, setHeaderHeight] = useState(0);

  const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };

  useFocusEffect(
    useCallback(() => {
      setIsComplete(false); // reset when returning
      setSelectedDate('')
      setSelectedStartTime({ hour: '10', minute: '00', period: 'AM' })
      setSelectedEndTime({ hour: '3', minute: '00', period: 'PM' })
      setProgram('')
      setRoom('')
      setReason('')
      setSelectedUsageTypeInput(null)
    }, [])
  );
   
  useEffect(() => {
    const inventoryCollection = collection(db, 'inventory');  
  
    const unsubscribe = onSnapshot(
      inventoryCollection,
      (inventorySnapshot) => {
        const inventoryList = inventorySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        setInventoryItems(inventoryList);
  
        const categoriesList = ['All', ...new Set(inventoryList.map((item) => item.type))];
        const departmentsList = ['All', ...new Set(inventoryList.map((item) => item.department))];
        const usageTypesList = ['All', ...new Set(inventoryList.map((item) => item.usageType))];
  
        setCategories(categoriesList);
        setDepartments(departmentsList);
        setUsageTypes(usageTypesList);
      },
      
      (error) => {
        console.error('Error fetching inventory in real-time: ', error);
      }
    );
  
    return () => unsubscribe(); // Clean up the listener on unmount
  }, []);

  useEffect(() => {
    if (!user || !user.id) return;
  
    const tempRequestRef = collection(db, 'accounts', user.id, 'temporaryRequests');
  
    const unsubscribe = onSnapshot(tempRequestRef, (snapshot) => {
      setTempRequestCount(snapshot.size); // Real-time count
    }, (error) => {
      console.error('Real-time update error:', error);
    });
  
    return () => unsubscribe(); // cleanup listener on unmount
  }, [user]);  

  const filteredItems = inventoryItems.filter((item) => {
    const isCategoryMatch = selectedCategory === 'All' || selectedCategory === '' || item.type === selectedCategory;
    const isUsageTypeMatch = selectedUsageType === 'All' || selectedUsageType === '' || item.usageType === selectedUsageType;
    const isSearchMatch = !searchQuery || item.itemName?.toLowerCase().includes(searchQuery.toLowerCase());
  
    return isCategoryMatch && isUsageTypeMatch && isSearchMatch;
  });  

  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
    setQuantity('');
    setReason('');
    setSelectedUsageTypeInput(''); 
  };

  const handleInputToggle = (itemId) => {
    if (activeInputItemId === itemId) {
      setActiveInputItemId(null);
      
    } else {
      setActiveInputItemId(itemId);
    }
  };

  const handleQuantityChange = (text, itemId) => {
    if (/^[1-9]\d*$/.test(text) || text === '') {
      setItemQuantities(prev => ({ ...prev, [itemId]: text }));
    }
  };

  const addToList = async (item) => {
    const quantity = itemQuantities[item.id];
  
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    if (!selectedUsageTypeInput) {
      alert('Please select a usage type.');
      return;
    }

    const requestedQty = parseInt(quantity);
    const availableQty = parseInt(item.quantity);
  
    if (requestedQty > availableQty) {
      alert(`The quantity you requested exceeds available stock (${availableQty}).`);
      return;
    }

    if (
      !metadata?.dateRequired || 
      !metadata?.timeFrom || 
      !metadata?.timeTo || 
      !metadata?.program || 
      !metadata?.room || 
      !metadata?.usageType
    ) {
      alert('Please fill out all the borrowing details before adding an item.');
      return;
    }
  
    try {
      const collectionRef = collection(db, 'accounts', user.id, 'temporaryRequests');
  
      // 🔍 Check for duplicates by "id"
      const q = query(collectionRef, where('id', '==', item.id));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        alert('This item is already in your request list.');
        return;
      }
  
      await addDoc(collectionRef, {
        category: item.category || '',
        condition: item.condition || '',
        department: item.department || '',
        entryDate: item.entryDate || '',
        expiryDate: item.expiryDate || '',
        id: item.id, 
        itemId: item.itemId || '',
        itemName: item.itemName || '',
        labRoom: item.labRoom || '',
        qrCode: item.qrCode || '',
        quantity: quantity.toString(),
        selectedItemId: item.id,
        selectedItemLabel: item.itemName,
        status: item.status || 'Available',
        timestamp: Timestamp.fromDate(new Date()),
        type: item.type || '',
        usageType: item.usageType || '',
      });
  
      alert('Item successfully added to temporaryRequests.');
      setActiveInputItemId(null);
      setItemQuantities((prev) => ({ ...prev, [item.id]: '' }));
      
    } catch (error) {
      console.error('Error adding item to temporaryRequests:', error);
      alert('Failed to add item. Try again.');
    }
  };

  const renderItem = ({ item }) => {
    const isAlreadyInList = requestList.some(reqItem => reqItem.id === item.id);
    const isActive = activeInputItemId === item.id;
  
    return (
      <TouchableOpacity onPress={() => openModal(item)} activeOpacity={0.9}>
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.imageContainer}>
              <Image style={styles.itemImage} source={require('../assets/favicon.png')} />
            </View>
  
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.itemName}</Text>
              <Text style={styles.itemType}>Quantity: {item.quantity}</Text>
              <Text style={styles.itemType}>Status: {item.status}</Text>
            </View>
  
            <TouchableOpacity
              style={[styles.addButton, isAlreadyInList && styles.disabledButton]}
              onPress={(e) => {
                e.stopPropagation(); 
                handleInputToggle(item.id);
              }}
              disabled={isAlreadyInList}
            >
              <Icon name="plus-circle" size={24} color={isAlreadyInList ? '#ccc' : 'green'} />
            </TouchableOpacity>
          </View>
  
          {isActive && (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                keyboardType="numeric"
                value={itemQuantities[item.id] || ''}
                onChangeText={(text) => handleQuantityChange(text, item.id)}
              />
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => addToList(item)}
              >
                <Text style={styles.confirmButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };  

  const formatTime = ({ hour, minute, period }) => `${hour}:${minute} ${period}`;

  const convertTo24Hour = ({ hour, minute, period }) => {
    let hours = parseInt(hour);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  
    // Format to HH:mm (24-hour format)
    const formattedHour = hours.toString().padStart(2, '0'); // Add leading zero if necessary
    const formattedMinute = minute.toString().padStart(2, '0'); // Add leading zero if necessary
    return `${formattedHour}:${formattedMinute}`;
  };  

  const openTimePicker = (type) => {
    setTimePickerType(type);
    setTimeModalVisible(true); // this just opens your modal
  };
  
  const handleStartTimeSelect = (startTime) => {
    // Save the selected start time
    setSelectedStartTime(startTime);
  
    // Convert to 24-hour format and save to metadata
    setMetadata((prevMetadata) => ({
      ...prevMetadata,
      timeFrom: convertTo24Hour(startTime), // Convert to 24-hour format and save
    }));
  };
  
  const handleEndTimeSelect = (endTime) => {
    // Save the selected end time
    setSelectedEndTime(endTime);
  
    // Convert to 24-hour format and save to metadata
    setMetadata((prevMetadata) => ({
      ...prevMetadata,
      timeTo: convertTo24Hour(endTime), // Convert to 24-hour format and save
    }));
  };  

  const [errors, setErrors] = useState({
    date: false,
    startTime: false,
    endTime: false,
    program: false,
    room: false,
    usageType: false,
  });
  
  const handleNext = () => {
    const newErrors = {
      date: !selectedDate,
      startTime: !selectedStartTime,
      endTime: !selectedEndTime,
      program: !program,
      room: !room,
      usageType: !selectedUsageTypeInput,
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (!hasErrors) {
      setMetadata({
        dateRequired: selectedDate,
        timeFrom: selectedStartTime,
        timeTo: selectedEndTime,
        program,
        room,
        usageType: selectedUsageTypeInput,
        reason
      });
      
      setIsComplete(true);
    }
    };

  return (
    <View style={styles.container}>
      <Header onLayout={handleHeaderLayout} />

      <KeyboardAvoidingView
      style={{ flex: 1,}}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0} 
    >
      {isComplete && (
     
  
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          enableOnAndroid={true}
          keyboardShouldPersistTaps="always"
          extraScrollHeight={0} 
          enableAutomaticScroll={true} >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={{flex: 1, overflow: 'visible' }}>
      <View style={[styles.wholeSection,{ marginTop: headerHeight }]}>
      <View style={{flexDirection:'row', alignItems: 'center', marginBottom: 10}}>
        <Icon2 name='clipboard-outline' size={30}/>
        <View style={{flex: 1, marginLeft: 8}}>
        <Text style={{fontSize:18, fontWeight: 'bold'}}>Requisition Slip</Text>
        <Text style={{fontWeight: 300, fontSize: 13}}>Please fill in the required information to proceed.</Text>
        </View>
      </View>
    <View style={[styles.dateSection]}>
      <Text style={{fontSize: 16, fontWeight: 500, color: '#395a7f', width: 100}}>Date Needed:</Text>

      <TouchableOpacity style={[
    styles.dateButton,
    errors.date && { borderColor: 'red', borderWidth: 1 }
    ]} 
    onPress={() => setCalendarVisible(true)}>
      
        <Text style={styles.dateButtonText}>
          {selectedDate || 'Select Date'}
        </Text>
        <Icon2 name="chevron-down" type="ionicon" size={20} color='#fff'/>1
      </TouchableOpacity>

      {/* Modal with Calendar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={calendarVisible}
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Calendar
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
                setCalendarVisible(false);
                setMetadata((prev) => ({ ...prev, dateRequired: day.dateString }));
              }}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: '#00796B' },
              }}
              minDate={today}
            />
            <TouchableOpacity onPress={() => setCalendarVisible(false)} style={styles.closeButton}>
              <Text style={{ color: 'white' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>

          <View style={styles.timeSection}>
              <Text style={{fontSize: 16, fontWeight: 500, color: '#395a7f', width:100}}>Time Needed:</Text>
              <View style={styles.timeButtonContainer}>
                <View style={styles.timeBtn}>
                <Text style={{fontSize: 12, fontWeight: 400, color: '#395a7f'}}>start:</Text>
                <TouchableOpacity
                    style={[
                      styles.timeButton,
                      errors.startTime && { borderColor: 'red', borderWidth: 1 }
                    ]}
                    onPress={() => openTimePicker('start')}
>
                      <Text style={styles.timeButtonText}>
                        {formatTime(selectedStartTime)}
                      </Text>
                    </TouchableOpacity>
                </View>
                  
                <View  style={styles.timeBtn}>
                <Text  style={{fontSize: 12, fontWeight: 400, color: '#395a7f'}}>end:</Text>
                <TouchableOpacity
                      style={[
                        styles.timeButton,
                        errors.endTime && { borderColor: 'red', borderWidth: 1 }
                      ]}
                      onPress={() => openTimePicker('end')}
                    >
                      <Text style={styles.timeButtonText}>
                      {formatTime(selectedEndTime)}
                      </Text>
                    </TouchableOpacity>
                </View>  
                  </View>
          </View>


          <View style={styles.programSection}>
            <Text style={{fontSize: 16, fontWeight: 500, color: '#395a7f',  width:100}}>Select Program:</Text>
            <View
                style={[
                  styles.programPicker,
                  errors.program && { borderColor: 'red', borderWidth: 1 }
                ]}
              >
                  <Picker
                    selectedValue={program}
                    onValueChange={(itemValue) => {
                      setProgram(itemValue);
                      setMetadata((prevMetadata) => ({ ...prevMetadata, program: itemValue }));
                    }}
                    style={styles.programItem}
                    dropdownIconColor= "#6e9fc1"
                    dropdownIconRippleColor='white'
                  >
                    <Picker.Item label="Program" value=""  style={{fontSize: 15}}/>
                    <Picker.Item label="SAM - BSMT" value="SAM - BSMT" style={{fontSize: 15}} />
                    <Picker.Item label="SAH - BSN" value="SAH - BSN"  style={{fontSize: 15}}/>
                    <Picker.Item label="SHS" value="SHS"  style={{fontSize: 15}}/>
                  </Picker>

                  <Icon2
                    name="chevron-down"
                    size={20}
                    color="white"
                    style={styles.arrowIcon}
                    pointerEvents="none"
                  />
                </View>
          </View>

          <View style={styles.roomSection}>
            <Text style={{fontSize: 16, fontWeight: 500, color: '#395a7f',  width: 100}}>Room No.</Text>
            <TextInput
                  style={[
                    styles.roomInput,
                    errors.room && { borderColor: 'red', borderWidth: 1 }
                  ]}
                  placeholder="e.g., 929"
                  value={room}
                  keyboardType='numeric'
                  maxLength={4}
                  onChangeText={(text) => {
                    setRoom(text);
                    setMetadata((prevMetadata) => ({ ...prevMetadata, room: text }));
                  }}
                />
          </View>

          <View style={styles.usageSection}>
                <Text style={{fontSize: 16, fontWeight: 500, color: '#395a7f',  width: 100}}>Usage Type</Text>
                <View
                style={[
                  styles.usagePicker,
                  errors.usageType && { borderColor: 'red', borderWidth: 1 }
                ]}
              >
          <Picker
            selectedValue={selectedUsageTypeInput}
            onValueChange={(itemValue) => {
              setSelectedUsageTypeInput(itemValue);
              setMetadata((prevMetadata) => ({
                ...prevMetadata,
                usageType: itemValue,
              }));
            }}
            dropdownIconColor='#6e9fc1'
            dropdownIconRippleColor='white'
            style={styles.programItem}
          >
            <Picker.Item label="Select" value="" style={{fontSize: 15}}/>
            <Picker.Item label="Laboratory Experiment" value="Laboratory Experiment" style={{fontSize: 15}}/>
            <Picker.Item label="Research" value="Research" />
            <Picker.Item label="Community Extension" value="Community Extension" style={{fontSize: 15}}/>
            <Picker.Item label="Others" value="Others" style={{fontSize: 15}}/>
          </Picker>
          <Icon2
                    name="chevron-down"
                    size={20}
                    color="white"
                    style={styles.arrowIcon}
                    pointerEvents="none"
                  />
        </View>
          </View>

        <View style={styles.noteSection}>
          <Text style={{fontWeight: 'bold'}}>Note: (Optional)</Text>
        <TextInput
                style={styles.noteInput}
                placeholder="Leave a note..."
                value={reason}
                onChangeText={(text) => {
                  setReason(text);
                  setMetadata((prevMetadata) => ({ ...prevMetadata, reason: text }));
                }}
                multiline
              />
        </View>

        <View style={{alignItems: 'flex-end', padding: 5}}>
          <TouchableOpacity style={styles.proceedBtn} onPress={() => handleNext()}>
            <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 15, marginRight: 10, textAlign: 'center'}}>Next</Text>
            <Icon2 name='chevron-forward' color='#fff' size={15}/>
          </TouchableOpacity>
        </View>
        </View>
        </TouchableWithoutFeedback>
        </ScrollView>
        
    )}
    
  {!isComplete && (
    <ScrollView 
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.scrollContainer}
    enableOnAndroid={true}
    keyboardShouldPersistTaps="always"
    extraScrollHeight={0} 
    enableAutomaticScroll={true} >
    <View style={[styles.wholeSection2,{ marginTop: headerHeight }]}>
        <TextInput 
                style={[styles.searchBar]}
                placeholder="Search by item name"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
      
              <FlatList
                data={filteredItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No items found</Text>}
              /> 

 <View style={styles.bottomContainer}>
        <View style={styles.requestAddContainer}>
        <TouchableOpacity style={styles.requestButton} onPress={() => navigation.navigate('RequestListScreen')}>
          <Text style={styles.requestButtonText}>Request List</Text>
          {tempRequestCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{tempRequestCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.helpButton} onPress={() => navigation.navigate('HelpScreen')}>
          <Text style={styles.helpButtonText}>Help (?)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={()=> setIsComplete(false)}>
          <Text>Back</Text>
        </TouchableOpacity>
      </View> 
      </View>
      </ScrollView>
  )}
      </KeyboardAvoidingView>

    
    
    
      
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalBackground}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <View style={styles.modalImageContainer}>
                  <Image style={styles.modalImage} source={require('../assets/favicon.png')} />
                </View>

                <Text style={styles.modalItemName}>{selectedItem?.itemName}</Text>
                <Text style={styles.itemType}>Type: {selectedItem?.type}</Text>
                <Text style={styles.itemType}>Department: {selectedItem?.department}</Text>
                <Text style={styles.itemType}>Category: {selectedItem?.category}</Text>
                <Text style={styles.itemType}>Condition: {selectedItem?.condition}</Text>
                <Text style={styles.itemType}>Status: {selectedItem?.status}</Text>
                <Text style={styles.itemType}>Available Quantity: {selectedItem?.quantity}</Text>
              </View>
            </TouchableWithoutFeedback> 
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      

      <Modal
        visible={timeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setTimeModalVisible(false)}>
          <View style={styles.timeModalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.timeModalContent}>
                <Text style={styles.modalTitle}>
                  Select {timePickerType === 'start' ? 'Start' : 'End'} Time
                </Text>
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
                        }}
                      >
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
                        }}
                      >
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
                        }}
                      >
                        <Text style={styles.timeText}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </ScrollView>

                <TouchableOpacity
                  style={styles.okButton}
                  onPress={() => {
                    let selectedTime;
                    if (timePickerType === 'start') {
                      selectedTime = selectedStartTime;
                    } else {
                      selectedTime = selectedEndTime;
                    }

                    const { hour, minute, period } = selectedTime;

                    if (!hour || !minute || !period) {
                      alert('Please select hour, minute, and AM/PM.');
                      return;
                    }

                    const timeString = `${hour}:${minute} ${period}`;

                    // Pass the selected time to the appropriate handler
                    if (timePickerType === 'start') {
                      handleStartTimeSelect(selectedTime); // Correctly pass selected time

                    } else {
                      handleEndTimeSelect(selectedTime); // Correctly pass selected time
                    }

                    setTimeModalVisible(false); // Close the modal
                  }}
                >
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

