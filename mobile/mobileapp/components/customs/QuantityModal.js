import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const QuantityModal = ({ visible, onClose, onSubmit, itemName, category, dateOfExpiry }) => {
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);
  
  // New state for enhanced chemical/reagent input
  const [quantityMode, setQuantityMode] = useState('direct'); // 'direct' or 'container'
  const [baseUnit, setBaseUnit] = useState('ml');
  const [containerCount, setContainerCount] = useState('');
  const [containerCapacity, setContainerCapacity] = useState('');
  const [unitDropdownVisible, setUnitDropdownVisible] = useState(false);

  const isChemicalOrReagent = category === "Chemical" || category === "Reagent";
  const today = new Date().toISOString().split('T')[0];
  
  // Available units for chemicals/reagents
  const availableUnits = ['ml', 'g', 'mg', 'L', 'kg'];

  // const handleConfirm = () => {
  //   const num = parseInt(quantity);
  //   if (isNaN(num) || num <= 0) {
  //     alert("Please enter a valid positive number");
  //     return;
  //   }
  //   onSubmit(num);
  //   setQuantity('');
  // };

  const handleConfirm = () => {
    // Parse quantity following web component logic
    const parseNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    let qtyBase = 0;

    if (isChemicalOrReagent) {
      if (quantityMode === "direct") {
        qtyBase = parseNum(quantity);
      } else {
        // Container mode
        const count = parseNum(containerCount);
        const capacity = parseNum(containerCapacity);
        qtyBase = count * capacity;
      }
    } else {
      // Non-chemical/reagent - simple quantity
      qtyBase = parseNum(quantity);
    }
    
    if (!Number.isFinite(qtyBase) || qtyBase < 0) {
      alert("Please enter a valid positive number");
      return;
    }

    // For chemicals and reagents, expiry date is optional but recommended
    if (isChemicalOrReagent && !expiryDate) {
      // Show warning but allow proceeding
      alert("Warning: No expiry date provided for chemical/reagent. This is recommended for proper tracking.");
    }

    // Pass additional data for container mode
    const submitData = {
      qtyBase,
      expiryDate: expiryDate || null,
      quantityMode: isChemicalOrReagent ? quantityMode : 'direct',
      baseUnit: isChemicalOrReagent ? baseUnit : 'pcs',
      containerCount: quantityMode === 'container' ? parseNum(containerCount) : null,
      containerCapacity: quantityMode === 'container' ? parseNum(containerCapacity) : null,
    };

    onSubmit(submitData);
    
    // Reset form
    setQuantity('');
    setExpiryDate('');
    setContainerCount('');
    setContainerCapacity('');
    setQuantityMode('direct');
    setBaseUnit('ml');
  };

