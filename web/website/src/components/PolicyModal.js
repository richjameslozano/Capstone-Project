import React from 'react';
import { Modal, Tabs, Typography, Divider, List } from 'antd';
import { BookOutlined, ShoppingCartOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

const PolicyModal = ({ visible, onCancel }) => {
  const borrowingPolicies = [
    "All borrowing requests must be submitted at least 24 hours in advance",
    "Maximum borrowing period is 7 days for regular items",
    "Equipment borrowing is limited to 3 days maximum",
    "Users are responsible for the condition of borrowed items",
    "Late returns will result in borrowing privileges suspension",
    "Damaged or lost items must be reported immediately",
    "Borrowing privileges may be revoked for repeated violations"
  ];

  const categoryPolicies = [
    "Electronics: Requires special handling and must be returned in original condition",
    "Laboratory Equipment: Only authorized personnel may borrow",
    "Books and Materials: Standard 7-day borrowing period applies",
    "Consumables: Limited quantities per request",
    "Safety Equipment: Must be returned immediately after use",
    "Software Licenses: Subject to vendor terms and conditions",
    "Specialized Tools: Requires supervisor approval"
  ];

  const cancellationPolicies = [
    "Requests can be cancelled up to 2 hours before scheduled pickup",
    "No cancellation fees for requests cancelled within the allowed timeframe",
    "Late cancellations may affect future borrowing privileges",
    "Emergency cancellations must be reported to the administrator",
    "Cancelled items will be made available to other users immediately",
    "Repeated cancellations may result in borrowing restrictions",
    "Cancellation requests must be submitted through the system"
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px'}}>
          <BookOutlined style={{ color: '#1890ff' }} />
          <span>System Policies</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={window.innerWidth <= 768 ? "90%" : 800}
      zIndex={1020}
      style={{ 
        top: window.innerWidth <= 768 ? 20 : 150,
        maxHeight: '80vh',
        overflow: 'auto'
      }}
      bodyStyle={{
        maxHeight: '60vh',
        overflow: 'auto',
        padding: window.innerWidth <= 768 ? '12px' : '24px'
      }}
    >
      <Tabs 
        defaultActiveKey="1" 
        size={window.innerWidth <= 768 ? "small" : "large"}
        tabPosition={window.innerWidth <= 768 ? "top" : "top"}
      >
        <TabPane
          tab={
            <span>
              <ShoppingCartOutlined />
              <span style={{ display: window.innerWidth <= 480 ? 'none' : 'inline' }}>
                Borrowing Policies
              </span>
            </span>
          }
          key="1"
        >
          <div style={{ padding: window.innerWidth <= 768 ? '8px 0' : '16px 0' }}>
            <Title level={4} style={{ color: '#1890ff', marginBottom: '16px' }}>
              Borrowing Guidelines
            </Title>
            <List
              dataSource={borrowingPolicies}
              renderItem={(item, index) => (
                <List.Item style={{ border: 'none', padding: '8px 0' }}>
                  <Text>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '20px', 
                      height: '20px', 
                      backgroundColor: '#1890ff', 
                      color: 'white', 
                      borderRadius: '50%', 
                      textAlign: 'center', 
                      lineHeight: '20px', 
                      fontSize: '12px', 
                      marginRight: '12px' 
                    }}>
                      {index + 1}
                    </span>
                    {item}
                  </Text>
                </List.Item>
              )}
            />
          </div>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BookOutlined />
              <span style={{ display: window.innerWidth <= 480 ? 'none' : 'inline' }}>
                Category Policies
              </span>
            </span>
          }
          key="2"
        >
          <div style={{ padding: window.innerWidth <= 768 ? '8px 0' : '16px 0' }}>
            <Title level={4} style={{ color: '#52c41a', marginBottom: '16px' }}>
              Item Category Guidelines
            </Title>
            <List
              dataSource={categoryPolicies}
              renderItem={(item, index) => (
                <List.Item style={{ border: 'none', padding: '8px 0' }}>
                  <Text>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '20px', 
                      height: '20px', 
                      backgroundColor: '#52c41a', 
                      color: 'white', 
                      borderRadius: '50%', 
                      textAlign: 'center', 
                      lineHeight: '20px', 
                      fontSize: '12px', 
                      marginRight: '12px' 
                    }}>
                      {index + 1}
                    </span>
                    {item}
                  </Text>
                </List.Item>
              )}
            />
          </div>
        </TabPane>

        <TabPane
          tab={
            <span>
              <CloseCircleOutlined />
              <span style={{ display: window.innerWidth <= 480 ? 'none' : 'inline' }}>
                Cancellation Policies
              </span>
            </span>
          }
          key="3"
        >
          <div style={{ padding: window.innerWidth <= 768 ? '8px 0' : '16px 0' }}>
            <Title level={4} style={{ color: '#fa8c16', marginBottom: '16px' }}>
              Request Cancellation Guidelines
            </Title>
            <List
              dataSource={cancellationPolicies}
              renderItem={(item, index) => (
                <List.Item style={{ border: 'none', padding: '8px 0' }}>
                  <Text>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '20px', 
                      height: '20px', 
                      backgroundColor: '#fa8c16', 
                      color: 'white', 
                      borderRadius: '50%', 
                      textAlign: 'center', 
                      lineHeight: '20px', 
                      fontSize: '12px', 
                      marginRight: '12px' 
                    }}>
                      {index + 1}
                    </span>
                    {item}
                  </Text>
                </List.Item>
              )}
            />
          </div>
        </TabPane>
      </Tabs>

      <Divider />
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          For questions or clarifications about these policies, please contact the system administrator.
        </Text>
      </div>
    </Modal>
  );
};

export default PolicyModal;
