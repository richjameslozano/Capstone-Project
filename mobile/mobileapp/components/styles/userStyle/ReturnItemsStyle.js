import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },

  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
    marginTop: 100,
  },

  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#dcdcdc',
    borderRadius: 20,
  },

  activeButton: {
    backgroundColor: '#007bff',
  },

  filterText: {
    color: '#000',
    fontWeight: '600',
  },

  tableContainer1: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingBottom: 10,
    flex: 1,
  },

  tableContainer2: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    paddingBottom: 8,
    paddingHorizontal: 4,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e8e8e8',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  // Columns flex for alignment
  headerCellDate: {
    flex: 2,
    fontWeight: '700',
    textAlign: 'center',
    color: '#222',
    paddingHorizontal: 6,
  },

  headerCellStatus: {
    flex: 2,
    fontWeight: '700',
    textAlign: 'center',
    color: '#222',
    paddingHorizontal: 6,
  },

  headerCellAction: {
    flex: 1,
    fontWeight: '700',
    textAlign: 'center',
    color: '#222',
  },

  cellDate: {
    flex: 2,
    textAlign: 'center',
    color: '#444',
    fontSize: 13,
  },

  cellStatus: {
    flex: 2,
    textAlign: 'center',
    color: '#444',
    fontSize: 13,
  },

  cellAction: {
    flex: 1,
    textAlign: 'center',
    color: '#444',
    fontSize: 13,
  },

  linkText: {
    color: '#007bff',
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark overlay for focus
    paddingHorizontal: 20,
    paddingTop: 200,
  },

  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    maxHeight: '85%',
    width: '100%',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#222',
  },

  boldText: {
    fontWeight: '700',
    marginVertical: 14,
    fontSize: 17,
    color: '#333',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fefefe',
    marginTop: 4,
  },

  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    height: 42,
    backgroundColor: '#fefefe',
    marginTop: 4,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
});

export default styles;
