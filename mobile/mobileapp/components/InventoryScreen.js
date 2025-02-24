import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Image, Modal, TouchableWithoutFeedback, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker'; 
import { useAuth } from '../components/contexts/AuthContext'; 
import styles from './styles/InventoryStyle';

export default function InventoryScreen({ navigation }) { 
  const { user } = useAuth();  
  const isAdmin = user?.role === 'admin';

  const [selectedTab, setSelectedTab] = useState('Fixed');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const categories = ['All', 'Fixed', 'Consumable'];
  const departments = ['DEPARTMENTS', 'MIKMIK', 'NURSING', 'MEDTECH', 'DENTISTRY', 'OPTOMETRY', 'DENTAL HYGIENE'];

  const items = [
    { id: '1', name: 'ITEM 1 NAME', department: 'MIKMIK', type: 'Fixed', color: 'navy' },
    { id: '2', name: 'ITEM 2 NAME', department: 'NURSING', type: 'Consumable', color: 'orange' },
    { id: '3', name: 'ITEM 3 NAME', department: 'MEDTECH', type: 'Fixed', color: 'green' },
    { id: '4', name: 'ITEM 4 NAME', department: 'DENTISTRY', type: 'Consumable', color: 'purple' },
    { id: '5', name: 'ITEM 5 NAME', department: 'OPTOMETRY', type: 'Fixed', color: 'blue' },
    { id: '6', name: 'ITEM 6 NAME', department: 'DENTAL HYGIENE', type: 'Consumable', color: 'teal' },
  ];

  const filteredItems = items.filter(item => 
    (selectedDepartment === 'DEPARTMENTS' || selectedDepartment === '' || item.department === selectedDepartment) &&
    (selectedCategory === 'All' || item.type === selectedCategory) &&
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          <Image style={styles.itemImage} source={require('../assets/favicon.png')} />
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={[styles.department, { color: item.color }]}>Department: {item.department}</Text>
          <Text style={styles.itemType}>Type: {item.type}</Text> 
          <Text style={styles.tags}>{"<Tag>"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../assets/icon.png')} style={styles.logo} />

        <View style={styles.headerText}>
          <Text style={styles.title}>National University</Text>
          <Text style={styles.subtitle}>Laboratory System</Text>
        </View>

        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('ProfileScreen')}>
          <Icon name="account-circle" size={35} color="white" />
        </TouchableOpacity>
      </View>

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
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalBackground}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContainer}>
                <View style={styles.modalImageContainer}>
                  <Image style={styles.modalImage} source={require('../assets/favicon.png')} />
                </View>

                <Text style={styles.modalItemName}>{selectedItem?.name}</Text>
                <Text style={styles.itemType}>Type: {selectedItem?.type}</Text> 

                <View style={styles.inputRow}>
                  <TextInput style={styles.input} placeholder="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
                </View>

                <Text style={styles.label}>Department:</Text>
                <Text style={styles.departmentText}>{selectedItem?.department}</Text>

                <Text style={styles.label}>Reason of Request:</Text>
                <TextInput style={styles.textArea} placeholder="Class activity, Research" value={reason} onChangeText={setReason} multiline />

                <TouchableOpacity style={styles.addButton} onPress={closeModal}>
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
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>3</Text>
              </View>
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
