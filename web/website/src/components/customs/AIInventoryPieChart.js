import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Card, Spin, Empty, Typography } from "antd";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

const { Paragraph, Title } = Typography;

ChartJS.register(ArcElement, Tooltip, Legend);

const AIInventoryPieChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAIAnalysis = async () => {
      try {
        const response = await fetch("https://webnuls.onrender.com/ai-inventory-analysis", {
          method: "POST",
        });
        const json = await response.json();
        setChartData(json.data);
      } catch (err) {
        console.error("Failed to load AI analysis", err);
        setChartData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAIAnalysis();
  }, []);

  if (loading) return <Spin />;
  if (!chartData || Object.keys(chartData).length === 0) {
    return <Empty description="No AI analysis data" />;
  }

  const pieData = {
    labels: ["Safe", "Warning", "Critical"],
    datasets: [
      {
        label: "Stock Categories",
        data: [
          chartData.Safe || 0,
          chartData.Warning || 0,
          chartData.Critical || 0,
        ],
        backgroundColor: ["#52c41a", "#faad14", "#f5222d"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <>
      <Pie data={pieData} />

      <div style={{ marginTop: 24 }}>
        <Title level={5}>AI Explanation</Title>
        <Paragraph>
          {chartData.Explanation || "No explanation provided by the AI."}
        </Paragraph>

        <Title level={5} style={{ marginTop: 24 }}>How Items Are Classified</Title>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Safe</strong>: Quantity is above the critical threshold.</li>
          <li><strong>Warning</strong>: Quantity equals the critical threshold.</li>
          <li><strong>Critical</strong>: Quantity is below the critical threshold and may require urgent restocking.</li>
        </ul>
      </div>
    </>
  );
};

export default AIInventoryPieChart;
