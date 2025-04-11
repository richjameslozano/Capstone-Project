import React from 'react';
import { View, Text, Image, TouchableOpacity, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../components/styles/HeaderStyle';
import  {useNavigation } from '@react-navigation/native';

export default function Header() {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>

      <Image source={require('../assets/icon.png')} style={styles.logo} />

      <View style={styles.headerText}>
        <Text style={styles.title}>NU MOA</Text>
        <Text style={styles.subtitle}>Laboratory System</Text>
      </View>

      <TouchableOpacity 
        style={styles.profileButton} 
        onPress={() => navigation.navigate('ProfileScreen')}
      >
        <Icon name="account-circle" size={35} color="white" />
      </TouchableOpacity>
    </View>
  );
}
