import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/userStyle/SearchItemsStyle';
import Header from '../Header';

const initialItems = [
  {
    id: '1',
    description: 'Hydrochloric Acid',
    quantity: 5,
    status: 'In Use',
    category: 'Chemical',
    location: 'Lab A',
  },
  {
    id: '2',
    description: 'Microscope',
    quantity: 3,
    status: 'Available',
    category: 'Equipment',
    location: 'Lab B',
  },
  {
    id: '3',
    description: 'Gloves',
    quantity: 0,
    status: 'Out of Stock',
    category: 'Materials',
    location: 'Storage Room',
  },
  {
    id: '4',
    description: 'Phenolphthalein',
    quantity: 8,
    status: 'Available',
    category: 'Reagent',
    location: 'Lab C',
  },
  {
    id: '5',
    description: 'Burette',
    quantity: 1,
    status: 'In Use',
    category: 'Equipment',
    location: 'Lab D',
  },
];

export default function SearchItemsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(initialItems);
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filteredData = initialItems.filter(
      (item) =>
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.location.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredItems(filteredData);
  };

  const handleLongPress = (item) => {
    setHoveredItem(item);
  };

  const closeModal = () => {
    setHoveredItem(null);
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={[styles.cell, { flex: 2 }]}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.cellText}>
          {item.description}
        </Text>
      </View>
      <View style={[styles.cell, { flex: 1 }]}>
        <Text style={styles.cellText}>{item.quantity}</Text>
      </View>
      <View style={[styles.statusCell, { flex: 2 }]}>
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
      <View style={[styles.cell, { flex: 1.5 }]}>
        <Text style={styles.cellText}>{item.category}</Text>
      </View>
      <View style={[styles.cell, { flex: 1.5 }]}>
        <Text style={styles.cellText}>{item.location}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header/>

      <View style={styles.content}>
        <Text style={styles.pageTitle}>Search Items</Text>

        <View style={styles.searchContainer}>
          <Icon name="magnify" size={24} color="#777" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items, category, location..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.tableContainer}>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.headerText, { flex: 2 }]}>Description</Text>
              <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
              <Text style={[styles.headerText, { flex: 2 }]}>Status</Text>
              <Text style={[styles.headerText, { flex: 1.5 }]}>Category</Text>
              <Text style={[styles.headerText, { flex: 1.5 }]}>Location</Text>
            </View>

            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ListEmptyComponent={() => (
                <Text style={styles.noResults}>No matching items found.</Text>
              )}
            />
          </View>
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.helpButton}>
        <Text style={styles.helpText}>Help (?)</Text>
      </TouchableOpacity>

      {hoveredItem && (
        <Modal
          visible={!!hoveredItem}
          transparent
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Full Description</Text>
              <Text style={styles.modalText}>{hoveredItem.description}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
