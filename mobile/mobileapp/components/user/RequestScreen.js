import React, { useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Image, Modal, TouchableWithoutFeedback } from 'react-native';
import { Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/userStyle/RequestStyle';
import { useAuth } from '../contexts/AuthContext';
import { useRequestList } from '../contexts/RequestListContext';

export default function RequestScreen({ navigation }) {
  const { user } = useAuth(); 
  const { pendingRequests } = useRequestList();
  const { removeFromPendingRequests } = useRequestList();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmCancelVisible, setConfirmCancelVisible] = useState(false);

  const openModal = (item) => {
    setSelectedRequest(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
  };

  const handleCancelRequest = () => {
    setConfirmCancelVisible(true); 
  };

  const confirmCancel = () => {
    if (selectedRequest) {
      removeFromPendingRequests(selectedRequest.id);
    }
    setModalVisible(false);
    setConfirmCancelVisible(false);
    alert(`Your request for "${selectedRequest?.name}" has been canceled.`);
  };

  const renderItem = ({ item, index }) => (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.index}>{index + 1}.)</Text>
        <Image source={require('../../assets/favicon.png')} style={styles.image} />
        <View style={styles.details}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.department}>Department: <Text style={styles.highlight}>{item.department}</Text></Text>
          <TouchableOpacity style={styles.button} onPress={() => openModal(item)}>
            <Text style={styles.buttonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <View style={styles.headerText}>
          <Text style={styles.title}>National University</Text>
          <Text style={styles.subtitle}>Laboratory System</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('ProfileScreen')}>
          <Icon name="account-circle" size={35} color="white" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Pending Requests</Text>
      <Text style={styles.subtitle}>View your confirmed requests here.</Text>

      <FlatList data={pendingRequests} keyExtractor={(item) => item.id} renderItem={renderItem} />

      <TouchableOpacity style={styles.helpButton}>
        <Text style={styles.helpText}>Help (?)</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Image source={require('../../assets/favicon.png')} style={styles.modalImage} />
                <Text style={styles.modalItemName}>{selectedRequest?.name}</Text>
              </View>

              <View style={styles.modalDetails}>
                <Text style={styles.modalLabel}><Text style={styles.bold}>Requestor:</Text> {user?.name || 'Unknown'}</Text>
                <Text style={styles.modalLabel}><Text style={styles.bold}>Quantity:</Text> {selectedRequest?.quantity}</Text>
                <Text style={styles.modalLabel}><Text style={styles.bold}>Department:</Text> {selectedRequest?.department}</Text>
                <Text style={styles.modalLabel}><Text style={styles.bold}>Tag:</Text> {selectedRequest?.tags}</Text>
                <Text style={styles.modalLabel}><Text style={styles.bold}>Date:</Text> {selectedRequest?.date}</Text>
                <Text style={styles.modalLabel}><Text style={styles.bold}>Time:</Text></Text>
                <Text style={styles.modalText}>
                  Start Time: {selectedRequest?.startTime?.hour ?? '--'}:{selectedRequest?.startTime?.minute ?? '--'} {selectedRequest?.startTime?.period ?? '--'}
                </Text>
                <Text style={styles.modalText}>
                  End Time: {selectedRequest?.endTime?.hour ?? '--'}:{selectedRequest?.endTime?.minute ?? '--'} {selectedRequest?.endTime?.period ?? '--'}
                </Text>
                <Text style={styles.modalLabel}><Text style={styles.bold}>Reason:</Text></Text>
                <Text style={styles.modalReason}>{selectedRequest?.reason}</Text>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity onPress={closeModal} style={styles.okButton}>
                  <Text style={styles.okButtonText}>OK</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleCancelRequest} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={confirmCancelVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmCancelVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setConfirmCancelVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalItemName}>Cancel Request</Text>
              <Text style={{ textAlign: 'center', marginVertical: 10 }}>
                Are you sure you want to cancel this request?
              </Text>

              <View style={styles.modalFooter}>
                <TouchableOpacity onPress={() => setConfirmCancelVisible(false)} style={styles.okButton}>
                  <Text style={styles.okButtonText}>No</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={confirmCancel} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Yes, Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
