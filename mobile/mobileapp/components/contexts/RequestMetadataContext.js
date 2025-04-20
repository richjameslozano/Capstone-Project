import React, { createContext, useState, useContext } from 'react';

const RequestMetadataContext = createContext();

export const RequestMetadataProvider = ({ children }) => {
  const [metadata, setMetadata] = useState({
    dateRequired: '',
    timeFrom: '',
    timeTo: '',
    program: '',
    room: '',
    reason: ''
  });

  return (
    <RequestMetadataContext.Provider value={{ metadata, setMetadata }}>
      {children}
    </RequestMetadataContext.Provider>
  );
};

export const useRequestMetadata = () => useContext(RequestMetadataContext);