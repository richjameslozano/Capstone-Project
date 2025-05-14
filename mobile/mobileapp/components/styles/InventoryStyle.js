import { StatusBar, StyleSheet } from 'react-native';
import Header from '../Header';
import { auth } from '../../backend/firebase/FirebaseConfig';


export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9ecee',
    paddingBottom: 0,
    overflow: 'visible'
  },

  profileHeader:{
    position: 'absolute',
    backgroundColor: '#fff',
    flex: 1,
    paddingTop: StatusBar.currentHeight+15,
    left: 0,
    right:0,
    alignItems: 'center',
    justifyContent:'space-between',
    zIndex: 999,
  },

  inst:{backgroundColor: '#dfdfdf', fontSize: 11, fontWeight: 300, width: '100%', textAlign: 'center', padding: 1},

  /* Section Title */
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },

  searchFilter:{
    position: 'absolute', 
    zIndex: 999, 
    alignSelf: 'center', 
    width: '100%',
    height: 'auto',
    padding: 5,
    paddingBottom: 20,
    top: 5,
  
  },

  /* Search Bar */
  searchBar: {
    height: 50,
    flex: 1,
    backgroundColor: '#EDEDED',
    fontSize: 14,
    padding: 10,
    borderRadius: 10,
    margin: 0,
    borderWidth: 1,
    borderColor: 'gray',
    // Android shadow
    elevation: 50,
  
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  

  /* Picker Styles */
  usageSection:{
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8, 
    borderRadius: 5
  },

  usagePicker: {
    flex: 1,
    borderRadius: 5,
    justifyContent: 'center',
    backgroundColor:'#6e9fc1',
    height: 'auto',
    width: '60%',
    padding:0,
    height: 40
  },

  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  /* Modal Styles */
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize:20,
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
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#fff',
  },

  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },

  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  dateSection:{
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: 'auto',
    padding: 8,
    borderRadius: 5
  },

  dateButton: {
    display: 'flex',
    width: '60%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6e9fc1',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'space-between'
  },

  dateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15
  },

  label: {fontSize: 14, fontWeight: 500, color: '#000',  width:'40%'},

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

  /* Time Picker Modal */

timeSection:{
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: 5,
  padding: 8
},

timeBtn:{
  flex: 1,
},

  timeButtonContainer: {
    flexDirection: 'row',
    width: '60%',
    gap: 5
  },

  timeButton: {
    backgroundColor: '#6e9fc1',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },

  timeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center'
  },

  /* Bottom Section */
  bottomContainer: {
    width: '100%',
    display: 'flex',
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#395a7f',
    padding: 10,
    borderRadius:20,
    elevation: 4,
    bottom: 20,
    alignSelf: 'center'
  },

  requestButton: {
    backgroundColor: '#6e9fc1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a3cae9'
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



  programSection:{
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8, 
    borderRadius: 5
  },

  programPicker: {
    flex: 1,
    borderRadius: 5,
    justifyContent: 'center',
    backgroundColor:'#6e9fc1',
    height: 'auto',
    width: '60%',
    padding:0,
    height: 40
  },

  programItem:{
    color: 'white',
    height: 'auto',
  },  
  arrowIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -10,
    pointerEvents: 'none',
    zIndex: 1,
  },

  roomSection:{
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8, 
    borderRadius: 5
  },

  roomInput: {
    flex: 1,
    backgroundColor: '#e9ecee',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 'auto',
  },

  timeModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
  },

  timeModalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },

  timeScroll: {
    height: 150,
    width: 60,
    marginHorizontal: 5,
  },

  timeText: {
    fontSize: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    textAlign: 'center',
  },

  colon: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 5,
    textAlign: 'center',
  },

  okButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },

  okButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  noteSection:{
    display: 'flex',
    flexDirection: 'column',
    padding: 8, 
    backgroundColor: '#fff',
    borderRadius: 5,
  },

  noteInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',

  },  

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // dim background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '90%',
    elevation: 10,
  },
  closeButton: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: '#00796B',
    padding: 10,
    borderRadius: 8,
  },

  wholeSection:{
    flex:1,
    backgroundColor: '#e9ecee',
    height: 'auto',
    gap: 5,
    overflow: 'visible',
    paddingHorizontal: 7,
    paddingVertical: 7,
    paddingTop: 10,
  },

  wholeSection2:{
    flex: 1, 
    padding: 8,
    backgroundColor: '#fff',
    borderWidth: 8,
    borderRadius: 20,
    borderColor: '#cde4f4',
    height: 'auto',
    gap: 5,
    paddingBottom: 0
  },

  proceedBtn:{
    display: 'flex',
    backgroundColor: '#395a7f',
    padding: 10,
    paddingLeft: 20,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },

  scrollContainer: {
    flexGrow: 1
    // paddingHorizontal: 7,
    // paddingVertical: 5,
  },

  
});
