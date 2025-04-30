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

  // input: {
  //   marginBottom: 10,
  // },

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

  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#002075',
    height: '35%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 36,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 16,
    color: '#c8e6c9',
    marginTop: 8,
  },
  loginCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: -40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 20,
    paddingTop: 30,
    height: 'auto'
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#374151',
  },

  signupTitle: {
    fontSize: 14,
    marginBottom: 30,
    color: '#374151',
    textAlign: 'center'
  },

  inputContainer: {
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 0,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 0,
  },
  
  inputContainer2: {
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 0,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 0,
  },

  inputText: {
    fontSize: 16,
  },

  forgotPassword: {
    textAlign: 'right',
    color: '#4B5563',
    marginBottom: 20,
    marginRight: 110,
    fontSize: 14,
  },

  loginButton: {
    backgroundColor: '#002075',
  borderRadius: 10,
  paddingVertical: 10,
  marginTop: 10,
  },

  loginButtonText: {
    fontSize: 18,
  color: '#fff',
  },

  footerText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#6b7280',
  },
  
  input: {
    height: 20,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  scrollContainer: {

    flexGrow: 1,
    paddingBottom: 80,
    backgroundColor: 'white',
    
  },

  label:{
    paddingLeft: 10,
    fontWeight: 800,
    fontSize: 12,
    marginBottom: 5
  },

  menucontainer:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 10,
    
  }
});
