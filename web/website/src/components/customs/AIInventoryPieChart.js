import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Card, Spin, Empty, Typography } from "antd";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bot, LineChart, BarChart2  } from 'lucide-react';
import { FaRobot, FaChartLine  } from 'react-icons/fa';
import { MdSmartToy, MdAnalytics } from 'react-icons/md';      // Material Icons
import { GiArtificialHive } from 'react-icons/gi';// Game Icons (AI-theme)
import { LineChartOutlined } from '@ant-design/icons';

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
        backgroundColor: ["#134b5f", "#51abcb", "#FFC420"],
        borderWidth: 1,
      },
      
    ],
    
  };

const pieOptions = {
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        pointStyle: 'rectRounded',
        padding: 25,
        font: {
          size: 14,
        },
      },
    },
    datalabels: {
      color: '#ffffff', // Set label text color here
      font: {
        weight: 'bold',
        size: 14,
      },
    },
  },
  maintainAspectRatio: false,
};

  return (
    <div style={{height: '100%', display: 'flex',flexDirection: 'column',gap: 10, padding: 30, backgroundColor: 'white', boxShadow: '0px 8px 14px rgba(0,0,0,0.1)', borderRadius: 10, justifyItems: 'flex-start', border: '1px solid #dcdcdc', paddingTop: 20}}>
            <div className="analytics-center-wrapper" style={{display: 'flex', alignItems: 'center', justifyItems: 'center', padding: 5, gap: 15, marginBottom: 15}}>
           <BarChart2
              color="#fff"
              width={25}
              height={25}
              style={{ padding: 5, backgroundColor: '#2187ab', borderRadius: 5 }}
            />

            <h1 style={{ fontWeight: "bold", fontSize: '26px',justifySelf: 'flex-start', borderRadius: 5, margin: 0}}>
              Analytics Center
            </h1>
            </div>

    <div style={{display: 'flex', gap: 30,justifyItems: 'center', alignItems: 'center'}}>
    <div style={{ width: '330px', height: '330px',marginRight: 20 }}>
    <Pie
    data={pieData}
    options={pieOptions}
    
      />
      </div>

      <div style={{ backgroundColor: '#e9f5f9', padding:20, borderRadius: 8}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10}}>
          {/* <FaRobot size={28} color="#4b8bbe" />
          <MdSmartToy size={28} color="gray" />
          <GiArtificialHive size={28} color="purple" /> */}
        <Bot size={28} color="#0f3c4c" />
        <Title level={5} style={{margin: 0, padding: 0, fontSize: 20}}>Pixie Prescription</Title>
        </div>
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
      </div>
    </div>
  );
};

export default AIInventoryPieChart;
