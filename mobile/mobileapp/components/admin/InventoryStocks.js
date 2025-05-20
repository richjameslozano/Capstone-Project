import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getDocs, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig'; 
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/adminStyle/InventoryStocksStyle';
import Header from '../Header';

export default function InventoryStocks({ navigation }) {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');

  // useEffect(() => {
  //   const fetchInventory = async () => {
  //     try {
  //       const inventoryCollection = collection(db, 'inventory');
  //       const inventorySnapshot = await getDocs(inventoryCollection);
  //       const inventoryList = inventorySnapshot.docs.map(doc => ({
  //         id: doc.id,
  //         ...doc.data()
  //       }));

  //       setInventoryItems(inventoryList);
  //     } catch (error) {
  //       console.error("Error fetching inventory: ", error);
  //     }
  //   };

  //   fetchInventory();
  // }, []);

  useEffect(() => {
    const fetchInventory = () => {
      try {
        // Set up the real-time listener using onSnapshot
        const inventoryCollection = collection(db, 'inventory');
  
        const unsubscribe = onSnapshot(inventoryCollection, (snapshot) => {
          const inventoryList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
  
          // Update the state with the latest inventory data
          setInventoryItems(inventoryList);
        });
  
        // Cleanup listener when the component unmounts
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching inventory: ", error);
      }
    };
  
    fetchInventory();
  }, []);

  const filteredData = inventoryItems.filter(item =>
    item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterType === 'All' || item.type === filterType) &&
    (filterCategory === 'All' || item.category === filterCategory)
  );   

  const openDetailsModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const formatCondition = (cond) => {
    if (cond && typeof cond === 'object') {
      return `Good: ${cond.Good ?? 0}, Defect: ${cond.Defect ?? 0}, Damage: ${cond.Damage ?? 0}`;
    }
    
    return cond || 'N/A';
  };

  return (
    <View style={styles.container}>
      <Header />

      <Text style={styles.pageTitle}>Inventory Stocks</Text>

      <TextInput
        style={styles.searchBar}
        placeholder="Search Item Description..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 10 }}>
        <View style={{ flex: 1, marginRight: 5 }}>
          <Picker
            selectedValue={filterType}
            style={styles.picker}
            onValueChange={(itemValue) => setFilterType(itemValue)}
          >
            <Picker.Item label="All Types" value="All" />
            <Picker.Item label="Fixed" value="Fixed" />
            <Picker.Item label="Consumables" value="Consumables" />
          </Picker>
        </View>

        <View style={{ flex: 1, marginLeft: 5 }}>
          <Picker
            selectedValue={filterCategory}
            style={styles.picker}
            onValueChange={(itemValue) => setFilterCategory(itemValue)}
          >
            <Picker.Item label="All Categories" value="All" />
            <Picker.Item label="Chemical" value="Chemical" />
            <Picker.Item label="Reagent" value="Reagent" />
            <Picker.Item label="Materials" value="Materials" />
            <Picker.Item label="Equipment" value="Equipment" />
            <Picker.Item label="Glasswares" value="Glasswares" />
          </Picker>
        </View>
      </View>

      <ScrollView>
        {filteredData.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>ID:</Text>
              <Text style={styles.cardValue}>{item.itemId || item.id}</Text>
            </View>

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Item Name:</Text>
              <Text style={styles.cardValue}>{item.itemName}</Text>
            </View>

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Balance:</Text>
              <Text style={styles.cardValueNum}>{item.quantity}</Text>
            </View>

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Condition:</Text>
              <Text style={styles.cardValueNum}>{formatCondition(item.condition)}</Text>
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
                <Text style={styles.modalText}><Text style={styles.modalLabel}>ID:</Text> {selectedItem.itemId || selectedItem.id}</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Item Name:</Text> {selectedItem.itemName}</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Department:</Text> {selectedItem.department}</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Entry Date:</Text> {selectedItem.entryCurrentDate}</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Expire Date:</Text> {selectedItem.expireDate || 'N/A'}</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Type:</Text> {selectedItem.type}</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Inventory Stock:</Text> {selectedItem.quantity}</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Category:</Text> {selectedItem.category || 'N/A'}</Text>
                {/* <Text style={styles.modalText}><Text style={styles.modalLabel}>Condition:</Text> {selectedItem.condition || 'N/A'}</Text> */}
                <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Condition:</Text>{' '}
                  {formatCondition(selectedItem.condition)}
                </Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Lab Room:</Text> {selectedItem.labRoom || 'N/A'}</Text>
                <Text style={styles.modalText}><Text style={styles.modalLabel}>Status:</Text> {selectedItem.status || 'N/A'}</Text>
                {/* <Text style={styles.modalText}><Text style={styles.modalLabel}>Usage Type:</Text> {selectedItem.usageType || 'N/A'}</Text> */}

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
