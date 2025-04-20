import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },

  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    marginTop: 70,
  },

  list: {
    flex: 1,
  },

  card: {
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    elevation: 3,
  },

  requestor: {
    fontSize: 16,
    fontWeight: "bold",
  },
  
  description: {
    fontSize: 14,
    marginTop: 4,
  },

  dateRequired: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
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
