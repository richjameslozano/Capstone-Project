import React, { createContext, useState, useContext, useEffect } from 'react';

const RequestListContext = createContext();

export const RequestListProvider = ({ children }) => {
  const [requestList, setRequestList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);  

  useEffect(() => {
    console.log("Updated Rejected Requests:", rejectedRequests);
  }, [rejectedRequests]);
  
  useEffect(() => {
    console.log("Approved Requests Updated:", approvedRequests);
  }, [approvedRequests]);
  
  useEffect(() => {
    console.log("Rejected Requests Updated:", rejectedRequests);
  }, [rejectedRequests]);
  

  const addToRequestList = (item) => {
    setRequestList((prevList) => [...prevList, item]);
  };

  const removeFromRequestList = (id) => {
    setRequestList((prevList) => prevList.filter((item) => item.id !== id));
  };

  const moveToPendingRequests = (requests) => {
    setPendingRequests((prev) => {
      // Create a map of current pending requests for quick lookup
      const requestMap = new Map(prev.map(req => [req.id, req]));
  
      // Update existing requests if they match, otherwise keep them the same
      requests.forEach(updatedReq => {
        if (requestMap.has(updatedReq.id)) {
          requestMap.set(updatedReq.id, updatedReq); // Update existing request
        } else {
          requestMap.set(updatedReq.id, updatedReq); // Add new request
        }
      });
  
      return Array.from(requestMap.values()); // Convert back to array
    });
  
    setRequestList([]); // Clear request list after moving
  };
  
  const moveToApprovedRequests = (requests) => {
    if (!Array.isArray(requests)) {
      console.error("moveToApprovedRequests: requests is not an array", requests);
      return;
    }
  
    setApprovedRequests((prev) => [...prev, ...requests]);
    setPendingRequests((prev) => prev.filter(req => !requests.some(r => r.id === req.id)));
  };  

  const moveToRejectedRequests = (requests) => {
    if (!Array.isArray(requests)) {
      console.error("moveToRejectedRequests: requests is not an array", requests);
      return;
    }
  
    console.log("Moving to Rejected Requests:", requests); // Debugging log
  
    setRejectedRequests((prev) => [...prev, ...requests]);
    setPendingRequests((prev) => prev.filter(req => !requests.some(r => r.id === req.id)));
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


  return (
    <RequestListContext.Provider value={{
      requestList, setRequestList, addToRequestList, removeFromRequestList,
      transferToRequestList, pendingRequests, moveToPendingRequests,
      removeFromPendingRequests, approvedRequests, moveToApprovedRequests,
      rejectedRequests, moveToRejectedRequests 
    }}>
      {children}
    </RequestListContext.Provider>
  );
};

export const useRequestList = () => useContext(RequestListContext);

// import React, { createContext, useState, useContext, useEffect } from 'react';

// const RequestListContext = createContext();

// export const RequestListProvider = ({ children }) => {
//   const [requestList, setRequestList] = useState([]);
//   const [pendingRequests, setPendingRequests] = useState([]);
//   const [approvedRequests, setApprovedRequests] = useState([]);
//   const [rejectedRequests, setRejectedRequests] = useState([]);

//   // ✅ Logs for approved and rejected requests
//   useEffect(() => {
//     console.log('Updated Rejected Requests:', rejectedRequests);
//   }, [rejectedRequests]);

//   useEffect(() => {
//     console.log('Approved Requests Updated:', approvedRequests);
//   }, [approvedRequests]);

//   useEffect(() => {
//     console.log('Rejected Requests Updated:', rejectedRequests);
//   }, [rejectedRequests]);

//   // ✅ Add new item to request list
//   const addToRequestList = (item) => {
//     setRequestList((prevList) => [...prevList, item]);
//   };

//   // ✅ Remove item by ID
//   const removeFromRequestList = (id) => {
//     setRequestList((prevList) => prevList.filter((item) => item.id !== id));
//   };

//   // ✅ Move to pending requests
//   const moveToPendingRequests = (requests) => {
//     setPendingRequests((prev) => {
//       const requestMap = new Map(prev.map((req) => [req.id, req]));

//       requests.forEach((updatedReq) => {
//         if (requestMap.has(updatedReq.id)) {
//           requestMap.set(updatedReq.id, updatedReq);
//         } else {
//           requestMap.set(updatedReq.id, updatedReq);
//         }
//       });

//       return Array.from(requestMap.values());
//     });

//     setRequestList([]); // Clear request list after moving
//   };

//   // ✅ Move to approved requests
//   const moveToApprovedRequests = (requests) => {
//     if (!Array.isArray(requests)) {
//       console.error('moveToApprovedRequests: requests is not an array', requests);
//       return;
//     }

//     setApprovedRequests((prev) => [...prev, ...requests]);
//     setPendingRequests((prev) =>
//       prev.filter((req) => !requests.some((r) => r.id === req.id))
//     );
//   };

//   // ✅ Move to rejected requests
//   const moveToRejectedRequests = (requests) => {
//     if (!Array.isArray(requests)) {
//       console.error('moveToRejectedRequests: requests is not an array', requests);
//       return;
//     }

//     console.log('Moving to Rejected Requests:', requests); // Debugging log

//     setRejectedRequests((prev) => [...prev, ...requests]);
//     setPendingRequests((prev) =>
//       prev.filter((req) => !requests.some((r) => r.id === req.id))
//     );
//   };

//   // ✅ Remove item from pending requests
//   const removeFromPendingRequests = (id) => {
//     setPendingRequests((prev) => prev.filter((item) => item.id !== id));
//   };

//   // ✅ Transfer to request list with validation
//   const transferToRequestList = (
//     item,
//     quantity,
//     reason,
//     usageType = '',
//     requestorName = '',
//     courseCode = '',
//     room = ''
//   ) => {
//     if (!quantity.trim() || !reason.trim()) {
//       alert('Please enter both quantity and reason of request.');
//       return;
//     }

//     const isAlreadyInList = requestList.some(
//       (reqItem) => reqItem.originalId === item.id
//     );

//     if (isAlreadyInList) {
//       alert('This item is already in the request list.');
//       return;
//     }

//     const newItem = {
//       ...item,
//       originalId: item.id,
//       id: `${item.id}-${Date.now()}`, // Unique ID with timestamp
//       quantity: parseInt(quantity, 10),
//       reason,
//       usageType, // ✅ New field
//       requestorName, // ✅ New field
//       courseCode, // ✅ New field
//       room, // ✅ New field
//       status: 'Pending', // ✅ Default to pending
//     };

//     addToRequestList(newItem);
//   };

//   return (
//     <RequestListContext.Provider
//       value={{
//         requestList,
//         setRequestList,
//         addToRequestList,
//         removeFromRequestList,
//         transferToRequestList,
//         pendingRequests,
//         moveToPendingRequests,
//         removeFromPendingRequests,
//         approvedRequests,
//         moveToApprovedRequests,
//         rejectedRequests,
//         moveToRejectedRequests,
//       }}
//     >
//       {children}
//     </RequestListContext.Provider>
//   );
// };

// export const useRequestList = () => useContext(RequestListContext);
