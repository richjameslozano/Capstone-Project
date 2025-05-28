import { StatusBar } from "react-native";

export default {
  container: {
    flex: 1,
    padding: 7,
    // backgroundColor: '#fff',
  },

  container2:{
    flex:1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  qrHeader:{
          position: 'absolute',
              flex: 1,
              paddingTop: StatusBar.currentHeight+15,
              top: 0,
              left: 0,
              right:0,
              flexDirection: 'row',
              paddingBottom: 10,
              paddingHorizontal: 15,
              alignItems: 'center',
              justifyContent:'space-between',
              // borderBottomWidth: 1,
              // borderColor: '#e9ecee',
               zIndex: 999
        },




  button: {
    backgroundColor: "#2d405b",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    width: '100%',
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  itemsContainer: {
    marginTop: 20,
  },

  itemCard: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },

  itemName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  
  details: {
    fontSize: 14,
    color: "#777",
  },
};
