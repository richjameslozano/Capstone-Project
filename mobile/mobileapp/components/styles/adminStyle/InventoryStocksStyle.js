import { StatusBar, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9ecee',
    padding: 7,
    paddingTop: 4,
    gap: 5
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
        borderColor: '#e9ecee',
        zIndex: 999,
  },

  container2:{
    flex:1,
    backgroundColor: 'white',
    borderRadius: 5,
    paddingVertical: 5,
  },

    searchFilter:{
    width: '100%',
    alignSelf: 'center', 
    padding: 5,
    paddingBottom: 5,
    backgroundColor: 'white',
    paddingTop: 10,
    borderRadius: 5,
  },

    searchContainer: {
    width: '70%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },


    searchInput: {
    flex: 1,
    height: 40,
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
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 3,
    gap: 5,
    padding: 5,
    paddingRight: 0,
  },

    imageContainer: {
      flexDirection: 'row',
      gap: 5,
    backgroundColor: '#e9ecee',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    paddingVertical:1,
    paddingRight: 5,
    alignSelf: 'flex-start'
  },

  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cardLabel: {
    fontSize: 13,
    fontWeight: 400,
    color: 'gray',
  },

  cardValue: {
    fontSize: 14,
    color: '#555',
  },

  cardValueNum: {
    fontSize: 13,
    color: '#000',
  },

  viewDetailsButton: {
    alignSelf: 'center',
    borderColor: '#b9bcbe',
    alignSelf: 'center',
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

  row:{
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default styles;
