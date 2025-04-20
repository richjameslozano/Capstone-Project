import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 10,
    paddingBottom: 20, 
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00796B',
    paddingVertical: 15,
    paddingHorizontal: 20,
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
    fontSize: 18,
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
    flex: 1,
    marginTop: 10,
  },

  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
    textAlign: 'center',
    color: '#00796B',
  },

  tableHeader: {
    backgroundColor: '#00796B',
    paddingVertical: 12,
  },

  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',  
  },
  
  tableCell: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    paddingVertical: 12,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },

  viewButtonText: {
    fontSize: 14,
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
    width: '85%',
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#00796B',
  },

  modalText: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
  },

  closeButton: {
    marginTop: 20,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00796B',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },

  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 10,
    alignItems: 'center',
  },
  
  modalText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'left',
    width: '100%',
    color: '#333',
  },
  
  tableHeader: {
    backgroundColor: '#00796B',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  
  tableHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  
  tableCell: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  
  closeButton: {
    marginTop: 15,
    backgroundColor: '#00796B',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },  

});
