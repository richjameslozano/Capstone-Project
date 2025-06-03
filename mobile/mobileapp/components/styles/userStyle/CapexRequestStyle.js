import { StatusBar, StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9ecee',
    padding: 7,
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
          zIndex: 999,
    },
  

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
    marginTop: 20,
  },

  total: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#444',
    textAlign: 'right',
  },

  item: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },

  modalContent: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'stretch',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Optional: dim background
  },  

  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#222',
  },

  buttonPrimary: {
    backgroundColor: '#6E9FC1',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'center',
  },

  buttonDanger: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'center',
  },

  buttonSecondary: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  tableContainer: {
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  tableHeader: {
    backgroundColor: '#395A7E',
  },

  // tableRow: {
  //   flexDirection: 'row',
  //   borderBottomWidth: 1,
  //   borderColor: '#ddd',
  //   paddingVertical: 10,
  // },
  tableRow: {
  flexDirection: 'row',       
  backgroundColor: '#fff',
  paddingVertical: 10,
  borderRadius: 6,          
  shadowOpacity: 0.05,
  shadowRadius: 2,
},
  
  tableCell: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
  },
  
  headerCell: {
    fontWeight: 'bold',
    color: '#fff',
  },
  
  actionsCell: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  
  smallButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  
  editButton: {
    backgroundColor: '#17a2b8',
  },
  
  deleteButton: {
    backgroundColor: '#dc3545',
  },

    modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#0f3c4c',
  },
  input: {
    borderWidth: 1,
    borderColor: '#1a6985',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1e7898',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#7cc0d8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

   title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f3c4c',
    marginBottom: 16,
    textAlign: 'center',
  },
  tableContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#7cc0d8',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableHeader: {
    backgroundColor: '#0f3c4c',
  },
  tableCell: {
    fontSize: 14,
    color: '#000',
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  actionsCell: {
    justifyContent: 'center',
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: '#1e7898',
  },
  deleteButton: {
    backgroundColor: '#d9534f',
  },
  buttonPrimary: {
    backgroundColor: '#1e7898',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'right',
    color: '#0f3c4c',
  },
  
});
