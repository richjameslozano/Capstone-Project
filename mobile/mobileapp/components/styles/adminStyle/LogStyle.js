import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 10,
    paddingBottom: 20,
  },

  filterContainer: {
    flexDirection: 'row',  // Keeps the buttons side by side
    justifyContent: 'space-between', // Ensures space between buttons
    marginVertical: 5,
    marginBottom: 10, 
    marginTop: 80,
  },

  table: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 10,
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },

  tableHeader: {
    flex: 1,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#00796B',
    color: 'white',
    paddingVertical: 8,
    borderRightWidth: 1,
    borderColor: '#005a4f',
  },

  tableCell: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },

  tableRowEven: {
    backgroundColor: '#ffffff',
  },

  tableRowOdd: {
    backgroundColor: '#f9f9f9',
  },

  button: {
    backgroundColor: '#00796B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    marginVertical: 5,
  },

  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  modalText: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
  },

  closeButton: {
    marginTop: 15,
    backgroundColor: '#00796B',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },

  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  helpButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    position: 'absolute',
    bottom: 20,
  },

  helpText: {
    textDecorationLine: 'underline',
    color: 'blue',
    fontSize: 16,
  },

});
