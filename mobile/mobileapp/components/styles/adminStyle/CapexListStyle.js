import { StatusBar, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  
    inventoryStocksHeader:{
      position: 'absolute',
          backgroundColor: '#fff',
          flex: 1,
          paddingTop: StatusBar.currentHeight+15,
          left: 0,
          right:0,
          flexDirection: 'row',
          paddingBottom: 10,
          paddingHorizontal: 15,
          alignItems: 'center',
          justifyContent:'space-between',
          borderBottomWidth: 1,
          borderColor: '#e9ecee',
          zIndex: 999
    },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 50,
  },

  row: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: '#fff'
  },

  rowText: {
    fontSize: 16,
    marginBottom: 5,
  },
  
  viewButton: {
    backgroundColor: "#134b5f",
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
