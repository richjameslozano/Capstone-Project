import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  ScrollView,
  StatusBar,
} from 'react-native';
import { collection, getDocs, deleteDoc, doc, onSnapshot, Timestamp, setDoc, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useRequestMetadata } from '../contexts/RequestMetadataContext';
import styles from '../styles/userStyle/RequestListStyle';
import Header from '../Header';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Checkbox  } from 'react-native-paper';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';

const RequestListScreen = ({}) => {
  const { user } = useAuth();
  const [requestList, setRequestList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('');
  const { metadata } = useRequestMetadata();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); 
  const [confirmationData, setConfirmationData] = useState(null);
  const [tempDocIdsToDelete, setTempDocIdsToDelete] = useState([]);

    const navigation = useNavigation()
  
  const [headerHeight, setHeaderHeight] = useState(0);

  const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('transparent'); // Android only
      StatusBar.setTranslucent(true)
    }, [])
  );

  
  useEffect(() => {
    if (!user || !user.id) return;
  
    const tempRequestRef = collection(db, 'accounts', user.id, 'temporaryRequests');
  
    const unsubscribe = onSnapshot(tempRequestRef, (querySnapshot) => {
      const tempRequestList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          selectedItem: {
            value: data.selectedItemId,
            label: data.selectedItemLabel,
          },
        };
      });
      
      // ✅ Collect all temp doc IDs to delete later
      const ids = querySnapshot.docs.map(doc => doc.id);
      setTempDocIdsToDelete(ids);
      
      setRequestList(tempRequestList);      
      setLoading(false);
      
    }, (error) => {
      console.error('Error fetching request list in real-time:', error);
      setLoading(false);
    });
  
    return () => unsubscribe(); // cleanup listener on unmount
  }, [user]);  

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

  const handleSaveDraft = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Authentication Error', 'No user is currently logged in.');
        return;
      }

      const draftId = Date.now().toString();
      const draftRef = doc(db, 'accounts', user.id, 'draftRequests', draftId);

      await setDoc(draftRef, {
        ...metadata,
        filteredMergedData: requestList.map((item) => ({
          ...item,
          program: metadata.program,
          reason: metadata.reason,
          room: metadata.room,
          timeFrom: metadata.timeFrom,
          timeTo: metadata.timeTo,
          usageType: metadata.usageType,
        })),
        timestamp: new Date(),
        status: 'draft',
      });

      Alert.alert('Draft Saved', 'Your request has been saved as a draft.');

    } catch (error) {
      console.error('Error saving draft request:', error);
      Alert.alert('Error', 'Failed to save your draft request.');
    }
  };

  const handleRequestNow = async () => {
    console.log('Current metadata:', metadata);
  
    // Check if all required fields are filled
    if (
      !metadata?.dateRequired ||
      !metadata?.timeFrom ||
      !metadata?.timeTo ||
      !metadata?.program ||
      !metadata?.course ||
      !metadata?.courseDescription ||
      !metadata?.room ||
      !metadata?.usageType
      
    ) {
      Alert.alert('Missing Info', 'Please go back and fill the required borrowing details.');
      return;
    }
  
    // Show the confirmation modal with the metadata details
    setConfirmationData(metadata);
    setShowConfirmationModal(true);
    
  };

  const logRequestOrReturn = async (userId, userName, action, requestDetails) => {
    await addDoc(collection(db, `accounts/${userId}/activitylog`), {
      action, // e.g. "Requested Items" or "Returned Items"
      userName,
      timestamp: serverTimestamp(),
      requestList: requestDetails, 
    });
  };

 const submitRequest = async () => {
    console.log('submitRequest initiated');
    console.log('Submitting for user:', user?.id);
  
    if (!user || !user.id) {
      console.log('No user logged in');
      Alert.alert('Error', 'User is not logged in.');
      return false;
    }
  
    if (!requestList || requestList.length === 0) {
      console.log('Request list is empty');
      Alert.alert('Error', 'No items in the request list.');
      return false;
    }
  
    try {
      const userDocRef = doc(db, 'accounts', user.id);
      const userDocSnapshot = await getDoc(userDocRef);
  
      if (!userDocSnapshot.exists()) {
        console.log('User document does not exist');
        Alert.alert('Error', 'User not found.');
        return false;
      }
  
      const userData = userDocSnapshot.data();
      const userName = userDocSnapshot.data().name;
      const department = userData.department || "N/A";
  
      // Prepare request data
      const requestData = {
        dateRequired: metadata.dateRequired,
        timeFrom: metadata.timeFrom,
        timeTo: metadata.timeTo,
        program: metadata.program,
        course: metadata.course,
        courseDescription: metadata.courseDescription,
        room: metadata.room,
        reason: metadata.reason,
        filteredMergedData: requestList.map((item) => ({
          ...item,
          // program: metadata.program,
          // reason: metadata.reason,
          // room: metadata.room,
          // timeFrom: metadata.timeFrom,
          // timeTo: metadata.timeTo,
        })),
        userName,
        department, 
        timestamp: Timestamp.now(),
        usageType: metadata.usageType,
      };
  
      console.log('Request data to be saved:', requestData);
  
      // Add to user's personal requests collection
      const userRequestRef = collection(db, 'accounts', user.id, 'userRequests');
      await addDoc(userRequestRef, requestData);
  
      // Add to global user requests collection
      const userRequestsRootRef = collection(db, 'userrequests');
      const newUserRequestRef = doc(userRequestsRootRef);
      await setDoc(newUserRequestRef, {
        ...requestData,
        accountId: user.id,
      });

      // ✅ Delete the original temporary request
      if (tempDocIdsToDelete.length > 0) {
        for (const id of tempDocIdsToDelete) {
          await deleteDoc(doc(db, 'accounts', user.id, 'temporaryRequests', id));
          console.log('Deleted temp request with ID:', id);
        }

      } else {
        console.log('No temp requests to delete');
      }      
  
      // Log the "Requested Items" action
      await logRequestOrReturn(user.id, userName, "Requested Items", requestData.filteredMergedData);

      console.log('Request submitted successfully');
      return true; 

    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
      return false; 
    }
  };
  
  const handleConfirmRequest = async () => {
    console.log('Metadata:', metadata);
    console.log('Confirm button pressed');
    await submitRequest(); // Await the request submission
  
    // Close the confirmation modal after the request is saved
    setShowConfirmationModal(false);
  };
  

  const openModal = (item) => {
    setSelectedItem(item);
    setQuantity(String(item.quantity)); // prefill quantity
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
    setQuantity('');
  };

  const handleQuantityChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setQuantity(numericValue);
  };

  const removeFromList = async (idToDelete) => {
    try {
      const tempRequestRef = collection(db, 'accounts', user.id, 'temporaryRequests');
      const querySnapshot = await getDocs(tempRequestRef);
  
      let foundDocId = null;
  
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.selectedItemId === idToDelete) {
          foundDocId = docSnap.id;
        }
      });
  
      if (foundDocId) {
        await deleteDoc(doc(db, 'accounts', user.id, 'temporaryRequests', foundDocId));
        console.log(`Item with Firestore doc ID ${foundDocId} removed from Firestore.`);
  
        // Remove from local list
        const updatedList = requestList.filter((item) => item.selectedItemId !== idToDelete);
        setRequestList(updatedList);

      } else {
        console.warn('Item not found in Firestore.');
      }

    } catch (error) {
      console.error('Error removing item from Firestore:', error);
    }
  };
  
  const confirmRemoveItem = (item) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from the list?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          onPress: () => removeFromList(item.selectedItemId),
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };  
  const modalText = {
  fontSize: 14,
  marginBottom: 8,
  color: '#000000',
};

