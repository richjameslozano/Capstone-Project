import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/Ionicons';

const { width: screenWidth } = Dimensions.get('window');

const IOSCompatibleDropdown = ({
  data = [],
  value,
  onValueChange,
  placeholder = 'Select an option',
  style,
  containerStyle,
  disabled = false,
  error = false,
  label,
  required = false,
  usePicker = false, // Use native picker for iOS, custom modal for Android
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(
    data.find(item => item.value === value) || null
  );

  const handleSelect = (item) => {
    setSelectedItem(item);
    onValueChange(item.value);
    setIsVisible(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsVisible(!isVisible);
    }
  };

  // iOS Native Picker Implementation
  if (Platform.OS === 'ios' && usePicker) {
    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}
        <View style={[
          styles.pickerContainer,
          style,
          error && styles.errorBorder,
          disabled && styles.disabled
        ]}>
          <Picker
            selectedValue={value}
            onValueChange={onValueChange}
            enabled={!disabled}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label={placeholder} value="" />
            {data.map((item) => (
              <Picker.Item
                key={item.value}
                label={item.label}
                value={item.value}
              />
            ))}
          </Picker>
          <Icon
            name="chevron-down"
            size={20}
            color="#666"
            style={styles.pickerIcon}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // Custom Modal Dropdown (Better for Android and iOS consistency)
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          style,
          error && styles.errorBorder,
          disabled && styles.disabled
        ]}
        onPress={toggleDropdown}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dropdownButtonText,
          !selectedItem && styles.placeholderText
        ]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Icon
          name={isVisible ? "chevron-up" : "chevron-down"}
          size={20}
          color="#666"
          style={styles.dropdownIcon}
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={data}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedItem?.value === item.value && styles.selectedOption
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedItem?.value === item.value && styles.selectedOptionText
                  ]}>
                    {item.label}
                  </Text>
                  {selectedItem?.value === item.value && (
                    <Icon name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    backgroundColor: '#FFF',
    position: 'relative',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  pickerItem: {
    fontSize: 16,
  },
  pickerIcon: {
    position: 'absolute',
    right: 12,
    top: 15,
    pointerEvents: 'none',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    minHeight: 50,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: screenWidth * 0.9,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedOption: {
    backgroundColor: '#F0F8FF',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  errorBorder: {
    borderColor: '#FF3B30',
  },
  disabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
});

export default IOSCompatibleDropdown;
