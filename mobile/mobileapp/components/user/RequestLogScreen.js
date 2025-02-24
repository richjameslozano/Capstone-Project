import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal } from 'react-native';
import { DataTable } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/userStyle/RequestLogStyle';

const requests = [
  { id: '1', name: 'Syringe', department: 'NURSING', date: '2025-02-23', status: 'Approved', tag: 'INF224' },
  { id: '2', name: 'Gloves', department: 'NURSING', date: '2025-02-22', status: 'Approved', tag: 'MED223' },
  { id: '3', name: 'Stethoscope', department: 'NURSING', date: '2025-02-21', status: 'Approved', tag: 'INF225' },
  { id: '4', name: 'Thermometer', department: 'NURSING', date: '2025-02-20', status: 'Approved', tag: 'MED224' },
  { id: '5', name: 'Face Mask', department: 'NURSING', date: '2025-02-19', status: 'Approved', tag: 'INF226' },
  { id: '6', name: 'Alcohol', department: 'NURSING', date: '2025-02-18', status: 'Rejected', tag: 'MED225' },
  { id: '7', name: 'Bandages', department: 'NURSING', date: '2025-02-17', status: 'Rejected', tag: 'INF227' },
];

export default function RequestLogScreen({ navigation }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = (request) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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

        <DataTable>
          <DataTable.Header style={styles.tableHeader}>
            <DataTable.Title textStyle={styles.tableHeaderText} style={{ flex: 0.5 }}>#</DataTable.Title>
            <DataTable.Title textStyle={styles.tableHeaderText} style={{ flex: 1 }}>Item Name</DataTable.Title>
            <DataTable.Title textStyle={styles.tableHeaderText} style={{ flex: 1 }}>Department</DataTable.Title>
            <DataTable.Title textStyle={styles.tableHeaderText} style={{ flex: 1 }}>Date</DataTable.Title>
            <DataTable.Title textStyle={styles.tableHeaderText} style={{ flex: 1 }}>Tag</DataTable.Title>  
            <DataTable.Title textStyle={styles.tableHeaderText} style={{ flex: 1 }}>Status</DataTable.Title>
            <DataTable.Title textStyle={styles.tableHeaderText} style={{ flex: 1 }}>Action</DataTable.Title>
          </DataTable.Header>

          {requests.map((item, index) => (
            <DataTable.Row key={item.id} style={styles.tableRow}>
              <DataTable.Cell textStyle={styles.tableCell} style={{ flex: 0.5 }}>{index + 1}.</DataTable.Cell>
              <DataTable.Cell textStyle={styles.tableCell} style={{ flex: 1 }}>{item.name}</DataTable.Cell>
              <DataTable.Cell textStyle={styles.tableCell} style={{ flex: 1 }}>{item.department}</DataTable.Cell>
              <DataTable.Cell textStyle={styles.tableCell} style={{ flex: 1 }}>{item.date}</DataTable.Cell>
              <DataTable.Cell textStyle={styles.tableCell} style={{ flex: 1, fontWeight: 'bold' }}>{item.tag}</DataTable.Cell>  
              <DataTable.Cell 
                textStyle={[
                  styles.tableCell, 
                  item.status === 'Approved' ? styles.statusApproved : styles.statusRejected
                ]}
                style={{ flex: 1 }}
              >
                {item.status}
              </DataTable.Cell>
              <DataTable.Cell style={{ flex: 1 }}>
                <TouchableOpacity style={styles.viewButton} onPress={() => openModal(item)}>
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </View>

      {/* Help Button */}
      <TouchableOpacity style={styles.helpButton}>
        <Text style={styles.helpText}>Help (?)</Text>
      </TouchableOpacity>

      {/* Modal */}
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
