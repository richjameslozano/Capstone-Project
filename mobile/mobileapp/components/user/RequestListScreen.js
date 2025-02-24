import React, { useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Image, Modal, Alert, TouchableWithoutFeedback } from 'react-native';
import { Card, Button, Checkbox } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/userStyle/RequestListStyle';
import { useAuth } from '../contexts/AuthContext';

const requestList = [
  { id: '1', name: 'ITEM NAME', department: 'NURSING', quantity: 20, date: 'March 23, 2025', time: '4pm-7pm', reason: 'I have a class that needs this equipment. My students will use these' },
  { id: '2', name: 'ITEM NAME', department: 'NURSING', quantity: 10, date: 'March 24, 2025', time: '1pm-3pm', reason: 'Equipment needed for training' },
];

export default function RequestListScreen({ navigation }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false); 

  const [checkedItems, setCheckedItems] = useState({});

  const toggleCheckbox = (id) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id], 
    }));
  };

  const removeSelectedItems = () => {
    const selectedIds = Object.keys(checkedItems).filter((id) => checkedItems[id]);

    if (selectedIds.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to remove.');
      return;
    }

    Alert.alert(
      'Confirm Removal',
      `Are you sure you want to remove ${selectedIds.length} selected item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            console.log('Removed items:', selectedIds);
            // You can update the state or make an API call here
          },
        },
      ]
    );
  };

  const requestSelectedItems = () => {
    const selectedItems = Object.keys(checkedItems)
      .filter((id) => checkedItems[id])
      .map((id) => requestList.find((item) => item.id === id));

    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to request.');
      return;
    }

    Alert.alert(
      'Confirm Request',
      `Are you sure you want to request ${selectedItems.length} selected item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: () => {
            console.log('Requested items:', selectedItems);
            Alert.alert("Request Submitted", "Your request has been sent successfully!");
          },
        },
      ]
    );
  };

  const openModal = (item) => {
    setSelectedRequest(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
  };

  const confirmCancelRequest = () => {
    setConfirmVisible(true);
  };

  const handleCancelRequest = () => {
    setConfirmVisible(false);
    closeModal();
    console.log('Request canceled:', selectedRequest?.name);
    Alert.alert("Request Canceled", `Your request for "${selectedRequest?.name}" has been canceled.`);
  };

  const renderItem = ({ item, index }) => (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Checkbox
          status={checkedItems[item.id] ? 'checked' : 'unchecked'}
          onPress={() => toggleCheckbox(item.id)}
        />
        <Text style={styles.index}>{index + 1}.)</Text>
        <Image source={require('../../assets/favicon.png')} style={styles.image} />
        <View style={styles.details}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.department}>
            Department: <Text style={styles.highlight}>{item.department}</Text>
          </Text>
          <Button mode="contained" style={styles.button} onPress={() => openModal(item)}>
            View Details
          </Button>
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

      <Text style={styles.sectionTitle}>Requests List</Text>
      <Text style={styles.subtitle}>Select items to remove or request.</Text>

      <FlatList
        data={requestList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={removeSelectedItems} style={[styles.removeButton, styles.buttonStyle]}>
            Remove
        </Button>

        <Button mode="contained" onPress={requestSelectedItems} style={[styles.requestButton, styles.buttonStyle]}>
            Request Now
        </Button>

        <TouchableOpacity style={styles.helpButton} onPress={() => navigation.navigate('HelpScreen')}>
          <Text style={styles.helpButtonText}>Help (?)</Text>
        </TouchableOpacity>
      </View>

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
                <Text style={styles.modalTag}>{"<Tag>"}</Text>
              </View>

              <View style={styles.modalDetails}>
                <Text style={styles.modalLabel}><Text style={styles.bold}>Quantity:</Text> {selectedRequest?.quantity}</Text>
                <Text style={styles.modalLabel}><Text style={styles.bold}>Item Department:</Text> {selectedRequest?.department}</Text>
                <Text style={styles.modalLabel}><Text style={styles.bold}>Date:</Text> {selectedRequest?.date}</Text>
                <Text style={styles.modalLabel}><Text style={styles.bold}>Time:</Text> {selectedRequest?.time}</Text>
                <Text style={styles.modalLabel}><Text style={styles.bold}>Reason of Request:</Text></Text>
                <Text style={styles.modalReason}>{selectedRequest?.reason}</Text>
              </View>

              <View style={styles.modalFooter}>
              <TouchableOpacity onPress={closeModal} style={styles.okButton}>
                  <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
