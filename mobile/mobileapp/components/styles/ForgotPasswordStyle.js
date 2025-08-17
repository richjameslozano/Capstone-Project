import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalContent: {
    width: '85%',
    maxWidth: 400,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },

  modalText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 15,
    color: 'gray'
  },

  input: {
    marginBottom: 10,
    height: 40,
    backgroundColor: 'transparent'
  },

  successText: {
    color: 'green',
    textAlign: 'center',
    marginBottom: 10,
  },

  modalButton: {
    marginTop: 10,
    backgroundColor: '#1a6985',
    borderRadius: 4, 
  },

  modalCancel: {
    textAlign: 'center',
    marginTop: 10,
    color: '#1a6985',
  },
});
