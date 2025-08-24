// src/app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { CardSkeleton, PageTransition } from '../components/LoadingComponents';

const MainMenu: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Redirect to welcome page if already authenticated
    if (!isLoading && isAuthenticated) {
      router.push('/welcome');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Show content after a delay for nice animation
    if (!isLoading) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleNavigation = (page: string) => {
    router.push(`/${page}`);
  };

  // Show loading skeleton while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <CardSkeleton />
      </div>
    );
  }

  return (
    <PageTransition className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-2">
      <div className="max-w-2xl w-full mx-2">
        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-xl shadow-xl transform transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
          
          {/* Header Section with animated elements */}
          <div className="text-center mb-10">
            <div className="inline-block p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white text-3xl mb-3 animate-bounce">
              🔍
            </div>
            <h1 className="text-3xl font-bold mb-2 animate-fadeIn leading-relaxed" style={{background: 'linear-gradient(to right, #2563eb, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: '#2563eb'}}>
              Face Recognition
            </h1>
            <h2 className="text-xl text-gray-600 animate-fadeIn delay-200 font-medium">
              Security System
            </h2>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-base font-medium animate-fadeIn delay-300 shadow-md">
              <span className="text-xl animate-pulse">🛡️</span>
              Secure Access Portal
              <span className="text-xl animate-pulse">🛡️</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-5 animate-fadeIn delay-500">
            <button
              onClick={() => handleNavigation('login')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95 shadow-lg"
            >
              <span className="flex items-center justify-center gap-3 text-base">
                <span className="text-xl animate-pulse">🔐</span>
                Login to System
                <span className="text-xl animate-pulse">🔐</span>
              </span>
            </button>
            
            <button
              onClick={() => handleNavigation('register')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95 shadow-lg"
            >
              <span className="flex items-center justify-center gap-3 text-base">
                <span className="text-xl animate-pulse">👤</span>
                Register New User
                <span className="text-xl animate-pulse">👤</span>
              </span>
            </button>
          </div>

          {/* Feature Highlights */}
          {showContent && (
            <div className="mt-8 animate-fadeIn delay-700">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 hover:shadow-md transition-all duration-300 transform hover:scale-105">
                  <div className="text-xl mb-1">⚡</div>
                  <div className="text-xs text-green-700 font-medium">Fast</div>
                </div>
                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-300 transform hover:scale-105">
                  <div className="text-xl mb-1">🔒</div>
                  <div className="text-xs text-blue-700 font-medium">Secure</div>
                </div>
                <div className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:shadow-md transition-all duration-300 transform hover:scale-105">
                  <div className="text-xl mb-1">🎯</div>
                  <div className="text-xs text-purple-700 font-medium">Accurate</div>
                </div>
              </div>
            </div>
          )}

          {/* Success Indicators */}
          <div className="mt-6 flex justify-center animate-fadeIn delay-900">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default MainMenu;