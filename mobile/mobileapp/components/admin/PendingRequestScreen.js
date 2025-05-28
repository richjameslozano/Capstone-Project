import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, Modal, TextInput, Alert, ScrollView, StatusBar,Image } from 'react-native';
import { Card } from 'react-native-paper';
import { collection, getDocs, doc, updateDoc, getDoc, collectionGroup, onSnapshot } from 'firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/adminStyle/PendingRequestStyle';
import Header from '../Header';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
export default function PendingRequestScreen() {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [isNote, setIsNote] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('All'); // or 'All' if you want a default


  const navigation = useNavigation()

  const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };

  const handleIsNote = () =>{
    if(!isNote){
      setIsNote(true)
    }
    else if(isNote){
      setIsNote(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('transparent'); // Android only
      StatusBar.setTranslucent(true)
    }, [])
  );

  const usageTypes = ['All','Laboratory Experiment', 'Research', 'Community Extension', 'Others'];

useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, 'userrequests'), (querySnapshot) => {
    const processRequests = async () => {
      try {
        const fetched = [];

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const userId = data.accountId;

          const dateRequested = data.timestamp?.toDate?.() || new Date();

          // Fetch user profile image
          let profileImage = null;
          try {
            const userDoc = await getDoc(doc(db, 'accounts', userId));
            if (userDoc.exists()) {
              profileImage = userDoc.data().profileImage || null;
              // console.log('Profile image URL:', profileImage);

            }
          } catch (e) {
            console.error(`Error fetching profile for ${userId}`, e);
          }

          // Enrich inventory
          const enrichedItems = await Promise.all(
            (data.filteredMergedData || []).map(async (item) => {
              const inventoryId = item.selectedItemId || item.selectedItem?.value;
              let itemId = 'N/A';

              if (inventoryId) {
                try {
                  const invDoc = await getDoc(doc(db, 'inventory', inventoryId));
                  if (invDoc.exists()) {
                    itemId = invDoc.data().itemId || 'N/A';
                  }
                } catch (err) {
                  console.error(`Error fetching inventory item ${inventoryId}:`, err);
                }
              }

              return {
                ...item,
                itemIdFromInventory: itemId,
              };
            })
          );

          fetched.push({
            id: docSnap.id,
            ...data,
            userId,
            profileImage,
            dateRequested,
            filteredMergedData: enrichedItems,
          });
        }

        setPendingRequests(fetched);
      } catch (err) {
        console.error('Error processing requests:', err);
      }
    };

    processRequests();
  });

  return () => unsubscribe();
}, []);



const getInitials = (usage) => {
  if (!usage) return '';

  const officialUsages = ['Laboratory Experiment', 'Research', 'Community Extension'];

  // If it's not one of the official usage types, treat it as "Others"
  const normalized = officialUsages.includes(usage) ? usage : 'Others';

  const words = normalized.trim().split(' ');
  return words.length === 1
    ? (words[0][0].toUpperCase() + words[0][1])?.toUpperCase()
    : (words[0][0] + words[1][0]).toUpperCase();
};


  const usageBG = (item) => {
    if(item.usageType === 'Laboratory Experiment') return 'orange'
    if(item.usageType === 'Research') return '#70c247'
    if(item.usageType === 'Community Extension') return '#6e9fc1'
    else{return '#b66ee8'}
  }
  

