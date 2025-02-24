import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import Modal from "react-native-modal";
import { BarChart, PieChart } from "react-native-chart-kit";
import styles from "../styles/adminStyle/DataAnalysisModalStyle";

const screenWidth = Dimensions.get("window").width;

const DataAnalysisModal = ({ isVisible, onClose }) => {
  const barData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [{ data: [20, 45, 28, 80, 99, 43] }]
  };

  const pieData = [
    { name: "Category A", population: 40, color: "#4CAF50", legendFontColor: "#000", legendFontSize: 14 },
    { name: "Category B", population: 30, color: "#D32F2F", legendFontColor: "#000", legendFontSize: 14 },
    { name: "Category C", population: 20, color: "#FFC107", legendFontColor: "#000", legendFontSize: 14 },
    { name: "Category D", population: 10, color: "#673AB7", legendFontColor: "#000", legendFontSize: 14 }
  ];

  return (
    <Modal isVisible={isVisible} onSwipeComplete={onClose} swipeDirection="down" backdropOpacity={0.5} style={styles.modal}>
      <View style={styles.modalContent}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>📊 Data Analysis</Text>

        <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: 20 }}>
          <Text style={styles.chartTitle}>Sales Over Time</Text>
          <BarChart
            data={barData}
            width={screenWidth * 0.9}
            height={220}
            yAxisLabel=""
            chartConfig={chartConfig}
            verticalLabelRotation={30}
          />

          <Text style={styles.chartTitle}>Sales Distribution</Text>
          <PieChart
            data={pieData}
            width={screenWidth * 0.9}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </ScrollView>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const chartConfig = {
  backgroundGradientFrom: "#f5f5f5",
  backgroundGradientTo: "#fff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 77, 64, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: { borderRadius: 10 },
  propsForDots: { r: "6", strokeWidth: "2", stroke: "#004d40" }
};

export default DataAnalysisModal;
