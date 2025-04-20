import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  /* General Container Styles */
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },

  subtitle: {
    fontSize: 14,
    color: 'white',
  },

  profileButton: {
    padding: 5,
  },

  /* Content Section */
  content: {
    padding: 10,
    flex: 1,
  },

  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    marginTop: 80,
  },

  /* Search Section */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEDED',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  searchIcon: {
    marginRight: 5,
  },

  searchInput: {
    flex: 1,
    height: 40,
  },

  /* Table Section */
  tableContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    marginTop: 10,
    width: '100%', // Make it fit the screen
  },  

  headerRow: {
    backgroundColor: '#E0E0E0',
    borderBottomWidth: 1,
    borderColor: '#D6D6D6',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  tableHeaderText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },

  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  cell: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  statusCell: {
    justifyContent: 'center',
  },

  cellText: {
    fontSize: 14,
    color: '#333',
  },

  status: {
    fontWeight: 'bold',
  },

  available: {
    color: '#4CAF50',
  },

  outOfStock: {
    color: '#D32F2F',
  },

  inUse: {
    color: '#FFA000',
  },

  noResults: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#777',
    fontSize: 16,
  },

  /* Help Button */
  helpButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 50,
    elevation: 5,
  },

  helpText: {
    color: 'white',
    fontWeight: 'bold',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,  // Add horizontal padding so modal doesn't touch sides
  },

  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '90%',  // Limit the width to 90% of the screen width
    maxHeight: '70%', // Limit the height to 70% of the screen height
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'absolute',  // Ensure it's not taking up full screen
    top: '20%',  // Keep the modal from sticking to the top of the screen
  },


  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  modalText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },

  closeButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },

  closeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  
  rowEven: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  
  rowOdd: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },
});
