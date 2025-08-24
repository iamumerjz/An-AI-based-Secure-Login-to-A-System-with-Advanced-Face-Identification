// src/components/LoadingComponents.tsx
'use client';

import React from 'react';

// Skeleton loader for general content
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Webcam skeleton loader
export const WebcamSkeleton: React.FC = () => (
  <div className="w-full aspect-video bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-center text-gray-400">
      <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
      <p className="text-sm">Loading camera...</p>
    </div>
  </div>
);

// Card skeleton for main menu and other cards
export const CardSkeleton: React.FC = () => (
  <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
    <Skeleton className="h-8 w-3/4 mx-auto mb-8" />
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
);

// Welcome page skeleton
export const WelcomeSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <Skeleton className="h-8 w-32 mx-auto mb-2" />
        <Skeleton className="h-6 w-40 mx-auto mb-6" />
        
        <div className="mb-6">
          <div className="w-64 h-64 mx-auto rounded-full bg-gray-200 animate-pulse border-4 border-blue-200" />
        </div>

        <div className="text-gray-600 mb-6 space-y-2">
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-3 w-36 mx-auto" />
        </div>

        <Skeleton className="h-12 w-32 mx-auto" />
      </div>
    </div>
  </div>
);

// Spinning loader
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <div className="w-full h-full border-2 border-white border-t-transparent rounded-full"></div>
    </div>
  );
};

// Page transition wrapper
export const PageTransition: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`animate-fadeIn ${className}`}>
    {children}
  </div>
);

// Button with loading state
export const LoadingButton: React.FC<{
  children: React.ReactNode;
  isLoading: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}> = ({ 
  children, 
  isLoading, 
  onClick, 
  disabled = false, 
  className = '',
  variant = 'primary'
}) => {
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300',
    secondary: 'bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300',
    danger: 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`
        ${variantClasses[variant]}
        text-white py-2 px-6 rounded-lg font-semibold 
        transition-all duration-200 transform
        hover:scale-105 active:scale-95
        disabled:cursor-not-allowed disabled:transform-none
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
};