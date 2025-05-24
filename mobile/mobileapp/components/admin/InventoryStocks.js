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
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const categoryOptions = ['All', 'Equipment', 'Chemical', 'Materials', 'Reagent', 'Glasswares'];
  const [filterCategory, setFilterCategory] = useState('All');

  const [selectedCategory, setSelectedCategory] = useState('All');


  const [headerHeight, setHeaderHeight] = useState(0);
  const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };

  const handleIcon =(item)=>{
      if(item.category === 'Equipment') return 'cube-outline';
      if(item.category === 'Chemical') return 'flask-outline';
      if(item.category === 'Materials') return 'layers-outline';
      if(item.category === 'Reagent') return 'test-tube';
    }


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

    const filteredItems = inventoryItems.filter((item) => {
    const isCategoryMatch = selectedCategory === 'All' || selectedCategory === '' || item.category === selectedCategory;
    const isSearchMatch = !searchQuery || item.itemName?.toLowerCase().includes(searchQuery.toLowerCase());
  
    return isCategoryMatch && isSearchMatch;
  });  

  
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
      <View style={styles.inventoryStocksHeader} onLayout={handleHeaderLayout}>
                     <TouchableOpacity onPress={() => {
                if (navigation?.openDrawer) {
                  navigation.openDrawer();
      
                } else {
                  console.warn("Drawer navigation not available");
                }
              }} 
              >
                       <Icon name="menu" size={28} color="black" /> 
                     </TouchableOpacity>
                    <View>
                      <Text style={{textAlign: 'center', fontWeight: 800, fontSize: 18, color: '#395a7f'}}>NU <Text style={{color: '#f4c430'}}>MOA</Text></Text>
                      <Text style={{ fontWeight: 300, fontSize: 13}}>Laboratory System</Text>
                    </View>
      
                     <TouchableOpacity style={{padding: 2}}>
                       <Icon name="information-outline" size={24} color="#000" />
                     </TouchableOpacity>
                   </View>

       <View style={[styles.searchFilter, {marginTop: headerHeight}]}>
              <View style={{height: 45, flexDirection: 'row', gap: 5, paddingHorizontal: 2}}>
                <View style={styles.searchContainer}>
                  <Icon name="magnify" size={20} color="#888"  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by item name"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
      
                <TouchableOpacity
                  style={{
                    backgroundColor: '#efefef',
                    flex: 1,
                    borderRadius: 5,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 5,
                    padding: 10,
                  }}
                  onPress={() => setIsCategoryModalVisible(true)}
                >
                  <Icon name='filter-variant' size={20} color='#515151' />
                  <Text style={{ fontWeight: 'bold', color: '#515151' }}>{selectedCategory}</Text>
                </TouchableOpacity>
              </View>
      
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, paddingHorizontal:10, paddingVertical: 2}}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icon name='cube-outline' size={16} color={'gray'}/>
                <Text style={{fontWeight: 300, fontSize: 11}}>- Equipment</Text>
                </View>
      
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icon name='flask-outline' size={16} color={'gray'}/>
                <Text style={{fontWeight: 300, fontSize: 11}}>- Chemical</Text>
                </View>
      
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icon name='layers-outline' size={16} color={'gray'}/>
                <Text style={{fontWeight: 300, fontSize: 11}}>- Material</Text>
                </View>
      
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icon name='test-tube' size={16} color={'gray'}/>
                <Text style={{fontWeight: 300, fontSize: 11}} >- Reagent</Text>
                </View>
      
              </View>
            </View>

      <View style={[styles.container2]}>

      {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 10 }}>
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
      </View> */}

      <ScrollView style={{paddingHorizontal: 8, paddingVertical: 10}}>
        {filteredItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={[styles.imageContainer]}>
              <Icon name={handleIcon()} size={30} color={'black'}/>
            </View>


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
      </View>



      <Modal
              visible={isCategoryModalVisible}
              transparent={true}
              animationType="slide"
            >
              <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                <View style={{ margin: 20, backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
                  {categoryOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={{ paddingVertical: 10 }}
                      onPress={() => {
                        setSelectedCategory(option);
                        setIsCategoryModalVisible(false);
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)} style={{ marginTop: 10 }}>
                    <Text style={{ textAlign: 'center', color: 'red' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

      

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
