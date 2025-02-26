import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container2: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    height:' 100%'
  },

  // header: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   backgroundColor: '#00796B',
  //   padding: 15,
  //   borderRadius: 8,
  //   justifyContent: 'space-between',
  // },

  // logo: {
  //   width: 40,
  //   height: 40,
  //   resizeMode: 'contain',
  // },

  // headerText: {
  //   alignItems: 'center',
  //   flex: 1,
  // },

  // title: {
  //   color: 'white',
  //   fontSize: 18,
  //   fontWeight: 'bold',
  // },

  // subtitle: {
  //   color: 'white',
  //   fontSize: 14,
  // },

  // profileButton: {
  //   padding: 5,
  // },

  // grid: {
  //   marginTop: 20,
  // },

  card: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: '45%', 
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 5 }, 
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
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
});
