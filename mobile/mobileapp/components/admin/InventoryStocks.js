import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getDocs, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig'; 
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/adminStyle/InventoryStocksStyle';
import Header from '../Header';
import { useNavigation } from '@react-navigation/native';

export default function InventoryStocks({ }) {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const categoryOptions = ['All', 'Equipment', 'Chemical', 'Materials', 'Reagent', 'Glasswares'];
  const [filterCategory, setFilterCategory] = useState('All');
  const [isOpen, setIsOpen] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All');

  const navigation = useNavigation()

  const [headerHeight, setHeaderHeight] = useState(0);
  const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const handleOpen = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(prev => (prev === id ? null : id));
  };

  // useEffect(() => {
  //   const fetchInventory = () => {
  //     try {
  //       // Set up the real-time listener using onSnapshot
  //       const inventoryCollection = collection(db, 'inventory');
  
  //       const unsubscribe = onSnapshot(inventoryCollection, (snapshot) => {
  //         const inventoryList = snapshot.docs.map(doc => ({
  //           id: doc.id,
  //           ...doc.data(),
  //         }));
  
  //         // Update the state with the latest inventory data
  //         setInventoryItems(inventoryList);
  //       });
  
  //       // Cleanup listener when the component unmounts
  //       return () => unsubscribe();
  //     } catch (error) {
  //       console.error("Error fetching inventory: ", error);
  //     }
  //   };
  
  //   fetchInventory();
  // }, []);


  // VERSION NI BERLENE NO DATE EXPIRY CONDITION
  // useEffect(() => {
  //   const fetchInventory = () => {
  //     try {
  //       const inventoryCollection = collection(db, 'inventory');

  //       const unsubscribe = onSnapshot(inventoryCollection, (snapshot) => {
  //         const inventoryList = snapshot.docs
  //           .map(doc => ({
  //             id: doc.id,
  //             ...doc.data(),
  //           }))
  //           .sort((a, b) => a.itemName.localeCompare(b.itemName)); // alphabetically by itemName

  //         setInventoryItems(inventoryList);
  //       });

  //       return () => unsubscribe();
  //     } catch (error) {
  //       console.error("Error fetching inventory: ", error);
  //     }
  //   };

  //   fetchInventory();
  // }, []);

  // VERSION NI RICH WITH DATE EXPIRY CONDITION
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const inventoryRef = collection(db, "inventory");
        const snapshot = await getDocs(inventoryRef);
        const now = new Date();

        const validItems = [];

        for (const doc of snapshot.docs) {
          const data = doc.data();

          // Fetch stockLog subcollection for this inventory item
          const stockLogRef = collection(db, "inventory", doc.id, "stockLog");
          const stockSnapshot = await getDocs(stockLogRef);

          let hasValidStock = false;

          for (const logDoc of stockSnapshot.docs) {
            const logData = logDoc.data();
            const expiryRaw = logData.expiryDate;

            if (!expiryRaw) {
              // No expiry date means valid stock
              hasValidStock = true;
              break;
            }

            // Convert Firestore timestamp or string to JS Date
            const expiryDate = typeof expiryRaw === "string"
              ? new Date(expiryRaw)
              : expiryRaw?.toDate?.() || new Date(expiryRaw);

            if (isNaN(expiryDate.getTime())) continue;

            if (expiryDate >= now) {
              hasValidStock = true;
              break;
            }
          }

          if (hasValidStock) {
            validItems.push({
              id: doc.id,
              ...data,
            });
          }
        }

        // Sort alphabetically by itemName
        validItems.sort((a, b) => (a.itemName || "").localeCompare(b.itemName || ""));

        setInventoryItems(validItems);
      } catch (err) {
        console.error("Error fetching inventory with expiry filter:", err);
      }
    };

    fetchInventory();
  }, []);

    const handleIcon =(item)=>{
      if(item.category === 'Equipment') return 'cube-outline';
      if(item.category === 'Chemical') return 'flask-outline';
      if(item.category === 'Materials') return 'layers-outline';
      if(item.category === 'Reagent') return 'test-tube';
      if(item.category === 'Glasswares') return 'beaker-outline';
    }


    const handleColor =(item)=>{
      if(item.category === 'Equipment') return '#026A5D';
      if(item.category === 'Chemical') return '#631990';
      if(item.category === 'Materials') return '#c4610e';
      if(item.category === 'Reagent') return '#235284';
      if(item.category === 'Glasswares') return '#d09902';
    }

    const handleBG =(item)=>{
      if(item.category === 'Equipment') return '#C8E6C9';
      if(item.category === 'Chemical') return '#E4D6EC';
      if(item.category === 'Materials') return '#f7d4b7'; 
      if(item.category === 'Reagent') return '#b8e2f4';
      if(item.category === 'Glasswares') return '#fff2ce';
    }


  const filteredData = inventoryItems.filter(item =>
    item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterType === 'All' || item.type === filterType) &&
    (filterCategory === 'All' || item.category === filterCategory) 
  );   

  // const filteredItems = inventoryItems.filter((item) => {
  //   const isCategoryMatch = selectedCategory === 'All' || selectedCategory === '' || item.category === selectedCategory;
  //   const isSearchMatch = !searchQuery || item.itemName?.toLowerCase().includes(searchQuery.toLowerCase());
  
  //   return isCategoryMatch && isSearchMatch;
  // }); 
  
  const filteredItems = inventoryItems.filter((item) => {
    const isCategoryMatch =
      selectedCategory === 'All' || selectedCategory === '' || item.category === selectedCategory;

    const lowerQuery = searchQuery.toLowerCase();

    const isSearchMatch =
      !searchQuery ||
      item.itemName?.toLowerCase().includes(lowerQuery) ||
      item.itemDetails?.toLowerCase().includes(lowerQuery) ||
      item.brand?.toLowerCase().includes(lowerQuery) ||
      item.itemCode?.toLowerCase().includes(lowerQuery);

    return isCategoryMatch && isSearchMatch;
  });
  
  const openDetailsModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

