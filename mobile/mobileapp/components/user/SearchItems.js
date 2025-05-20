import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { db } from '../../backend/firebase/FirebaseConfig'; 
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import styles from '../styles/userStyle/SearchItemsStyle';
import Header from '../Header';

export default function SearchItemsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);

  // useEffect(() => {
  //   const fetchItems = async () => {
  //     try {
  //       const querySnapshot = await getDocs(collection(db, 'inventory')); 
  //       const items = querySnapshot.docs.map(doc => ({
  //         id: doc.id,
  //         ...doc.data(),
  //       }));
  //       setFilteredItems(items);
  //     } catch (error) {
  //       console.error("Error fetching items: ", error);
  //     }
  //   };

  //   fetchItems();
  // }, []);

  useEffect(() => {
    const fetchItems = () => {
      try {
        // Set up the real-time listener using onSnapshot
        const inventoryRef = collection(db, 'inventory');
        const unsubscribe = onSnapshot(inventoryRef, (querySnapshot) => {
          const items = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
  
          setFilteredItems(items); // Update state with the fetched items
        });
  
        // Clean up the listener when the component unmounts
        return () => unsubscribe();
  
      } catch (error) {
        console.error("Error fetching items: ", error);
      }
    };
  
    fetchItems();
  }, []); 

  const handleSearch = (query) => {
    setSearchQuery(query);

    const filteredData = filteredItems.filter((item) => {
      const description = item.itemName ? item.itemName.toLowerCase() : ''; 
      const category = item.category ? item.category.toLowerCase() : '';
      const location = item.labRoom ? item.labRoom.toLowerCase() : '';
  
      return (
        description.includes(query.toLowerCase()) ||
        category.includes(query.toLowerCase()) ||
        location.includes(query.toLowerCase())
      );
    });
  
    setFilteredItems(filteredData);
  };  

  // Function to handle row click and show details
  const handleRowClick = (item) => {
    setHoveredItem(item);  // Set the clicked item as hovered item
  };

  const closeModal = () => {
    setHoveredItem(null); // Close the modal by setting hoveredItem to null
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity onPress={() => handleRowClick(item)} style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
      <View style={{ flex: 2}}>
        <Text style={styles.cellText} numberOfLines={1}>{item.itemName}

        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cellText}>{item.quantity}</Text>
      </View>
      <View style={{ flex: 2 }}>
        <Text
          style={[
            styles.status,
            item.status === 'Available' && styles.available,
            item.status === 'Out of Stock' && styles.outOfStock,
            item.status === 'In Use' && styles.inUse,
          ]}
        >
          {item.status}
        </Text>
      </View>
      <View style={{ flex: 2 }}>
        <Text style={styles.cellText}>{item.category}</Text>
      </View>
      <View style={{ flex: 2 }}>
       <Text style={styles.cellText}>
          {item.condition && typeof item.condition === 'object'
            ? `G:${item.condition.Good ?? 0}, Df:${item.condition.Defect ?? 0}, Dmg:${item.condition.Damage ?? 0}`
            : item.condition || 'N/A'}
        </Text>

      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.content}>
      <Header />

      <Text style={styles.pageTitle}>Search Items</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} color="#799" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items, category, location..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Table Header */}
      <View style={styles.tableContainer}>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.tableHeaderText, { flex: 1.1, }]}>Description </Text>
          <Text style={[styles.tableHeaderText, { flex: .6 }]}>Qty </Text>
          <Text style={[styles.tableHeaderText, { flex: 1.1 }]}>Status</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.1 }]}>Category</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.1 }]}>Condition</Text>
        </View>

        {/* Items List */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={() => (
            <Text style={styles.noResults}>No matching items found.</Text>
          )}
        />
      </View>

      {/* Modal for Item Details */}
      <Modal visible={hoveredItem !== null} onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <ScrollView>
            {hoveredItem && (
              <View>
                <Text style={styles.modalTitle}>{hoveredItem.itemName}</Text>
                <Text>Quantity: {hoveredItem.quantity}</Text>
                <Text>Status: {hoveredItem.status}</Text>
                <Text>Category: {hoveredItem.category}</Text>
                <Text>Location: {hoveredItem.labRoom}</Text>
                {/* <Text>Condition: {hoveredItem.condition || 'N/A'}</Text> */}
                <Text>
                  Condition: {hoveredItem.condition && typeof hoveredItem.condition === 'object'
                    ? `Good: ${String(hoveredItem.condition.Good ?? 0)}, Defect: ${String(hoveredItem.condition.Defect ?? 0)}, Damage: ${String(hoveredItem.condition.Damage ?? 0)}`
                    : "N/A"}
                </Text>
                <Text>Item Type: {hoveredItem.type || 'N/A'}</Text>
                <Text>Date Acquired: {hoveredItem.entryCurrentDate || 'N/A'}</Text>
              </View>
            )}
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
