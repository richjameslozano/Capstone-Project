// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, FlatList, TextInput, Image, Modal, TouchableWithoutFeedback, Keyboard } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { Picker } from '@react-native-picker/picker';
// import styles from './styles/InventoryStyle';
// import { useAuth } from '../components/contexts/AuthContext';
// import { useRequestList } from '../components/contexts/RequestListContext';

// export default function InventoryScreen({ navigation }) {
//   const { user } = useAuth();  
//   const isAdmin = user?.role === 'admin';

//   const { transferToRequestList, requestList } = useRequestList();

//   const [selectedTab, setSelectedTab] = useState('Fixed');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [modalVisible, setModalVisible] = useState(false);
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [quantity, setQuantity] = useState('');
//   const [reason, setReason] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('All');
//   const [selectedDepartment, setSelectedDepartment] = useState('');
  

//   const categories = ['All', 'Fixed', 'Consumable'];
//   const departments = ['DEPARTMENTS', 'MIKMIK', 'NURSING', 'MEDTECH', 'DENTISTRY', 'OPTOMETRY', 'DENTAL HYGIENE'];

//   const items = [
//     { id: '1', name: 'ITEM 1 NAME', department: 'MIKMIK', type: 'Fixed', color: 'navy', tags: 'INF223'},
//     { id: '2', name: 'ITEM 2 NAME', department: 'NURSING', type: 'Consumable', color: 'orange', tags: 'MED222'},
//     { id: '3', name: 'ITEM 3 NAME', department: 'MEDTECH', type: 'Fixed', color: 'green', tags: 'INF223'},
//     { id: '4', name: 'ITEM 4 NAME', department: 'DENTISTRY', type: 'Consumable', color: 'purple', tags: 'MED222'},
//     { id: '5', name: 'ITEM 5 NAME', department: 'OPTOMETRY', type: 'Fixed', color: 'blue', tags: 'INF223'},
//     { id: '6', name: 'ITEM 6 NAME', department: 'DENTAL HYGIENE', type: 'Consumable', color: 'teal', tags: 'MED222'},
//   ];  

//   const filteredItems = items.filter(item => 
//     (selectedDepartment === 'DEPARTMENTS' || selectedDepartment === '' || item.department === selectedDepartment) &&
//     (selectedCategory === 'All' || item.type === selectedCategory) &&
//     item.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const openModal = (item) => {
//     setSelectedItem(item);
//     setModalVisible(true);
//   };

//   const closeModal = () => {
//     setModalVisible(false);
//     setSelectedItem(null);
//     setQuantity('');
//     setReason('');
//   };

//   const addToList = () => {
//     if (selectedItem) {
//       const isAlreadyInList = requestList.some(item => item.id.startsWith(selectedItem.id));
      
//       if (isAlreadyInList) {
//         alert('This item is already on the list');
//         return;
//       }
  
//       transferToRequestList(selectedItem, quantity, reason);
//       closeModal();
//       alert('Item added to request list!');
//     }
//   };

//   const renderItem = ({ item }) => (
//     <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
//       <View style={styles.cardContent}>
//         <View style={styles.imageContainer}>
//           <Image style={styles.itemImage} source={require('../assets/favicon.png')} />
//         </View>
  
//         <View style={styles.itemDetails}>
//           <Text style={styles.itemName}>{item.name}</Text>
//           <Text style={[styles.department, { color: item.color }]}>Department: {item.department}</Text>
//           <Text style={styles.itemType}>Type: {item.type}</Text> 
//           <Text style={styles.description}>Description:</Text>
  
//           {/* Display Single Tag */}
//           <View style={styles.tag}>
//             <Text style={styles.tagText}>{item.tags}</Text>
//           </View>
  
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Image source={require('../assets/icon.png')} style={styles.logo} />

//         <View style={styles.headerText}>
//           <Text style={styles.title}>National University</Text>
//           <Text style={styles.subtitle}>Laboratory System</Text>
//         </View>

//         <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('ProfileScreen')}>
//           <Icon name="account-circle" size={35} color="white" />
//         </TouchableOpacity>
//       </View>

//       <Text style={styles.sectionTitle}>Laboratory Items</Text>
//       <TextInput 
//         style={styles.searchBar} 
//         placeholder="Search by item name" 
//         value={searchQuery} 
//         onChangeText={setSearchQuery} 
//       />

//       <View style={styles.pickerContainer}>
//         <Picker
//           selectedValue={selectedCategory}
//           onValueChange={(itemValue) => setSelectedCategory(itemValue)}
//           style={styles.picker}
//         >
//           {categories.map((category) => (
//             <Picker.Item key={category} label={category} value={category} />
//           ))}
//         </Picker>

