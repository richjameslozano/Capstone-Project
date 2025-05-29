import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ItemDetailsModal = ({ visible, onClose, itemData }) => {
  if (!itemData) return null;

  const {
    itemName,
    itemId,
    category,
    department,
    quantity,
    labRoom,
    borrowedCount,
    deployedCount = 0,
    condition,
  } = itemData;

  // Format condition object (if object) into a readable string
  const formatCondition = (cond) => {
    if (!cond) return "N/A";
    if (typeof cond === "object") {
      return Object.entries(cond)
        .map(([key, val]) => `${key}: ${val}`)
        .join(", ");
    }
    return cond.toString();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Item Details</Text>

          <Text style={styles.label}>
            Item Name: <Text style={styles.value}>{itemName}</Text>
          </Text>

          <Text style={styles.label}>
            Item ID: <Text style={styles.value}>{itemId}</Text>
          </Text>

          <Text style={styles.label}>
            Category: <Text style={styles.value}>{category}</Text>
          </Text>
          
          <Text style={styles.label}>
            Department: <Text style={styles.value}>{department}</Text>
          </Text>

          <Text style={styles.label}>
            Quantity Available: <Text style={styles.value}>{quantity}</Text>
          </Text>

          <Text style={styles.label}>
            Location: <Text style={styles.value}>{labRoom}</Text>
          </Text>

          <Text style={styles.label}>
            Borrowed Today: <Text style={styles.value}>{borrowedCount} times</Text>
          </Text>

          <Text style={styles.label}>
            Deployed Today: <Text style={styles.value}>{deployedCount} times</Text>
          </Text>

          {deployedCount > 0 && itemData.deployedInfo?.length > 0 && (
            <>
              <Text style={styles.label}>Deployed To:</Text>
              {itemData.deployedInfo.map((info, index) => (
                <Text key={index} style={styles.value}>
                  • {info.requestor} — Room: {info.room}, Qty: {info.quantity}
                </Text>
              ))}
            </>
          )}

          <Text style={styles.label}>
            Condition: <Text style={styles.value}>{formatCondition(condition)}</Text>
          </Text>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ItemDetailsModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    backgroundColor: 'white',
    width: '85%',
    padding: 20,
    borderRadius: 12,
    elevation: 10,
  },

  title: {
    fontSize: 20,
    marginBottom: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  label: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: '600',
  },

  value: {
    fontWeight: '400',
  },

  closeButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  closeText: {
    color: 'white',
    fontSize: 16,
  },
});
