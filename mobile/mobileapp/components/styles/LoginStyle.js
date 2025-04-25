import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
  },

  card: {
    width: 320,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },

  input: {
    marginBottom: 10,
  },

  dropdown: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderColor: '#ccc',
    borderWidth: 1,
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },

  button: {
    marginTop: 10,
  },

  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },

  forgotPassword: {
    marginTop: 10,
    textAlign: 'center',
    color: '#6200ee',
    textDecorationLine: 'underline',
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },

  passwordInput: {
    flex: 1,
  },

  iconContainer: {
    position: 'absolute',
    right: 10,
    top: 18,
  },

  signupSection: {
    marginTop: 30,
  },

  signupLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#444',
  },

  signupDropdown: {
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
