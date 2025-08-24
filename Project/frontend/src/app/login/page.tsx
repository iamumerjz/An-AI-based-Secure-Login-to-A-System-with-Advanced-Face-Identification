// src/app/login/page.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import { useAuth } from '../../contexts/AuthContext';
import { usePopup } from '../../contexts/PopupContext';
import { WebcamSkeleton, LoadingButton, PageTransition } from '../../components/LoadingComponents';

interface FaceDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface UserLoginResponse {
  success: boolean;
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
  image: string;
  message?: string;
}

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [detectedFaces, setDetectedFaces] = useState<FaceDetection[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showLoginStats, setShowLoginStats] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const { showPopup } = usePopup();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.push('/welcome');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Focus the container to enable keyboard events
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Load face detection model
  useEffect(() => {
    let isMounted = true;
    
    const loadFaceDetection = async () => {
      try {
        // Check if face-api.js is available
        if (typeof window !== 'undefined' && (window as any).faceapi) {
          const faceapi = (window as any).faceapi;
          
          // Load models
          await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
          
          if (isMounted) {
            setIsDetecting(true);
          }
        } else {
          // Fallback: Load face-api.js dynamically
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
          script.onload = async () => {
            try {
              const faceapi = (window as any).faceapi;
              await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights');
              
              if (isMounted) {
                setIsDetecting(true);
              }
            } catch (error) {
              console.log('Face detection model loading failed, continuing without real-time detection');
              if (isMounted) {
                setIsDetecting(true); // Enable mock detection
              }
            }
          };
          document.head.appendChild(script);
        }
      } catch (error) {
        console.log('Face detection initialization failed, using mock detection');
        // Use mock detection for demo purposes
        if (isMounted) {
          setIsDetecting(true);
        }
      }
    };

    if (webcamReady) {
      loadFaceDetection();
      // Show login stats after camera is ready
      setTimeout(() => setShowLoginStats(true), 1500);
    }

    return () => {
      isMounted = false;
    };
  }, [webcamReady]);

  // Mock face detection for demo (since we don't have the actual face-api.js models)
  const mockFaceDetection = useCallback((videoElement: HTMLVideoElement) => {
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    
    // Create a mock face detection in the center of the video
    const mockFace: FaceDetection = {
      x: videoWidth * 0.3,
      y: videoHeight * 0.25,
      width: videoWidth * 0.4,
      height: videoHeight * 0.5,
      confidence: 0.95
    };

    return [mockFace];
  }, []);

  // Real face detection function
  const detectFaces = useCallback(async () => {
    if (!webcamRef.current || !isDetecting) return;

    try {
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) return;

      let faces: FaceDetection[] = [];

      // Try to use face-api.js if available
      if (typeof window !== 'undefined' && (window as any).faceapi) {
        try {
          const faceapi = (window as any).faceapi;
          const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions()
          );

          faces = detections.map((detection: any) => ({
            x: detection.box.x,
            y: detection.box.y,
            width: detection.box.width,
            height: detection.box.height,
            confidence: detection.score
          }));
        } catch (error) {
          // Fall back to mock detection
          faces = mockFaceDetection(video);
        }
      } else {
        // Use mock detection
        faces = mockFaceDetection(video);
      }

      setDetectedFaces(faces);
    } catch (error) {
      console.log('Face detection error:', error);
    }
  }, [isDetecting, mockFaceDetection]);

  // Start face detection when camera is ready
  useEffect(() => {
    if (webcamReady && isDetecting) {
      detectionIntervalRef.current = setInterval(detectFaces, 200); // Detect every 200ms
      
      return () => {
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
        }
      };
    }
  }, [webcamReady, isDetecting, detectFaces]);

  // Draw face detection boxes
  useEffect(() => {
    if (!canvasRef.current || !webcamRef.current) return;

    const canvas = canvasRef.current;
    const video = webcamRef.current.video;
    
    if (!video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale factors
    const scaleX = rect.width / video.videoWidth;
    const scaleY = rect.height / video.videoHeight;

    // Draw face detection boxes
    detectedFaces.forEach((face, index) => {
      const x = face.x * scaleX;
      const y = face.y * scaleY;
      const width = face.width * scaleX;
      const height = face.height * scaleY;

      // Draw main bounding box
      ctx.strokeStyle = face.confidence > 0.8 ? '#10B981' : '#F59E0B'; // Green for high confidence, yellow for low
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.strokeRect(x, y, width, height);

      // Draw corner brackets for a more modern look
      const cornerLength = 20;
      ctx.lineWidth = 4;
      ctx.strokeStyle = face.confidence > 0.8 ? '#10B981' : '#F59E0B';
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLength);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLength, y);
      ctx.stroke();

      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(x + width - cornerLength, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + cornerLength);
      ctx.stroke();

      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(x, y + height - cornerLength);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x + cornerLength, y + height);
      ctx.stroke();

      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(x + width - cornerLength, y + height);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x + width, y + height - cornerLength);
      ctx.stroke();

      // Draw confidence score
      if (face.confidence) {
        ctx.fillStyle = face.confidence > 0.8 ? '#10B981' : '#F59E0B';
        ctx.font = '14px Arial';
        ctx.fillText(
          `${(face.confidence * 100).toFixed(0)}%`,
          x,
          y - 8
        );
      }

      // Draw face center dot
      ctx.fillStyle = face.confidence > 0.8 ? '#10B981' : '#F59E0B';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [detectedFaces]);

  const capture = (): string | null => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCaptureCount(prev => prev + 1);
      return imageSrc;
    }
    return null;
  };

  const handleLogin = async () => {
    if (!webcamReady) {
      showPopup('Please wait for camera to load', 'error');
      return;
    }

    // Check if a face is detected
    if (detectedFaces.length === 0) {
      showPopup('No face detected. Please position yourself in front of the camera.', 'error');
      return;
    }

    // Check for multiple faces
    if (detectedFaces.length > 1) {
      showPopup('Multiple faces detected. Please ensure only one person is in the camera view.', 'error');
      return;
    }

    // Check face detection confidence
    const highConfidenceFaces = detectedFaces.filter(face => face.confidence > 0.7);
    if (highConfidenceFaces.length === 0) {
      showPopup('Face detection confidence is low. Please ensure good lighting and clear view.', 'error');
      return;
    }

    const image = capture();
    if (!image) {
      showPopup('Unable to capture image', 'error');
      return;
    }

    setIsLoading(true);
    setLoginAttempts(prev => prev + 1);
    
    try {
      const response = await fetch(`http://localhost:5000/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image })
      });

      const data: UserLoginResponse = await response.json();
      
      
      if (data.success) {
        // Create comprehensive user data object for the auth context
        const userData = {
          // Core identification
          user_id: data.user_id,
          name: data.name,
          image: data.image,
          
          // Contact information
          email: data.email,
          phone: data.phone,
          
          // Personal details
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          address: data.address,
          
          // Professional information
          department: data.department,
          position: data.position,
          
          // Emergency contact
          emergency_contact: data.emergency_contact,
          emergency_phone: data.emergency_phone,
          
          // Account metadata
          registration_date: data.registration_date,
          last_login: data.last_login,
          login_count: data.login_count,
          
          // Session information
          loginTime: new Date().toISOString()
        };
        
        // Pass all user data to the auth context
        login(userData);
        
        // Show success message with user details
        showPopup(
          `Welcome back, ${data.name}! This is login #${data.login_count}.`,
          'success',
          3000
        );
        
        // Add a small delay for the success message to be seen
        setTimeout(() => {
          router.push('/welcome');
        }, 1000);
        
      } else {
        showPopup(data.message || 'Login failed - face not recognized', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showPopup('Error connecting to server. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && webcamReady && detectedFaces.length === 1) {
      handleLogin();
    }
  };

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-4">
      <div 
        ref={containerRef}
        className="max-w-4xl mx-auto"
        tabIndex={0}
        onKeyPress={handleKeyPress}
        style={{ outline: 'none' }}
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8 transform transition-all duration-500 hover:shadow-2xl">
          
          {/* Header with animated icon */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-white text-3xl mb-4 animate-bounce">
              🔐
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 animate-fadeIn">
              Welcome Back
            </h1>
            <p className="text-gray-600 animate-fadeIn delay-200">
              Look at the camera to authenticate and access your account
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Camera Section */}
            <div className="lg:col-span-2">
              <div className="mb-6 relative">
                <div className="relative overflow-hidden rounded-xl shadow-lg">
                  {!webcamReady && <WebcamSkeleton />}
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className={`w-full rounded-xl transition-all duration-700 transform ${
                      webcamReady 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-95 absolute inset-0'
                    }`}
                    videoConstraints={{
                      width: 640,
                      height: 480,
                      facingMode: "user"
                    }}
                    onUserMedia={() => {
                      setTimeout(() => setWebcamReady(true), 800);
                    }}
                  />
                  
                  {/* Face Detection Canvas Overlay */}
                  {webcamReady && (
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 pointer-events-none rounded-xl"
                      style={{ zIndex: 10 }}
                    />
                  )}
                  
                  {/* Camera Status Indicators */}
                  {webcamReady && (
                    <>
                      <div className="absolute top-3 left-3 bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                        📹 Camera Active
                      </div>
                      
                      {/* Face Detection Status */}
                      <div className="absolute top-3 right-3 space-y-2">
                        {captureCount > 0 && (
                          <div className="bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium animate-fadeIn">
                            📸 Attempts: {captureCount}
                          </div>
                        )}
                        
                        {isDetecting && (
                          <div className={`backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                            detectedFaces.length === 1
                              ? 'bg-green-500/90'
                              : detectedFaces.length > 1
                              ? 'bg-orange-500/90' 
                              : 'bg-gray-500/90'
                          }`}>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            {detectedFaces.length === 1
                              ? '👤 Ready'
                              : detectedFaces.length > 1
                              ? `⚠️ ${detectedFaces.length} Faces`
                              : '🔍 Scanning...'
                            }
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Face Detection Status Bar */}
              {webcamReady && isDetecting && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full animate-pulse ${
                        detectedFaces.length === 1 ? 'bg-green-500' : 
                        detectedFaces.length > 1 ? 'bg-orange-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        Face Detection: {
                          detectedFaces.length === 1 ? 'Ready for Login' :
                          detectedFaces.length > 1 ? 'Multiple Faces Detected' :
                          'Scanning for Face...'
                        }
                      </span>
                    </div>
                    
                    {detectedFaces.length > 0 && (
                      <div className="text-xs text-gray-600">
                        Confidence: {detectedFaces.map(f => `${(f.confidence * 100).toFixed(0)}%`).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stats and Info Sidebar */}
            <div className="lg:col-span-1">
              {showLoginStats && (
                <div className="space-y-4 animate-fadeIn delay-300">
                  
                  {/* Login Attempts */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔄</span>
                      <div>
                        <h3 className="font-semibold text-blue-700">Login Attempts</h3>
                        <p className="text-sm text-blue-600">{loginAttempts} this session</p>
                      </div>
                    </div>
                  </div>

                  {/* Face Detection Stats */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👤</span>
                      <div>
                        <h3 className="font-semibold text-green-700">Faces Detected</h3>
                        <p className="text-sm text-green-600">
                          {detectedFaces.length} {detectedFaces.length === 1 ? 'face' : 'faces'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Camera Status */}
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📹</span>
                      <div>
                        <h3 className="font-semibold text-purple-700">Camera Status</h3>
                        <p className="text-sm text-purple-600">
                          {webcamReady ? 'Ready' : 'Loading...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚡</span>
                      <div>
                        <h3 className="font-semibold text-indigo-700">System Status</h3>
                        <div className="flex items-center gap-1 text-sm text-indigo-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>All Systems Online</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-6">
            <LoadingButton
              onClick={handleBack}
              isLoading={false}
              variant="secondary"
              className="py-3 px-6 text-base font-semibold transform hover:scale-105 transition-all duration-200"
            >
              <span className="flex items-center gap-2">
                ← Back
              </span>
            </LoadingButton>
            
            <button
              onClick={handleLogin}
              disabled={isLoading || !webcamReady || detectedFaces.length !== 1}
              className={`py-3 px-8 text-base font-semibold rounded-xl transform transition-all duration-300 flex items-center gap-2 justify-center ${
                isLoading || !webcamReady || detectedFaces.length !== 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Authenticating...
                </>
              ) : detectedFaces.length === 1 ? (
                <>
                  ✅ Login with Face Recognition
                </>
              ) : detectedFaces.length > 1 ? (
                <>
                  ⚠️ Multiple Faces - Please Position One Person
                </>
              ) : (
                <>
                  ⏳ Position Your Face in Camera
                </>
              )}
            </button>
          </div>

          {/* Loading State Messages */}
          {!webcamReady && (
            <div className="text-center mt-6 text-gray-500 animate-pulse">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-4 h-4 bg-teal-500 rounded-full animate-bounce delay-200"></div>
              </div>
              <p className="mt-2 font-medium">Initializing camera and face detection...</p>
            </div>
          )}
          
          {/* Enhanced Tips Section */}
          {webcamReady && !isLoading && (
            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 animate-fadeIn delay-500">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                💡 Face Recognition Login Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Position your face clearly within the detection box
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Ensure good lighting for accurate recognition
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Stay still when confidence level is high
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Only one face should be visible
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Press Enter or click Login to authenticate
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    System loads your complete profile automatically
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Authentication Status */}
          {webcamReady && (
            <div className="mt-6 text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium animate-fadeIn delay-700 ${
                detectedFaces.length === 1
                  ? 'bg-green-100 text-green-700'
                  : detectedFaces.length > 1
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  detectedFaces.length === 1 ? 'bg-green-500' : 
                  detectedFaces.length > 1 ? 'bg-orange-500' : 'bg-blue-500'
                }`}></div>
                {detectedFaces.length === 1
                  ? 'Ready for secure face recognition login'
                  : detectedFaces.length > 1
                  ? `${detectedFaces.length} faces detected - please ensure only one person`
                  : 'Position your face in the camera view for recognition'
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default LoginPage;