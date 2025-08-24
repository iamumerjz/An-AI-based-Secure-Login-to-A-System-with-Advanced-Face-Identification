// src/app/layout.tsx
import React from 'react';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { PopupProvider } from '../contexts/PopupContext';
import Popup from '../components/Popup';

export const metadata = {
  title: 'Face Recognition System',
  description: 'A face recognition authentication system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <PopupProvider>
            <div className="App">
              <div className="animate-fadeIn">
                {children}
              </div>
              <Popup />
            </div>
          </PopupProvider>
        </AuthProvider>
      </body>
    </html>
  );
}