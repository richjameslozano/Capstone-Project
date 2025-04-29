import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  row: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },

  rowText: {
    fontSize: 16,
    marginBottom: 5,
  },
  
  viewButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },

  viewButtonText: {
    color: "white",
    textAlign: "center",
  },

  modalContent: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  subHeading: {
    fontSize: 18,
    marginVertical: 10,
  },

  itemRow: {
    marginBottom: 10,
  },
});

export default styles;
