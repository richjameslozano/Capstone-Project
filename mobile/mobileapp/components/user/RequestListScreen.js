// VERSION 1
// import React, { useCallback, useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   ActivityIndicator,
//   Modal,
//   TextInput,
//   Alert,
//   TouchableWithoutFeedback,
//   ScrollView,
//   StatusBar,
// } from 'react-native';
// import { collection, getDocs, deleteDoc, doc, onSnapshot, Timestamp, setDoc, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '../../backend/firebase/FirebaseConfig';
// import { getFunctions, httpsCallable } from 'firebase/functions';
// import { useAuth } from '../contexts/AuthContext';
// import { useRequestMetadata } from '../contexts/RequestMetadataContext';
// import styles from '../styles/userStyle/RequestListStyle';
// import Header from '../Header';
// import { useFocusEffect, useNavigation } from '@react-navigation/native';
// import Icon from 'react-native-vector-icons/Ionicons';
// import { Checkbox  } from 'react-native-paper';
// import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';

// const RequestListScreen = ({}) => {
//   const { user } = useAuth();
//   const [requestList, setRequestList] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [quantity, setQuantity] = useState('');
//   const { metadata } = useRequestMetadata();
//   const [showConfirmationModal, setShowConfirmationModal] = useState(false); 
//   const [confirmationData, setConfirmationData] = useState(null);
//   const [tempDocIdsToDelete, setTempDocIdsToDelete] = useState([]);
//   const [submitLoading, setSubmitLoading] = useState(false);
//   const [removeLoading, setRemoveLoading] = useState({});

//     const navigation = useNavigation()
  
//   const [headerHeight, setHeaderHeight] = useState(0);

//   const handleHeaderLayout = (event) => {
//     const { height } = event.nativeEvent.layout;
//     setHeaderHeight(height);
//   };

//   useFocusEffect(
//     useCallback(() => {
//       StatusBar.setBarStyle('dark-content');
//       StatusBar.setBackgroundColor('transparent'); // Android only
//       StatusBar.setTranslucent(true)
//     }, [])
//   );

  
//   useEffect(() => {
//     if (!user || !user.id) return;
  
//     const tempRequestRef = collection(db, 'accounts', user.id, 'temporaryRequests');
  
//     const unsubscribe = onSnapshot(tempRequestRef, (querySnapshot) => {
//       const tempRequestList = querySnapshot.docs.map((doc) => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           ...data,
//           selectedItem: {
//             value: data.selectedItemId,
//             label: data.selectedItemLabel,
//           },
//         };
//       });
      
//       // ✅ Collect all temp doc IDs to delete later
//       const ids = querySnapshot.docs.map(doc => doc.id);
//       setTempDocIdsToDelete(ids);
      
//       setRequestList(tempRequestList);      
//       setLoading(false);
      
//     }, (error) => {
//       console.error('Error fetching request list in real-time:', error);
//       setLoading(false);
//     });
  
//     return () => unsubscribe(); // cleanup listener on unmount
//   }, [user]);  

//   const formatTime = (timeObj) => {
//     if (!timeObj || typeof timeObj !== 'object') return '';

//     let { hour, minute, period } = timeObj;
//     hour = parseInt(hour);
//     minute = parseInt(minute);

//     if (period === 'PM' && hour !== 12) {
//       hour += 12;
      
//     } else if (period === 'AM' && hour === 12) {
//       hour = 0;
//     }

//     const paddedHour = hour.toString().padStart(2, '0');
//     const paddedMinute = minute.toString().padStart(2, '0');

//     return `${paddedHour}:${paddedMinute}`;
//   };

//   const handleSaveDraft = async () => {
//     try {
//       if (!user?.id) {
//         Alert.alert('Authentication Error', 'No user is currently logged in.');
//         return;
//       }

//       const draftId = Date.now().toString();
//       const draftRef = doc(db, 'accounts', user.id, 'draftRequests', draftId);

//       await setDoc(draftRef, {
//         ...metadata,
//         filteredMergedData: requestList.map((item) => ({
//           ...item,
//           program: metadata.program,
//           reason: metadata.reason,
//           room: metadata.room,
//           timeFrom: metadata.timeFrom,
//           timeTo: metadata.timeTo,
//           usageType: metadata.usageType,
//         })),
//         timestamp: new Date(),
//         status: 'draft',
//       });

//       Alert.alert('Draft Saved', 'Your request has been saved as a draft.');

//     } catch (error) {
//       console.error('Error saving draft request:', error);
//       Alert.alert('Error', 'Failed to save your draft request.');
//     }
//   };

//   const handleRequestNow = async () => {
//     console.log('Current metadata:', metadata);
  
