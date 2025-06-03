// VERSION 1
// import React, { useState, useEffect, useCallback } from "react";
// import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar } from "react-native";
// import { useFocusEffect, useNavigation } from "@react-navigation/native";
// import { collection, getDocs, onSnapshot } from "firebase/firestore";
// import { db } from "../../backend/firebase/FirebaseConfig";
// import styles from "../styles/adminStyle/ItemListStyle";
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import Header from "../Header";

// const ItemListScreen = () => {
//   const navigation = useNavigation();
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);

//       const [headerHeight, setHeaderHeight] = useState(0);
//     const handleHeaderLayout = (event) => {
//       const { height } = event.nativeEvent.layout;
//       setHeaderHeight(height);
//     };

//     useFocusEffect(
//       useCallback(() => {
//         StatusBar.setBarStyle('dark-content');
//         StatusBar.setBackgroundColor('transparent'); // Android only
//         StatusBar.setTranslucent(true)
//       }, [])
//     );

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "inventory"),
//       (snapshot) => {
//         const fetchedItems = snapshot.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data()
//         }));
//         setItems(fetchedItems);
//         setLoading(false);
//       },
//       (error) => {
//         console.error("Error fetching items:", error);
//         setLoading(false);
//       }
//     );

//     // Cleanup listener on unmount
//     return () => unsubscribe();
//   }, []);

//   const handleItemPress = (item) => {
//     navigation.navigate("CameraUpdateItems", { selectedItem: item });
//   };

// const renderItem = ({ item }) => (
//     <TouchableOpacity style={styles.itemCard} onPress={() => handleItemPress(item)}>
//       <Text style={styles.itemName}>{item.itemName}</Text>
//       <Text style={styles.details}>Inventory Balance: {item.quantity} </Text>
//     </TouchableOpacity>
//   );

//   if (loading) {
//     return <ActivityIndicator size="large" color="#007bff" style={{ flex: 1, justifyContent: "center" }} />;
//   }



//   return (
//     <View style={styles.container}>
//       <View style={styles.inventoryStocksHeader} onLayout={handleHeaderLayout}>
//           <TouchableOpacity onPress={() => navigation.navigate('QRScanScreen')} style={styles.backButton}>
//                           <Icon name="keyboard-backspace" size={28} color="black" />
//                         </TouchableOpacity>

//         <View>
//           <Text style={{textAlign: 'center', fontWeight: 800, fontSize: 18, color: '#395a7f'}}>Update Item Stocks</Text>
//           <Text style={{ fontWeight: 300, fontSize: 13, textAlign: 'center'}}>Scan Item to Update</Text>
//         </View>

//           <TouchableOpacity style={{padding: 2}}>
//             <Icon name="information-outline" size={24} color="#000" />
//           </TouchableOpacity>
//         </View>

//     <View style={{flex: 1, backgroundColor: 'white', marginTop: headerHeight+5,padding: 10, }}>
//       <Text style={styles.title}>All Inventory Items</Text>
//       <Text style={{color: 'gray', marginBottom: 10}}>Select an Item</Text>
//       <FlatList
//         data={items}
//         keyExtractor={(item) => item.id}
//         renderItem={renderItem}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 20, padding: 10}}
//       />
//     </View>
//     </View>
//   );
// };

// export default ItemListScreen;


// VERSION 2
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import styles from "../styles/adminStyle/ItemListStyle";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const categories = ["All", "Chemical", "Reagent", "Consumable", "Equipment", "Other"]; // example categories

const ItemListScreen = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("transparent"); // Android only
      StatusBar.setTranslucent(true);
    }, [])
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "inventory"),
      (snapshot) => {
        const fetchedItems = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(fetchedItems);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching items:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleItemPress = (item) => {
    navigation.navigate("CameraUpdateItems", { selectedItem: item });
  };

  // Filter items based on searchText and selectedCategory
  const filteredItems = items.filter((item) => {
    const matchesName =
      item.itemName?.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesName && matchesCategory;
  });

  // Sort filtered items alphabetically by itemName
  const filteredItemsSorted = filteredItems.sort((a, b) =>
    a.itemName.localeCompare(b.itemName)
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => handleItemPress(item)}
    >
      <Text style={styles.itemName}>{item.itemName}</Text>
      <Text style={styles.details}>Inventory Balance: {item.quantity} </Text>
      <Text style={styles.details}>Category: {item.category}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#007bff"
        style={{ flex: 1, justifyContent: "center" }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inventoryStocksHeader} onLayout={handleHeaderLayout}>
        <TouchableOpacity
          onPress={() => navigation.navigate("QRScanScreen")}
          style={styles.backButton}
        >
          <Icon name="keyboard-backspace" size={28} color="black" />
        </TouchableOpacity>

        <View>
          <Text
            style={{
              textAlign: "center",
              fontWeight: "800",
              fontSize: 18,
              color: "#395a7f",
            }}
          >
            Update Item Stocks
          </Text>
          <Text
            style={{ fontWeight: "300", fontSize: 13, textAlign: "center" }}
          >
            Scan Item to Update
          </Text>
        </View>

        <TouchableOpacity style={{ padding: 2 }}>
          <Icon name="information-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View
        style={{
          flex: 1,
          backgroundColor: "white",
          marginTop: headerHeight + 5,
          padding: 10,
        }}
      >
        <Text style={styles.title}>All Inventory Items</Text>
        <Text style={{ color: "gray", marginBottom: 10 }}>Select an Item</Text>

        {/* Search bar */}
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            padding: 8,
            marginBottom: 10,
          }}
          placeholder="Search by item name"
          value={searchText}
          onChangeText={setSearchText}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {/* Category dropdown picker */}
        <View
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            marginBottom: 15,
            overflow: 'hidden',
          }}
        >
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
          >
            {categories.map((cat) => (
              <Picker.Item label={cat} value={cat} key={cat} />
            ))}
          </Picker>
        </View>

        <FlatList
          data={filteredItemsSorted}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20, padding: 10 }}
          ListEmptyComponent={
            <Text
              style={{ textAlign: "center", marginTop: 20, color: "gray" }}
            >
              No items found.
            </Text>
          }
        />
      </View>
    </View>
  );
};

export default ItemListScreen;
