import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },

  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 12,
  },

  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#d3d3d3',
    borderRadius: 6,
  },

  activeButton: {
    backgroundColor: '#007bff',
  },

  filterText: {
    color: '#000',
    fontWeight: '600',
  },

  tableContainer: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },

  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },

  cell: {
    flex: 1,
    textAlign: 'center',
    color: '#555',
  },

  linkText: {
    color: 'blue',
  },    

  modalContent: {
    backgroundColor: '#fff',
    width: '80%', // Set the width to 80% of the screen width
    maxHeight: '60%', // Set the max height to 60% of the screen height
    marginHorizontal: '10%', // Center the modal horizontally
    borderRadius: 10,
    overflow: 'hidden', // Ensure content doesn't overflow the modal
    padding: 20, // Add padding for spacing
  },  

  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  }, 

  itemRow: {
    marginBottom: 15,
  },

  boldText: {
    fontWeight: 'bold',
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 10,
    borderRadius: 4,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

});

export default styles;
