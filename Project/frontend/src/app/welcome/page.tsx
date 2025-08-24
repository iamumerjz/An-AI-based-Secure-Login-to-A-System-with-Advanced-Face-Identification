// src/app/welcome/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { usePopup } from '../../contexts/PopupContext';
import { WelcomeSkeleton, LoadingButton, PageTransition } from '../../components/LoadingComponents';

const WelcomePage: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { showPopup } = usePopup();
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Redirect to main menu if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Show stats after a delay for nice animation
    if (user) {
      const timer = setTimeout(() => setShowStats(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    // Update current time every minute to refresh session duration
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      // Call the backend logout endpoint to log the event
      const response = await fetch('http://localhost:5000/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: user?.name
        }),
      });

      if (response.ok) {
        console.log('Logout logged successfully');
      } else {
        console.warn('Failed to log logout event');
      }
    } catch (error) {
      console.error('Error logging logout:', error);
    }

    // Proceed with frontend logout regardless of logging success
    logout();
    showPopup("You have been logged out successfully!", 'success');
    router.push('/');
  };

  const formatSessionDuration = () => {
    if (!user?.loginTime) return '0 minutes';
    const loginTime = new Date(user.loginTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - loginTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Less than a minute';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    
    const hours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not provided';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const calculateAge = (dateOfBirth: string | undefined) => {
    if (!dateOfBirth) return null;
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch {
      return null;
    }
  };

  // Show loading skeleton while checking authentication
  if (isLoading) {
    return <WelcomeSkeleton />;
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8 transform transition-all duration-500 hover:shadow-2xl">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full text-white text-3xl mb-4 animate-bounce">
              🎉
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2 animate-fadeIn">
              Welcome Back!
            </h1>
            <h2 className="text-3xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 animate-fadeIn delay-200 font-bold">
              {user.name}
            </h2>
            {user.position && user.department && (
              <p className="text-lg text-gray-600 animate-fadeIn delay-300">
                {user.position} • {user.department}
              </p>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
            
            {/* Information Sections - Takes 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Personal Information Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span>👤</span> Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Full Name *</label>
                      <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200">
                        {user.name || 'Not provided'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Phone Number *</label>
                      <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200">
                        {user.phone || 'Not provided'}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-600">Gender</label>
                      <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200 capitalize">
                        {user.gender ? user.gender.replace('-', ' ') : 'Not specified'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Email Address *</label>
                      <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200 break-all">
                        {user.email || 'Not provided'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Date of Birth *</label>
                      <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200">
                        {user.date_of_birth ? (
                          <span>
                            {formatDate(user.date_of_birth)}
                            {calculateAge(user.date_of_birth) && (
                              <span className="text-gray-500 text-sm ml-2">
                                (Age: {calculateAge(user.date_of_birth)})
                              </span>
                            )}
                          </span>
                        ) : 'Not provided'}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-600">Address</label>
                      <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200">
                        {user.address || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span>💼</span> Professional Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Department</label>
                    <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200">
                      {user.department || 'Not specified'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Position</label>
                    <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200">
                      {user.position || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span>🚨</span> Emergency Contact
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Emergency Contact Name *</label>
                    <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200">
                      {user.emergency_contact || 'Not provided'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Emergency Contact Phone *</label>
                    <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200">
                      {user.emergency_phone || 'Not provided'}
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600 text-xl">⚠️</span>
                    <div>
                      <h4 className="font-semibold text-yellow-800">Emergency Contact Information</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        This information is kept secure and will only be used in case of emergencies.
                        Please ensure your emergency contact details are always up to date.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Photo and Stats - Takes 1 column */}
            <div className="lg:col-span-1">
              {/* Profile Photo */}
              <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    {!imageLoaded && (
                      <div className="w-48 h-48 rounded-full bg-gray-200 animate-pulse border-4 border-blue-200 flex items-center justify-center shadow-lg">
                        <div className="text-gray-400">
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    <img
                      src={`data:image/jpeg;base64,${user.image}`}
                      alt="User Profile"
                      className={`
                        w-48 h-48 object-cover rounded-full border-4 border-blue-200 shadow-lg
                        transition-all duration-500 transform
                        ${imageLoaded 
                          ? 'opacity-100 scale-100 hover:scale-105' 
                          : 'opacity-0 scale-95 absolute inset-0'
                        }
                      `}
                      onLoad={() => setImageLoaded(true)}
                    />
                    
                    {/* Online Status Badge */}
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Cards */}
              {showStats && (
                <div className="space-y-4 animate-fadeIn delay-300">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👤</span>
                      <div>
                        <h3 className="font-semibold text-green-700">User ID</h3>
                        <p className="text-sm text-green-600">{user.user_id || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <h3 className="font-semibold text-blue-700">Login Count</h3>
                        <p className="text-sm text-blue-600">{user.login_count || 1} times</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⏱️</span>
                      <div>
                        <h3 className="font-semibold text-purple-700">Session Time</h3>
                        <p className="text-sm text-purple-600">{formatSessionDuration()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📅</span>
                      <div>
                        <h3 className="font-semibold text-indigo-700">Member Since</h3>
                        <p className="text-sm text-indigo-600">{formatDate(user.registration_date)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-xl border border-pink-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🕐</span>
                      <div>
                        <h3 className="font-semibold text-pink-700">Last Login</h3>
                        <p className="text-sm text-pink-600">
                          {user.last_login ? formatDate(user.last_login) : 'First login'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-lg font-medium animate-fadeIn delay-300 shadow-md">
              <span className="text-2xl animate-pulse">✨</span>
              Face recognition login successful!
              <span className="text-2xl animate-pulse">✨</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-4">
            

            <LoadingButton
              onClick={handleLogout}
              isLoading={false}
              variant="danger"
              className="py-3 px-6 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <span className="text-lg">🚪</span>
              Secure Logout
            </LoadingButton>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <div className="flex justify-center items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Logged in securely via face recognition</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default WelcomePage;