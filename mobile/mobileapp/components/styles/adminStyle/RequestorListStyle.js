import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
    marginTop: 100,
  },

  requestorButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
  },

  requestorText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },

  emptyText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
    color: "#888",
  },

  debugText: {
    fontSize: 14,
    marginTop: 30,
    textAlign: "center",
    color: "#aaa",
  },
});