//     // Check if all required fields are filled
//     if (
//       !metadata?.dateRequired ||
//       !metadata?.timeFrom ||
//       !metadata?.timeTo ||
//       !metadata?.program ||
//       !metadata?.course ||
//       !metadata?.courseDescription ||
//       !metadata?.room ||
//       !metadata?.usageType
      
//     ) {
//       Alert.alert('Missing Info', 'Please go back and fill the required borrowing details.');
//       return;
//     }
  
//     // Show the confirmation modal with the metadata details
//     setConfirmationData(metadata);
//     setShowConfirmationModal(true);
    
//   };

//   const logRequestOrReturn = async (userId, userName, action, requestDetails) => {
//     await addDoc(collection(db, `accounts/${userId}/activitylog`), {
//       action, // e.g. "Requested Items" or "Returned Items"
//       userName,
//       timestamp: serverTimestamp(),
//       requestList: requestDetails, 
//     });
//   };

//  const submitRequest = async () => {
//     setSubmitLoading(true);
    
//     try {
//       console.log('submitRequest initiated');
//       console.log('Submitting for user:', user?.id);
    
//       if (!user || !user.id) {
//         console.log('No user logged in');
//         Alert.alert('Error', 'User is not logged in.');
//         return false;
//       }
    
//       if (!requestList || requestList.length === 0) {
//         console.log('Request list is empty');
//         Alert.alert('Error', 'No items in the request list.');
//         return false;
//       }
  
//       try {
//       const userDocRef = doc(db, 'accounts', user.id);
//       const userDocSnapshot = await getDoc(userDocRef);
  
//       if (!userDocSnapshot.exists()) {
//         console.log('User document does not exist');
//         Alert.alert('Error', 'User not found.');
//         return false;
//       }
  
//       const userData = userDocSnapshot.data();
//       const userName = userDocSnapshot.data().name;
//       const department = userData.department || "N/A";
  
//       // Prepare request data
//       const requestData = {
//         dateRequired: metadata.dateRequired,
//         timeFrom: metadata.timeFrom,
//         timeTo: metadata.timeTo,
//         program: metadata.program,
//         course: metadata.course,
//         courseDescription: metadata.courseDescription,
//         room: metadata.room,
//         reason: metadata.reason,
//         filteredMergedData: requestList.map((item) => ({
//           ...item,
//           // program: metadata.program,
//           // reason: metadata.reason,
//           // room: metadata.room,
//           // timeFrom: metadata.timeFrom,
//           // timeTo: metadata.timeTo,
//         })),
//         userName,
//         department, 
//         timestamp: Timestamp.now(),
//         usageType: metadata.usageType,
//       };
  
//       console.log('Request data to be saved:', requestData);
  
//       // Add to user's personal requests collection
//       const userRequestRef = collection(db, 'accounts', user.id, 'userRequests');
//       await addDoc(userRequestRef, requestData);
  
//       // Add to global user requests collection
//       const userRequestsRootRef = collection(db, 'userrequests');
//       const newUserRequestRef = doc(userRequestsRootRef);
//       await setDoc(newUserRequestRef, {
//         ...requestData,
//         accountId: user.id,
//       });

//       // ✅ Delete the original temporary request
//       if (tempDocIdsToDelete.length > 0) {
//         for (const id of tempDocIdsToDelete) {
//           await deleteDoc(doc(db, 'accounts', user.id, 'temporaryRequests', id));
//           console.log('Deleted temp request with ID:', id);
//         }

//       } else {
//         console.log('No temp requests to delete');
//       }      
  
//       // Log the "Requested Items" action
//       await logRequestOrReturn(user.id, userName, "Requested Items", requestData.filteredMergedData);

//       // 🔔 Log to allNotifications
//       await addDoc(collection(db, "allNotifications"), {
//         action: `New requisition submitted by ${userName}`,
//         userId: user.id,
//         userName: userName,
//         read: false,
//         timestamp: serverTimestamp(),
//       });

//       // 🔔 Notify admins via push
//       const functions = getFunctions();
//       const sendPush = httpsCallable(functions, "sendPushNotification");

//       const pushTokenSnapshot = await getDocs(collection(db, "pushTokens"));
//       const tokensToNotify = [];

//       pushTokenSnapshot.forEach((doc) => {
//         const data = doc.data();
//         if (
//           data?.expoPushToken &&
//           ["admin", "admin1", "admin2"].includes(data.role?.toLowerCase())
//         ) {
//           tokensToNotify.push(data.expoPushToken);
//         }
//       });

//       for (const token of tokensToNotify) {
//         const payload = {
//           token,
//           title: "New Request",
//           body: `New requisition submitted by ${userName}`,
//         };

//         try {
//           const response = await sendPush(payload);
//           console.log("✅ Push sent to:", token, "Response:", response.data);
          
