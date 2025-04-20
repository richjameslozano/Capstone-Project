import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
    marginTop: 80,
  },

  listContainer: {
    paddingBottom: 80,
  },

  card: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },

  requestId: {
    fontWeight: 'bold',
    marginBottom: 6,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },

  label: {
    fontWeight: 'bold',
  },

  subTitle: {
    marginTop: 10,
    fontWeight: 'bold',
  },

  itemCard: {
    marginVertical: 5,
    padding: 8,
    backgroundColor: '#e6f7ff',
    borderRadius: 6,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 10,
  },
  
  cancelButton: {
    flex: 1,
    backgroundColor: '#ff4d4f',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  
  closeButton: {
    flex: 1,
    backgroundColor: '#1890ff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  
  cancelText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1890ff',
    paddingVertical: 8,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  
  tableHeaderCell: {
    flex: 1,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 12,
  },
  
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingVertical: 6,
  },
  
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
  },
  
});
