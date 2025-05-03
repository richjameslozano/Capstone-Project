import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { collection, getDocs, deleteDoc, doc, onSnapshot, Timestamp, setDoc, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useRequestMetadata } from '../contexts/RequestMetadataContext';
import styles from '../styles/userStyle/RequestListStyle';
import Header from '../Header';

const RequestListScreen = () => {
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

   // useEffect(() => {
  //   if (!user || !user.id) return;
  
  //   const tempRequestRef = collection(db, 'accounts', user.id, 'temporaryRequests');
  
  //   const unsubscribe = onSnapshot(tempRequestRef, (querySnapshot) => {
  //     const tempRequestList = querySnapshot.docs.map((doc) => {
  //       const data = doc.data();
  //       return {
  //         id: doc.id,
  //         ...data,
  //         selectedItem: {
  //           value: data.selectedItemId,
  //           label: data.selectedItemLabel,
  //         },
  //       };
  //     });
  
  //     setRequestList(tempRequestList);
  //     setLoading(false);
  //   }, (error) => {
  //     console.error('Error fetching request list in real-time:', error);
  //     setLoading(false);
  //   });
  
  //   return () => unsubscribe(); // cleanup listener on unmount
  // }, [user]);
  
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

  const handleRequestNow = async () => {
    console.log('Current metadata:', metadata);
  
    // Check if all required fields are filled
    if (
      !metadata?.dateRequired ||
      !metadata?.timeFrom ||
      !metadata?.timeTo ||
      !metadata?.program ||
      !metadata?.room ||
      !metadata?.reason ||
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
  
      const userName = userDocSnapshot.data().name;
  
      // Prepare request data
      const requestData = {
        dateRequired: metadata.dateRequired,
        timeFrom: metadata.timeFrom,
        timeTo: metadata.timeTo,
        program: metadata.program,
        room: metadata.room,
        reason: metadata.reason,
        filteredMergedData: requestList.map((item) => ({
          ...item,
          program: metadata.program,
          reason: metadata.reason,
          room: metadata.room,
          timeFrom: metadata.timeFrom,
          timeTo: metadata.timeTo,
        })),
        userName,
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

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openModal(item)} style={styles.cardTouchable}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{item.selectedItem?.label}</Text>
          <TouchableOpacity onPress={() => confirmRemoveItem(item)} >
            <Text style={styles.xIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text>Quantity: {item.quantity}</Text>
        <Text>Category: {item.category}</Text>
        <Text>Status: {item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.tableContainer}>
        <FlatList
          data={requestList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No requests found.</Text>}
        />
      </View>

      <TouchableOpacity style={styles.requestButton} onPress={handleRequestNow}>
        <Text style={styles.requestButtonText}>Request Now</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.title}>Request Details</Text>

            {selectedItem && (
              <>
                <Text style={styles.modalDetail}>
                  <Text style={styles.bold}>Item:</Text> {selectedItem.selectedItem?.label}
                </Text>

                <Text style={styles.modalDetail}>
                  <Text style={styles.bold}>Quantity:</Text>
                </Text>

                <TextInput
                  style={styles.inputQuantity}
                  value={quantity}
                  onChangeText={handleQuantityChange}
                  keyboardType="numeric"
                  placeholder="Enter quantity"
                />

                <Text style={styles.modalDetail}>
                  <Text style={styles.bold}>Category:</Text> {selectedItem.category}
                </Text>

                <Text style={styles.modalDetail}>
                  <Text style={styles.bold}>Usage Type:</Text> {selectedItem.usageType}
                </Text>

                <Text style={styles.modalDetail}>
                  <Text style={styles.bold}>Item Type:</Text> {selectedItem.type}
                </Text>

                <Text style={styles.modalDetail}>
                  <Text style={styles.bold}>Lab Room:</Text> {selectedItem.labRoom}
                </Text>

                <Text style={styles.modalDetail}>
                  <Text style={styles.bold}>Condition:</Text> {selectedItem.condition}
                </Text>

                <Text style={styles.modalDetail}>
                  <Text style={styles.bold}>Department:</Text> {selectedItem.department}
                </Text>
              </>
            )}

            <TouchableOpacity style={styles.requestButtonModal} onPress={closeModal}>
              <Text style={styles.requestButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showConfirmationModal && (
        <Modal
          visible={showConfirmationModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowConfirmationModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowConfirmationModal(false)}>
            <View style={styles.modalBackground}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Confirm Request</Text>
                  <Text style={styles.modalText}>Date Required: {confirmationData?.dateRequired}</Text>
                  <Text style={styles.modalText}>Start Time: {confirmationData?.timeFrom}</Text>
                  <Text style={styles.modalText}>End Time: {confirmationData?.timeTo}</Text>
                  <Text style={styles.modalText}>Program: {confirmationData?.program}</Text>
                  <Text style={styles.modalText}>Room: {confirmationData?.room}</Text>
                  <Text style={styles.modalText}>Reason: {confirmationData?.reason}</Text>

                  <ScrollView horizontal>
                    <View>
                      {/* Table Header */}
                      <View style={styles.tableRowHeader}>
                        <Text style={[styles.tableCellHeader, { width: 150 }]}>Item Name</Text>
                        <Text style={[styles.tableCellHeader, { width: 100 }]}>Qty</Text>
                        <Text style={[styles.tableCellHeader, { width: 120 }]}>Category</Text>
                        <Text style={[styles.tableCellHeader, { width: 120 }]}>Status</Text>
                      </View>

                      {/* Table Rows */}
                      {requestList.map((item) => (
                        <View key={item.id} style={styles.tableRow}>
                          <Text style={[styles.tableCell, { width: 150 }]}>{item.selectedItem?.label}</Text>
                          <Text style={[styles.tableCell, { width: 100 }]}>{item.quantity}</Text>
                          <Text style={[styles.tableCell, { width: 120 }]}>{item.category}</Text>
                          <Text style={[styles.tableCell, { width: 120 }]}>{item.status}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>

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
                        console.log('Confirm button pressed');

                        const requestSuccess = await submitRequest(); // Await submitRequest to finish

                        if (requestSuccess) {
                          console.log('Request successfully submitted. Closing modal.');
                          setShowConfirmationModal(false); // Close the modal only if the request was successful
                        } else {
                          console.log('Request submission failed. Not closing modal.');
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
