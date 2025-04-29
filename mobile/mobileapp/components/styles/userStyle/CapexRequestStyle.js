// CAPEXRequestStyle.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },

  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  title: {
    marginTop: 70,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },

  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  checkboxLabel: {
    marginLeft: 8,
  },

  submitButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