const capitalizeName = (name) => {
  return name.replace(/\b\w/g, char => char.toUpperCase());
};

  const renderItem = ({ item, index }) => (
    

      <TouchableOpacity key={index} onPress={() => { setSelectedRequest(item), setViewModalVisible(true)}} style={styles.pendingCard}>
              <View style={styles.usageContainer}>
              <Text style={[styles.usage, {backgroundColor: usageBG(item)}]}>{getInitials(item.usageType)}</Text>
              </View>

              <View style={styles.detailsContainer}>
                <View style={{justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', width: '100%'}}>
                <Text style={styles.name}>{capitalizeName(item.userName) || 'N/A'}</Text>
                <Text style={{color: 'gray', fontSize: 12, fontWeight: 300}}>{item.dateRequested.toLocaleDateString()}</Text>
                </View>


               {/* {item.profileImage ? (
                <Image
                  source={{ uri: item.profileImage }}
                  style={{ width: 50, height: 50, borderRadius: 25 }}
                />
              ) : (
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#ccc' }} />
              )} */}

              

                <Text style={styles.reason}>{item.course}</Text>
                <Text style={[styles.reason,{marginTop: 5}]}>{item.usageType}</Text>
                <Text style={[styles.reason]}>Room {item.room}</Text>
              </View>
      </TouchableOpacity>
  );

const groupByDueDateCategory = (requests) => {
  const now = new Date();

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startOfNextWeek = new Date(endOfWeek);
  startOfNextWeek.setDate(endOfWeek.getDate() + 1);
  startOfNextWeek.setHours(0, 0, 0, 0);

  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
  endOfNextWeek.setHours(23, 59, 59, 999);

  const thisWeek = [];
  const nextWeek = [];
  const later = [];

  requests.forEach((item) => {
    const dueDate = new Date(item.dateRequired);

    if (dueDate >= startOfWeek && dueDate <= endOfWeek) {
      thisWeek.push(item);
    } else if (dueDate >= startOfNextWeek && dueDate <= endOfNextWeek) {
      nextWeek.push(item);
    } else if (dueDate > endOfNextWeek) {
      later.push(item);
    }
  });

  return {
    'Required This Week': thisWeek,
    'Next Week': nextWeek,
    'Further Ahead': later,
  };
};

const getFilteredRequests = () => {
  if (selectedFilter === 'All') return pendingRequests;

  return pendingRequests.filter((item) => {
    const usage = item.usageType?.trim().toLowerCase();
    if (!usage) return false;

    const normalized = usage.replace(/\s+/g, ' ').toLowerCase();
    const isKnownType = ['laboratory experiment', 'research', 'community extension'];

    if (isKnownType.includes(normalized)) {
      return normalized === selectedFilter.toLowerCase();
    } else {
      return selectedFilter === 'Others';
    }
  });
};

const filteredRequests = getFilteredRequests();
const categorizedRequests = groupByDueDateCategory(filteredRequests);






  return (
    <View style={styles.container}>
             <View style={styles.pendingHeader} onLayout={handleHeaderLayout}>
                    <TouchableOpacity onPress={() => navigation.navigate('Admin2Dashboard')} style={styles.backButton}>
                                                         <Icon name="keyboard-backspace" size={28} color="black" />
                                                       </TouchableOpacity>
                    <View>
                      <Text style={{textAlign: 'center', fontWeight: 800, fontSize: 18, color: '#395a7f'}}>Pending Requests</Text>
                      <Text style={{ fontWeight: 300, fontSize: 13, textAlign: 'center'}}>Subject for Approval</Text>
                    </View>
      
                     <TouchableOpacity style={{padding: 2}}>
                       <Icon name="information-outline" size={24} color="#000" />
                     </TouchableOpacity>
                   </View>
              
              <TouchableOpacity 
              style={[styles.note, { top: headerHeight }]} 
              onPress={handleIsNote}
            >
              <Text
                style={{ fontWeight: '300', fontSize: 11, color: '#fff' }}
                numberOfLines={isNote ? undefined : 1} // ✅ Collapse to 1 line when hidden
              >
                <Text style={{ fontWeight: 'bold' }}>Note: </Text>
                The items listed on this page are subject to approval by the Laboratory Custodians/Technicians. 
                This page is intended for viewing requests submitted by faculty staff only. 
                Please note that all approvals must be processed through the web application.
              </Text>
            </TouchableOpacity>

        <View style={{height: 'auto', marginTop: headerHeight, }}>
          <ScrollView
            style={{borderColor: '#dcdcdc', borderBottomWidth: 1, height: 'auto', alignSelf: 'flex-start',  height: '8%'
            }}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              backgroundColor: '#fff',
              padding: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {usageTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterbtn,
                  selectedFilter === type && styles.selectedFilterBtn
                ]}
                onPress={() => setSelectedFilter(type)}
              >
                <Text
                  style={[
                    styles.filtername,
                    selectedFilter === type && styles.selectedFilterText
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
</View>
          

      <ScrollView style={{ backgroundColor: '#e9ecee', paddingHorizontal: 7, paddingTop: 5, flex: 1}}
      contentContainerStyle={styles.pendingFlat}>
        {Object.entries(categorizedRequests)
          .filter(([_, items]) => items.length > 0)
          .map(([category, items]) => (
            <View key={category} style={{ gap: 5, justifyContent: 'flex-start', flex: 1 }}>
              <View style={styles.categoryContainer}>
              <Text style={styles.categoryHeader}>{category} </Text>
              <Text style={styles.number}> {items.length}</Text>
              </View>
              <View style={{ gap: 3 }}>
                {items
  .filter(item => {
    if (selectedFilter === 'All' || !selectedFilter) return true;

    const normalized = item.usageType?.toLowerCase();
    return selectedFilter === 'Others'
      ? !['laboratory experiment', 'research', 'community extension'].includes(normalized)
      : normalized === selectedFilter.toLowerCase();
  })
  .map((item, index) => renderItem({ item, index }))
}
              </View>
            </View>
          ))}
      </ScrollView>
      

      <Modal
        visible={viewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressOut={() => setViewModalVisible(false)}
          style={styles.modalContainer}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Request Details</Text>
            {selectedRequest && (
              <>
                <Text style={styles.modalText}>Name: {selectedRequest.userName || 'N/A'}</Text>
                <Text style={styles.modalText}>Program: {selectedRequest.program}</Text>
                <Text style={styles.modalText}>Usage Type: {selectedRequest.usageType}</Text>
                <Text style={styles.modalText}>Room: {selectedRequest.room}</Text>
                <Text style={styles.modalText}>Reason: {selectedRequest.reason}</Text>
                <Text style={styles.modalText}>Time Needed: {selectedRequest.timeFrom} - {selectedRequest.timeTo}</Text>
                <Text style={styles.modalText}>Date Required: {selectedRequest.dateRequired || 'N/A'}</Text>
                <Text style={styles.modalText}>Requested On: {selectedRequest.timestamp?.toDate().toLocaleString() || 'N/A'}</Text>
                <Text style={styles.modalText}>Status: {selectedRequest.status || 'Pending'}</Text>
                <Text style={styles.modalText}>Reason: {selectedRequest.reason}</Text>

                <Text style={[styles.modalTitle, { marginTop: 10 }]}>Requested Items:</Text>

                <ScrollView horizontal>
                  <View>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                      <Text style={styles.tableCell}>Item ID</Text>
                      <Text style={styles.tableCell}>Item</Text>
                      <Text style={styles.tableCell}>Qty</Text> 
                      <Text style={styles.tableCell}>Category</Text>
                    </View>
                    {selectedRequest.filteredMergedData?.map((item, idx) => (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{item.itemIdFromInventory}</Text>
                        <Text style={styles.tableCell}>{item.itemName}</Text>
                        <Text style={styles.tableCell}>{item.quantity}</Text>
                        <Text style={styles.tableCell}>{item.category}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                <TouchableOpacity
                  onPress={() => setViewModalVisible(false)}
                  style={[styles.button, { marginTop: 15 }]}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
