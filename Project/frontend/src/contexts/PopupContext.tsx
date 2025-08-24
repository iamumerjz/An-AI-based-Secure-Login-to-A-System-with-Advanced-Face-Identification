// src/contexts/PopupContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface PopupData {
  message: string;
  type: 'success' | 'error';
  id: number;
}

interface PopupContextType {
  popups: PopupData[];
  showPopup: (message: string, type?: 'success' | 'error', duration?: number) => void;
  closePopup: (id: number) => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within PopupProvider');
  }
  return context;
};

interface PopupProviderProps {
  children: ReactNode;
}

export const PopupProvider: React.FC<PopupProviderProps> = ({ children }) => {
  const [popups, setPopups] = useState<PopupData[]>([]);
  const [nextId, setNextId] = useState(1);

  const showPopup = (message: string, type: 'success' | 'error' = 'success', duration: number = 4000) => {
    const id = nextId;
    setNextId(prev => prev + 1);
    
    const newPopup: PopupData = { message, type, id };
    setPopups(prev => [...prev, newPopup]);

    // Auto-dismiss after specified duration
    setTimeout(() => {
      closePopup(id);
    }, duration);
  };

  const closePopup = (id: number) => {
    setPopups(prev => prev.filter(popup => popup.id !== id));
  };

  const value: PopupContextType = {
    popups,
    showPopup,
    closePopup
  };

  return (
    <PopupContext.Provider value={value}>
      {children}
    </PopupContext.Provider>
  );
};