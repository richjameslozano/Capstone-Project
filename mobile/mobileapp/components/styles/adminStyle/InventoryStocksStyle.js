import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    padding: 15,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00796B',
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 5,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },

  subtitle: {
    fontSize: 12,
    color: 'white',
  },

  profileButton: {
    padding: 5,
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
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 3,
  },

  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  cardLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },

  cardValue: {
    fontSize: 14,
    color: '#555',
  },

  cardValueNum: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00796B',
  },

  viewDetailsButton: {
    marginTop: 10,
    backgroundColor: '#00796B',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
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
});

export default styles;
