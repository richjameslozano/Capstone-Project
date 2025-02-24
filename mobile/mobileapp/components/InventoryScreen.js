import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Image, Modal, TouchableWithoutFeedback, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import DatePicker from 'react-native-date-picker';
import styles from './styles/InventoryStyle';

export default function InventoryScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('Fixed');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('');  
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const categories = ['All', 'Fixed', 'Consumables'];
  const departments = ['DEPARTMENTS', 'MIKMIK', 'NURSING', 'MEDTECH', 'DENTISTRY', 'OPTOMETRY', 'DENTAL HYGIENE'];

  const items = [
    { id: '1', name: 'ITEM NAME', department: 'MIKMIK', color: 'navy' },
    { id: '2', name: 'ITEM NAME', department: 'NURSING', color: 'orange' },
    { id: '3', name: 'ITEM NAME', department: 'MEDTECH', color: 'green' },
    { id: '4', name: 'ITEM NAME', department: 'DENTISTRY', color: 'purple' },
    { id: '5', name: 'ITEM NAME', department: 'OPTOMETRY', color: 'blue' },
    { id: '6', name: 'ITEM NAME', department: 'DENTAL HYGIENE', color: 'teal' },
  ];

  const filteredItems = selectedDepartment === 'DEPARTMENTS' || selectedDepartment === '' ? items : items.filter(item => item.department === selectedDepartment);

  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
    setQuantity('');
    setDate(new Date());
    setReason('');
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          <Image style={styles.itemImage} source={require('../assets/favicon.png')} />
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>ITEM NAME</Text>
          <Text style={[styles.department, { color: item.color }]}>Department: {item.department}</Text>
          <Text style={styles.description}>Description:</Text>
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
      <TextInput style={styles.searchBar} placeholder="Search" value={searchQuery} onChangeText={setSearchQuery} />

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

        <Picker
          selectedValue={selectedDepartment}
          onValueChange={(itemValue) => setSelectedDepartment(itemValue)}
          style={styles.picker}
        >
          {departments.map((department) => (
            <Picker.Item key={department} label={department} value={department} />
          ))}
        </Picker>
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

                <View style={styles.inputRow}>
                  <TextInput style={styles.input} placeholder="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
                </View>

                <Text style={styles.label}>Department:</Text>
                <Text style={styles.departmentText}>{selectedItem?.department}</Text>

                <TouchableOpacity style={styles.dateButton} onPress={() => setDatePickerVisible(true)}>
                  <Text style={styles.dateButtonText}>{date.toDateString()}</Text>
                  <Icon name="calendar" size={20} color="white" />
                </TouchableOpacity>

                <DatePicker
                  modal
                  open={isDatePickerVisible}
                  date={date}
                  mode="date"
                  onConfirm={(selectedDate) => {
                    setDatePickerVisible(false);
                    setDate(selectedDate);
                  }}
                  onCancel={() => setDatePickerVisible(false)}
                />

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
          <TouchableOpacity style={styles.requestButton} onPress={() => navigation.navigate('RequestListScreen')}>
            <Text style={styles.requestButtonText}>Request List</Text>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.helpButton} onPress={() => navigation.navigate('HelpScreen')}>
          <Text style={styles.helpButtonText}>Help (?)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
