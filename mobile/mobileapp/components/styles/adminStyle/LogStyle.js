import { StatusBar, StyleSheet } from 'react-native';

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
    marginTop: 120,
  },


      pendingHeader:{
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
             zIndex: 999
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },

  modalHeader: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  modalBody: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },

  infoLabel: {
    fontWeight: 'bold',
  },

  infoValue: {
    flexShrink: 1,
  },

  subTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },

  itemRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 6,
  },

  itemHeader: {
    backgroundColor: '#ddd',
  },

  itemHeaderText: {
    fontWeight: 'bold',
  },

  itemCell: {
    flex: 1,
    paddingHorizontal: 3,
  },

  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    padding: 15,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },

  modalText: {
    fontSize: 14,
    marginBottom: 10,
  },

});
