import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Card, Spin, Empty, Typography, Button, Select, Space } from "antd";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const { Title, Paragraph } = Typography;
const { Option } = Select;

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

const MostRequestedItemsBarChart = () => {
  const [barData, setBarData] = useState(null);
  const [rawData, setRawData] = useState({});
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [topN, setTopN] = useState(5);

  useEffect(() => {
    const fetchAIBarData = async () => {
      try {
        const response = await fetch("https://webnuls.onrender.com/ai-most-requested-items-bar", {
          method: "POST",
        });
        const json = await response.json();
        const items = json.data?.items;
        const summaryText = json.data?.summary;

        if (!items || Object.keys(items).length === 0) {
          setBarData(null);
          return;
        }

        setRawData(items);
        setSummary(summaryText || "");
        processData(items, topN);
      } catch (err) {
        console.error("Failed to load AI-generated item request data", err);
        setBarData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAIBarData();
  }, []);

const generateBarColors = (count) => {
  const palette = [
    '#0f3c4c',
    '#165a72',
    '#2596be',
    '#66b6d2',
    '#92cbdf',
    '#e6b01d',
    '#ffc420',
    '#ffe290',
    '#ff924d',
    '#ffb382',
  ];

  return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
};

const processData = (data, count) => {
  const sorted = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count);

  const labels = sorted.map(([label]) => label);
  const values = sorted.map(([, value]) => value);

  setBarData({
    labels,
    datasets: [
      {
        label: "Requests",
        data: values,
        backgroundColor: generateBarColors(values.length),
        borderRadius: 4,
        barThickness: 18,
        borderSkipped: false,
      },
    ],
  });
};



  const handleExportCSV = () => {
    if (!barData) return;

    const rows = [["Item Name", "Request Count"]];
    barData.labels.forEach((label, i) => {
      rows.push([label, barData.datasets[0].data[i]]);
    });

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "most_requested_items.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const chartElement = document.getElementById("most-requested-bar-chart");
    if (!chartElement) return;

    const canvas = await html2canvas(chartElement);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save("most_requested_items.pdf");
  };

  const handleTopNChange = (value) => {
    setTopN(value);
    processData(rawData, value);
  };

  if (loading) return <Spin />;
  if (!barData) return <Empty description="No item request data available" />;

  return (
    <Card style={{ padding: 16, height: '100%' }}>
      <Title level={5}>Medical Supplies in Progress</Title>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Materials needed in laboratory operations
      </Paragraph>

      <div id="most-requested-bar-chart">
        <Bar
          data={barData}
          options={{
            indexAxis: "y",
            responsive: true,
            plugins: {
              datalabels: {
                anchor: "end",
                align: "right",
                color: "#fff",
                font: { weight: "bold" },
                formatter: value => `${value}`,
              },
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: context => `${context.raw}`,
                },
              },
            },
            scales: {
              x: {
                beginAtZero: true,
                grid: { display: false },
                ticks: { stepSize: 1, precision: 0 },
              },
              y: {
                grid: { display: false },
                ticks: { font: { size: 14 } },
              },
            },
          }}
        />
      </div>

      {summary && (
        <Paragraph style={{ marginTop: 16 }}>
          <strong>AI Insight Summary:</strong>
          <p>{summary}</p> 
        </Paragraph>
      )}

      <Space style={{ marginTop: 24, justifyContent: "space-between", width: "100%" }} wrap>
        <Select defaultValue={5} onChange={handleTopNChange}>
          <Option value={5}>Top 5</Option>
          <Option value={10}>Top 10</Option>
        </Select>

        <Space>
          <Button onClick={handleExportCSV}>Export CSV</Button>
          <Button onClick={handleExportPDF}>Export PDF</Button>
        </Space>
      </Space>
    </Card>
  );
};

export default MostRequestedItemsBarChart;