//         } catch (pushErr) {
//           console.error("❌ Failed to send push to:", token, "Error:", pushErr.message);
//         }
//       }

//       console.log('Request submitted successfully');
//       return true; 

//       } catch (error) {
//         console.error('Error submitting request:', error);
//         Alert.alert('Error', 'Failed to submit request. Please try again.');
//         return false; 
//       }
//     } catch (error) {
//       console.error('Error in submitRequest:', error);
//       Alert.alert('Error', 'Failed to submit request. Please try again.');
//       return false;
//     } finally {
//       setSubmitLoading(false);
//     }
//   };
  
//   const handleConfirmRequest = async () => {
//     console.log('Metadata:', metadata);
//     console.log('Confirm button pressed');
//     await submitRequest(); // Await the request submission
  
//     // Close the confirmation modal after the request is saved
//     setShowConfirmationModal(false);
//   };
  

//   const openModal = (item) => {
//     setSelectedItem(item);
//     setQuantity(String(item.quantity)); // prefill quantity
//     setModalVisible(true);
//   };

//   const closeModal = () => {
//     setModalVisible(false);
//     setSelectedItem(null);
//     setQuantity('');
//   };

//   const handleQuantityChange = (text) => {
//     const numericValue = text.replace(/[^0-9]/g, '');
//     setQuantity(numericValue);
//   };

//   const removeFromList = async (idToDelete) => {
//     setRemoveLoading(prev => ({ ...prev, [idToDelete]: true }));
    
//     try {
//       const tempRequestRef = collection(db, 'accounts', user.id, 'temporaryRequests');
//       const querySnapshot = await getDocs(tempRequestRef);
  
//       let foundDocId = null;
  
//       querySnapshot.forEach((docSnap) => {
//         const data = docSnap.data();
//         if (data.selectedItemId === idToDelete) {
//           foundDocId = docSnap.id;
//         }
//       });
  
//       if (foundDocId) {
//         await deleteDoc(doc(db, 'accounts', user.id, 'temporaryRequests', foundDocId));
//         console.log(`Item with Firestore doc ID ${foundDocId} removed from Firestore.`);
  
//         // Remove from local list
//         const updatedList = requestList.filter((item) => item.selectedItemId !== idToDelete);
//         setRequestList(updatedList);

//       } else {
//         console.warn('Item not found in Firestore.');
//       }

//     } catch (error) {
//       console.error('Error removing item from Firestore:', error);
//     } finally {
//       setRemoveLoading(prev => ({ ...prev, [idToDelete]: false }));
//     }
//   };
  
//   const confirmRemoveItem = (item) => {
//     Alert.alert(
//       'Remove Item',
//       'Are you sure you want to remove this item from the list?',
//       [
//         {
//           text: 'Cancel',
//           style: 'cancel',
//         },
//         {
//           text: 'Remove',
//           onPress: () => removeFromList(item.selectedItemId),
//           style: 'destructive',
//         },
//       ],
//       { cancelable: true }
//     );
//   };  
//   const modalText = {
//   fontSize: 14,
//   marginBottom: 8,
//   color: '#000000',
// };

// const boldLabel = {
//   fontWeight: 'bold',
//   color: '#0f3c4c',
// };


//   const renderItem = ({ item }) => (
//     <View style={{flex: 1, flexDirection: 'row', marginBottom: 5, elevation: 1, backgroundColor: 'white', borderRadius: 10}}>
//     <TouchableOpacity onPress={() => openModal(item)} style={[styles.touchable, {borderBottomColor: '#395a7f'}]}>
//       <View style={styles.card}>
//         <View style={styles.cardHeader}>
//           <Text style={styles.title}>{item.selectedItem?.label}</Text>
//           <Text style={styles.sublabel}>Quantity: {item.quantity}</Text>
//         <Text style={styles.sublabel}>Category: {item.category}</Text>
//         <Text style={styles.sublabel}>Status: {item.status}</Text>
//       </View>
//         </View>
//     </TouchableOpacity>
//     <TouchableOpacity 
//       onPress={() => confirmRemoveItem(item)} 
//       style={[styles.trash, removeLoading[item.selectedItemId] && styles.disabledButton]} 
//       disabled={removeLoading[item.selectedItemId]}
//     >
//       {removeLoading[item.selectedItemId] ? (
//         <Text style={{color: '#fff', fontSize: 12}}>...</Text>
//       ) : (
//         <Icon name='trash' size={15} color='#fff'/>
//       )}
//     </TouchableOpacity>
//     </View>
//   );

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#333" />
//       </View>
//     );
//   }


