import { StatusBar, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9ecee',
    padding: 7,
    paddingTop: 5,
  },

  inventoryStocksHeader:{
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
        borderColor: '#e9ecee'
  },

  pageTitle:{
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },

  pickerContainer:{
    width:200,
    
  },
  
  pickerText:{
  fontSize:16
  },
  

  searchBar: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },

  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 3,
  },

  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  cardLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },

  cardValue: {
    fontSize: 14,
    color: '#555',
  },

  cardValueNum: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00796B',
  },

  viewDetailsButton: {
    marginTop: 10,
    backgroundColor: '#00796B',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },

  viewDetailsText: {
    color: 'white',
    fontWeight: 'bold',
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
    borderRadius: 8,
    width: '80%',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  modalLabel: {
    fontWeight: 'bold',
  },

  closeButton: {
    marginTop: 15,
    backgroundColor: '#D32F2F',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },

  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default styles;
