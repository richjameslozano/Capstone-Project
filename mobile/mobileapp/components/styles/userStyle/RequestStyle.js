import { StatusBar, StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9ecee',
    padding: 7,
    gap: 5,
  },

  containerInner:{
    flex:1,
    backgroundColor:'#e9ecee',
    borderRadius: 5,
  },

    OrdersHeader:{
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
  
  page:{
    flex: 1,
    borderRadius: 5,
    gap: 5
  },

  searchFilter:{
    width: '100%',
    alignSelf: 'center', 
    padding: 5,
    backgroundColor: 'white',
    paddingVertical: 10,
    borderRadius: 5,
    gap: 5,
  },

      searchContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  
  topNav:{
    width: '60%',
    height: 'auto',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 10,
    alignSelf: 'center',
  },

   border: { 
    position: 'absolute', 
    bottom: 0, 
    width: '25%', 
    height: 5, 
    backgroundColor: '#000',
    borderRadius: 20, 
    left: 75 },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
    marginTop: 80,
  },

  listContainer: {
    paddingVertical: 15,
    backgroundColor: 'white',
     borderRadius: 5,
     gap: 10,
  },

  pendingCard:{
    padding: 10,
    backgroundColor: 'white',
    width: '100%',
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 5,
    gap: 5,
  },

  card: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },

  requestId: {
    fontWeight: 'bold',
    marginBottom: 6,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },

  label: {
    fontWeight: 'bold',
  },

  subTitle: {
    marginTop: 10,
    fontWeight: 'bold',
  },

  itemCard: {
    marginVertical: 5,
    padding: 8,
    backgroundColor: '#e6f7ff',
    borderRadius: 6,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 10,
  },
  
  cancelButton: {
    flex: 1,
    backgroundColor: '#ff4d4f',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },

  cancelButton1: {
    flex: 1,
    marginTop: 25,
    backgroundColor: '#ff4d4f',
    padding: 5,
    borderRadius: 6,
    alignItems: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  
  closeButton: {
    flex: 1,
    backgroundColor: '#1890ff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    
  },
  
  cancelText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  closeText1: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 1,
    paddingBottom: 1,
    marginTop: 5,
    borderRadius: 6,
    alignItems: 'center',
    color: '#fff',
  },

  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#134b5f',
    paddingVertical: 8,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },

  content:{
    padding: 0
  },
  tableHeaderText:{
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'center'
  },
  
  tableHeaderCell: {
    flex: 1,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 12,
  },
  
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingVertical: 6,
  },
  
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
  },
  
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},

modalCard: {
  backgroundColor: 'white',
  borderRadius: 16,
  padding: 20,
  width: '100%',
  maxHeight: '90%',
  elevation: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
},

modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 10,
  color: '#333',
  textAlign: 'center',
},

modalSubtitle: {
  fontSize: 16,
  fontWeight: '600',
  marginTop: 20,
  marginBottom: 10,
  color: '#555',
},

modalScroll: {
  width: '100%',
},

infoSection: {
  marginBottom: 10,
},

modalLabel: {
  fontWeight: '600',
  color: '#444',
  marginTop: 6,
},

modalValue: {
  color: '#333',
  marginBottom: 4,
},

closeButton: {
  marginTop: 25,
  backgroundColor: '#333',
  paddingVertical: 10,
  borderRadius: 8,
  alignItems: 'center',
},

closeButtonText: {
  color: 'white',
  fontWeight: '600',
},

table: {
  marginTop: 10,
},

tableHeader2: {
  flexDirection: 'row',
  backgroundColor: '#eee',
  padding: 8,
  borderTopLeftRadius: 5,
  borderTopRightRadius: 5,
},

tableHeaderText2: {
  fontWeight: 'bold',
  color: '#333',
},

tableRow: {
  flexDirection: 'row',
  paddingVertical: 8,
  paddingHorizontal: 4,
},

tableRowEven: {
  backgroundColor: '#f9f9f9',
},

tableRowOdd: {
  backgroundColor: '#fff',
},

tableCell2: {
  color: '#333',
},

btnContainer:{
  display:'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  borderRadius: 5,
  backgroundColor: 'white'
},

timelineBtn:{
  padding: 10,
  backgroundColor: 'white',
  width: '25%',
  alignItems: 'center'
},
activeBtn: {
    borderBottomWidth: 2,
    borderBottomColor: '#165a72', // Change color for active button
    backgroundColor: '#e9f5f9',
  },

timeText:{
  fontSize: 13,
  fontWeight: 400,
  color: '#165a72'
},
  
});
