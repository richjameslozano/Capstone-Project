import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  
  card: {
    width: 320,
    padding: 20,
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
  
});
