import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF6F6',
  },

  // Header Styling
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#00796B',
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },

  backButton: {
    marginRight: 15,
  },

  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },

  // Main Content Area
  wholeSection: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
    marginTop: 20,
  },

  // Policy Card Styling
  card: {
    backgroundColor: 'white',
    padding: 18,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 5,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

  cardDescription: {
    fontSize: 15,
    color: '#666',
    marginTop: 6,
    lineHeight: 20,
  },
});




// import { StyleSheet } from 'react-native';

// export default StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//     padding: 16,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#00796B',
//     padding: 50,
//     borderRadius: 8,
//   },

//   backButton: {
//     marginRight: 10,
//   },

//   headerTitle: {
//     color: 'white',
//     fontSize: 20,
//     fontWeight: 'bold',
//   },

//   card: {
//     backgroundColor: 'white',
//     padding: 16,
//     marginVertical: 8,
//     borderRadius: 8,
//     elevation: 3,
//   },

//   cardTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },

//   cardDescription: {
//     fontSize: 14,
//     color: 'gray',
//     marginTop: 5,
//   },

//     wholeSection:{
//     padding: 10,
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#cde4f4',
//     height: 'auto',
//     gap: 5,
//     overflow: 'visible'
//   },
// });
