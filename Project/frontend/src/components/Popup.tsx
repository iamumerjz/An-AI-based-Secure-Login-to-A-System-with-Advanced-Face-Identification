// src/components/Popup.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePopup } from '../contexts/PopupContext';

interface PopupItemProps {
  popup: {
    id: number;
    message: string;
    type: 'success' | 'error';
  };
  onClose: (id: number) => void;
}

const PopupItem: React.FC<PopupItemProps> = ({ popup, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(popup.id), 300);
  };

  return (
    <div 
      className={`
        transform transition-all duration-500 ease-out mb-3
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <div className={`
        bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border p-5 max-w-sm w-full
        transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]
        ${popup.type === 'success' 
          ? 'border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50' 
          : 'border-red-200 bg-gradient-to-r from-red-50/50 to-pink-50/50'
        }
      `}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className={`
              inline-flex items-center justify-center w-10 h-10 rounded-full text-white text-xl animate-pulse
              ${popup.type === 'success' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                : 'bg-gradient-to-r from-red-500 to-pink-600'
              }
            `}>
              {popup.type === 'success' ? '✓' : '⚠'}
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className={`
              text-base font-semibold mb-1
              ${popup.type === 'success' 
                ? 'text-green-800' 
                : 'text-red-800'
              }
            `}>
              {popup.type === 'success' ? 'Success!' : 'Error!'}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {popup.message}
            </p>
          </div>
          <div className="ml-3 flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 focus:outline-none transition-all duration-200 transform hover:scale-110"
            >
              <span className="sr-only">Close</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className={`
          mt-3 h-1 bg-gray-200 rounded-full overflow-hidden
          ${popup.type === 'success' ? 'bg-green-100' : 'bg-red-100'}
        `}>
          <div className={`
            h-full rounded-full animate-pulse
            ${popup.type === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
              : 'bg-gradient-to-r from-red-500 to-pink-600'
            }
          `} style={{
            animation: 'shrink 4s linear forwards'
          }} />
        </div>
      </div>
    </div>
  );
};

const Popup: React.FC = () => {
  const { popups, closePopup } = usePopup();

  if (popups.length === 0) return null;

  return (
    <>
      {/* Add custom styles */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      
      <div className="fixed top-6 right-6 z-50 space-y-3">
        {popups.map((popup) => (
          <PopupItem
            key={popup.id}
            popup={popup}
            onClose={closePopup}
          />
        ))}
      </div>
    </>
  );
};

export default Popup;