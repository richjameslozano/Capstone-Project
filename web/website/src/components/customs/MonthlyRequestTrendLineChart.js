import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Card, Spin, Typography, Empty, Select, Space } from "antd";
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
  const [dailyData, setDailyData] = useState({});
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(true);

  const monthOrder = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const res = await fetch("https://webnuls.onrender.com/ai-monthly-request-trend", {
          method: "POST",
        });
        const json = await res.json();
        const allData = json.data || [];

        setTrendData(allData);
        setDailyData(json.dailyData || {});
        setExplanation(json.explanation || "");

        const yearSet = new Set();
        const monthMap = {};

        allData.forEach(entry => {
          const [month, year] = entry.month.split(" ");
          yearSet.add(year);
          if (!monthMap[year]) monthMap[year] = new Set();
          monthMap[year].add(month);
        });

        const sortedYears = Array.from(yearSet).sort();
        setAvailableYears(sortedYears);
        const defaultYear = sortedYears[0];
        setSelectedYear(defaultYear);

        const sortedMonths = Array.from(monthMap[defaultYear] || []).sort(
          (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
        );
        setAvailableMonths(sortedMonths);
        setSelectedMonth(null); // Start with all months
      } catch (err) {
        console.error("Error loading trend data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, []);

  useEffect(() => {
    if (!selectedYear || trendData.length === 0) return;

    const filtered = trendData.filter(entry => entry.month.endsWith(selectedYear));
    const uniqueMonths = [...new Set(filtered.map(entry => entry.month.split(" ")[0]))];
    const ordered = uniqueMonths.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    setAvailableMonths(ordered);

    if (selectedMonth && !ordered.includes(selectedMonth)) {
      setSelectedMonth(null);
    }
  }, [selectedYear, trendData]);

  if (loading) return <Spin />;
  if (!trendData.length || !selectedYear) return <Empty description="No request data available" />;

  const labelKey = selectedMonth ? `${selectedMonth} ${selectedYear}` : null;
  const isDailyView = labelKey && dailyData[labelKey];

  const chartData = {
    labels: isDailyView
      ? Object.keys(dailyData[labelKey]).sort((a, b) => Number(a) - Number(b))
      : trendData
          .filter(entry => entry.month.endsWith(selectedYear))
          .sort((a, b) => monthOrder.indexOf(a.month.split(" ")[0]) - monthOrder.indexOf(b.month.split(" ")[0]))
          .map(entry => entry.month.split(" ")[0]),

    datasets: [
      {
        label: "Requests",
        data: isDailyView
          ? Object.values(dailyData[labelKey])
          : trendData
              .filter(entry => entry.month.endsWith(selectedYear))
              .sort((a, b) => monthOrder.indexOf(a.month.split(" ")[0]) - monthOrder.indexOf(b.month.split(" ")[0]))
              .map(entry => entry.count),
        borderColor: "#1e88e5",
        backgroundColor: "rgba(30, 136, 229, 0.3)",
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
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
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          value={selectedYear}
          onChange={setSelectedYear}
          style={{ width: 140 }}
        >
          {availableYears.map(year => (
            <Option key={year} value={year}>{year}</Option>
          ))}
        </Select>

        <Select
          value={selectedMonth}
          onChange={(value) => setSelectedMonth(value || null)}
          allowClear
          placeholder="All Months"
          style={{ width: 140 }}
        >
          {availableMonths.map(month => (
            <Option key={month} value={month}>{month}</Option>
          ))}
        </Select>
      </Space>

      <Line data={chartData} options={chartOptions} />

      <div style={{ marginTop: 24 }}>
        <Title level={5}>AI Insight</Title>
        <Paragraph>{explanation}</Paragraph>
      </div>
    </Card>
  );
};

export default MonthlyRequestTrendLineChart;