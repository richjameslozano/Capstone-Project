import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00796B',
    padding: 16,
    borderRadius: 8,
  },

  backButton: {
    marginRight: 10,
  },

  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  cardDescription: {
    fontSize: 14,
    color: 'gray',
    marginTop: 5,
  },
});
