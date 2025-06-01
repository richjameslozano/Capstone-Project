import { StatusBar, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 7,
    backgroundColor: "#e9ecee",
  },

pendingHeader:{
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
    borderColor: '#e9ecee',
      zIndex: 999
},

  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
  },

  list: {
    flex: 1,
    padding: 5,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    paddingHorizontal: 15,
    borderColor: '#dcdcdc',
    borderWidth: 1,
  },

  requestor: {
    fontSize: 17,
    fontWeight: 500,
  },
  
  description: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: 300,
    color: 'gray'
  },

  dateRequired: {
    fontSize: 13,
    color: "gray",
    fontWeight: 300,
  },

  status: {
    marginTop: 6,
    fontWeight: "bold",
  },

  approved: {
    color: "green",
  },

  pending: {
    color: "red",
  },

  viewLink: {
    color: "#007bff",
    marginTop: 8,
  },
});

export default styles;
