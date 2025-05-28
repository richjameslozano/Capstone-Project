import { StatusBar, StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9ecee',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
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

  categoryHeader:{
  fontSize: 15,
  fontWeight: 500,
  marginRight: 5,
  color: '#395A7F'
  },

  categoryContainer:{
  backgroundColor: '#fff',
  flexDirection: 'row',
  paddingHorizontal: 15,
  borderRadius: 5,
  paddingVertical: 10,
  borderColor: '#acacac',
  borderWidth: 1,
  alignSelf: 'flex-start',
  marginTop: 10, 
  alignItems:'center'
  },
  number:{paddingRight: 5,paddingLeft: 2, backgroundColor: '#395a7f', borderRadius: 3, textAlign: 'center', alignSelf: 'center', fontWeight: 'bold', fontSize: 13, color: '#fff'},

  note:{
    backgroundColor: '#6e9fc1', 
    width: '100%', 
    height: 'auto',
    paddingHorizontal: 20,
    paddingVertical: 3,

  },

    pendingFlat:{
    paddingHorizontal: 5,
    gap: 5,
    paddingBottom: 20
  },

  pendingCard:{
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderRadius: 10,
    borderColor: '#dcdcdc',
    borderWidth: 1,
    paddingVertical: 5,
  },

  usage:{fontSize: 15, padding: 10, backgroundColor: 'orange', borderRadius: 5, color: 'white', width: '100%'},
  usageContainer:{justifyContent: 'flex-start', alignItems: 'center', padding: 10, paddingLeft: 15},

  detailsContainer:{
    flex: 1,
    padding: 10,
    paddingLeft: 5,
    paddingVertical: 5,
  },

  filterbtn: {
  paddingHorizontal: 15,
  paddingVertical: 8,
  borderRadius: 20,
  backgroundColor: '#e0e0e0',
  marginRight: 10,
},

selectedFilterBtn: {
  backgroundColor: '#395a7f', // or any highlight color
},

filtername: {
  color: '#303030',
},

selectedFilterText: {
  color: '#fff',
}
,
      
  name: {
    fontSize: 16,
    color: '#000',
  },

  request: {
    fontSize: 16,
    color: '#555',
  },

  reason: {
    fontSize: 13,
    color: '#777',
  },

  tagContainer: {
    marginTop: 10,
    marginBottom: 10
  },

  tag: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },

  pending: {
    backgroundColor: '#ffeb3b',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
    color: '#333',
  },

  approved: {
    backgroundColor: '#4caf50',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
    color: 'white',
  },

  rejected: {
    backgroundColor: '#f44336',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
    color: 'white',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },

  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },

  approveButton: {
    backgroundColor: '#4caf50',
  },

  rejectButton: {
    backgroundColor: '#f44336',
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  quantity: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  
  date: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  
  time: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
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
    borderRadius: 10,
    width: '90%',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    marginBottom: 10,
  },

  modalButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cardButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    marginTop: 10,
  },  

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },

  tableHeader: {
    backgroundColor: '#f0f0f0',
  },
  
  tableCell: {
    paddingHorizontal: 8,
    minWidth: 90,
    fontSize: 12,
    color: '#333',
  },
});