const formatCondition = (cond) => {
  if (cond && typeof cond === 'object') {
    return `Good: ${cond.Good ?? 0}\nDefect: ${cond.Defect ?? 0}\nDamage: ${cond.Damage ?? 0}`;
  }

  return cond || 'N/A';
};


  return (
    <View style={styles.container}>
      <View style={styles.inventoryStocksHeader} onLayout={handleHeaderLayout}>
                     <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                     <Icon name="keyboard-backspace" size={28} color="black" />
                                   </TouchableOpacity>

                    <View>
                      <Text style={{textAlign: 'center', fontWeight: 800, fontSize: 18, color: '#395a7f'}}>Inventory</Text>
                      <Text style={{ fontWeight: 300, fontSize: 13}}>View Inventory Items</Text>
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
                    placeholder="Search by item name, category"
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

                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icon name='beaker-outline' size={16} color={'gray'}/>
                <Text style={{fontWeight: 300, fontSize: 11}} >- Glasswares</Text>
                </View>
      
              </View>
            </View>

      <View style={[styles.container2]}>

      <ScrollView style={{paddingHorizontal: 8, paddingVertical: 10}}>
        {filteredItems.map((item) => (
          <View key={item.id} style={styles.card}>
             <View style={{flexDirection: 'row'}}>
            <View style={{width: '85%', gap: 5}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems:'center'}}>
            <View style={[styles.imageContainer, {backgroundColor: handleBG(item)}]}>
              <Icon name={handleIcon(item)} size={20} color={handleColor(item)}/>
              <Text style={{fontSize: 13, fontWeight: 'bold', color: handleColor(item)}}>{item.category}</Text>
            </View>
              <Text style={{color: 'gray', fontSize: 13, fontWeight: 300}}>{item.itemId || item.id}</Text>
              </View>

           

              <View style={{padding: 8, borderColor: handleBG(item), borderRadius: 5, borderWidth: 2}}>
              <Text style={{fontSize: 16, fontWeight: 'bold'}}>{item.itemName}</Text>
            
            <View style={{marginTop:5}}>
              <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Inventory Balance:</Text>
              <Text style={styles.cardValueNum}>{item.quantity}</Text>
              {/* Simple quantity display for other cases */}
              {/* <Text style={styles.cardValueNum}>
                {typeof item.quantity === "number" ? item.quantity : JSON.stringify(item.quantity)}
              </Text> */}
             </View>

             <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Stock Room:</Text>
              <Text style={styles.cardValueNum}>{item.labRoom}</Text>
              
              </View>   
              {isOpen === item.id  && (
              
             <View style={{flex: 1, marginTop: 10}}>
                 <Text style={{color: handleColor(item), fontWeight: 'bold'}}>Other Details</Text>
                <View style={{justifyContent: 'space-between'}}>
                <View style={styles.row}>
                <Text style={styles.cardLabel}>Item Description</Text>
                <Text style={styles.cardValueNum}>{item.itemDetails}</Text>
                </View>

                <View style={styles.row}>
                <Text style={styles.cardLabel}>Department</Text>
                <Text style={styles.cardValueNum}>{item.department}</Text>
                </View>

                <View style={styles.row}>
                <Text style={styles.cardLabel}>Entry Date:</Text>
                <Text style={styles.cardValueNum}>{item.entryCurrentDate}</Text>
                </View>

                <View style={styles.row}>
                <Text style={styles.cardLabel}>Expire Date: </Text>
                <Text style={styles.cardValueNum}>{item.expireDate || 'N/A'}</Text>
                </View>

                <View style={styles.row}>
                <Text style={styles.cardLabel}>Type: </Text>
                <Text style={styles.cardValueNum}>{item.type}</Text>
                </View>

                {["Chemical", "Reagent"].includes(item.category) && item.unit && (
                  <View style={styles.row}>
                    <Text style={styles.cardLabel}>Unit: </Text>
                    <Text style={styles.cardValueNum}>{item.unit}</Text>
                  </View>
                )}

                <View style={styles.row}>
                {/* <Text style={styles.cardLabel}>Inventory Balance:  </Text>
                <Text style={styles.cardValueNum}>{item.quantity}</Text> */}

                {/* <Text style={styles.cardValueNum}>
                  {item.quantity}
                  {["Glasswares", "Chemical", "Reagent"].includes(item.category) && " pcs"}
                  {["Chemical", "Reagent"].includes(item.category) && item.unit && ` / ${item.unit} ML`}
                  {item.category === "Glasswares" && item.volume && ` / ${item.volume} ML`}
                </Text> */}
                </View>

                <View style={[styles.row, {marginTop:5}]}>
                <Text style={styles.cardLabel}>Condition: </Text>
                <Text style={styles.cardValueNum}>{formatCondition(item.condition)}</Text>
                </View>
                </View>
              </View>
          )}  
            </View>

              </View>

              
            
            </View>

          <View style={{flex:1, backgroundColor: 'white', borderRadius: 5, paddingTop:'12%'}}>
            <TouchableOpacity style={styles.viewDetailsButton} onPress={() => handleOpen(item.id)}>
                <Icon name={isOpen === item.id ?'chevron-up-circle-outline':'chevron-down-circle-outline'} size={25} color='#395a7f'/>
            </TouchableOpacity>
            </View>
           </View>

            

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
                {/* <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Inventory Stock:</Text> {selectedItem.quantity}
                  {["Chemical", "Reagent"].includes(selectedItem.category) && selectedItem.unit ? ` ${selectedItem.unit}` : ""}
                  {selectedItem.category === "Glasswares" && selectedItem.volume ? ` / ${selectedItem.volume} ML` : ""}
                </Text> */}

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
