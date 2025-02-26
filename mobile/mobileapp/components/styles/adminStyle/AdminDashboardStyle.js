import { StyleSheet } from 'react-native';

export default StyleSheet.create({
   container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingTop:60,
  },

  userType: {
    color: 'gray',
    fontSize: 14,
    marginBottom: 5,
  },

  header: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 10, // Keeps it above other content
  backgroundColor: '#1A4572', // Ensure it's visible
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 10,
  elevation: 4, // Adds shadow on Android
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,

  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'white',
  },

  headerText: {
    flex: 1,
    marginLeft: 10,
  },

  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  subtitle: {
    color: 'white',
    fontSize: 12,
  },

  profileButton: {
    padding: 5,
  },

  grid: {
    marginTop: 20,
  },

  card: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    minWidth: '45%', 
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },

  cardSubtitle: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'center',
  },

  bottomSheetTrigger: {
    backgroundColor: '#004D40',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 8,
    marginTop: 15,
    width: '90%',
    alignSelf: 'center',
  },

  footerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
