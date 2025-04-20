import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../components/styles/HeaderStyle';
import { useNavigation } from '@react-navigation/native';

export default function Header() {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => navigation.openDrawer()}
      >
        <Icon name="menu" size={30} color="white" />
      </TouchableOpacity>

      <Image source={require('../assets/icon.png')} style={styles.logo} />

      <View style={styles.headerText}>
        <Text style={styles.title}>NU MOA</Text>
        <Text style={styles.subtitle}>Laboratory System</Text>
      </View>
    </View>
  );
}
