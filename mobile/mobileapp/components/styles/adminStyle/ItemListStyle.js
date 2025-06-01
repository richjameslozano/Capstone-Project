import { StatusBar, StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e9ecee",
    paddingHorizontal: 7,
  },

    inventoryStocksHeader:{
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
          zIndex: 999,
    },

  title: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 5,
  },

  itemCard: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2
  },

  itemName: {
    fontSize: 18,
    fontWeight: "bold"
  },

  details: {
    fontSize: 14,
    color: "gray",
    fontWeight: 300
  },

});
