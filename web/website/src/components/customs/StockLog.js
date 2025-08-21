import { useState, useEffect } from 'react';
import { Table, Spin, Alert, Modal } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig';

const StockLog = ({ inventoryDocId, editingItem, setDataSource }) => {
  const [stockLogs, setStockLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [grayedRows, setGrayedRows] = useState({});

  useEffect(() => {
    if (!inventoryDocId) return;

    setLoading(true);
    setError(null);

    const logRef = collection(db, 'inventory', inventoryDocId, 'stockLog');

    const unsubscribe = onSnapshot(
      logRef,
      (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          key: doc.id,
          ...doc.data(),
        }));

        const sortedLogs = logs.sort((a, b) => {
          const aNum = parseInt(a.deliveryNumber?.replace('DLV-', '')) || 0;
          const bNum = parseInt(b.deliveryNumber?.replace('DLV-', '')) || 0;
          return bNum - aNum;
        });

        setStockLogs(sortedLogs);
        setLoading(false);
      },
      () => {
        setError('Failed to fetch stock logs');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [inventoryDocId]);

  const handleDeleteClick = (record) => {
    setSelectedRow(record);
    setConfirmVisible(true);
  };

  const confirmDelete = async () => {
    const userId = localStorage.getItem("userId") || "unknown";
    const userName = localStorage.getItem("userName") || "User";

    const deductedQty = Number(selectedRow.noOfItems) || 0;
    const itemMeta = editingItem || selectedRow;

    if (!itemMeta || !itemMeta.itemId) {
      console.error("Missing editingItem metadata");
      setConfirmVisible(false);
      return;
    }

    try {
      const response = await axios.post("https://webnuls.onrender.com/deduct-stocklog-item", {
      // const response = await axios.post("http://localhost:5000/deduct-stocklog-item", {
        userId,
        userName,
        values: {
          quantity: deductedQty,
          editingItem: itemMeta,
          logId: selectedRow.key, 
        },
      });

      if (response.status === 200) {
        // ✅ Gray out the deleted row
        setGrayedRows(prev => ({ ...prev, [selectedRow.key]: true }));

        // ✅ Update the local top-level table count
        if (setDataSource) {
          setDataSource(prev =>
            prev.map(item => {
              if (item.itemId === editingItem.itemId) {
                return {
                  ...item,
                  quantity: (item.quantity || 0) - deductedQty,
                };
              }
              return item;
            })
          );
        }
      } else {
        console.error("Failed to deduct, backend returned non-200");
      }
    } catch (err) {
      console.error("Failed to deduct item:", err);
    }

    setConfirmVisible(false);
    setSelectedRow(null);
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: text => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Number of Items',
      dataIndex: 'noOfItems',
      key: 'noOfItems',
    },
    {
      title: 'Delivery #',
      dataIndex: 'deliveryNumber',
      key: 'deliveryNumber',
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (text) =>
        text ? new Date(text).toLocaleDateString() : <span style={{ color: '#888' }}>N/A</span>,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        record.noOfItems > 0 && !record.deducted ? (
          <DeleteOutlined
            style={{ color: 'red', cursor: 'pointer' }}
            onClick={() => handleDeleteClick(record)}
          />
        ) : null
      ),
    },
  ];

  if (loading) return <Spin />;
  if (error) return <Alert message={error} type="error" />;
  if (!stockLogs.length) return <p>No stock logs for this item.</p>;

  return (
    <>
      <Table
        dataSource={stockLogs}
        columns={columns}
        pagination={5}
        scroll={{ y: 300 }}
        rowKey="key"
        rowClassName={(record) => (record.deducted ? 'grayed-row' : '')}
      />

      <Modal
        title="Confirm"
        open={confirmVisible}
        onOk={confirmDelete}
        onCancel={() => setConfirmVisible(false)}
        okText="Yes"
        cancelText="No"
      >
        Are you sure you want to deduct {selectedRow?.noOfItems} items from inventory?
      </Modal>

      <style>
        {`
          .grayed-row {
            opacity: 0.5;
            pointer-events: none;
          }
        `}
      </style>
    </>
  );
};

export default StockLog;
