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

tableContainer1: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
    height: '70%',
},

tableContainer2: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
    height: '60%',
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
    width: '100%',
    height: '70%',
    borderRadius: 0,
    padding: 20,
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
    borderRadius: 4,
    padding: 6,
    fontSize: 14,
    backgroundColor: '#fff',
},

picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    height: 40,
    backgroundColor: '#fff',
},

inputCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
},

modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
},

modalOverlay: {
    flex: 1,
    justifyContent: 'center',  // Center the modal vertically
    alignItems: 'center',      // Center the modal horizontally
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Optional: dim the background
    width: '100%',
},  
});

export default styles;
