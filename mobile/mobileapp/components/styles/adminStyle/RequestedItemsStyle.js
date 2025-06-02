import { StatusBar, StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
    marginTop: 100,
  },

  itemButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
  },
  
  itemText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
});