// Show calendar for chemicals and reagents (following web component logic)
const shouldShowCalendar = isChemicalOrReagent;



  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Update Inventory Balance</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Item: {itemName}</Text>
            <Text style={styles.label}>Category: {category}</Text>

            {/* Quantity Mode Selection - Only for Chemical/Reagent */}
            {isChemicalOrReagent && (
              <>
                <Text style={styles.sectionTitle}>Quantity Input *</Text>
                <View style={styles.radioContainer}>
                  <TouchableOpacity 
                    style={[styles.radioOption, quantityMode === 'direct' && styles.radioSelected]}
                    onPress={() => setQuantityMode('direct')}
                  >
                    <View style={[styles.radioCircle, quantityMode === 'direct' && styles.radioCircleSelected]}>
                      {quantityMode === 'direct' && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioText}>Direct (base units)</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.radioOption, quantityMode === 'container' && styles.radioSelected]}
                    onPress={() => setQuantityMode('container')}
                  >
                    <View style={[styles.radioCircle, quantityMode === 'container' && styles.radioCircleSelected]}>
                      {quantityMode === 'container' && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioText}>By Container</Text>
                  </TouchableOpacity>
                </View>

                {/* Base Unit Selection */}
                <Text style={styles.sectionTitle}>Base Unit *</Text>
                <TouchableOpacity 
                  style={styles.dropdown}
                  onPress={() => setUnitDropdownVisible(!unitDropdownVisible)}
                >
                  <Text style={styles.dropdownText}>{baseUnit}</Text>
                  <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                
                {unitDropdownVisible && (
                  <View style={styles.dropdownList}>
                    {availableUnits.map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setBaseUnit(unit);
                          setUnitDropdownVisible(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{unit}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Direct Mode Input */}
            {(!isChemicalOrReagent || quantityMode === 'direct') && (
              <>
                <Text style={styles.sectionTitle}>
                  Quantity (in base unit) *
                </Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder={isChemicalOrReagent ? "e.g., 1000" : "e.g., 25"}
                    value={quantity}
                    onChangeText={(text) => setQuantity(text.replace(/[^\d.]/g, ""))}
                  />
                  <Text style={styles.unitLabel}>{isChemicalOrReagent ? baseUnit : 'pcs'}</Text>
                </View>
              </>
            )}

            {/* Container Mode Input */}
            {isChemicalOrReagent && quantityMode === 'container' && (
              <>
                <Text style={styles.sectionTitle}>Number of Containers *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g., 10"
                  value={containerCount}
                  onChangeText={(text) => setContainerCount(text.replace(/\D/g, ""))}
                />

                <Text style={styles.sectionTitle}>Capacity per Container ({baseUnit}) *</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="e.g., 100"
                    value={containerCapacity}
                    onChangeText={(text) => setContainerCapacity(text.replace(/[^\d.]/g, ""))}
                  />
                  <Text style={styles.unitLabel}>{baseUnit}</Text>
                </View>

                {/* Quantity Preview */}
                {containerCount && containerCapacity && (
                  <View style={styles.previewContainer}>
                    <Text style={styles.previewText}>
                      <Text style={styles.previewBold}>Quantity Preview: </Text>
                      {containerCount} × {containerCapacity} {baseUnit} = <Text style={styles.previewBold}>{Number(containerCount) * Number(containerCapacity)}</Text> {baseUnit}
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Expiry Date - Only for Chemical/Reagent */}
            {isChemicalOrReagent && (
              <>
                <Text style={styles.sectionTitle}>Expiry Date *</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setCalendarVisible(true)}
                >
                  <Text style={{ color: expiryDate ? 'black' : '#aaa' }}>
                    {expiryDate || "Select date"}
                  </Text>
                  <Icon name="calendar" size={20} color="#666" style={styles.calendarIcon} />
                </TouchableOpacity>
              </>
            )}

            <Modal
              animationType="fade"
              transparent={true}
              visible={calendarVisible}
              onRequestClose={() => setCalendarVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Calendar
                    onDayPress={(day) => {
                      setExpiryDate(day.dateString);
                      setCalendarVisible(false);
                    }}
                    markedDates={{
                      [expiryDate]: { selected: true, selectedColor: '#00796B' }
                    }}
                    minDate={today}
                  />
                  <TouchableOpacity onPress={() => setCalendarVisible(false)} style={styles.closeButton}>
                    <Text style={{ color: 'white' }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.buttonCancel} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonConfirm} onPress={handleConfirm}>
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default QuantityModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 10,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  closeButton: {
    padding: 5,
  },

  scrollContainer: {
    maxHeight: 400,
    padding: 20,
  },

  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },

  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },

  unitLabel: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
    color: '#666',
    fontSize: 14,
  },

  radioContainer: {
    marginBottom: 15,
  },

  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },

  radioSelected: {
    backgroundColor: '#e3f2fd',
  },

  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioCircleSelected: {
    borderColor: '#2196F3',
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
  },

  radioText: {
    fontSize: 16,
    color: '#333',
  },

  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
  },

  dropdownText: {
    fontSize: 16,
    color: '#333',
  },

  dropdownList: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
  },

  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },

  previewContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginBottom: 15,
  },

  previewText: {
    fontSize: 13,
    color: '#666',
  },

  previewBold: {
    fontWeight: 'bold',
    color: '#333',
  },

  calendarIcon: {
    position: 'absolute',
    right: 12,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  buttonCancel: {
    marginRight: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#bbb',
    borderRadius: 6,
  },

  buttonConfirm: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2196F3',
    borderRadius: 6,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 10,
  },
});
