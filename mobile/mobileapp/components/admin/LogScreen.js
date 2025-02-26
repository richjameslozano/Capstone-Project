import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { DataTable } from 'react-native-paper';
import { useRequestList } from '../contexts/RequestListContext'; 
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/admin2Style/LogStyle';

export default function LogScreen({ navigation }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { approvedRequests = [], rejectedRequests = [] } = useRequestList();

  console.log("Approved Requests:", approvedRequests);
  console.log("Rejected Requests:", rejectedRequests);

  const openModal = (request) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

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

      <View style={styles.content}>
        <Text style={styles.pageTitle}>Requests Log</Text>

        <ScrollView horizontal={true}>
          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title>#</DataTable.Title>
              <DataTable.Title>Item Name</DataTable.Title>
              <DataTable.Title>Department</DataTable.Title>
              <DataTable.Title>Date</DataTable.Title>
              <DataTable.Title>Tag</DataTable.Title>
              <DataTable.Title>Status</DataTable.Title>
              <DataTable.Title>Action</DataTable.Title>
            </DataTable.Header>

            {approvedRequests.map((item, index) => (
              <DataTable.Row key={item.id} style={styles.tableRow}>
                <DataTable.Cell textStyle={styles.tableCell} style={{ flex: 0.5 }}>{index + 1}.</DataTable.Cell>
                <DataTable.Cell textStyle={styles.tableCell} style={{ flex: 1.5 }}>{item.name}</DataTable.Cell>
                <DataTable.Cell textStyle={styles.tableCell} style={{ flex: 1.2 }}>{item.department}</DataTable.Cell>
                <DataTable.Cell textStyle={styles.tableCell} style={{ flex: 1.2 }}>{item.date}</DataTable.Cell>
                <DataTable.Cell textStyle={[styles.tableCell, styles.tagCell]} style={{ flex: 1 }}>{item.tags}</DataTable.Cell>
                <DataTable.Cell textStyle={[styles.tableCell, styles.statusApproved]} style={{ flex: 1.2 }}>
                  {item.status}
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => openModal(item)}>
                    <Text style={styles.viewLinkText}>View</Text>
                  </TouchableOpacity>
                </DataTable.Cell>
              </DataTable.Row>
            ))}

          {rejectedRequests.map((item, index) => {
            console.log("Rendering rejected request:", item);
            return (
              <DataTable.Row key={item.id} style={styles.tableRow}>
                <DataTable.Cell textStyle={styles.tableCell} style={{ flex: 0.5 }}>{index + 1}.</DataTable.Cell>
                <DataTable.Cell textStyle={styles.tableCell} style={{ flex: 1.5 }}>{item.name}</DataTable.Cell>
                <DataTable.Cell textStyle={styles.tableCell} style={{ flex: 1.2 }}>{item.department}</DataTable.Cell>
                <DataTable.Cell textStyle={styles.tableCell} style={{ flex: 1.2 }}>{item.date}</DataTable.Cell>
                <DataTable.Cell textStyle={[styles.tableCell, styles.tagCell]} style={{ flex: 1 }}>{item.tags}</DataTable.Cell>
                <DataTable.Cell textStyle={[styles.tableCell, styles.statusRejected]} style={{ flex: 1.2 }}>
                  {item.status}
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => openModal(item)}>
                    <Text style={styles.viewLinkText}>View</Text>
                  </TouchableOpacity>
                </DataTable.Cell>
              </DataTable.Row>
            );
          })}


          </DataTable>
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.helpButton}>
        <Text style={styles.helpText}>Help (?)</Text>
      </TouchableOpacity>
    
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Details</Text>
            {selectedRequest && (
              <>
                <Text style={styles.modalText}>Item: {selectedRequest.name}</Text>
                <Text style={styles.modalText}>Department: {selectedRequest.department}</Text>
                <Text style={styles.modalText}>Date: {selectedRequest.date}</Text>
                <Text style={styles.modalText}>Tag: {selectedRequest.tag}</Text>
                <Text style={styles.modalText}>Quantity: {selectedRequest.quantity}</Text> 
                <Text 
                  style={[
                    styles.modalText, 
                    selectedRequest.status === 'Approved' ? styles.statusApproved : styles.statusRejected
                  ]}
                >
                  Status: {selectedRequest.status}
                </Text>
              </>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
