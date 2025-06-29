import React from "react";
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";

const ShelfDetailsModal = ({ visible, shelfId, rows, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Shelf: {shelfId}</Text>

          <FlatList
            data={rows}
            keyExtractor={(item, index) => item.rowId || index.toString()}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <Text style={styles.text}>• Row {item.rowId}</Text>
                <Text style={styles.subText}>Room: {item.room || "N/A"}</Text>
              </View>
            )}
          />

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ShelfDetailsModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000099",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  item: {
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
  subText: {
    fontSize: 14,
    color: "#666",
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: {
    color: "white",
    fontWeight: "bold",
  },
});
