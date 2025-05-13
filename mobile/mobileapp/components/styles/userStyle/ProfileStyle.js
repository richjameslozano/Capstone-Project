import { StatusBar, StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9ecee',
    padding: 7,
    gap: 5
  },  



  
profileHeader:{
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
  borderColor: '#e9ecee'
},

  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },

  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 30
  },

  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#00796B',
  },

  secondSection:{
    height: 'auto',
    backgroundColor: '#fff',
    borderRadius: 8, 
    paddingTop: 8, 
    paddingBottom: 10, 
    paddingHorizontal: 10 
  },

  profileDetails: {
    marginTop: 20,
    paddingHorizontal: 10,
  },

  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b5b5b5',
  },

  info:{backgroundColor: '#fff', borderRadius: 5, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10},

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
