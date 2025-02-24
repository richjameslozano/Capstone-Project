import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './styles/PolicyStyle';

export default function PolicyScreen({ navigation }) {
  const policies = [
    { id: '1', title: 'Lab Safety', description: 'Follow all safety guidelines while using lab equipment.' },
    { id: '2', title: 'Equipment Usage', description: 'Return equipment after use in its original condition.' },
    { id: '3', title: 'Access Policy', description: 'Only authorized users can access restricted areas.' },
    { id: '4', title: 'Cleanliness', description: 'Maintain cleanliness and dispose of waste properly.' },
    { id: '5', title: 'Emergency Procedures', description: 'Know the emergency exits and first aid locations.' },
  ];

  return (
    <View style={styles.container}>
      {/* Back Button */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Policies</Text>
      </View> */}

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
  );
}
