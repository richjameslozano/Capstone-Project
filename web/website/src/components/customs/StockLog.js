import { Table } from 'antd';

// Define your data
const dataSource = [
  {
    key: '1',
    date: '2025-05-30',
    items: 10,
    deliveryNumber: 'DLV-00123',
  },
  {
    key: '2',
    date: '2025-05-29',
    items: 7,
    deliveryNumber: 'DLV-00122',
  },
];

// Define the columns
const columns = [
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
  },
  {
    title: 'No. of Items',
    dataIndex: 'items',
    key: 'items',
  },
  {
    title: 'Delivery #',
    dataIndex: 'deliveryNumber',
    key: 'deliveryNumber',
  },
];

// Use it in your component
const DeliveryTable = () => {
  return <Table dataSource={dataSource} columns={columns} pagination={false} scroll={{ y: 300 }} className="custom-header-table"/>;
};

export default DeliveryTable;
