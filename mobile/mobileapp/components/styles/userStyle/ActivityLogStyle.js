import { StatusBar, StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 7,
    backgroundColor: '#e9ecee',
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

    wholeSection:{
      flex: 1, 
      backgroundColor: '#fff',
      borderRadius: 5,
      padding: 10,
    },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1890ff',
  },

  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderColor: '#ddd',
    borderWidth: 1,
  },

  row: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    elevation: 1,
  },

  cell: {
    fontSize: 16,
    color: '#333',
  },
  
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#999',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 14,
    elevation: 5,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1890ff',
    marginBottom: 10,
  },

  modalText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
  },

  modalLabel: {
    fontWeight: 'bold',
    color: '#000',
  },

  modalButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#1890ff',
    borderRadius: 10,
    alignItems: 'center',
  },

  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },

  table: {
    marginTop: 10,
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#134b5f',
    paddingVertical: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  
  tableCell: {
    flex: 1,
    paddingHorizontal: 4,
    color: '#333',
    fontSize: 14,
  },
  
  headerCell: {
    color: '#fff',
    fontWeight: 'bold',
  },

  tableRowEven: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  
  tableRowOdd: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },

  // Pagination Styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },

  paginationButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#134b5f',
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },

  paginationButtonDisabled: {
    backgroundColor: '#ccc',
  },

  paginationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  paginationButtonTextDisabled: {
    color: '#999',
  },

  paginationText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  
});
