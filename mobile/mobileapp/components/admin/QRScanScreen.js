import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StatusBar, ImageBackground } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/adminStyle/QRScanStyle";
import Header from "../Header";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import qrbg from '../images/qrbg.jpg'

const QRScanScreen = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

    const [headerHeight, setHeaderHeight] = useState(0);
      const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };
    useFocusEffect(
      useCallback(() => {
        StatusBar.setBarStyle('light-content');
        StatusBar.setBackgroundColor('transparent'); // Android only
        StatusBar.setTranslucent(true)
      }, [])
    );
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const snapshot = await getDocs(collection(db, "inventory"));
        const fetchedItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setItems(fetchedItems);
        
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleTrackItems = () => {
    navigation.navigate("CameraShowItems");
  };

  const handleUpdateStock = () => {
    navigation.navigate("ItemListScreen");
  };

  const handleDeployReturnStock = () => {
    navigation.navigate("RequestorListScreen");
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" style={{ flex: 1, justifyContent: "center" }} />;
  }

  return (
    <ImageBackground
    source={require('../images/qrbg.jpg')}
    resizeMode="cover"
    style={styles.container}
    >
    <View style={styles.container2}>
      <View style={styles.qrHeader} onLayout={handleHeaderLayout}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                              <Icon name="keyboard-backspace" size={28} color="white" />
                                            </TouchableOpacity>
        <View>
          {/* <Text style={{textAlign: 'center', fontWeight: 800, fontSize: 18, color: '#fff'}}>QR Scanner</Text> */}
          <Text style={{ fontWeight: 300, fontSize: 13, textAlign: 'center', color: '#fff'}}>Track, Update, and Monitor Items</Text>
        </View>

          <TouchableOpacity style={{padding: 2}}>
            <Icon name="information-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

      <View style={{marginTop: headerHeight, flex: 1,justifyContent: 'flex-end', alignItems: 'center', gap: 10, paddingHorizontal: 20}}>
      <Icon name="qrcode-scan" size={150} color={'#FFC107'}/>
      <Text style={{fontSize: 40, fontWeight: 'bold', color: '#fff'}}>QR Scanner</Text>
      <Text style={{textAlign: 'center', fontWeight: 300, color: '#fff', fontSize: 13}}>Welcome! Use the QR Scanner to track, update, and manage your inventory efficiently.</Text>
      </View>
<View style={{gap: 10, padding: 25, justifyContent: 'center', alignItems: 'center', width: '100%', flex: 1}}>
      
      <Text style={{fontWeight: 300, color: '#fff', fontSize :13}}>Please select method below:</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleTrackItems}
      >
        <Text style={styles.buttonText}>Track Items</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleUpdateStock}
      >
        <Text style={styles.buttonText}>Update Stock Item</Text>
      </TouchableOpacity>

      {/* <TouchableOpacity
        style={styles.button}
        onPress={handleDeployReturnStock}
      >
        <Text style={styles.buttonText}>Deploy / Return Items</Text>
      </TouchableOpacity> */}

          {user?.role !== "admin" && user?.role !== "admin1" && user?.role !== "admin2" && (
            <TouchableOpacity style={styles.button} onPress={handleDeployReturnStock}>
              <Text style={styles.buttonText}>Deploy / Return Items</Text>
            </TouchableOpacity>
          )}
      </View>

      {/* List of Inventory Items */}
      {/* <View style={styles.itemsContainer}>
        {items.map(item => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={styles.details}>Qty: {item.quantity} | Condition: {item.condition || "N/A"}</Text>
          </View>
        ))}
      </View> */}
    </View>
    </ImageBackground>
  );
};

export default QRScanScreen;
