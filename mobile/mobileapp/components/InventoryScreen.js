import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Image, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, ScrollView , Platform, Keyboard, StatusBar, Alert} from 'react-native';
import { getDocs, collection, onSnapshot, doc, setDoc, addDoc, query, where, Timestamp, collectionGroup } from 'firebase/firestore';
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
import { useFocusEffect, useIsFocused } from '@react-navigation/native';


export default function InventoryScreen({ navigation }) {
  const { user } = useAuth();
  const [tempRequestCount, setTempRequestCount] = useState(0);
  const { transferToRequestList, requestList } = useRequestList();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
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
  const [course, setCourse] = useState('');
  const [room, setRoom] = useState('');
  const [selectedUsageTypeInput, setSelectedUsageTypeInput] = useState(''); 
  const [usageTypeOtherInput, setUsageTypeOtherInput] = useState('')
  const today = new Date().toISOString().split('T')[0];
  const { metadata, setMetadata } = useRequestMetadata();
  const [isComplete, setIsComplete] = useState(false); 
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const categoryOptions = ['All', 'Equipment', 'Chemical', 'Materials', 'Reagent', 'Glasswares'];


  const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };

  useFocusEffect(
    useCallback(() => {
      setIsComplete(false); 
      setSelectedDate('')
      setSelectedStartTime({ hour: '10', minute: '00', period: 'AM' })
      setSelectedEndTime({ hour: '3', minute: '00', period: 'PM' })
      setProgram('')
      setCourse('')
      setRoom('')
      setReason('')
      setSelectedUsageTypeInput(null)

          StatusBar.setBarStyle('light-content');
          StatusBar.setBackgroundColor('transparent');
          StatusBar.setTranslucent(true)
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

  useEffect(() => {
    if (selectedStartTime.hour && selectedStartTime.minute && selectedStartTime.period) {
      handleStartTimeSelect(selectedStartTime);
    }
  }, [selectedStartTime]);
  
  useEffect(() => {
    if (selectedEndTime.hour && selectedEndTime.minute && selectedEndTime.period) {
      handleEndTimeSelect(selectedEndTime);
    }
  }, [selectedEndTime]);  

  useEffect(() => {
    setMetadata(prev => ({ ...prev, usageTypeOther: usageTypeOtherInput }));
  }, [usageTypeOtherInput]);

  const filteredItems = inventoryItems.filter((item) => {
    const isCategoryMatch = selectedCategory === 'All' || selectedCategory === '' || item.category === selectedCategory;
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

    console.log('metadata.usageTypeOther:', metadata.usageTypeOther);
    console.log('selectedUsageTypeInput:', selectedUsageTypeInput);


    const finalUsageType =
      selectedUsageTypeInput === 'Others'
        ? metadata?.usageTypeOther || ''
        : selectedUsageTypeInput;

    const requestedQty = parseInt(quantity);
    const availableQty = parseInt(item.quantity);
  
    if (requestedQty > availableQty) {
      alert(`The quantity you requested exceeds available stock (${availableQty}).`);
      return;
    }

    console.log({
      dateRequired: metadata?.dateRequired,
      timeFrom: metadata?.timeFrom,
      timeTo: metadata?.timeTo,
      program: metadata?.program,
      course: metadata?.course,
      room: metadata?.room,
      usageType: metadata?.usageType,
      usageTypeOther: metadata?.usageTypeOther,
      finalUsageType
    });

    if (selectedUsageTypeInput === 'Others' && !finalUsageType) {
      alert('Please specify the usage type in the text field.');
      return;
    }


    if (
      !metadata?.dateRequired || 
      !metadata?.timeFrom || 
      !metadata?.timeTo || 
      !metadata?.program || 
      !metadata?.course || 
      !metadata?.room || 
      !finalUsageType 
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
        // condition: item.condition || '',
        department: item.department || '',
        entryDate: item.entryCurrentDate || '',
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
        usageType: finalUsageType || '',
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
  
    const handleIcon =()=>{
      if(item.category === 'Equipment') return 'cube-outline';
      if(item.category === 'Chemical') return 'flask-outline';
      if(item.category === 'Materials') return 'layers-outline';
      if(item.category === 'Reagent') return 'test-tube';
    }
    
    return (
      <TouchableOpacity onPress={() => openModal(item)} activeOpacity={0.9}>
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={[styles.imageContainer]}>
              <Icon name={handleIcon()} size={30} color={'black'}/>
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
              <View style={{flex: 1,borderLeftWidth: 1, borderColor: '#e9ecee', paddingLeft: 10, alignItems: 'center', justifyContent: 'center', marginVertical: 10}}>
                <Icon2 name={isActive ? "remove-circle-outline":"add-circle-outline"} size={28} color={isAlreadyInList ? '#ccc' : '#395a7f'} />
              </View>
              
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

  const formatTime = (timeObj) => {
    if (!timeObj || typeof timeObj !== 'object') return '';

    let { hour, minute, period } = timeObj;
    hour = parseInt(hour);
    minute = parseInt(minute);

    if (period === 'PM' && hour !== 12) {
      hour += 12;
      
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    const paddedHour = hour.toString().padStart(2, '0');
    const paddedMinute = minute.toString().padStart(2, '0');

    return `${paddedHour}:${paddedMinute}`;
  };

  // const convertTo24Hour = ({ hour, minute, period }) => {
  //   let hours = parseInt(hour);
  //   if (period === 'PM' && hours !== 12) hours += 12;
  //   if (period === 'AM' && hours === 12) hours = 0;
  
  //   // Format to HH:mm (24-hour format)
  //   const formattedHour = hours.toString().padStart(2, '0'); // Add leading zero if necessary
  //   const formattedMinute = minute.toString().padStart(2, '0'); // Add leading zero if necessary
  //   return `${formattedHour}:${formattedMinute}`;
  // };  

  const convertTo24Hour = ({ hour, minute, period }) => {
    let hours = parseInt(hour);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    // Format to HH:mm (24-hour format)
    const formattedHour = hours.toString().padStart(2, '0'); // Add leading zero if necessary
    const formattedMinute = minute.toString().padStart(2, '0'); // Add leading zero if necessary
    return `${formattedHour}:${formattedMinute}`; // Return as HH:mm
  };

  const openTimePicker = (type) => {
    setTimePickerType(type);
    setTimeModalVisible(true); // this just opens your modal
  };
  
  const handleStartTimeSelect = (startTime) => {
    // Convert to 24-hour format and save to metadata
    const formattedStartTime = convertTo24Hour(startTime);

    setMetadata((prevMetadata) => ({
      ...prevMetadata,
      timeFrom: formattedStartTime, // Save as string like "04:04"
    }));
  };

  const handleEndTimeSelect = (endTime) => {
    // Convert to 24-hour format and save to metadata
    const formattedEndTime = convertTo24Hour(endTime);

    setMetadata((prevMetadata) => ({
      ...prevMetadata,
      timeTo: formattedEndTime, // Save as string like "07:07"
    }));
  };

  const [errors, setErrors] = useState({
    date: false,
    startTime: false,
    endTime: false,
    program: false,
    course: false,
    room: false,
    usageType: false,
  });
  
  // const handleNext = () => {
  //   const newErrors = {
  //     date: !selectedDate,
  //     startTime: !selectedStartTime,
  //     endTime: !selectedEndTime,
  //     program: !program,
  //     room: !room,
  //     usageType: !selectedUsageTypeInput,
  //   };

  //   setErrors(newErrors);

  //   const hasErrors = Object.values(newErrors).some(Boolean);
  //   if (!hasErrors) {
  //     setMetadata({
  //       dateRequired: selectedDate,
  //       timeFrom: formatTime(selectedStartTime),
  //       timeTo: formatTime(selectedEndTime),
  //       program,
  //       room,
  //       usageType: selectedUsageTypeInput,
  //       reason
  //     });
      
  //     setIsComplete(true);
  //   }
  // };

  const isRoomTimeConflict = async (room, timeFrom, timeTo, dateRequired) => {
    const roomLower = room.toLowerCase();

    const checkConflict = (docs) => {
      return docs.some((doc) => {
        const data = doc.data();
        const docRoom = data.room?.toLowerCase();
        const docDate = data.dateRequired;
        const docTimeFrom = data.timeFrom;
        const docTimeTo = data.timeTo;

        console.log('Checking conflict with:', {
          docRoom, docDate, docTimeFrom, docTimeTo
        });

        return (
          docRoom === roomLower &&
          docDate === dateRequired &&
          timeFrom === docTimeFrom &&
          timeTo === docTimeTo
        );
      });
    };

    const userRequestsSnap = await getDocs(collectionGroup(db, 'userrequests'));
    const borrowCatalogSnap = await getDocs(collection(db, 'borrowCatalog'));

    const conflictInRequests = checkConflict(userRequestsSnap.docs);
    const conflictInCatalog = checkConflict(borrowCatalogSnap.docs);

    return conflictInRequests || conflictInCatalog;
  };

  const handleNext = async () => {
    const formattedStartTime = formatTime(selectedStartTime);
    const formattedEndTime = formatTime(selectedEndTime);

    console.log({
      dateRequired: selectedDate,
      timeFrom: formatTime(selectedStartTime),
      timeTo: formatTime(selectedEndTime),
      room,
      course
    });

    const newErrors = {
      date: !selectedDate,
      startTime: !selectedStartTime,
      endTime: !selectedEndTime,
      program: !program,
      course: !course,
      room: !room,
      usageType: !selectedUsageTypeInput,
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors) return;

    // 🔍 Conflict validation
    const hasConflict = await isRoomTimeConflict(
      room,
      formattedStartTime,
      formattedEndTime,
      selectedDate
    );

    if (hasConflict) {
      Alert.alert("Conflict Detected", "The selected room and time slot is already booked.");
      return; 
    }

    // setMetadata({
    //   dateRequired: selectedDate,
    //   timeFrom: formattedStartTime,
    //   timeTo: formattedEndTime,
    //   program,
    //   course,
    //   room,
    //   usageType: selectedUsageTypeInput,
    //   reason
    // });

    // setMetadata((prev) => ({
    //   ...prev,
    //   dateRequired: selectedDate,
    //   timeFrom: formattedStartTime,
    //   timeTo: formattedEndTime,
    //   program,
    //   course,
    //   room,
    //   usageType: selectedUsageTypeInput,
    //   reason,
    // }));

    const finalUsageType =
      selectedUsageTypeInput === 'Others'
        ? metadata?.usageTypeOther || ''
        : selectedUsageTypeInput;

    setMetadata((prev) => ({
      ...prev,
      dateRequired: selectedDate,
      timeFrom: formattedStartTime,
      timeTo: formattedEndTime,
      program,
      course,
      room,
      usageType: finalUsageType,
      reason,
    }));

    setIsComplete(true);
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.profileHeader} onLayout={handleHeaderLayout}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 15, paddingBottom: 10
        }}>
              <TouchableOpacity onPress={() => navigation.navigate('Admin2Dashboard')} style={styles.backButton}>
                <Icon name="keyboard-backspace" size={28} color="white" />
              </TouchableOpacity>
                <Text style={{textAlign: 'center', fontWeight: 800, fontSize: 17, color: 'white'}}>Requisition Slip</Text>
              <TouchableOpacity style={{padding: 2}}>
                <Icon name="dots-vertical" size={24} color="#fff" />
              </TouchableOpacity>
          </View>
          {!isComplete && (<Text style={styles.inst}>Please fill in the required information to proceed.</Text>)}
            </View>

      <KeyboardAvoidingView
      style={{ flex: 1,}}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0} 
    >
      {/* <StatusBar
                      translucent
                      backgroundColor="transparent"
                      barStyle="light-content" // or 'light-content' depending on your design
                    /> */}
      {!isComplete && (
     
        <View style={{flex:1}}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          enableOnAndroid={true}
          keyboardShouldPersistTaps="always"
          extraScrollHeight={0} 
          enableAutomaticScroll={true} >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={{flex: 1, overflow: 'visible' }}>

      

      <View style={[styles.wholeSection,{ marginTop: headerHeight}]}> 

        <View style={{ backgroundColor: 'white', borderRadius: 8, paddingTop: 8,paddingBottom: 5, paddingHorizontal: 10 }}>
          <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', gap: 5, borderBottomWidth: 1, paddingBottom: 5, borderColor: '#e9ecee', marginBottom: 5}}>
              <Icon name='book-outline' size={20} color='#6abce2'/>
              <Text style={{color: '#6abce2', fontSize: 12, fontWeight: 'bold'}}>Subject Details</Text>
              </View>

          <View style={styles.programSection}>
            <Text style={styles.label}>Select Program:</Text>
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
                    <Picker.Item label="SAH - BSMT" value="SAH - BSMT" style={{fontSize: 15}} />
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

          <View style={styles.programSection}>
            <Text style={styles.label}>Course Code:</Text>
            <View
                style={[
                  styles.programPicker,
                  errors.course && { borderColor: 'red', borderWidth: 1 }
                ]}
              >
                  <Picker
                    selectedValue={course}
                    onValueChange={(itemValue) => {
                      setCourse(itemValue);
                      setMetadata((prevMetadata) => ({ ...prevMetadata, course: itemValue }));
                    }}
                    style={styles.programItem}
                    dropdownIconColor= "#6e9fc1"
                    dropdownIconRippleColor='white'
                  >
                    <Picker.Item label="Course Code" value=""  style={{fontSize: 15}}/>
                    <Picker.Item label="SAH - BSMT" value="SAH - BSMT" style={{fontSize: 15}} />
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

          <View style={styles.programSection}>
              <Text style={styles.label}>Course Description:</Text>
              <TextInput style={{width: '60%', backgroundColor: 'gray', backgroundColor: '#e9ecee', borderRadius: 5, paddingHorizontal: 10}} placeholder='<autofill>'></TextInput>
          </View>
        </View>



        <View style={{ backgroundColor: 'white', borderRadius: 8, paddingTop: 8, paddingBottom: 5, paddingHorizontal: 10 }}>
        <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', gap: 5, borderBottomWidth: 1, paddingBottom: 5, borderColor: '#e9ecee', marginBottom: 5}}>
              <Icon name='calendar-outline' size={20} color='#6abce2'/>
              <Text style={{color: '#6abce2', fontSize: 12, fontWeight: 'bold'}}>Date & Time</Text>
              </View>

              <View style={[styles.dateSection]}>
      <Text style={styles.label}>Date Needed:</Text>

      <TouchableOpacity style={[
    styles.dateButton,
    errors.date && { borderColor: 'red', borderWidth: 1 }
    ]} 
    onPress={() => setCalendarVisible(true)}>
      
        <Text style={styles.dateButtonText}>
          {selectedDate || 'Select Date'}
        </Text>
        <Icon2 name="chevron-down" type="ionicon" size={20} color='#fff'/>
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
                [selectedDate]: { selected: true, selectedColor: '#00796B' }
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
              <Text style={styles.label}>Time Needed:</Text>
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
      </View>

      <View style={{ backgroundColor: 'white', borderRadius: 8, paddingTop: 8, paddingBottom: 5, paddingHorizontal: 10}}>
            <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', gap: 5, borderBottomWidth: 1, paddingBottom: 5, borderColor: '#e9ecee', marginBottom: 5}}>
              <Icon name='format-list-bulleted' size={20} color='#6abce2'/>
              <Text style={{color: '#6abce2', fontSize: 12, fontWeight: 'bold'}}>Other Info</Text>
              </View>

              <View style={styles.roomSection}>
            <Text style={styles.label}>Room No.</Text>
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
                <Text style={styles.label}>Usage Type</Text>
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
                    usageType: itemValue === 'Others' ? '' : itemValue, // only save if not Others
                    usageTypeOther: '',
                  }));
                }}
                dropdownIconColor="#6e9fc1"
                dropdownIconRippleColor="white"
                style={styles.programItem}
              >
                <Picker.Item label="Select" value="" style={{ fontSize: 15 }} />
                <Picker.Item label="Laboratory Experiment" value="Laboratory Experiment" style={{ fontSize: 15 }} />
                <Picker.Item label="Research" value="Research" />
                <Picker.Item label="Community Extension" value="Community Extension" style={{ fontSize: 15 }} />
                <Picker.Item label="Others" value="Others" style={{ fontSize: 15 }} />
              </Picker>

              {selectedUsageTypeInput === 'Others' && (
                <TextInput
                  placeholder="Please specify"
                  style={[styles.otherInput, errors.usageType && { borderColor: 'red', borderWidth: 1 }]}
                  value={metadata?.usageTypeOther || ''}
                  onChangeText={(text) => {
                    console.log('Updating usageTypeOther:', text);
                    setMetadata((prevMetadata) => ({
                      ...prevMetadata,
                      usageTypeOther: text, // 🧠 Make sure this field is not misspelled!
                    }));
                  }}
                />
              )}

          <Icon2
                    name="chevron-down"
                    size={20}
                    color="white"
                    style={styles.arrowIcon}
                    pointerEvents="none"
                  />
        </View>
          </View>
      </View>

        <View style={styles.noteSection}>
          <Text style={{fontWeight: 300, fontSize: 13, paddingLeft: 5}}>Note: (Optional)</Text>
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


        </View>
        
        </TouchableWithoutFeedback>
        </ScrollView>

        <View style={{left: 7, flexDirection: 'row', gap: 5, position: 'absolute', bottom: 5, right: 7, flex: 1}}>
          <TouchableOpacity style={styles.addDraft}>
            <Icon name='file-document-edit-outline' size={15} color='#395a7f'/>
            <Text style={{color: '#395a7f', fontWeight: 'bold', fontSize: 15, marginRight: 10, textAlign: 'center'}}>Add to Drafts</Text>
            </TouchableOpacity>
          <TouchableOpacity style={styles.proceedBtn} onPress={() => handleNext()}>
            <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 15, marginRight: 10, textAlign: 'center'}}>Next</Text>
            <Icon2 name='chevron-forward' color='#fff' size={15}/>
          </TouchableOpacity>
        </View>
        </View>
        
    )}
    
  {/* {isComplete && (
    <View style={{flex: 1, backgroundColor: '#e9ecee', paddingBottom: 7}}>


      <View style={[styles.searchFilter, {top: headerHeight}]}>
        <View style={{flex: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 7}}>
          <View style={styles.searchContainer}>
            <Icon name="magnify" size={20} color="#888"  />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by item name"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: '#efefef',
              flex: 1,
              borderRadius: 5,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              gap: 5,
              padding: 10,
            }}
            onPress={() => setIsCategoryModalVisible(true)}
          >
            <Icon name='filter-variant' size={20} color='#515151' />
            <Text style={{ fontWeight: 'bold', color: '#515151' }}>{selectedCategory}</Text>
          </TouchableOpacity>
        </View>

        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, paddingHorizontal:10}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Icon name='cube-outline' size={16} color={'gray'}/>
          <Text style={{fontWeight: 300, fontSize: 11}}>- Equipment</Text>
          </View>

          <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Icon name='flask-outline' size={16} color={'gray'}/>
          <Text style={{fontWeight: 300, fontSize: 11}}>- Chemical</Text>
          </View>

          <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Icon name='layers-outline' size={16} color={'gray'}/>
          <Text style={{fontWeight: 300, fontSize: 11}}>- Material</Text>
          </View>

          <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Icon name='test-tube' size={16} color={'gray'}/>
          <Text style={{fontWeight: 300, fontSize: 11}} >- Reagent</Text>
          </View>

        </View>
      </View>


    <View style={[styles.wholeSection2,{ marginTop: headerHeight+85 }]}>
            <ScrollView
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            keyboardShouldPersistTaps="always"
            extraScrollHeight={30} 
            enableAutomaticScroll={true}
            >
            <FlatList
                 style={{flexGrow: 1, paddingBottom: 80, paddingHorizontal: 5, paddingTop: 5}}
                data={filteredItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                extraScrollHeight={30}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20}}>No items found</Text>}
              /> 
            </ScrollView>
      
              
              

        <View style={styles.bottomContainer}>

        <View style={styles.requestAddContainer}>
        <TouchableOpacity style={styles.requestButton} onPress={() => navigation.navigate('RequestListScreen')}>
          <Text style={styles.requestButtonText}>Item List</Text>
          {tempRequestCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{tempRequestCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        </View>


      </View> 
      </View>
      </View>
  )} */}

        {isComplete && (
          <View style={{ flex: 1, backgroundColor: '#e9ecee', paddingBottom: 7 }}>
            
            {/* Header/Search Filter */}
            <View style={[styles.searchFilter, { top: headerHeight }]}>
                <View style={{flex: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 7}}>
                  <View style={styles.searchContainer}>
                    <Icon name="magnify" size={20} color="#888"  />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search by item name"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>

                  <TouchableOpacity
                    style={{
                      backgroundColor: '#efefef',
                      flex: 1,
                      borderRadius: 5,
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'row',
                      gap: 5,
                      padding: 10,
                    }}
                    onPress={() => setIsCategoryModalVisible(true)}
                  >
                    <Icon name='filter-variant' size={20} color='#515151' />
                    <Text style={{ fontWeight: 'bold', color: '#515151' }}>{selectedCategory}</Text>
                  </TouchableOpacity>

                </View>
                  <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, paddingHorizontal:10}}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Icon name='cube-outline' size={16} color={'gray'}/>
                  <Text style={{fontWeight: 300, fontSize: 11}}>- Equipment</Text>
                  </View>

                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Icon name='flask-outline' size={16} color={'gray'}/>
                  <Text style={{fontWeight: 300, fontSize: 11}}>- Chemical</Text>
                  </View>

                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Icon name='layers-outline' size={16} color={'gray'}/>
                  <Text style={{fontWeight: 300, fontSize: 11}}>- Material</Text>
                  </View>

                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Icon name='test-tube' size={16} color={'gray'}/>
                  <Text style={{fontWeight: 300, fontSize: 11}} >- Reagent</Text>
                  </View>
                </View>
            </View>

            {/* List Section */}
            <View style={[styles.wholeSection2, { marginTop: headerHeight + 85, flex: 1 }]}>
              <FlatList
                contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 5, paddingTop: 5 }}
                data={filteredItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <Text style={{ textAlign: 'center', marginTop: 20 }}>No items found</Text>
                }
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
              />

              {/* Floating Button / Bottom View */}
              <View style={styles.bottomContainer}>
                <View style={styles.requestAddContainer}>
                  <TouchableOpacity
                    style={styles.requestButton}
                    onPress={() => navigation.navigate('RequestListScreen')}
                  >
                    <Text style={styles.requestButtonText}>Item List</Text>
                    {tempRequestCount > 0 && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationText}>{tempRequestCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
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
                {/* <Text style={styles.itemType}>Condition: {selectedItem?.condition}</Text> */}
                <Text style={styles.itemType}>
                  Condition: {
                    selectedItem?.condition && typeof selectedItem.condition === 'object'
                      ? `Good: ${selectedItem.condition.Good ?? 0}, Defect: ${selectedItem.condition.Defect ?? 0}, Damage: ${selectedItem.condition.Damage ?? 0}`
                      : selectedItem?.condition || 'N/A'
                  }
                </Text>
                <Text style={styles.itemType}>Status: {selectedItem?.status}</Text>
                {/* <Text style={styles.itemType}>Available Quantity: {selectedItem?.quantity}</Text> */}
                <Text style={styles.itemType}>
                  Available Quantity: {selectedItem?.quantity}
                  {["Glasswares", "Chemical", "Reagent"].includes(selectedItem?.category) && " pcs"}
                  {["Chemical", "Reagent"].includes(selectedItem?.category) && selectedItem?.unit && ` / ${selectedItem.unit} ML`}
                  {selectedItem?.category === "Glasswares" && selectedItem?.volume && ` / ${selectedItem.volume} ML`}
                </Text>
              </View>
            </TouchableWithoutFeedback> 
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={isCategoryModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ margin: 20, backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
            {categoryOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={{ paddingVertical: 10 }}
                onPress={() => {
                  setSelectedCategory(option);
                  setIsCategoryModalVisible(false);
                }}
              >
                <Text style={{ fontSize: 16 }}>{option}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)} style={{ marginTop: 10 }}>
              <Text style={{ textAlign: 'center', color: 'red' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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