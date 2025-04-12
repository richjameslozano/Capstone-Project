import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Image, Modal, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../backend/firebase/FirebaseConfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import styles from './styles/InventoryStyle';
import { useAuth } from '../components/contexts/AuthContext';
import { useRequestList } from '../components/contexts/RequestListContext';
import Header from './Header';

export default function InventoryScreen({ navigation }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { transferToRequestList, requestList } = useRequestList();

  const [inventoryItems, setInventoryItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const inventoryCollection = collection(db, 'inventory');
        const inventorySnapshot = await getDocs(inventoryCollection);
        const inventoryList = inventorySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setInventoryItems(inventoryList);

        const categoriesList = ['All', ...new Set(inventoryList.map(item => item.type))]; 
        const departmentsList = ['All', ...new Set(inventoryList.map(item => item.department))]; 
        setCategories(categoriesList);
        setDepartments(departmentsList);

      } catch (error) {
        console.error("Error fetching inventory: ", error);
      }
    };

    fetchInventory();
  }, []);

  const filteredItems = inventoryItems.filter(item => {
    const isCategoryMatch = selectedCategory === 'All' || item.type === selectedCategory;
    const isDepartmentMatch = selectedDepartment === 'All' || item.department === selectedDepartment;
    
    return isCategoryMatch && isDepartmentMatch && 
      (item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) || '');
  });

  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
    setQuantity('');
    setReason('');
  };

  const addToList = (item) => {
    if (!item) return;

    const isAlreadyInList = requestList.some(reqItem => reqItem.originalId === item.id);
    if (isAlreadyInList) {
      alert('This item is already in the request list.');
      return;
    }

    transferToRequestList(item, '1', 'General Use');
    alert('Item added to request list!');
  };

  const renderItem = ({ item }) => {
    const isAlreadyInList = requestList.some(reqItem => reqItem.id === item.id);

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.imageContainer}>
            <Image style={styles.itemImage} source={require('../assets/favicon.png')} />
          </View>

          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={styles.itemType}>Quantity: {item.quantity}</Text>
            <Text style={[styles.department, { color: item.color }]}>Department: {item.department}</Text>
            <Text style={styles.itemType}>Status: {item.status}</Text>
            <Text style={styles.itemType}>Condition: {item.condition}</Text>
            <Text style={styles.itemType}>Category: {item.category}</Text>
            <Text style={styles.itemType}>Usage Type: {item.usageType}</Text>
          </View>

          <TouchableOpacity
            style={[styles.addButton, isAlreadyInList && styles.disabledButton]}
            onPress={() => addToList(item)}
            disabled={isAlreadyInList}
          >
            <Icon name="plus-circle" size={24} color={isAlreadyInList ? '#ccc' : 'green'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />

      <Text style={styles.sectionTitle}>Laboratory Items</Text>
      <TextInput
        style={styles.searchBar}
        placeholder="Search by item name"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCategory}
          onValueChange={(itemValue) => setSelectedCategory(itemValue)}
          style={styles.picker}
        >
          {categories.map((category) => (
            <Picker.Item key={category} label={category} value={category} />
          ))}
        </Picker>

        {!isAdmin && (
          <Picker
            selectedValue={selectedDepartment}
            onValueChange={(itemValue) => setSelectedDepartment(itemValue)}
            style={styles.picker}
          >
            {departments.map((department) => (
              <Picker.Item key={department} label={department} value={department} />
            ))}
          </Picker>
        )}
      </View>

      <FlatList
        data={filteredItems.length > 0 ? filteredItems : inventoryItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalBackground}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={styles.modalContainer}>
                <View style={styles.modalImageContainer}>
                  <Image style={styles.modalImage} source={require('../assets/favicon.png')} />
                </View>

                <Text style={styles.modalItemName}>{selectedItem?.itemName}</Text>
                <Text style={styles.itemType}>Type: {selectedItem?.type}</Text>

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Quantity"
                    value={quantity}
                    onChangeText={(text) => {
                      if (/^[1-9]\d*$/.test(text) || text === '') {
                        setQuantity(text);
                      }
                    }}
                    keyboardType="numeric"
                  />
                </View>

                <Text style={styles.label}>Department:</Text>
                <Text style={styles.departmentText}>{selectedItem?.department}</Text>

                <Text style={styles.label}>Reason of Request:</Text>
                <TextInput style={styles.textArea} placeholder="Class activity, Research" value={reason} onChangeText={setReason} multiline />

                <TouchableOpacity style={styles.addButton} onPress={() => addToList(selectedItem)}>
                  <Text style={styles.addButtonText}>Add to List</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.bottomContainer}>
        <View style={styles.requestAddContainer}>
          {!isAdmin && (
            <TouchableOpacity style={styles.requestButton} onPress={() => navigation.navigate('RequestListScreen')}>
              <Text style={styles.requestButtonText}>Request List</Text>

              {requestList.length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>{requestList.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.helpButton} onPress={() => navigation.navigate('HelpScreen')}>
          <Text style={styles.helpButtonText}>Help (?)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
