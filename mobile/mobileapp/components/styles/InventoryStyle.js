import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },

  /* Header Section */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00796B',
    padding: 15,
    borderRadius: 8,
    justifyContent: 'space-between',
  },

  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },

  headerText: {
    alignItems: 'center',
    flex: 1,
  },

  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  subtitle: {
    color: 'white',
    fontSize: 14,
  },

  profileButton: {
    padding: 5,
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },

  /* Search Bar */
  searchBar: {
    backgroundColor: '#EDEDED',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },

  /* Picker Styles */
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginBottom: 10,
  },

  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  picker: {
    flex: 1,
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginHorizontal: 5,
  },

  /* Modal Styles */
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  modalImageContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  modalItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },

  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },

  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },

  dateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 10,
  },

  label: {
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginTop: 10,
  },

  textArea: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CCC',
    padding: 10,
    borderRadius: 5,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 10,
  },

  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },

  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  /* Bottom Section */
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },

  requestButton: {
    backgroundColor: '#00796B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  requestButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginRight: 10,
  },

  notificationBadge: {
    backgroundColor: 'red',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignItems: 'center',
  },

  notificationText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },

  helpButton: {
    padding: 10,
  },

  helpButtonText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },

  /* List Style */
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'column',
    marginBottom: 10,
    elevation: 3,
  },
  
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  imageContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  
  itemDetails: {
    flex: 1,
  },
  
  itemName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  department: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 5,
  },
  
  description: {
    fontSize: 12,
    color: '#666',
  },
  
  tags: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },

  /* Add Item */
  requestAddContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  
  addItemButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginLeft: 10,
  },
  
  addItemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  itemType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  
  tag: {
    backgroundColor: '#ddd',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  
  tagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },

  addButton: {
    marginLeft: 10,
  },
  
  disabledButton: {
    opacity: 0.5,
  },
  
});
