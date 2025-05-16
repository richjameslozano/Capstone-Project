import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import styles from './styles/PolicyStyle';
import Header from './Header';

export default function PolicyScreen({ navigation }) {
  const policies = [
    { id: '1', title: 'Lab Safety', description: 'Follow all safety guidelines while using lab equipment.' },
    { id: '2', title: 'Equipment Usage', description: 'Return equipment after use in its original condition.' },
    { id: '3', title: 'Access Policy', description: 'Only authorized users can access restricted areas.' },
    { id: '4', title: 'Cleanliness', description: 'Maintain cleanliness and dispose of waste properly.' },
    { id: '5', title: 'Emergency Procedures', description: 'Know the emergency exits and first aid locations.' },
    {
      id: '6',
      title: 'Laboratory Request and Return Policy',
      description:
        'LABORATORY REQUESTS MUST BE SUBMITTED (7) SEVEN DAYS BEFORE THE SCHEDULED DATE NEEDED. FAILURE TO ADHERE TO THIS PROTOCOL WILL RESULT IN NON-FULFILLMENT OF THE REQUEST.\n\n' +
        'RETURN THE BORROWED ITEMS TO THE LABORATORY STOCK ROOM. MICROSCOPES, GLASSWARES, AND EQUIPMENT MUST BE CLEANED AND IN INTACT CONDITION.\n\n' +
        'DIRTY, MISSING, BROKEN, OR EXTREMELY DAMAGED LABORATORY ITEMS SHOULD BE REPORTED TO THE LABORATORY CUSTODIAN FOR PROPER DOCUMENTATION.'
    },
  ];

  const [headerHeight, setHeaderHeight] = useState(0);

  const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };

  return (
    <View style={styles.container}>
      <Header onLayout={handleHeaderLayout} />
      <View style={[styles.wholeSection, { marginTop: headerHeight }]}>
        <Text style={styles.title}>POLICY</Text>
        <FlatList
          data={policies}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}
