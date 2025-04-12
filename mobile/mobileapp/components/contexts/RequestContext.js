import React, { createContext, useContext, useState } from 'react';

const RequestContext = createContext();

export const RequestProvider = ({ children }) => {
  const [requestList, setRequestList] = useState([]);

  const addToRequestList = (item) => {
    setRequestList((prevList) => [...prevList, item]);
  };

  const removeFromRequestList = (id) => {
    setRequestList((prevList) => prevList.filter((item) => item.id !== id));
  };

  return (
    <RequestContext.Provider value={{ requestList, addToRequestList, removeFromRequestList }}>
      {children}
    </RequestContext.Provider>
  );
};

export const useRequest = () => useContext(RequestContext);
