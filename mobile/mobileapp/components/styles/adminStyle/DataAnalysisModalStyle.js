import { StyleSheet } from "react-native";

export default StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: "center",
  },

  modalHandle: {
    width: 50,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 10,
    marginBottom: 10,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 5,
  },

  closeButton: {
    marginTop: 20,
    backgroundColor: "#004d40",
    padding: 10,
    borderRadius: 10,
    width: "90%",
    alignItems: "center",
  },

  closeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
