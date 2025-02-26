import React from 'react';
import { View, Text, Image, TouchableOpacity, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../components/styles/HeaderStyle';
import  {useNavigation } from '@react-navigation/native';

export default function Header() {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      {/* Status Bar */}
      <StatusBar backgroundColor="#1A4572" barStyle="light-content" />

      {/* Logo */}
      <Image source={require('../assets/icon.png')} style={styles.logo} />

      {/* Title & Subtitle */}
      <View style={styles.headerText}>
        <Text style={styles.title}>National University</Text>
        <Text style={styles.subtitle}>Laboratory System</Text>
      </View>

      {/* Profile Button */}
      <TouchableOpacity 
        style={styles.profileButton} 
        onPress={() => navigation.navigate('ProfileScreen')}
      >
        <Icon name="account-circle" size={35} color="white" />
      </TouchableOpacity>
    </View>
  );
}
