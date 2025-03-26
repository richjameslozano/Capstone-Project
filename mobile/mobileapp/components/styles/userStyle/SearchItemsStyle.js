import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },

  /* Header Section */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#006E5F', 
    padding: 12,
    paddingTop: 35,
    justifyContent: 'space-between',
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
    marginTop: 70,
  },

  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
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
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    marginTop: 10,
    width: '100%',
  },

  headerRow: {
    backgroundColor: '#E0E0E0',
    borderBottomWidth: 1,
    borderColor: '#D6D6D6',
  },

  headerText: {
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
    width: '100%',
  },

  cell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  statusCell: {
    flex: 2,
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
  },

  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
});
