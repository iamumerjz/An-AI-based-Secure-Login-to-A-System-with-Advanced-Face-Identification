"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { useAuth } from "../../contexts/AuthContext";
import { usePopup } from "../../contexts/PopupContext";
import {
  WebcamSkeleton,
  LoadingButton,
  PageTransition,
} from "../../components/LoadingComponents";

interface FaceDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface CapturedPhoto {
  id: number;
  image: string;
  timestamp: number;
  faceConfidence: number;
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  department: string;
  position: string;
}

interface FormErrors {
  name: boolean;
  email: boolean;
  phone: boolean;
  dateOfBirth: boolean;
  emergencyContact: boolean;
  emergencyPhone: boolean;
}

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    department: "",
    position: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: false,
    email: false,
    phone: false,
    dateOfBirth: false,
    emergencyContact: false,
    emergencyPhone: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const [formFocused, setFormFocused] = useState("");
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [detectedFaces, setDetectedFaces] = useState<FaceDetection[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);
  const [registrationStep, setRegistrationStep] = useState<
    "setup" | "capturing" | "review" | "complete"
  >("setup");

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { showPopup } = usePopup();

  const REQUIRED_PHOTOS = 3;
  const CAPTURE_DELAY = 2000;

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(?:\+92|0)3[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
  };

  const validateAge = (dateOfBirth: string): boolean => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 16; // Minimum age 16
    }
    return age >= 16;
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {
      name: !formData.name.trim(),
      email: !formData.email.trim() || !validateEmail(formData.email),
      phone: !formData.phone.trim() || !validatePhone(formData.phone),
      dateOfBirth: !formData.dateOfBirth || !validateAge(formData.dateOfBirth),
      emergencyContact: !formData.emergencyContact.trim(),
      emergencyPhone: !formData.emergencyPhone.trim() || !validatePhone(formData.emergencyPhone),
    };

    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/welcome");
    }
  }, [isAuthenticated, router]);

  // Load face detection model
  useEffect(() => {
    let isMounted = true;

    const loadFaceDetection = async () => {
      try {
        if (typeof window !== "undefined" && (window as any).faceapi) {
          const faceapi = (window as any).faceapi;
          await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
          if (isMounted) {
            setIsDetecting(true);
          }
        } else {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
          script.onload = async () => {
            try {
              const faceapi = (window as any).faceapi;
              await faceapi.nets.tinyFaceDetector.loadFromUri(
                "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights"
              );
              if (isMounted) {
                setIsDetecting(true);
              }
            } catch (error) {
              console.log(
                "Face detection model loading failed, continuing without real-time detection"
              );
            }
          };
          document.head.appendChild(script);
        }
      } catch (error) {
        console.log(
          "Face detection initialization failed, using mock detection"
        );
        if (isMounted) {
          setIsDetecting(true);
        }
      }
    };

    if (webcamReady) {
      loadFaceDetection();
    }

    return () => {
      isMounted = false;
    };
  }, [webcamReady]);

  // Mock face detection
  const mockFaceDetection = useCallback((videoElement: HTMLVideoElement) => {
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;

    const mockFace: FaceDetection = {
      x: videoWidth * 0.3,
      y: videoHeight * 0.25,
      width: videoWidth * 0.4,
      height: videoHeight * 0.5,
      confidence: 0.95,
    };

    return [mockFace];
  }, []);

  // Face detection
  const detectFaces = useCallback(async () => {
    if (!webcamRef.current || !isDetecting) return;

    try {
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) return;

      let faces: FaceDetection[] = [];

      if (typeof window !== "undefined" && (window as any).faceapi) {
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
            confidence: detection.score,
          }));
        } catch (error) {
          faces = mockFaceDetection(video);
        }
      } else {
        faces = mockFaceDetection(video);
      }

      setDetectedFaces(faces);
    } catch (error) {
      console.log("Face detection error:", error);
    }
  }, [isDetecting, mockFaceDetection]);

  useEffect(() => {
    if (webcamReady && isDetecting) {
      detectionIntervalRef.current = setInterval(detectFaces, 200);

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

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = rect.width / video.videoWidth;
    const scaleY = rect.height / video.videoHeight;

    detectedFaces.forEach((face) => {
      const x = face.x * scaleX;
      const y = face.y * scaleY;
      const width = face.width * scaleX;
      const height = face.height * scaleY;

      ctx.strokeStyle = face.confidence > 0.8 ? "#3B82F6" : "#F59E0B";
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.strokeRect(x, y, width, height);

      const cornerLength = 20;
      ctx.lineWidth = 4;
      ctx.strokeStyle = face.confidence > 0.8 ? "#3B82F6" : "#F59E0B";

      // Draw corner brackets
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLength);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLength, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + width - cornerLength, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + cornerLength);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y + height - cornerLength);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x + cornerLength, y + height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + width - cornerLength, y + height);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x + width, y + height - cornerLength);
      ctx.stroke();

      if (face.confidence) {
        ctx.fillStyle = face.confidence > 0.8 ? "#3B82F6" : "#F59E0B";
        ctx.font = "14px Arial";
        ctx.fillText(`${(face.confidence * 100).toFixed(0)}%`, x, y - 8);
      }

      ctx.fillStyle = face.confidence > 0.8 ? "#3B82F6" : "#F59E0B";
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [detectedFaces]);

  const capture = (): string | null => {
    if (webcamRef.current) {
      return webcamRef.current.getScreenshot();
    }
    return null;
  };

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors] !== undefined) {
      setFormErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const startPhotoCapture = async () => {
    if (!validateForm()) {
      showPopup("Please fill in all required fields correctly", "error");
      return;
    }

    if (!webcamReady) {
      showPopup("Please wait for camera to load", "error");
      return;
    }

    if (detectedFaces.length === 0) {
      showPopup(
        "No face detected. Please position yourself in front of the camera.",
        "error"
      );
      return;
    }

    if (detectedFaces.length > 1) {
      showPopup(
        "Multiple faces detected. Please ensure only one person is in the camera view.",
        "error"
      );
      return;
    }

    const highConfidenceFaces = detectedFaces.filter(
      (face) => face.confidence > 0.7
    );
    if (highConfidenceFaces.length === 0) {
      showPopup(
        "Face detection confidence is low. Please ensure good lighting and clear view.",
        "error"
      );
      return;
    }

    setRegistrationStep("capturing");
    setCapturedPhotos([]);

    for (let i = 0; i < REQUIRED_PHOTOS; i++) {
      // Countdown
      for (let count = 3; count > 0; count--) {
        setCaptureCountdown(count);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setCaptureCountdown(null);

      // Capture photo
      const image = capture();
      if (image) {
        const newPhoto: CapturedPhoto = {
          id: i + 1,
          image,
          timestamp: Date.now(),
          faceConfidence: detectedFaces[0]?.confidence || 0,
        };

        setCapturedPhotos((prev) => [...prev, newPhoto]);
        showPopup(
          `Photo ${i + 1} of ${REQUIRED_PHOTOS} captured!`,
          "success",
          1500
        );

        // Wait before next capture (except for the last one)
        if (i < REQUIRED_PHOTOS - 1) {
          await new Promise((resolve) => setTimeout(resolve, CAPTURE_DELAY));
        }
      } else {
        showPopup(`Failed to capture photo ${i + 1}`, "error");
        setRegistrationStep("setup");
        return;
      }
    }

    setRegistrationStep("review");
    showPopup(
      "All photos captured! Please review and confirm registration.",
      "success"
    );
  };

  const retakePhotos = () => {
    setCapturedPhotos([]);
    setRegistrationStep("setup");
  };

  const handleRegister = async () => {
    if (capturedPhotos.length !== REQUIRED_PHOTOS) {
      showPopup("Please capture all required photos first", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: capturedPhotos.map((photo) => photo.image),
          ...formData,
          email: formData.email.toLowerCase().trim(), // Normalize email
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRegistrationStep("complete");
        showPopup(
          `User ${data.name} registered successfully with ${REQUIRED_PHOTOS} photos!`,
          "success",
          5000
        );
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        showPopup(data.message || "Registration failed", "error");
        setRegistrationStep("review");
      }
    } catch (error) {
      showPopup("Error connecting to server", "error");
      setRegistrationStep("review");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (registrationStep === "review") {
      setRegistrationStep("setup");
    } else {
      router.push("/");
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8 transform transition-all duration-500 hover:shadow-2xl hover:scale-[1.01]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white text-3xl mb-4 animate-bounce">
              📋
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 animate-fadeIn">
              User Registration
            </h1>
            <p className="text-gray-600 animate-fadeIn delay-200">
              Complete your profile and capture {REQUIRED_PHOTOS} photos for secure face recognition
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step === 1
                        ? "bg-blue-500 text-white"
                        : step === 2 && registrationStep !== "setup"
                        ? "bg-blue-500 text-white"
                        : step === 3 &&
                          (registrationStep === "review" ||
                            registrationStep === "complete")
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step === 1 ? "📝" : step === 2 ? "📸" : "✅"}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-8 h-1 mx-2 ${
                        (step === 1 && registrationStep !== "setup") ||
                        (step === 2 &&
                          (registrationStep === "review" ||
                            registrationStep === "complete"))
                          ? "bg-blue-500"
                          : "bg-gray-200"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-2 space-x-8 text-sm text-gray-600">
              <span>Details</span>
              <span>Capture</span>
              <span>Review</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Personal Information */}
              {registrationStep === "setup" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      👤 Personal Information
                    </h3>
                    
                    {/* Name and Email Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          onFocus={() => setFormFocused("name")}
                          onBlur={() => setFormFocused("")}
                          className={`w-full border-2 rounded-lg px-3 py-2 text-sm focus:outline-none transition-all duration-300 ${
                            formErrors.name
                              ? "border-red-500 bg-red-50"
                              : formFocused === "name"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 bg-white"
                          }`}
                        />
                        {formErrors.name && (
                          <p className="text-red-500 text-xs mt-1">Name is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          onFocus={() => setFormFocused("email")}
                          onBlur={() => setFormFocused("")}
                          className={`w-full border-2 rounded-lg px-3 py-2 text-sm focus:outline-none transition-all duration-300 ${
                            formErrors.email
                              ? "border-red-500 bg-red-50"
                              : formFocused === "email"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 bg-white"
                          }`}
                        />
                        {formErrors.email && (
                          <p className="text-red-500 text-xs mt-1">
                            Valid email is required
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Phone and DOB Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          placeholder="+923000000000"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          onFocus={() => setFormFocused("phone")}
                          onBlur={() => setFormFocused("")}
                          className={`w-full border-2 rounded-lg px-3 py-2 text-sm focus:outline-none transition-all duration-300 ${
                            formErrors.phone
                              ? "border-red-500 bg-red-50"
                              : formFocused === "phone"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 bg-white"
                          }`}
                        />
                        {formErrors.phone && (
                          <p className="text-red-500 text-xs mt-1">
                            Valid phone number is required
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                          onFocus={() => setFormFocused("dateOfBirth")}
                          onBlur={() => setFormFocused("")}
                          className={`w-full border-2 rounded-lg px-3 py-2 text-sm focus:outline-none transition-all duration-300 ${
                            formErrors.dateOfBirth
                              ? "border-red-500 bg-red-50"
                              : formFocused === "dateOfBirth"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 bg-white"
                          }`}
                        />
                        {formErrors.dateOfBirth && (
                          <p className="text-red-500 text-xs mt-1">
                            Must be at least 16 years old
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Gender and Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => handleInputChange("gender", e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          placeholder="Your address"
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      💼 Professional Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Department
                        </label>
                        <input
                          type="text"
                          placeholder="Department name"
                          value={formData.department}
                          onChange={(e) => handleInputChange("department", e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Position
                        </label>
                        <input
                          type="text"
                          placeholder="Job title/position"
                          value={formData.position}
                          onChange={(e) => handleInputChange("position", e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      🚨 Emergency Contact
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Emergency Contact Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Contact person name"
                          value={formData.emergencyContact}
                          onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                          onFocus={() => setFormFocused("emergencyContact")}
                          onBlur={() => setFormFocused("")}
                          className={`w-full border-2 rounded-lg px-3 py-2 text-sm focus:outline-none transition-all duration-300 ${
                            formErrors.emergencyContact
                              ? "border-red-500 bg-red-50"
                              : formFocused === "emergencyContact"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 bg-white"
                          }`}
                        />
                        {formErrors.emergencyContact && (
                          <p className="text-red-500 text-xs mt-1">
                            Emergency contact is required
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Emergency Contact Phone *
                        </label>
                        <input
                          type="tel"
                          placeholder="+923000000000"
                          value={formData.emergencyPhone}
                          onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                          onFocus={() => setFormFocused("emergencyPhone")}
                          onBlur={() => setFormFocused("")}
                          className={`w-full border-2 rounded-lg px-3 py-2 text-sm focus:outline-none transition-all duration-300 ${
                            formErrors.emergencyPhone
                              ? "border-red-500 bg-red-50"
                              : formFocused === "emergencyPhone"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 bg-white"
                          }`}
                        />
                        {formErrors.emergencyPhone && (
                          <p className="text-red-500 text-xs mt-1">
                            Valid emergency phone is required
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Section */}
              {registrationStep === "review" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    📋 Review Your Information
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-gray-600">Name:</span>
                        <p className="text-gray-800">{formData.name}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600">Email:</span>
                        <p className="text-gray-800">{formData.email}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600">Phone:</span>
                        <p className="text-gray-800">{formData.phone}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600">Date of Birth:</span>
                        <p className="text-gray-800">{formData.dateOfBirth}</p>
                      </div>
                      {formData.gender && (
                        <div>
                          <span className="font-semibold text-gray-600">Gender:</span>
                          <p className="text-gray-800 capitalize">{formData.gender.replace("-", " ")}</p>
                        </div>
                      )}
                      {formData.address && (
                        <div className="col-span-2">
                          <span className="font-semibold text-gray-600">Address:</span>
                          <p className="text-gray-800">{formData.address}</p>
                        </div>
                      )}
                      {formData.department && (
                        <div>
                          <span className="font-semibold text-gray-600">Department:</span>
                          <p className="text-gray-800">{formData.department}</p>
                        </div>
                      )}
                      {formData.position && (
                        <div>
                          <span className="font-semibold text-gray-600">Position:</span>
                          <p className="text-gray-800">{formData.position}</p>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-gray-600">Emergency Contact:</span>
                        <p className="text-gray-800">{formData.emergencyContact}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600">Emergency Phone:</span>
                        <p className="text-gray-800">{formData.emergencyPhone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Camera */}
            <div>
              {/* Camera Section */}
              <div className="mb-6 relative">
                <div className="relative overflow-hidden rounded-xl shadow-lg">
                  {!webcamReady && <WebcamSkeleton />}
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className={`w-full rounded-xl transition-all duration-700 transform ${
                      webcamReady
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95 absolute inset-0"
                    }`}
                    videoConstraints={{
                      width: 640,
                      height: 480,
                      facingMode: "user",
                    }}
                    onUserMedia={() => {
                      setTimeout(() => setWebcamReady(true), 800);
                    }}
                  />

                  {/* Face Detection Canvas */}
                  {webcamReady && (
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 pointer-events-none rounded-xl"
                      style={{ zIndex: 10 }}
                    />
                  )}

                  {/* Capture Countdown Overlay */}
                  {captureCountdown && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl z-20">
                      <div className="text-white text-6xl font-bold animate-ping">
                        {captureCountdown}
                      </div>
                    </div>
                  )}

                  {/* Camera Status */}
                  {webcamReady && (
                    <>
                      <div className="absolute top-3 left-3 bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                        📹 Camera Active
                      </div>

                      {/* Photo Counter */}
                      <div className="absolute top-3 right-3 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                        📸 {capturedPhotos.length}/{REQUIRED_PHOTOS}
                      </div>

                      {/* Face Detection Status */}
                      <div className="absolute bottom-3 right-3">
                        <div
                          className={`backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                            detectedFaces.length === 1
                              ? "bg-blue-500/90"
                              : detectedFaces.length > 1
                              ? "bg-orange-500/90"
                              : "bg-gray-500/90"
                          }`}
                        >
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          {detectedFaces.length === 1
                            ? "👤 Ready"
                            : detectedFaces.length > 1
                            ? `⚠️ ${detectedFaces.length} Faces`
                            : "🔍 Scanning..."}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Captured Photos Preview */}
              {capturedPhotos.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    📷 Captured Photos ({capturedPhotos.length}/{REQUIRED_PHOTOS})
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {capturedPhotos.map((photo) => (
                      <div key={photo.id} className="relative">
                        <img
                          src={photo.image}
                          alt={`Capture ${photo.id}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-blue-200"
                        />
                        <div className="absolute top-1 left-1 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                          #{photo.id}
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                          {(photo.faceConfidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips Section */}
              {registrationStep === "setup" && webcamReady && !isLoading && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 animate-fadeIn delay-500">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    💡 Photo Capture Tips
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Fill out all required fields before capturing photos</li>
                    <li>• We'll capture {REQUIRED_PHOTOS} photos automatically with countdown</li>
                    <li>• Keep your face clearly visible with good lighting</li>
                    <li>• Ensure only one face is visible in the camera</li>
                    <li>• Maintain slight variations in expression between captures</li>
                    <li>• You can retake photos if needed</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-6 border-t border-gray-200 mt-8">
            <LoadingButton
              onClick={handleBack}
              isLoading={false}
              variant="secondary"
              className="py-3 px-6 text-base font-semibold transform hover:scale-105 transition-all duration-200"
            >
              <span className="flex items-center gap-2">← Back</span>
            </LoadingButton>

            {registrationStep === "setup" && (
              <button
                onClick={startPhotoCapture}
                disabled={
                  !webcamReady ||
                  !formData.name.trim() ||
                  !formData.email.trim() ||
                  detectedFaces.length !== 1 ||
                  isCapturing
                }
                className={`py-3 px-6 text-base font-semibold rounded-xl transform transition-all duration-300 flex items-center gap-2 justify-center ${
                  !webcamReady ||
                  !formData.name.trim() ||
                  !formData.email.trim() ||
                  detectedFaces.length !== 1 ||
                  isCapturing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white hover:scale-105 shadow-lg hover:shadow-xl"
                }`}
              >
                📸 Start Photo Capture
              </button>
            )}

            {registrationStep === "review" && (
              <>
                <button
                  onClick={retakePhotos}
                  className="py-3 px-6 text-base font-semibold rounded-xl transform transition-all duration-300 flex items-center gap-2 justify-center bg-orange-500 hover:bg-orange-600 text-white hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  🔄 Retake Photos
                </button>
                <button
                  onClick={handleRegister}
                  disabled={isLoading}
                  className={`py-3 px-6 text-base font-semibold rounded-xl transform transition-all duration-300 flex items-center gap-2 justify-center ${
                    isLoading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover:scale-105 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registering...
                    </>
                  ) : (
                    <>Complete Registration</>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Registration Complete */}
          {registrationStep === "complete" && (
            <div className="text-center mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 animate-fadeIn">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Registration Successful!
              </h3>
              <p className="text-gray-600">
                {formData.name} has been registered successfully with {REQUIRED_PHOTOS} training
                photos and complete profile information.
              </p>
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {formData.email}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>User ID:</strong> Generated automatically
                </p>
              </div>
            </div>
          )}

          {/* Form Validation Summary */}
          {registrationStep === "setup" && Object.values(formErrors).some(error => error) && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">⚠️ Please fix the following errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {formErrors.name && <li>• Full name is required</li>}
                {formErrors.email && <li>• Valid email address is required</li>}
                {formErrors.phone && <li>• Valid phone number is required</li>}
                {formErrors.dateOfBirth && <li>• Valid date of birth is required (minimum age 16)</li>}
                {formErrors.emergencyContact && <li>• Emergency contact name is required</li>}
                {formErrors.emergencyPhone && <li>• Valid emergency contact phone is required</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default RegisterPage;