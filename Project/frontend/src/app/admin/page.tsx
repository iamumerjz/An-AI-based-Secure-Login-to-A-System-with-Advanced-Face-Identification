'use client';

import React, { useState, useEffect } from 'react';

// Admin credentials (in production, use environment variables)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

interface User {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  department: string;
  position: string;
  emergency_contact: string;
  emergency_phone: string;
  registration_date: string;
  last_login: string;
  login_count: number;
  images: string[];
  training_stats: {
    photos: number;
    quality: number;
    type: string;
  };
}

interface LoginLog {
  user_id: string;
  name: string;
  timestamp: string;
  action: string;
}

interface AdminData {
  statistics: {
    total_users: number;
    multi_photo_users: number;
    single_photo_users: number;
    total_logins: number;
    avg_photos_per_user: number;
  };
  users: User[];
  logs: LoginLog[];
}

const AdminPortal = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Handle admin login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchAdminData();
    } else {
      setLoginError('Invalid username or password');
    }
  };

  // Fetch admin data from backend
  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/admin/data');
      const data = await response.json();
      
      if (data.success) {
        setAdminData(data.data);
      } else {
        console.error('Failed to fetch admin data:', data.message);
        // Fallback to show some UI even if backend fails
        setAdminData({
          statistics: {
            total_users: 0,
            multi_photo_users: 0,
            single_photo_users: 0,
            total_logins: 0,
            avg_photos_per_user: 0
          },
          users: [],
          logs: []
        });
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      // Fallback to show some UI even if backend fails
      setAdminData({
        statistics: {
          total_users: 0,
          multi_photo_users: 0,
          single_photo_users: 0,
          total_logins: 0,
          avg_photos_per_user: 0
        },
        users: [],
        logs: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    window.location.href = '/';
    //setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setAdminData(null);
    setSelectedUser(null);
    setSearchTerm('');
  };

  // Navigate back to main menu
  const navigateBack = () => {
    // In a real Next.js app, you would use router.push('/')
    window.location.href = '/';
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatShortDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Filter users based on search
  const filteredUsers = adminData?.users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8 w-full max-w-md transform transition-all duration-500 hover:shadow-2xl hover:scale-[1.01]">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-white text-3xl mb-4 animate-bounce">
              🔐
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 animate-fadeIn">Admin Portal</h1>
            <p className="text-gray-600 animate-fadeIn delay-200">Enter credentials to access the admin dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-indigo-500 bg-white transition-all duration-300"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-indigo-500 bg-white transition-all duration-300"
                placeholder="Enter password"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-shake">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? '🔄 Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm mb-4">Demo credentials: admin / admin123</p>
            <button
              onClick={navigateBack}
              className="text-indigo-500 hover:text-indigo-600 transition-colors duration-200 text-sm font-medium"
            >
              ← Back to Main Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-6 transform transition-all duration-500 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-white text-2xl animate-bounce">
                👨‍💼
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-gray-600">Face Recognition System Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                System Online
              </div>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        {adminData && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Users</p>
                    <p className="text-2xl font-bold">{adminData.statistics.total_users}</p>
                  </div>
                  <div className="text-3xl opacity-80">👥</div>
                </div>
              </div>
              
              
              
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Logins</p>
                    <p className="text-2xl font-bold">{adminData.statistics.total_logins}</p>
                  </div>
                  <div className="text-3xl opacity-80">🔑</div>
                </div>
              </div>
              
              
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Activity Logs Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 transform transition-all duration-500 hover:shadow-2xl">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    📝 Recent Activity
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {adminData.logs.length > 0 ? (
                      adminData.logs.slice(0, 15).map((log, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-3 h-3 rounded-full ${
                            log.action === 'in' ? 'bg-green-500' : 'bg-red-500'
                          } animate-pulse`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {log.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                log.action === 'in' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {log.action === 'in' ? 'IN' : 'OUT'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No activity logs available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Users Management */}
              <div className="lg:col-span-3">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 transform transition-all duration-500 hover:shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      👥 Registered Users ({filteredUsers.length})
                    </h3>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-all duration-300"
                    />
                  </div>

                  {filteredUsers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredUsers.map((user) => (
                        <div key={user.user_id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              {user.images && user.images.length > 0 ? (
                                <img
                                  className="h-16 w-16 rounded-full object-cover border-2 border-blue-200 shadow-md"
                                  src={`data:image/jpeg;base64,${user.images[0]}`}
                                  alt={user.name}
                                />
                              ) : (
                                <div className="h-16 w-16 rounded-full bg-gray-300 border-2 border-blue-200 shadow-md flex items-center justify-center">
                                  <span className="text-gray-500 text-2xl">👤</span>
                                </div>
                              )}
                              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                                user.last_login && new Date(user.last_login) > new Date(Date.now() - 24*60*60*1000) 
                                  ? 'bg-green-500' 
                                  : 'bg-gray-400'
                              }`}></div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-gray-900 truncate">
                                {user.name}
                              </div>
                              <div className="text-xs text-gray-600 truncate mb-1">
                                {user.email}
                              </div>
                              
                              
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                  Logins: {user.login_count}
                                </div>
                                <button
                                  onClick={() => setSelectedUser(user)}
                                  className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-lg transition-all duration-200 transform hover:scale-105"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">👥</div>
                      <p className="text-gray-500 font-medium">
                        {searchTerm ? 'No users match your search' : 'No users registered yet'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 border border-white/30">
              
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {selectedUser.images && selectedUser.images.length > 0 ? (
                        <img
                          className="h-16 w-16 rounded-full object-cover border-4 border-white/30 shadow-lg"
                          src={`data:image/jpeg;base64,${selectedUser.images[0]}`}
                          alt={selectedUser.name}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-white/20 border-4 border-white/30 shadow-lg flex items-center justify-center">
                          <span className="text-white text-2xl">👤</span>
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-white ${
                        selectedUser.last_login && new Date(selectedUser.last_login) > new Date(Date.now() - 24*60*60*1000) 
                          ? 'bg-green-500' 
                          : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{selectedUser.name}</h3>
                      <p className="text-indigo-100">{selectedUser.user_id} • {selectedUser.position || 'Not specified'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-white hover:text-gray-200 text-3xl transform transition-all duration-200 hover:scale-110 bg-white/20 rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Personal Information */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                      👤 Personal Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Full Name</label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm">{selectedUser.name}</div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">User ID</label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm font-mono">{selectedUser.user_id}</div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Date of Birth</label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm">
                          {formatShortDate(selectedUser.date_of_birth)}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Gender</label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm capitalize">
                          {selectedUser.gender || 'Not specified'}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Address</label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm">
                          {selectedUser.address || 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                      📞 Contact Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Email Address</label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm break-all">{selectedUser.email}</div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Phone Number</label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm">{selectedUser.phone}</div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Department</label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm">
                          {selectedUser.department || 'Not specified'}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Position</label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm">
                          {selectedUser.position || 'Not specified'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Emergency Contact */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                      🚨 Emergency Contact
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Contact Name</label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm">
                          {selectedUser.emergency_contact || 'Not provided'}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Contact Phone</label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm">
                          {selectedUser.emergency_phone || 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Account Information */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                      📊 Account Statistics
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Registration Date</label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm">
                          {formatShortDate(selectedUser.registration_date)}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Last Login</label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm">
                          {selectedUser.last_login ? formatDate(selectedUser.last_login) : 'Never logged in'}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Total Logins</label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm font-semibold">
                          {selectedUser.login_count} times
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* User Activity Status */}
                <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${
                        selectedUser.last_login && new Date(selectedUser.last_login) > new Date(Date.now() - 24*60*60*1000) 
                          ? 'bg-green-500 animate-pulse' 
                          : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <h5 className="font-semibold text-gray-700">Activity Status</h5>
                        <p className="text-sm text-gray-600">
                          {selectedUser.last_login && new Date(selectedUser.last_login) > new Date(Date.now() - 24*60*60*1000)
                            ? 'Total Logins'
                            : selectedUser.last_login
                            ? 'Last seen: ' + formatDate(selectedUser.last_login)
                            : 'Never logged in'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-700">{selectedUser.login_count}</div>
                      
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50/50 backdrop-blur-sm rounded-b-xl flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortal;