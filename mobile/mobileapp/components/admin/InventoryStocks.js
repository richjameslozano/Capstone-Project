import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/adminStyle/InventoryStocksStyle';
import Header from '../Header';

const inventoryData = [
  { id: 'INF224', description: 'Syringe', department: 'NURSING', quantity: 100, entryDate: '2025-02-10', expireDate: '2026-02-10', type: 'Consumables' },
  { id: 'MED223', description: 'Gloves', department: 'NURSING', quantity: 200, entryDate: '2025-02-12', expireDate: '2026-02-12', type: 'Consumables' },
  { id: 'INF225', description: 'Stethoscope', department: 'NURSING', quantity: 50, entryDate: '2025-02-15', expireDate: '2030-02-15', type: 'Fixed' },
  { id: 'MED224', description: 'Thermometer', department: 'NURSING', quantity: 80, entryDate: '2025-02-18', expireDate: '2028-02-18', type: 'Fixed' },
  { id: 'INF226', description: 'Face Mask', department: 'NURSING', quantity: 500, entryDate: '2025-02-20', expireDate: '2027-02-20', type: 'Consumables' },
];

export default function InventoryStocks({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredData = inventoryData.filter(item => 
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterType === 'All' || item.type === filterType)
  );

  const openDetailsModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Header/>

      <Text style={[styles.pageTitle,{marginTop:60}]}>Inventory Stocks</Text>

      <TextInput
        style={styles.searchBar}
        placeholder="Search Item Description..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={filterType}
          style={styles.pickerText}
          onValueChange={(itemValue) => setFilterType(itemValue)}
        >
          <Picker.Item label="All" value="All" />
          <Picker.Item label="Fixed" value="Fixed" />
          <Picker.Item label="Consumables" value="Consumables"  style={styles.pickerText} />
        </Picker>
      </View>

      <ScrollView>
        {filteredData.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>ID:</Text>
              <Text style={styles.cardValue}>{item.id}</Text>
            </View>

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Description:</Text>
              <Text style={styles.cardValue}>{item.description}</Text>
            </View>

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Balance:</Text>
              <Text style={styles.cardValueNum}>{item.quantity}</Text>
            </View>

            <TouchableOpacity style={styles.viewDetailsButton} onPress={() => openDetailsModal(item)}>
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                <Text style={styles.modalTitle}>Item Details</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>ID:</Text> {selectedItem.id}</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Item Name:</Text> {selectedItem.description}</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Department:</Text> {selectedItem.department}</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Entry Date:</Text> {selectedItem.entryDate}</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Expire Date:</Text> {selectedItem.expireDate}</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Type:</Text> {selectedItem.type}</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Inventory Stock:</Text> {selectedItem.quantity}</Text>

                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
