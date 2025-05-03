import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  row: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },

  rowText: {
    fontSize: 16,
    marginBottom: 5,
  },
  
  viewButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },

  viewButtonText: {
    color: "white",
    textAlign: "center",
  },

  modalContent: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  subHeading: {
    fontSize: 18,
    marginVertical: 10,
  },

  itemRow: {
    marginBottom: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalBox: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 5,
    marginBottom: 5,
  },
  
  tableHeaderCell: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 14,
  },
  
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
  
  tableCell: {
    flex: 1,
    fontSize: 14,
  },  

});

export default styles;