//   return (
//     <View style={[styles.container]}>
//         <View 
//           style={[styles.inventoryStocksHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} 
//           onLayout={handleHeaderLayout}
//         >
//           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//             <Icon2 name="keyboard-backspace" size={28} color="black" />
//           </TouchableOpacity>

//           <View style={{ flex: 1, alignItems: 'center' }}>
//             <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 18, color: '#395a7f' }}>
//               Item List
//             </Text>
//             <Text style={{ fontWeight: '300', fontSize: 13, textAlign: 'center' }}>
//               Finalize Your Requisition
//             </Text>
//           </View>

//           {/* Placeholder to balance back button width */}
//           <View style={{ width: 28 }} />
//         </View>

//         <FlatList
//         style={{ paddingHorizontal: 5, marginTop: headerHeight+5, paddingTop: 10, backgroundColor:'#fff', borderRadius: 10}}
//         showsVerticalScrollIndicator={false}
//         scrollEnabled={true}
//           data={requestList}
//           keyExtractor={(item) => item.id}
//           renderItem={renderItem}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={<Text style={styles.emptyText}>No requests found.</Text>}
//         />
   

      
//       <View style={styles.bottomNav}>
//         <Text style={{backgroundColor: '#f5f5f5',borderBottomColor: '#e9ecee',borderBottomWidth: 1, paddingLeft: 20, fontSize:11, color: 'gray'}}><Text style={{fontWeight:'bold'}}>Note: </Text>Finalize your item list before submitting</Text>
        

//         <View style={{flex:1, flexDirection: 'row', paddingLeft:5}}>
          
          
//           <View style={{flex:1, width: '70%', flexDirection: 'row'}}>
//             <View style={{width: '50%', flexDirection: 'row', alignItems:'center'}}>
//             <Checkbox
//             />
//           <Text>Select All</Text>
//           </View>

//           {/* <TouchableOpacity onPress={handleSaveDraft}  style={{width: '50%', backgroundColor: '#a3cae9', justifyContent:'center', alignItems: 'center'}}>
//             <Text style={styles.requestButtonText}>
//               Add to Drafts
//             </Text>
//           </TouchableOpacity> */}
//         </View>
        

//         <TouchableOpacity style={styles.requestButton} onPress={handleRequestNow}>
//         <Text style={styles.requestButtonText}>Submit</Text>
//       </TouchableOpacity>
//         </View>
      
//       </View>

//    <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={closeModal}>
//   <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' }}>
//     <View style={{
//       width: '90%',
//       backgroundColor: '#ffffff',
//       borderRadius: 12,
//       padding: 20,
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.25,
//       shadowRadius: 4,
//       elevation: 5,
//       maxHeight: '80%',
//     }}>
//       <Text style={{
//         fontSize: 20,
//         fontWeight: 'bold',
//         marginBottom: 15,
//         color: '#0f3c4c',
//         textAlign: 'center',
//       }}>
//         Request Details
//       </Text>

//       <ScrollView showsVerticalScrollIndicator={false}>
//         {selectedItem && (
//           <>
//             <Text style={modalText}><Text style={boldLabel}>Item:</Text> {selectedItem.selectedItem?.label}</Text>
//             <Text style={modalText}><Text style={boldLabel}>Item Description:</Text> {selectedItem.itemDetails}</Text>

//             <Text style={modalText}><Text style={boldLabel}>Quantity:</Text></Text>
//             <TextInput
//               style={{
//                 borderWidth: 1,
//                 borderColor: '#7cc0d8',
//                 borderRadius: 8,
//                 padding: 10,
//                 marginBottom: 10,
//               }}
//               value={quantity}
//               onChangeText={handleQuantityChange}
//               keyboardType="numeric"
//               placeholder="Enter quantity"
//               placeholderTextColor="#aaa"
//             />

//             <Text style={modalText}><Text style={boldLabel}>Unit:</Text> {selectedItem.unit}</Text>
//             <Text style={modalText}><Text style={boldLabel}>Category:</Text> {selectedItem.category}</Text>
//             <Text style={modalText}><Text style={boldLabel}>Usage Type:</Text> {selectedItem.usageType}</Text>
//             <Text style={modalText}><Text style={boldLabel}>Item Type:</Text> {selectedItem.type}</Text>
//             <Text style={modalText}><Text style={boldLabel}>Lab Room:</Text> {selectedItem.labRoom}</Text>
//             <Text style={modalText}><Text style={boldLabel}>Department:</Text> {selectedItem.department}</Text>
//           </>
//         )}
//       </ScrollView>

