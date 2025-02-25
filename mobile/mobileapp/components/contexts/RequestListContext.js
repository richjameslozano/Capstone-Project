import React, { createContext, useState, useContext } from 'react';

const RequestListContext = createContext();

export const RequestListProvider = ({ children }) => {
  const [requestList, setRequestList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  const addToRequestList = (item) => {
    setRequestList((prevList) => [...prevList, item]);
  };

  const removeFromRequestList = (id) => {
    setRequestList((prevList) => prevList.filter((item) => item.id !== id));
  };

//   const moveToPendingRequests = (requests) => {
//     setPendingRequests((prev) => [...prev, ...requests]);
//     setRequestList([]);
//   };

const moveToPendingRequests = (updatedRequests) => {
    setPendingRequests(prev => 
      prev.map(req => updatedRequests.find(updated => updated.id === req.id) || req)
    );
  };  

  const removeFromPendingRequests = (id) => {
    setPendingRequests((prev) => prev.filter((item) => item.id !== id));
  };

  const transferToRequestList = (item, quantity, reason) => {
    if (!quantity.trim() || !reason.trim()) {
      alert('Please enter both quantity and reason of request.');
      return;
    }

    const isAlreadyInList = requestList.some(reqItem => reqItem.originalId === item.id);
    
    if (isAlreadyInList) {
      alert('This item is already in the request list.');
      return;
    }
  
    const newItem = {
      ...item,
      originalId: item.id,  
      id: `${item.id}-${Date.now()}`,  
      quantity: parseInt(quantity, 10),
      reason,
    };
  
    addToRequestList(newItem);
  }; 

// const transferToRequestList = (item, quantity, reason) => {
//     if (!quantity.trim() || parseInt(quantity, 10) <= 0) {
//       Alert.alert('Invalid Request', 'Quantity must be greater than 0.');
//       return;
//     }
  
//     if (!reason.trim()) {
//       Alert.alert('Missing Reason', 'Please enter a reason for the request.');
//       return;
//     }
  
//     const isAlreadyInList = requestList.some(reqItem => reqItem.originalId === item.id);
//     if (isAlreadyInList) {
//       Alert.alert('Duplicate Item', 'This item is already in the request list.');
//       return;
//     }
  
//     const newItem = {
//       ...item,
//       originalId: item.id,  
//       id: `${item.id}-${Date.now()}`,  
//       quantity: parseInt(quantity, 10),
//       reason,
//     };
  
//     addToRequestList(newItem);
//   };  

  return (
    <RequestListContext.Provider value={{ 
    requestList, setRequestList, addToRequestList, removeFromRequestList, 
    transferToRequestList, pendingRequests, moveToPendingRequests, removeFromPendingRequests 
    }}>
      {children}
    </RequestListContext.Provider>
  );
};

export const useRequestList = () => useContext(RequestListContext);