const boldLabel = {
  fontWeight: 'bold',
  color: '#0f3c4c',
};


  const renderItem = ({ item }) => (
    <View style={{flex: 1, flexDirection: 'row', marginBottom: 5, elevation: 1, backgroundColor: 'white', borderRadius: 10}}>
    <TouchableOpacity onPress={() => openModal(item)} style={[styles.touchable, {borderBottomColor: '#395a7f'}]}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{item.selectedItem?.label}</Text>
          <Text style={styles.sublabel}>Quantity: {item.quantity}</Text>
        <Text style={styles.sublabel}>Category: {item.category}</Text>
        <Text style={styles.sublabel}>Status: {item.status}</Text>
      </View>
        </View>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => confirmRemoveItem(item)} style={styles.trash} >
            <Icon name='trash' size={15} color='#fff'/>
          </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }


  return (
    <View style={[styles.container]}>
      <View style={styles.inventoryStocksHeader} onLayout={handleHeaderLayout}>
                     <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                     <Icon2 name="keyboard-backspace" size={28} color="black" />
                                   </TouchableOpacity>

                    <View>
                      <Text style={{textAlign: 'center', fontWeight: 800, fontSize: 18, color: '#395a7f'}}>Item List</Text>
                      <Text style={{ fontWeight: 300, fontSize: 13}}>Finalize Your Requisition</Text>
                    </View>

                     <TouchableOpacity style={{padding: 2}}>
                       <Icon2 name="information-outline" size={24} color="#000" />
                     </TouchableOpacity>
                   </View>

        <FlatList
        style={{ paddingHorizontal: 5, marginTop: headerHeight+5, paddingTop: 10, backgroundColor:'#fff', borderRadius: 10}}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
          data={requestList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No requests found.</Text>}
        />
   

      
      <View style={styles.bottomNav}>
        <Text style={{backgroundColor: '#f5f5f5',borderBottomColor: '#e9ecee',borderBottomWidth: 1, paddingLeft: 20, fontSize:11, color: 'gray'}}><Text style={{fontWeight:'bold'}}>Note: </Text>Finalize your item list before submitting</Text>
        

        <View style={{flex:1, flexDirection: 'row', paddingLeft:5}}>
          
          
          <View style={{flex:1, width: '70%', flexDirection: 'row'}}>
            <View style={{width: '50%', flexDirection: 'row', alignItems:'center'}}>
            <Checkbox
            />
          <Text>Select All</Text>
          </View>

          <TouchableOpacity onPress={handleSaveDraft}  style={{width: '50%', backgroundColor: '#a3cae9', justifyContent:'center', alignItems: 'center'}}>
            <Text style={styles.requestButtonText}>
              Add to Drafts
            </Text>
          </TouchableOpacity>
        </View>
        

        <TouchableOpacity style={styles.requestButton} onPress={handleRequestNow}>
        <Text style={styles.requestButtonText}>Submit</Text>
      </TouchableOpacity>
        </View>
      
      </View>

   <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={closeModal}>
  <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: '90%',
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      maxHeight: '80%',
    }}>
      <Text style={{
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#0f3c4c',
        textAlign: 'center',
      }}>
        Request Details
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {selectedItem && (
          <>
            <Text style={modalText}><Text style={boldLabel}>Item:</Text> {selectedItem.selectedItem?.label}</Text>
            <Text style={modalText}><Text style={boldLabel}>Item Description:</Text> {selectedItem.itemDetails}</Text>

            <Text style={modalText}><Text style={boldLabel}>Quantity:</Text></Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#7cc0d8',
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
              }}
              value={quantity}
              onChangeText={handleQuantityChange}
              keyboardType="numeric"
              placeholder="Enter quantity"
              placeholderTextColor="#aaa"
            />

            <Text style={modalText}><Text style={boldLabel}>Unit:</Text> {selectedItem.unit}</Text>
            <Text style={modalText}><Text style={boldLabel}>Category:</Text> {selectedItem.category}</Text>
            <Text style={modalText}><Text style={boldLabel}>Usage Type:</Text> {selectedItem.usageType}</Text>
            <Text style={modalText}><Text style={boldLabel}>Item Type:</Text> {selectedItem.type}</Text>
            <Text style={modalText}><Text style={boldLabel}>Lab Room:</Text> {selectedItem.labRoom}</Text>
            <Text style={modalText}><Text style={boldLabel}>Department:</Text> {selectedItem.department}</Text>
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={{
          backgroundColor: '#1e7898',
          paddingVertical: 12,
          borderRadius: 10,
          marginTop: 20,
        }}
        onPress={closeModal}
      >
        <Text style={{
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          fontSize: 16,
        }}>
          Close
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

     {showConfirmationModal && (
<Modal
  visible={showConfirmationModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowConfirmationModal(false)}
>
  <TouchableWithoutFeedback onPress={() => setShowConfirmationModal(false)}>
    <View style={styles.modalBackground}>
      <TouchableWithoutFeedback>
        <View style={styles.confirmationModalContainer}>
          <Text style={styles.confirmationModalTitle}>Confirm Request</Text>

          <View style={styles.confirmationInfoSection}>
            <Text style={styles.confirmationLabel}>Date Required:</Text>
            <Text style={styles.confirmationValue}>{confirmationData?.dateRequired || 'N/A'}</Text>

            <Text style={styles.confirmationLabel}>Time:</Text>
            <Text style={styles.confirmationValue}>
              {metadata.timeFrom || 'N/A'} - {metadata.timeTo || 'N/A'}
            </Text>

            <Text style={styles.confirmationLabel}>Program:</Text>
            <Text style={styles.confirmationValue}>{confirmationData?.program || 'N/A'}</Text>

            <Text style={styles.confirmationLabel}>Course:</Text>
            <Text style={styles.confirmationValue}>{confirmationData?.course || 'N/A'}</Text>

            <Text style={styles.confirmationLabel}>Room:</Text>
            <Text style={styles.confirmationValue}>{confirmationData?.room || 'N/A'}</Text>

            <Text style={styles.confirmationLabel}>Reason:</Text>
            <Text style={styles.confirmationValue}>{confirmationData?.reason || 'N/A'}</Text>
          </View>

          <Text style={styles.confirmationSubtitle}>Items</Text>


          <View >
                  <ScrollView
                    horizontal={true}
                    contentContainerStyle={{ minWidth: 600, flexGrow: 1}}
                    showsHorizontalScrollIndicator={true}
                  >
                    <View style={{flex: 1}}>
                      {/* Header */}
                      <View style={styles.tableRowHeader}>
                        <Text style={[styles.tableCellHeader,]}>Name</Text>
                        <Text style={[styles.tableCellHeader, ]}>Details</Text>
                        <Text style={[styles.tableCellHeader,]}>Qty</Text>
                        <Text style={[styles.tableCellHeader,]}>Unit</Text>
                      </View>

                      {/* Rows */}
                      {requestList.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                          <Text style={[styles.tableCell,]}>{item.selectedItem?.label}</Text>
                          <Text style={[styles.tableCell, ]}>{item.itemDetails}</Text>
                          <Text style={[styles.tableCell,]}>{item.quantity}</Text>
                          <Text style={[styles.tableCell, ]}>{item.unit}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>



          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowConfirmationModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={async () => {
                const requestSuccess = await submitRequest();
                if (requestSuccess) {
                  alert('Request Submitted Successfully!');
                  setShowConfirmationModal(false);
                  navigation.goBack();
                } else {
                  alert('There was a problem processing your request. Try again later.');
                }
              }}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>

      )}
    </View>
  );
};

export default RequestListScreen;