//         {!isAdmin && (
//           <Picker
//             selectedValue={selectedDepartment}
//             onValueChange={(itemValue) => setSelectedDepartment(itemValue)}
//             style={styles.picker}
//           >
//             {departments.map((department) => (
//               <Picker.Item key={department} label={department} value={department} />
//             ))}
//           </Picker>
//         )}
//       </View>

//       <FlatList
//         data={filteredItems}
//         renderItem={renderItem}
//         keyExtractor={(item) => item.id}
//       />

//       <Modal visible={modalVisible} transparent animationType="fade">
//         <TouchableWithoutFeedback onPress={closeModal}>
//           <View style={styles.modalBackground}>
//             <TouchableWithoutFeedback onPress={() => {}}>
//               <View style={styles.modalContainer}>
//                 <View style={styles.modalImageContainer}>
//                   <Image style={styles.modalImage} source={require('../assets/favicon.png')} />
//                 </View>

//                 <Text style={styles.modalItemName}>{selectedItem?.name}</Text>
//                 <Text style={styles.itemType}>Type: {selectedItem?.type}</Text> 

//                 <View style={styles.inputRow}>
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Quantity"
//                     value={quantity}
//                     onChangeText={(text) => {
//                       if (/^[1-9]\d*$/.test(text) || text === '') {
//                         setQuantity(text);
//                       }
//                     }}
//                     keyboardType="numeric"
//                   />
//                 </View>

//                 <Text style={styles.label}>Department:</Text>
//                 <Text style={styles.departmentText}>{selectedItem?.department}</Text>

//                 <Text style={styles.label}>Reason of Request:</Text>
//                 <TextInput style={styles.textArea} placeholder="Class activity, Research" value={reason} onChangeText={setReason} multiline />

//                 <TouchableOpacity style={styles.addButton} onPress={addToList}>
//                     <Text style={styles.addButtonText}>Add to List</Text>
//                 </TouchableOpacity>

//               </View>
//             </TouchableWithoutFeedback>
//           </View>
//         </TouchableWithoutFeedback>
//       </Modal>

//       <View style={styles.bottomContainer}>
//         <View style={styles.requestAddContainer}>
//           {!isAdmin && (
//             <TouchableOpacity style={styles.requestButton} onPress={() => navigation.navigate('RequestListScreen')}>
//               <Text style={styles.requestButtonText}>Request List</Text>

//               {requestList.length > 0 && ( 
//                 <View style={styles.notificationBadge}>
//                   <Text style={styles.notificationText}>{requestList.length}</Text>
//                 </View>
//               )}
//             </TouchableOpacity>
//           )}
//         </View>

//         <TouchableOpacity style={styles.helpButton} onPress={() => navigation.navigate('HelpScreen')}>
//           <Text style={styles.helpButtonText}>Help (?)</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }


import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Image, Modal, TouchableWithoutFeedback, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import styles from './styles/InventoryStyle';
import { useAuth } from '../components/contexts/AuthContext';
import { useRequestList } from '../components/contexts/RequestListContext';

export default function InventoryScreen({ navigation }) {
  const { user } = useAuth();  
  const isAdmin = user?.role === 'admin';

  const { transferToRequestList, requestList } = useRequestList();

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
    { id: '1', name: 'ITEM 1 NAME', department: 'MIKMIK', type: 'Fixed', color: 'navy', tags: 'INF223'},
    { id: '2', name: 'ITEM 2 NAME', department: 'NURSING', type: 'Consumable', color: 'orange', tags: 'MED222'},
    { id: '3', name: 'ITEM 3 NAME', department: 'MEDTECH', type: 'Fixed', color: 'green', tags: 'INF223'},
    { id: '4', name: 'ITEM 4 NAME', department: 'DENTISTRY', type: 'Consumable', color: 'purple', tags: 'MED222'},
    { id: '5', name: 'ITEM 5 NAME', department: 'OPTOMETRY', type: 'Fixed', color: 'blue', tags: 'INF223'},
    { id: '6', name: 'ITEM 6 NAME', department: 'DENTAL HYGIENE', type: 'Consumable', color: 'teal', tags: 'MED222'},
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
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={[styles.department, { color: item.color }]}>Department: {item.department}</Text>
            <Text style={styles.itemType}>Type: {item.type}</Text> 
            <Text style={styles.description}>Description:</Text>

            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.tags}</Text>
            </View>
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
