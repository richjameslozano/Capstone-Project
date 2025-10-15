import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import './styles/NotAuthorized.css';

const NotAuthorized = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    const role = (localStorage.getItem("userPosition") || "").trim().toLowerCase();
    if (role === "user") {
      navigate("/main/requisition");

    } else if (role === "admin" || role === "super-user") {
      navigate("/main/dashboard");

    } else {
      navigate("/");
    }
  };

  return (
    <div className="not-authorized-container">
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button type="primary" onClick={handleBack}>
            Back Home
          </Button>
        }
      />
    </div>
  );
};

export default NotAuthorized;
