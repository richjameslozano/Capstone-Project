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
    paddingVertical: 10, 
    paddingHorizontal: 20,
    borderRadius: 5, 
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  helpButton: {
    alignSelf: 'center',
    marginTop: 10,
  },

  helpText: {
    fontSize: 12,
    color: '#007BFF',
    fontWeight: 'bold',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },

  modalHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },

  modalImage: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },

  modalItemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  modalDetails: {
    marginBottom: 15,
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
    color: '#333',
  },

  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
  },

  okButton: {
    backgroundColor: '#007BFF',
  },

  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  
  okButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginRight: 5,
  },
  
  okButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginLeft: 5,
  },
  
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },  
});
