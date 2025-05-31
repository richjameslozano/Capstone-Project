import { useState, useEffect } from 'react';
import { Table, Spin, Alert } from 'antd';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig';

const StockLog = ({ inventoryDocId }) => {
  const [stockLogs, setStockLogs] = useState([]);
  const [loading, setLoading] = useState(true); // start loading true
  const [error, setError] = useState(null);

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

        // 🔽 Sort by deliveryNumber descending (e.g., DLV-00010 > DLV-00001)
        const sortedLogs = logs.sort((a, b) => {
            const aNum = parseInt(a.deliveryNumber?.replace('DLV-', '')) || 0;
            const bNum = parseInt(b.deliveryNumber?.replace('DLV-', '')) || 0;
            return bNum - aNum;
        });

        setStockLogs(sortedLogs);
        setLoading(false);
        },
        (err) => {
        setError('Failed to fetch stock logs');
        console.error(err);
        setLoading(false);
        }
    );

    return () => unsubscribe();
  }, [inventoryDocId]);


  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: text => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Inventory Balance',
      dataIndex: 'noOfItems',
      key: 'noOfItems',
    },
    {
      title: 'Delivery #',
      dataIndex: 'deliveryNumber',
      key: 'deliveryNumber',
    },
  ];

  if (loading) return <Spin />;
  if (error) return <Alert message={error} type="error" />;
  if (!stockLogs.length) return <p>No stock logs for this item.</p>;

  return (
    <Table
      dataSource={stockLogs}
      columns={columns}
      pagination={false}
      scroll={{ y: 300 }}
      rowKey="key"
    />
  );
};

export default StockLog;
