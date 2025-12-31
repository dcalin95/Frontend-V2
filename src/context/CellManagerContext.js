// src/context/CellManagerContext.js
// Centralized CellManager data provider - prevents multiple parallel fetches

import React, { createContext, useContext } from 'react';
import useCellManagerData from '../Presale/hooks/useCellManagerData';

const CellManagerContext = createContext();

export const useCellManager = () => {
  const context = useContext(CellManagerContext);
  if (!context) {
    throw new Error('useCellManager must be used within CellManagerProvider');
  }
  return context;
};

export const CellManagerProvider = ({ children }) => {
  // ✅ Single source of truth - hook is called ONCE here
  const cellManagerData = useCellManagerData();

  return (
    <CellManagerContext.Provider value={cellManagerData}>
      {children}
    </CellManagerContext.Provider>
  );
};

