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
} from 'react-native';
import { collection, getDocs, deleteDoc, doc, onSnapshot, Timestamp, setDoc, addDoc, getDoc } from 'firebase/firestore';
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
      !metadata?.reason
    ) {
      Alert.alert('Missing Info', 'Please go back and fill the required borrowing details.');
      return;
    }
  
    // Show the confirmation modal with the metadata details
    setConfirmationData(metadata);
    setShowConfirmationModal(true);
  };

  // const submitRequest = async () => {
  //   const { user } = useAuth(); // access the user from AuthContext
  //   console.log('Checking if user is available:', user);
  
  //   if (!user || !user.id) {
  //     Alert.alert('Error', 'User is not logged in.');
  //     return;
  //   }
  
  //   try {
  //     // Get user's name from accounts collection
  //     const userDocRef = doc(db, 'accounts', user.id);
  //     const userDocSnapshot = await getDoc(userDocRef);
  
  //     if (!userDocSnapshot.exists()) {
  //       Alert.alert('Error', 'User not found.');
  //       return;
  //     }
  
  //     const userName = userDocSnapshot.data().name;
  
  //     // Prepare request data
  //     const requestData = {
  //       dateRequired: metadata.dateRequired,
  //       timeFrom: metadata.timeFrom,
  //       timeTo: metadata.timeTo,
  //       program: metadata.program,
  //       room: metadata.room,
  //       reason: metadata.reason,
  //       requestList: requestList.map((item) => ({
  //         ...item,
  //         program: metadata.program,
  //         reason: metadata.reason,
  //         room: metadata.room,
  //         timeFrom: metadata.timeFrom,
  //         timeTo: metadata.timeTo,
  //         usageType: item.usageType,
  //       })),
  //       userName,
  //       timestamp: Timestamp.now(),
  //     };
  
  //     console.log('Request data to be saved:', requestData);
  //     // Add to user's personal requests
  //     const userRequestRef = collection(db, 'accounts', user.id, 'userRequests');
  //     await addDoc(userRequestRef, requestData);
  
  //     // Add to global userrequests collection
  //     const userRequestsRootRef = collection(db, 'userrequests');
  //     const newUserRequestRef = doc(userRequestsRootRef);
  //     await setDoc(newUserRequestRef, {
  //       ...requestData,
  //       accountId: user.uid,
  //     });
  
  //     Alert.alert('Success', 'Request submitted successfully.');

  //   } catch (error) {
  //     console.error('Error submitting request:', error);
  //     Alert.alert('Error', 'Failed to submit request. Please try again.');
  //   }
  // };  

  const submitRequest = async () => {
    console.log('submitRequest initiated');
    const { user } = useAuth(); // access the user from AuthContext
  
    if (!user || !user.id) {
      console.log('No user logged in');
      Alert.alert('Error', 'User is not logged in.');
      return false;
    }
  
    try {
      // Fetch user info from the database
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
        requestList: requestList.map((item) => ({
          ...item,
          program: metadata.program,
          reason: metadata.reason,
          room: metadata.room,
          timeFrom: metadata.timeFrom,
          timeTo: metadata.timeTo,
          usageType: item.usageType,
        })),
        userName,
        timestamp: Timestamp.now(),
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
        accountId: user.uid,
      });
  
      console.log('Request submitted successfully');
      return true; // Successful submission
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
      return false; // Error in submission
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

                {selectedItem.usageType && (
                  <Text style={styles.modalDetail}>
                    <Text style={styles.bold}>Usage Type:</Text> {selectedItem.usageType}
                  </Text>
                )}

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

                  <FlatList
                    data={requestList}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>No items to display.</Text>}
                  />

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
