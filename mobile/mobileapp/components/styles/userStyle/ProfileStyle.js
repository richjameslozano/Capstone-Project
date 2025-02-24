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

  profileImageContainer: {
    alignItems: 'center',
    marginTop: 20,
  },

  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#00796B',
  },

  profileDetails: {
    marginTop: 20,
    paddingHorizontal: 10,
  },

  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
  },

  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    marginTop: 5,
    elevation: 2,
  },

  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#D32F2F',
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },

  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