//       <TouchableOpacity
//         style={{
//           backgroundColor: '#1e7898',
//           paddingVertical: 12,
//           borderRadius: 10,
//           marginTop: 20,
//         }}
//         onPress={closeModal}
//       >
//         <Text style={{
//           color: '#ffffff',
//           fontWeight: 'bold',
//           textAlign: 'center',
//           fontSize: 16,
//         }}>
//           Close
//         </Text>
//       </TouchableOpacity>
//     </View>
//   </View>
// </Modal>

//      {showConfirmationModal && (
// <Modal
//   visible={showConfirmationModal}
//   transparent
//   animationType="fade"
//   onRequestClose={() => setShowConfirmationModal(false)}
// >
//   <TouchableWithoutFeedback onPress={() => setShowConfirmationModal(false)}>
//     <View style={styles.modalBackground}>
//       <TouchableWithoutFeedback>
//         <View style={styles.confirmationModalContainer}>
//           <Text style={styles.confirmationModalTitle}>Confirm Request</Text>

//           <View style={styles.confirmationInfoSection}>
//             <Text style={styles.confirmationLabel}>Date Required:</Text>
//             <Text style={styles.confirmationValue}>{confirmationData?.dateRequired || 'N/A'}</Text>

//             <Text style={styles.confirmationLabel}>Time:</Text>
//             <Text style={styles.confirmationValue}>
//               {metadata.timeFrom || 'N/A'} - {metadata.timeTo || 'N/A'}
//             </Text>

//             <Text style={styles.confirmationLabel}>Program:</Text>
//             <Text style={styles.confirmationValue}>{confirmationData?.program || 'N/A'}</Text>

//             <Text style={styles.confirmationLabel}>Course:</Text>
//             <Text style={styles.confirmationValue}>{confirmationData?.course || 'N/A'}</Text>

//             <Text style={styles.confirmationLabel}>Room:</Text>
//             <Text style={styles.confirmationValue}>{confirmationData?.room || 'N/A'}</Text>

//             <Text style={styles.confirmationLabel}>Reason:</Text>
//             <Text style={styles.confirmationValue}>{confirmationData?.reason || 'N/A'}</Text>
//           </View>

//           <Text style={styles.confirmationSubtitle}>Items</Text>


//           <View >
//                   <ScrollView
//                     horizontal={true}
//                     contentContainerStyle={{ minWidth: 600, flexGrow: 1}}
//                     showsHorizontalScrollIndicator={true}
//                   >
//                     <View style={{flex: 1}}>
//                       {/* Header */}
//                       <View style={styles.tableRowHeader}>
//                         <Text style={[styles.tableCellHeader,]}>Name</Text>
//                         <Text style={[styles.tableCellHeader, ]}>Details</Text>
//                         <Text style={[styles.tableCellHeader,]}>Qty</Text>
//                         <Text style={[styles.tableCellHeader,]}>Unit</Text>
//                       </View>

//                       {/* Rows */}
//                       {requestList.map((item, index) => (
//                         <View key={index} style={styles.tableRow}>
//                           <Text style={[styles.tableCell,]}>{item.selectedItem?.label}</Text>
//                           <Text style={[styles.tableCell, ]}>{item.itemDetails}</Text>
//                           <Text style={[styles.tableCell,]}>{item.quantity}</Text>
//                           <Text style={[styles.tableCell, ]}>{item.unit}</Text>
//                         </View>
//                       ))}
//                     </View>
//                   </ScrollView>
//                 </View>



//           <View style={styles.modalActions}>
//             <TouchableOpacity
//               style={styles.cancelButton}
//               onPress={() => setShowConfirmationModal(false)}
//             >
//               <Text style={styles.cancelButtonText}>Cancel</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.confirmButton, submitLoading && styles.disabledButton]}
//               onPress={async () => {
//                 const requestSuccess = await submitRequest();
//                 if (requestSuccess) {
//                   alert('Request Submitted Successfully!');
//                   setShowConfirmationModal(false);
//                   navigation.goBack();
//                 } else {
//                   alert('There was a problem processing your request. Try again later.');
//                 }
//               }}
//               disabled={submitLoading}
//             >
//               <Text style={styles.confirmButtonText}>
//                 {submitLoading ? 'Submitting...' : 'Confirm'}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </TouchableWithoutFeedback>
//     </View>
//   </TouchableWithoutFeedback>
// </Modal>

//       )}
//     </View>
//   );
// };

// export default RequestListScreen;


