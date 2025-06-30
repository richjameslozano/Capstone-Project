import { StatusBar, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 7,
    backgroundColor: '#f9f9f9',
    gap: 7,
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

  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    justifyContent: 'center',
    gap: 20,
    borderRadius: 10,
    elevation: 3,

  },

  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#dfdfdf',
    borderRadius: 20,
  },

  activeButton: {
    backgroundColor: '#2187ab',
  },

  activeText:{
    color: '#fff'
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
    paddingHorizontal: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },

 

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
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

/* ----------  T A B L E   (modal)  ---------- */

  headerCell: {           // generic header text
    flex: 1,
    fontWeight: '700',
    textAlign: 'center',
    color: '#222',
    paddingHorizontal: 6,
  },

  cell: {                 // generic body text
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
    color: '#444',
    paddingHorizontal: 6,
  },

  /* –– reusable widths so header and rows always match –– */
  colName: { flex: 3 },       // wider for long names
  colQty: { flex: 1 },
  colCondition: { flex: 2 },

});

export default styles;
