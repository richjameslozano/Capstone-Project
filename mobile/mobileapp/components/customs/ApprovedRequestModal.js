import React from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const ApprovedRequestModal = ({ isVisible, onClose, request, formatDate }) => {
  if (!request) return null;

  const {
    userName,
    approvedBy,
    reason,
    dateRequired,
    timeFrom,
    timeTo,
    courseDescription,
    courseCode,
    program,
    room,
    requestedItems,
    rejectedBy,
    status,
    itemId,
  } = request;

  const renderTableHeader = () => (
    <View style={[styles.tableRow, styles.tableHeader]}>
      <Text style={styles.tableCellHeader}>Item Name</Text>
      <Text style={styles.tableCellHeader}>ID</Text>
      <Text style={styles.tableCellHeader}>Qty</Text>
      <Text style={styles.tableCellHeader}>Dept</Text>
      <Text style={styles.tableCellHeader}>Category</Text>
      <Text style={styles.tableCellHeader}>Condition</Text>
      <Text style={styles.tableCellHeader}>Lab Room</Text>
    </View>
  );

  const renderTableRow = ({ item, index }) => (
    <View
      style={[
        styles.tableRow,
        index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
      ]}
    >
      <Text style={styles.tableCell}>{item.itemName}</Text>
      <Text style={styles.tableCell}>{item.itemIdFromInventory}</Text>
      <Text style={styles.tableCell}>{item.quantity}</Text>
      <Text style={styles.tableCell}>{item.department}</Text>
      <Text style={styles.tableCell}>{item.category}</Text>
      <Text style={styles.tableCell}>{item.condition}</Text>
      <Text style={styles.tableCell}>{item.labRoom}</Text>
    </View>
  );

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>

          <FlatList
            style={{ flex: 1 }}
            data={request.requestList || []}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderTableRow}
            ListHeaderComponent={
              <View>
                <Text style={styles.title}>Approved Request Details</Text>

                <View style={styles.section}>
                  <Text style={styles.label}>Requestor:</Text>
                  <Text style={styles.value}>{userName}</Text>
                </View>

                {status === 'Approved' && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Approved By:</Text>
                    <Text style={styles.value}>{approvedBy}</Text>
                  </View>
                )}

                {status === 'Rejected' && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Rejected By:</Text>
                    <Text style={styles.value}>{rejectedBy}</Text>
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={styles.label}>Reason:</Text>
                  <Text style={styles.value}>{reason}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Date Required:</Text>
                  <Text style={styles.value}>{dateRequired}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Time:</Text>
                  <Text style={styles.value}>
                    {timeFrom} - {timeTo}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Program:</Text>
                  <Text style={styles.value}>{program}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Room:</Text>
                  <Text style={styles.value}>{room}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Course:</Text>
                  <Text style={styles.value}>
                    {courseCode} - {courseDescription}
                  </Text>
                </View>

                <Text style={styles.subTitle}>Requested Items</Text>
                {renderTableHeader()}
              </View>
            }
            ListFooterComponent={
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

export default ApprovedRequestModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  
  modalContainer: {
    width: "90%",
    height: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },

  subTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 10,
  },

  section: {
    marginBottom: 6,
  },

  label: {
    fontWeight: "bold",
  },

  value: {
    marginLeft: 4,
  },

  itemCard: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },

  itemName: {
    fontWeight: "bold",
    fontSize: 16,
  },

  itemDetail: {
    fontSize: 13,
    color: "#444",
  },

  closeButton: {
    marginTop: 16,
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 6,
  },
  
  tableHeader: {
    backgroundColor: "#eee",
    borderBottomWidth: 2,
    borderBottomColor: "#888",
  },
  
  tableRowEven: {
    backgroundColor: "#fafafa",
  },
  
  tableRowOdd: {
    backgroundColor: "#ffffff",
  },
  
  tableCell: {
    flex: 1,
    paddingHorizontal: 4,
    fontSize: 12,
  },
  
  tableCellHeader: {
    flex: 1,
    fontWeight: "bold",
    paddingHorizontal: 4,
    fontSize: 13,
  },
  
});