// VERSION 2
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
import { collection, getDocs, deleteDoc, doc, onSnapshot, Timestamp, setDoc, addDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';
import { useRequestMetadata } from '../contexts/RequestMetadataContext';
import styles from '../styles/userStyle/RequestListStyle';
import Header from '../Header';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
// import { Checkbox  } from 'react-native-paper';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const [submitLoading, setSubmitLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState({});
  const [liabilityAccepted, setLiabilityAccepted] = useState(false);

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

    // Check for 7-day warning and increment warning count if needed
    if (checkDateWarning(metadata.dateRequired)) {
      await incrementWarningCount();
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
    setSubmitLoading(true);
    
    try {
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

      // 🔔 Log to allNotifications
      await addDoc(collection(db, "allNotifications"), {
        action: `New requisition submitted by ${userName}`,
        userId: user.id,
        userName: userName,
        read: false,
        timestamp: serverTimestamp(),
      });

      // 🔔 Notify admins via push
      const functions = getFunctions();
      const sendPush = httpsCallable(functions, "sendPushNotification");

      const pushTokenSnapshot = await getDocs(collection(db, "pushTokens"));
      const tokensToNotify = [];

      pushTokenSnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          data?.expoPushToken &&
          ["admin", "admin1", "admin2"].includes(data.role?.toLowerCase())
        ) {
          tokensToNotify.push(data.expoPushToken);
        }
      });

      for (const token of tokensToNotify) {
        const payload = {
          token,
          title: "New Request",
          body: `New requisition submitted by ${userName}`,
        };

        try {
          const response = await sendPush(payload);
          console.log("✅ Push sent to:", token, "Response:", response.data);
          
        } catch (pushErr) {
          console.error("❌ Failed to send push to:", token, "Error:", pushErr.message);
        }
      }

      console.log('Request submitted successfully');
      return true; 

      } catch (error) {
        console.error('Error submitting request:', error);
        Alert.alert('Error', 'Failed to submit request. Please try again.');
        return false; 
      }
    } catch (error) {
      console.error('Error in submitRequest:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
      return false;
    } finally {
      setSubmitLoading(false);
    }
  };
  
  const handleConfirmRequest = async () => {
    console.log('Metadata:', metadata);
    console.log('Confirm button pressed');
    await submitRequest(); // Await the request submission
  
    // Close the confirmation modal after the request is saved
    setShowConfirmationModal(false);
  };

  const handleLiabilityChange = (checked) => {
    setLiabilityAccepted(checked);
  };

  // Function to get liability statement based on item categories
  const getLiabilityStatement = (items) => {
    const categories = [...new Set(items.map(item => item.category))];
    
    // If only one category, show specific statement
    if (categories.length === 1) {
      const category = categories[0];
      switch (category) {
        case 'Equipment':
          return "I am responsible for the proper use, care, and timely return of borrowed equipment. I accept liability for any loss or damage.";
        case 'Glasswares':
          return "I am responsible for the proper handling, cleaning, and timely return of borrowed glasswares. I accept liability for any breakage or damage.";
        case 'Materials':
          return "I am responsible for the proper use, storage, and timely return of borrowed materials. I accept liability for any loss, damage, or contamination.";
        case 'Chemical':
          return "I am responsible for the proper handling, storage, and safe disposal of borrowed chemicals. I accept liability for any spillage or contamination.";
        case 'Reagent':
          return "I am responsible for the proper handling, storage, and timely return of borrowed reagents. I accept liability for any contamination or degradation.";
        default:
          return "I am responsible for the proper use, care, and timely return of borrowed laboratory items. I accept liability for any loss or damage.";
      }
    }
    
    // If mixed categories, show unified statement
    return "I am responsible for the proper use, care, and timely return of all borrowed laboratory items. I accept liability for any loss, damage, or improper use.";
  };

  // Function to check if selected date is less than 7 days from today
  const checkDateWarning = (selectedDate) => {
    if (!selectedDate) return false;
    
    const today = new Date();
    const selected = new Date(selectedDate);
    const timeDiff = selected.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff < 7;
  };

  // Function to increment warning count for user
  const incrementWarningCount = async () => {
    try {
      if (!user?.id) return;

      const userDocRef = doc(db, "accounts", user.id);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentWarningCount = userData.warningCount || 0;
        const currentViolationCount = userData.violationCount || 0;
        
        const newWarningCount = currentWarningCount + 1;
        
        // Check if warnings reach 3, then convert to violation
        if (newWarningCount >= 3) {
          // Reset warnings to 0 and increment violations by 1
          await updateDoc(userDocRef, {
            warningCount: 0,
            violationCount: currentViolationCount + 1
          });
          console.log('Warning count reached 3, converted to violation for user:', user.id);
        } else {
          // Just increment warning count
          await updateDoc(userDocRef, {
            warningCount: newWarningCount
          });
          console.log('Warning count incremented for user:', user.id);
        }
      }
    } catch (error) {
      console.error('Error incrementing warning count:', error);
    }
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
    setRemoveLoading(prev => ({ ...prev, [idToDelete]: true }));
    
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
    } finally {
      setRemoveLoading(prev => ({ ...prev, [idToDelete]: false }));
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
    <TouchableOpacity 
      onPress={() => confirmRemoveItem(item)} 
      style={[styles.trash, removeLoading[item.selectedItemId] && styles.disabledButton]} 
      disabled={removeLoading[item.selectedItemId]}
    >
      {removeLoading[item.selectedItemId] ? (
        <Text style={{color: '#fff', fontSize: 12}}>...</Text>
      ) : (
        <Icon name='trash' size={15} color='#fff'/>
      )}
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
        <View 
          style={[styles.inventoryStocksHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} 
          onLayout={handleHeaderLayout}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon2 name="keyboard-backspace" size={28} color="black" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 18, color: '#395a7f' }}>
              Item List
            </Text>
            <Text style={{ fontWeight: '300', fontSize: 13, textAlign: 'center' }}>
              Finalize Your Requisition
            </Text>
          </View>

          {/* Placeholder to balance back button width */}
          <View style={{ width: 28 }} />
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
            {/* <View style={{width: '50%', flexDirection: 'row', alignItems:'center'}}>
            <Checkbox
            />
          <Text>Select All</Text>
          </View> */}

          {/* <TouchableOpacity onPress={handleSaveDraft}  style={{width: '50%', backgroundColor: '#a3cae9', justifyContent:'center', alignItems: 'center'}}>
            <Text style={styles.requestButtonText}>
              Add to Drafts
            </Text>
          </TouchableOpacity> */}
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
           <ScrollView 
             showsVerticalScrollIndicator={true}
             contentContainerStyle={{ flexGrow: 1 }}
             style={{ maxHeight: '85%' }}
           >
             <Text style={styles.confirmationModalTitle}>Confirm Request</Text>

                           <View style={styles.confirmationInfoSection}>
                {/* Date Required and Time */}
                <View style={styles.confirmationRow}>
                  <View style={styles.confirmationField}>
                    <Text style={styles.confirmationLabel}>Date Required:</Text>
                    <Text style={styles.confirmationValue}>{confirmationData?.dateRequired || 'N/A'}</Text>
                  </View>
                  <View style={styles.confirmationField}>
                    <Text style={styles.confirmationLabel}>Time:</Text>
                    <Text style={styles.confirmationValue}>
                      {metadata.timeFrom || 'N/A'} - {metadata.timeTo || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Program and Course */}
                <View style={styles.confirmationRow}>
                  <View style={styles.confirmationField}>
                    <Text style={styles.confirmationLabel}>Program:</Text>
                    <Text style={styles.confirmationValue}>{confirmationData?.program || 'N/A'}</Text>
                  </View>
                  <View style={styles.confirmationField}>
                    <Text style={styles.confirmationLabel}>Course:</Text>
                    <Text style={styles.confirmationValue}>{confirmationData?.course || 'N/A'}</Text>
                  </View>
                </View>

                {/* Room and Reason */}
                <View style={styles.confirmationRow}>
                  <View style={styles.confirmationField}>
                    <Text style={styles.confirmationLabel}>Room:</Text>
                    <Text style={styles.confirmationValue}>{confirmationData?.room || 'N/A'}</Text>
                  </View>
                  <View style={styles.confirmationField}>
                    <Text style={styles.confirmationLabel}>Reason:</Text>
                    <Text style={styles.confirmationValue}>{confirmationData?.reason || 'N/A'}</Text>
                  </View>
                </View>
              </View>

             <Text style={styles.confirmationSubtitle}>Items</Text>

             <View style={{ 
               height: 140, 
               marginBottom: 6, 
               borderWidth: 1, 
               borderColor: '#ccc', 
               borderRadius: 6, 
               overflow: 'hidden',
               backgroundColor: '#fff'
             }}>
               <ScrollView
                 horizontal={true}
                 showsHorizontalScrollIndicator={true}
                 contentContainerStyle={{ width: 800 }}
                 style={{ flex: 1 }}
                 bounces={false}
                 scrollEnabled={true}
                 nestedScrollEnabled={true}
               >
                 <View style={{ width: 800 }}>
                   {/* Header */}
                   <View style={{ 
                     flexDirection: 'row', 
                     backgroundColor: '#f5f5f5', 
                     borderBottomWidth: 1, 
                     borderBottomColor: '#ddd',
                     height: 35,
                     alignItems: 'center',
                     width: 800
                   }}>
                     <Text style={{ 
                       width: 150, 
                       paddingHorizontal: 8, 
                       fontSize: 12, 
                       fontWeight: 'bold',
                       color: '#333'
                     }}>Name</Text>
                     <Text style={{ 
                       width: 200, 
                       paddingHorizontal: 8, 
                       fontSize: 12, 
                       fontWeight: 'bold',
                       color: '#333'
                     }}>Details</Text>
                     <Text style={{ 
                       width: 80, 
                       paddingHorizontal: 8, 
                       fontSize: 12, 
                       fontWeight: 'bold',
                       color: '#333'
                     }}>Qty</Text>
                     <Text style={{ 
                       width: 100, 
                       paddingHorizontal: 8, 
                       fontSize: 12, 
                       fontWeight: 'bold',
                       color: '#333'
                     }}>Unit</Text>
                     <Text style={{ 
                       width: 120, 
                       paddingHorizontal: 8, 
                       fontSize: 12, 
                       fontWeight: 'bold',
                       color: '#333'
                     }}>Category</Text>
                     <Text style={{ 
                       width: 150, 
                       paddingHorizontal: 8, 
                       fontSize: 12, 
                       fontWeight: 'bold',
                       color: '#333'
                     }}>Status</Text>
                   </View>

                   {/* Rows */}
                   {requestList.map((item, index) => (
                     <View key={index} style={{ 
                       flexDirection: 'row', 
                       borderBottomWidth: 1, 
                       borderBottomColor: '#eee',
                       height: 30,
                       alignItems: 'center',
                       backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa',
                       width: 800
                     }}>
                       <Text style={{ 
                         width: 150, 
                         paddingHorizontal: 8, 
                         fontSize: 11,
                         color: '#333'
                       }} numberOfLines={1}>
                         {item.selectedItem?.label}
                       </Text>
                       <Text style={{ 
                         width: 200, 
                         paddingHorizontal: 8, 
                         fontSize: 11,
                         color: '#333'
                       }} numberOfLines={1}>
                         {item.itemDetails}
                       </Text>
                       <Text style={{ 
                         width: 80, 
                         paddingHorizontal: 8, 
                         fontSize: 11,
                         color: '#333'
                       }}>
                         {item.quantity}
                       </Text>
                       <Text style={{ 
                         width: 100, 
                         paddingHorizontal: 8, 
                         fontSize: 11,
                         color: '#333'
                       }}>
                         {item.unit}
                       </Text>
                       <Text style={{ 
                         width: 120, 
                         paddingHorizontal: 8, 
                         fontSize: 11,
                         color: '#333'
                       }}>
                         {item.category}
                       </Text>
                       <Text style={{ 
                         width: 150, 
                         paddingHorizontal: 8, 
                         fontSize: 11,
                         color: '#333'
                       }}>
                         {item.status}
                       </Text>
                     </View>
                   ))}
                 </View>
               </ScrollView>
             </View>
           </ScrollView>

           {/* Liability Checkbox */}
           <View style={{
             marginTop: 8,
             padding: 8,
             backgroundColor: '#f8f9fa',
             borderRadius: 4,
             borderWidth: 1,
             borderColor: '#e9ecef'
           }}>
             <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
               <TouchableOpacity 
                 style={{ 
                   flexDirection: 'row', 
                   alignItems: 'center',
                   marginRight: 8
                 }}
                 onPress={() => handleLiabilityChange(!liabilityAccepted)}
                 activeOpacity={0.7}
               >
                 <View style={{
                   width: 20,
                   height: 20,
                   borderRadius: 4,
                   borderWidth: 2,
                   borderColor: liabilityAccepted ? '#1e7898' : '#ccc',
                   backgroundColor: liabilityAccepted ? '#1e7898' : 'transparent',
                   justifyContent: 'center',
                   alignItems: 'center',
                   marginRight: 8
                 }}>
                   {liabilityAccepted && (
                     <MaterialCommunityIcons 
                       name="check" 
                       size={14} 
                       color="white" 
                     />
                   )}
                 </View>
               </TouchableOpacity>
               <Text style={{
                 flex: 1,
                 fontSize: 11,
                 lineHeight: 14,
                 color: '#333'
               }}>
                 <Text style={{ fontWeight: '500' }}>
                   {getLiabilityStatement(requestList)}
                 </Text>
               </Text>
             </View>
           </View>

           <View style={styles.modalActions}>
             <TouchableOpacity
               style={styles.cancelButton}
               onPress={() => setShowConfirmationModal(false)}
             >
               <Text style={styles.cancelButtonText}>Cancel</Text>
             </TouchableOpacity>

             <TouchableOpacity
               style={[
                 styles.confirmButton, 
                 (submitLoading || !liabilityAccepted) && styles.disabledButton
               ]}
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
               disabled={submitLoading || !liabilityAccepted}
             >
               <Text style={[
                 styles.confirmButtonText,
                 (!liabilityAccepted && !submitLoading) && { color: '#999' }
               ]}>
                 {submitLoading ? 'Submitting...' : 'Confirm'}
               </Text>
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
