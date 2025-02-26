import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 10,
    paddingBottom: 20, // Ensure space for the help button at the bottom
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00796B',
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 5,
  },

  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },

  subtitle: {
    fontSize: 12,
    color: 'white',
  },

  profileButton: {
    padding: 5,
  },

  content: {
    marginTop:60,
    flex: 1,
  },

  pageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },

  tableHeader: {
    backgroundColor: '#00796B',
    paddingVertical: 10,
  },

  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 10,
    width: 'auto'
  },
  
  tableCell: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    width: 'auto',
    maxWidth: 100,
  },    

  tagCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00796B',
    textAlign: 'center',
  },

  tableRowEven: {
    backgroundColor: 'white',
  },

  tableRowOdd: {
    backgroundColor: '#f2f2f2',
  },

  statusApproved: {
    color: 'green',
    fontWeight: 'bold',
  },

  statusRejected: {
    color: 'red',
    fontWeight: 'bold',
  },

  viewButton: {
    backgroundColor: '#00796B',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },

  viewButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
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
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    position: 'absolute',
    bottom: 20,
  },

  helpText: {
    textDecorationLine: 'underline',
    color: 'blue', 
    fontSize: 16, 
  },  

  viewLinkText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00796B',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  
});
