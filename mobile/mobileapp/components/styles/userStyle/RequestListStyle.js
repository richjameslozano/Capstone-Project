import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  container1: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 85,
  },
  
  /* Section Title */
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },

  /* Card Styles */
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'column',
    marginBottom: 10,
    elevation: 3,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  index: {
    fontSize: 16,
    marginRight: 10,
    fontWeight: 'bold',
  },

  image: {
    width: 50,
    height: 50,
    backgroundColor: '#ccc',
    marginRight: 10,
  },

  details: {
    flex: 1,
  },

  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  department: {
    fontSize: 12,
    color: '#333',
  },

  highlight: {
    color: 'orange',
    fontWeight: 'bold',
  },

  button: {
    marginTop: 5,
    backgroundColor: '#007BFF',
  },

  /* New Remove Button Styles */
  removeButton: {
    marginTop: 5,
    backgroundColor: 'red',
    paddingVertical: 8,
    borderRadius: 8,
  },

  /* Modal Styles */
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  modalHeader: {
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },

  modalImage: {
    width: 100,
    height: 100,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },

  modalItemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  modalTag: {
    fontSize: 14,
    color: 'gray',
  },

  modalDetails: {
    paddingVertical: 10,
  },

  modalLabel: {
    fontSize: 14,
    marginBottom: 5,
  },

  bold: {
    fontWeight: 'bold',
  },

  modalReason: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'gray',
  },

  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },

  okButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  
  okButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* Confirmation Modal */
  confirmModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  confirmModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  confirmMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },

  confirmButtons: {
    flexDirection: 'row',
    width: '100%',
  },

  /* Bottom Container */
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  /* Request Now Button */
  requestListButton: {
    backgroundColor: '#007BFF', 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },

  requestListText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* Help Button */
  helpButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },

  helpText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    marginTop: 20,
  },

  buttonStyle: {
    flex: 1, 
    marginHorizontal: 5,
  },
  
  requestButton: {
    marginTop: 5,
    backgroundColor: '#007BFF',
    paddingVertical: 8,
    borderRadius: 8,
  },  

  selectedDateText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: 'bold',
  },

  datePickerContainer: {
    flexDirection: 'row', // Puts items next to each other
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },    
  
  dateButton: {
    marginTop: 5,
    backgroundColor: '#007BFF',
  },

  removeIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
  },    

  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    width: "80%",
    padding: 20,
    alignItems: "center",
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  
  timeScroll: {
    height: 150,
    width: 60,
  },
  
  timeText: {
    fontSize: 22,
    textAlign: "center",
    paddingVertical: 10,
  },
  
  colon: {
    fontSize: 22,
    paddingHorizontal: 5,
  },
  
  modalImage: {
  width: 100,
  height: 100,
  resizeMode: 'contain',
  alignSelf: 'center',
  marginBottom: 10,
  },

  reasonInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top', 
  },    

  dateButton: {
    backgroundColor: '#00796B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },

  dateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  timeButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },  
  
  timeButton: {
    backgroundColor: '#FFA726',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: 140, // Fixed button width
    marginHorizontal: 5,
  },
  
  timeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },  

  requestButton: {
    backgroundColor: '#0288D1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
  },

  requestButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  okButton: {
    backgroundColor: '#388E3C',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },

  okButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 20,
    color: '#888',
  },

  dateButton: {
    backgroundColor: '#00796B',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 10,
    alignItems: 'center',
  },

  dateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  timeButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },

  timeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },

  timeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  reasonInput: {
    marginHorizontal: 20,
    marginTop: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'white',
    minHeight: 60,
    textAlignVertical: 'top',
  },

  requestButton: {
    backgroundColor: '#00796B',
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },

  requestButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  timeScroll: {
    maxHeight: 150,
    marginHorizontal: 5,
  },

  timeText: {
    fontSize: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    textAlign: 'center',
  },

  colon: {
    fontSize: 18,
    alignSelf: 'center',
    paddingHorizontal: 5,
  },

  okButton: {
    backgroundColor: '#00796B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },

  okButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff',
  },

  removeIcon: {
    padding: 5,
  },

  programRoomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  
  pickerWrapper: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    justifyContent: 'center',
    height: 45,
  },
  
  roomInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 45,
  },  
});
