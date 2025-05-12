import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#efefef',
    padding: 8,
    paddingTop: 0,
    paddingBottom: 45,
  },

  listContent: {
    paddingBottom: 40,
  },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  touchable:{
    height: '100%',
    flexDirection: 'row',
    width: '85%',
    backgroundColor: 'white',
    borderWidth: 1,
    borderEndWidth:0,
    borderBottomWidth: 3,
    borderColor: '#e9ecee',
    borderStartStartRadius: 5,
    borderBottomStartRadius: 5,
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
    fontSize: 16,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },



  requestButton: {
    backgroundColor: '#395a7f',
    paddingVertical: 15,
    alignItems: 'center',
    paddingHorizontal: 10,
    width: '30%'
  },

  requestButtonModal: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    marginTop: 50,
  },

  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '85%',
    alignItems: 'flex-start',
    height: '60%',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },

  modalText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
    textAlign: 'left',
    width: '100%',
  },

  modalDetail: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
    textAlign: 'left',
    width: '100%',
  },

  bold: {
    fontWeight: 'bold',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },

  cancelButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '45%',
  },

  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '45%',
  },

  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  inputQuantity: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: '10%',
    width: '30%',
  },

  xIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'red',
    borderRadius: 50,
    height: 30,
    width: 30,
    textAlign: 'center'
  },

  card: {
    flexDirection: 'column',
    width: '85%',
    padding: 10
  },

  trash:{
    height: '100%',
    justifyContent: 'center',
    backgroundColor: '#18496e',
    width: '15%',
    alignItems: 'center',
    borderEndEndRadius: 5,
    borderTopEndRadius: 5
  },

  table: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 10,
    overflow: 'hidden',
  },

  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#ddd',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  
  tableCellHeader: {
    fontWeight: 'bold',
    paddingHorizontal: 8,
    fontSize: 14,
  },
  
  tableCell: {
    paddingHorizontal: 8,
    fontSize: 14,
  },

  bottomNav:{
    position: 'absolute',
    bottom: 0,
    flex:1,
    right: 0,
    left: 0,
    height: 'auto',
    backgroundColor: '#fff',
    justifyContent: 'center',
    flexDirection: 'column',
    borderTopWidth: 1,
    borderColor: '#e9ecee'
  },  
  
});
