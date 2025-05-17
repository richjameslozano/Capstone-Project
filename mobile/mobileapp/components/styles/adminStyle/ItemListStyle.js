import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 100,
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
    color: "#555"
  }
});
