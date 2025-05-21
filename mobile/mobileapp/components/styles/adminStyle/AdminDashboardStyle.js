
import { StatusBar, StyleSheet } from 'react-native';


export default StyleSheet.create({
   container3: {
    flex: 1,
    backgroundColor: '#e9ecee',
    padding: 7,
  },

  dashboardHeader:{
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

  userType: {
    color: 'gray',
    fontSize: 14,
    marginBottom: 5,
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

  actionContainer:{
    backgroundColor: 'white',
    borderRadius: 5,
    padding:10,
  },

  card: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 5,
    elevation:2,
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
