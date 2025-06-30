import React from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const ShelfDetailsModal = ({ visible, shelfId, rows, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Shelf {`“${shelfId}”`}</Text>

          <FlatList
            data={rows}
            keyExtractor={(item, idx) => item.rowId || idx.toString()}
            renderItem={({ item }) => (
              <View style={styles.rowBlock}>
                <Text style={styles.rowTitle}>• Row {item.rowId}</Text>

                {item.items.length === 0 ? (
                  <Text style={styles.noItemTxt}>No items in this row.</Text>
                ) : (
                  item.items.map((it, i) => (
                    <Text key={i} style={styles.itemTxt}>
                      – {it.itemName} (Qty: {it.quantity})
                    </Text>
                  ))
                )}
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
    marginBottom: 12,
  },

  rowBlock: {
    marginBottom: 14,
  },

  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  itemTxt: {
    fontSize: 14,
    color: "#444",
    marginLeft: 14,
  },

  noItemTxt: {
    fontSize: 14,
    color: "#888",
    marginLeft: 14,
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
