import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Card, Spin, Typography, Empty, Select } from "antd";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

const { Title, Paragraph } = Typography;
const { Option } = Select;

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

const MonthlyRequestTrendLineChart = () => {
  const [trendData, setTrendData] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const res = await fetch("https://webnuls.onrender.com/ai-monthly-request-trend", {
          method: "POST",
        });
        const json = await res.json();
        setAvailableYears(json.years || []);
        setTrendData(json.data || []);
        setExplanation(json.explanation || "");
        setSelectedYear(json.years?.[0] || null); // Default to first year
      } catch (err) {
        console.error("Error loading trend data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, []);

  if (loading) return <Spin />;
  if (!trendData.length || !selectedYear) return <Empty description="No monthly request data" />;

  const filteredData = trendData.filter(entry =>
    entry.month.endsWith(String(selectedYear))
  );

  const values = filteredData.map(entry => entry.count);
  const labels = filteredData.map(entry =>
    entry.month.replace(` ${selectedYear}`, "")
  );

const chartData = {
  labels,
  datasets: [
    {
      label: "Requests",
      data: values,
      fill: true,
      tension: 0, // solid line
      borderWidth: 2,
      borderColor: "#165a72", // ← your desired line color
      // backgroundColor: "rgba(19, 75, 95, 0.2)",
      pointBackgroundColor: "#134b5f",
      pointBorderColor: "#fff",
      pointRadius: 4,
      pointHoverRadius: 6,
    },
  ],
};



  const chartOptions = {
    responsive: true,
    elements: {
      line: {
        borderJoinStyle: "round",
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f8fafc",
        bodyColor: "#cbd5e1",
        callbacks: {
          label: context => `${context.raw} requests`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Month",
          color: "#333",
          font: { size: 14 },
        },
        grid: { display: false },
        ticks: { color: "#666", font: { size: 12 } },
      },
      y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Request Count",
            color: "#333",
            font: { size: 14 },
          },
          grid: { color: "#e5e7eb" },
          ticks: {
            color: "#666",
            font: { size: 12 },
            stepSize: 5, // ← Set increment to 5
          },
        },
    },
  };

  return (
    <Card title="Monthly Request Trend Overview">
      <Select
        value={selectedYear}
        onChange={setSelectedYear}
        style={{ width: 140, marginBottom: 16 }}
      >
        {availableYears.map(y => (
          <Option key={y} value={y}>
            {y}
          </Option>
        ))}
      </Select>

      <Line data={chartData} options={chartOptions} />

      <div style={{ marginTop: 24 }}>
        <Title level={5}>AI Insight</Title>
        <Paragraph>{explanation}</Paragraph>
      </div>
    </Card>
  );
};

export default MonthlyRequestTrendLineChart;
