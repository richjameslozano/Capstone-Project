import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },

  card: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },

  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },

  request: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },

  reason: {
    fontSize: 14,
    color: '#777',
  },

  tagContainer: {
    marginTop: 10,
    marginBottom: 10
  },

  tag: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },

  pending: {
    backgroundColor: '#ffeb3b',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
    color: '#333',
  },

  approved: {
    backgroundColor: '#4caf50',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
    color: 'white',
  },

  rejected: {
    backgroundColor: '#f44336',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
    color: 'white',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },

  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },

  approveButton: {
    backgroundColor: '#4caf50',
  },

  rejectButton: {
    backgroundColor: '#f44336',
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  quantity: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  
  date: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  
  time: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    marginBottom: 10,
  },

  modalButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cardButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    marginTop: 10,
  },  

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },

  tableHeader: {
    backgroundColor: '#f0f0f0',
  },
  
  tableCell: {
    paddingHorizontal: 8,
    minWidth: 90,
    fontSize: 12,
    color: '#333',
  },
});
