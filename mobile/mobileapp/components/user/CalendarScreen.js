import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Calendar } from 'react-native-calendars';
import styles from '../styles/userStyle/CalendarStyle';
import Header from '../Header';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState('');

  const today = new Date().toISOString().split('T')[0]; 
 const [headerHeight, setHeaderHeight] = useState(0);
   const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };
  return (
    <View style={styles.container}>
      <Header onLayout={handleHeaderLayout} />
      <View style={[styles.wholeSection,{ marginTop: headerHeight }]}>
      <View style={styles.content}>
      <Text style={styles.title}>Select a Date</Text>

      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: '#00796B' }
        }}
        minDate={today}
        theme={{
          todayTextColor: '#FF5722',
          arrowColor: '#00796B',
        }}
      />

      {selectedDate ? <Text style={styles.selectedDate}>Selected: {selectedDate}</Text> : null}
      </View>
      </View>
    </View>
  );
}
