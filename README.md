# An AI based Secure Login to A System with Advanced Face Identification

A cutting-edge face recognition authentication system that combines the power of **Next.js 15** frontend with **Python Flask** backend, utilizing advanced **Convolutional Neural Networks (CNN)** and **OpenCV** computer vision techniques for highly secure user authentication.

## 🎯 Project Overview

This project implements a sophisticated facial recognition system that allows users to:
- **Register** using multiple facial images for enhanced accuracy
- **Login** securely through facial recognition
- **Admin Dashboard** for user management and system monitoring
- **Multi-photo Training** using VGG16 CNN architecture for superior recognition accuracy

### 🧠 AI & Machine Learning Technologies Used

- **VGG16 CNN Architecture**: Pre-trained deep learning model for feature extraction
- **MediaPipe Face Detection**: Google's state-of-the-art face detection library
- **Cosine Similarity Matching**: Advanced mathematical approach for face comparison
- **Ensemble Learning**: Multi-photo training for improved recognition accuracy
- **TensorFlow/Keras**: Deep learning framework for neural network operations
- **OpenCV**: Computer vision library for image processing

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Webcam** - Camera integration for live capture

### Backend
- **Python Flask** - Lightweight web framework
- **TensorFlow** - Machine learning framework
- **OpenCV** - Computer vision operations
- **MediaPipe** - Face detection and landmarks
- **scikit-learn** - Machine learning utilities
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computing

### AI/ML Components
- **VGG16 Pre-trained Model** - Feature extraction from facial images
- **Convolutional Neural Networks** - Deep learning for image recognition
- **Cosine Similarity** - Mathematical face matching algorithm
- **Ensemble Methods** - Multi-image training for better accuracy

## 📋 Prerequisites

Before starting, you need to install the following software on your computer:

### 🐍 Python (Version 3.9 or Higher - REQUIRED)

**Check if Python is installed:**
```cmd
python --version
```

**If Python is NOT installed or version is below 3.9:**

1. **Download Python:**
   - Go to [python.org](https://python.org/downloads/)
   - Download **Python 3.11** or **Python 3.12** (recommended)

2. **Install Python:**
   - Run the downloaded installer
   - ✅ **IMPORTANT**: Check "Add Python to PATH" 
   - ✅ **IMPORTANT**: Check "Install pip"
   - Click "Install Now"
   - Restart your computer after installation

3. **Verify Installation:**
   ```cmd
   python --version
   pip --version
   ```

### 🟢 Node.js (for Frontend)

**Check if Node.js is installed:**
```cmd
node --version
npm --version
```

**If Node.js is NOT installed:**

1. **Download Node.js:**
   - Go to [nodejs.org](https://nodejs.org/)
   - Download the **LTS (Long Term Support)** version

2. **Install Node.js:**
   - Run the downloaded installer
   - Follow the installation wizard with default settings
   - Restart your computer after installation

3. **Verify Installation:**
   ```cmd
   node --version
   npm --version
   ```

### 🔧 Git (for Cloning Repository)

**Check if Git is installed:**
```cmd
git --version
```

**If Git is NOT installed:**

1. **Download Git:**
   - Go to [git-scm.com](https://git-scm.com/)
   - Download Git for your operating system

2. **Install Git:**
   - Run the installer with default settings
   - Restart command prompt after installation

### 🏗️ Visual Studio Build Tools (Windows Only - REQUIRED)

**This is crucial for installing face recognition libraries on Windows:**

1. **Download Build Tools:**
   - Go to [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - Download "Build Tools for Visual Studio"

2. **Install Build Tools:**
   - Run the installer
   - Select **"C++ build tools"** workload
   - Click Install (this may take 15-30 minutes)

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```cmd
git clone https://github.com/iamumerjz/An-AI-based-Secure-Login-to-A-System-with-Advanced-Face-Identification
```

### Step 2: Backend Setup (Python Flask + AI/ML)

1. **Navigate to backend directory:**
   ```cmd
   cd project/backend
   ```

2. **Create Python Virtual Environment:**
   ```cmd
   python -m venv venv
   ```

3. **Activate Virtual Environment:**
   
   **Windows:**
   ```cmd
   venv\Scripts\activate
   ```
   
   **Mac/Linux:**
   ```bash
   source venv/bin/activate
   ```
   
   You should see `(venv)` at the beginning of your command line.

4. **Install Python Dependencies:**

   **Option 1: Install all at once using requirements.txt (Recommended):**
   ```cmd
   pip install -r requirements.txt
   ```

   **Option 2: Install libraries individually:**
   ```cmd
   # Core web framework
   pip install flask==2.3.3
   pip install flask-cors==4.0.0
   
   # AI/ML and Computer Vision
   pip install tensorflow==2.13.0
   pip install opencv-python==4.8.0.76
   pip install mediapipe==0.10.3
   pip install scikit-learn==1.3.0
   
   # Data processing
   pip install pandas==2.0.3
   pip install numpy==1.24.3
   
   # Image processing
   pip install Pillow==10.0.0
   
   # Utilities
   pip install uuid
   ```

   **⏳ Installation Time:** 10-20 minutes (TensorFlow is large)

5. **Create requirements.txt file** (Optional):
   ```txt
   flask==2.3.3
   flask-cors==4.0.0
   tensorflow==2.13.0
   opencv-python==4.8.0.76
   mediapipe==0.10.3
   scikit-learn==1.3.0
   pandas==2.0.3
   numpy==1.24.3
   Pillow==10.0.0
   ```

### Step 3: Frontend Setup (Next.js + React)

1. **Open a NEW terminal/command prompt**

2. **Navigate to project directory:**
   ```cmd
   cd project/frontend
   ```

3. **Install Node.js Dependencies:**
   ```cmd
   npm install
   ```

   This will install all dependencies from `package.json`:
   - Next.js 15
   - React 19
   - TypeScript
   - Tailwind CSS
   - React Webcam
   - And all development dependencies

   **⏳ Installation Time:** 2-5 minutes

## 🏃‍♂️ Running the Application

You need to run **BOTH** the backend and frontend servers simultaneously.

### Terminal 1: Start Backend (Python Flask)

```cmd
cd project/backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
python backend.py
```

✅ **Backend will start on:** http://localhost:5000

### Terminal 2: Start Frontend (Next.js)

```cmd
cd project/frontend
npm run dev
```

✅ **Frontend will start on:** http://localhost:3000

### 🌐 Access the Application

Open your web browser and go to:

- **Main Application:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin

### 🔐 Admin Panel Access

The admin panel can be accessed at **http://localhost:3000/admin** with the following credentials:

- **Username:** `admin`
- **Password:** `admin123`

## 📁 Project Structure

```
project-root/
├── project/                   # Main Project Directory
│   ├── backend/               # Python Flask Backend
│   │   ├── backend.py        # Main Flask application
│   │   ├── requirements.txt  # Python dependencies
│   │   ├── db/               # Database storage
│   │   │   ├── photos/       # User facial images
│   │   │   ├── pickles/      # CNN feature encodings
│   │   │   └── users.csv     # User information
│   │   ├── venv/             # Python virtual environment
│   │   └── log.txt           # Authentication logs
│   │
│   └── frontend/             # Next.js Frontend
│       ├── src/
│       │   ├── app/          # Next.js App Router
│       │   ├── components/   # React components
│       │   ├── contexts/     # React contexts
│       │   └── lib/          # Utility functions
│       ├── package.json      # Node.js dependencies
│       ├── tailwind.config.js# Tailwind CSS config
│       └── tsconfig.json     # TypeScript config
```

## 🤖 How the AI Works

### 1. **Face Detection (MediaPipe)**
- Uses Google's MediaPipe for accurate face detection
- Detects multiple faces in a single image
- Provides confidence scores for each detection

### 2. **Feature Extraction (VGG16 CNN)**
- Pre-trained VGG16 Convolutional Neural Network
- Extracts 4096-dimensional feature vectors from faces
- Removes top classification layers, uses convolutional features

### 3. **Multi-Photo Training (Ensemble Learning)**
- Requires minimum 2 photos for registration (recommended 3-5)
- Creates ensemble features by averaging multiple images
- Stores both individual and ensemble features for comparison

### 4. **Face Recognition (Cosine Similarity)**
- Compares unknown faces with stored features
- Uses cosine similarity for mathematical matching
- Dynamic thresholds based on training quality
- Multi-strategy comparison (ensemble + individual matching)

### 5. **Advanced Matching Algorithm**
- **40%** weight to ensemble features
- **30%** weight to best individual match
- **30%** weight to average individual similarity
- Quality-based scoring adjustments

## 🎯 Features

### 🔐 **User Authentication**
- **Registration**: Multi-photo facial registration
- **Login**: Secure facial recognition login
- **Logout**: Activity logging and session management

### 👨‍💼 **Admin Dashboard**
- User management interface
- Registration statistics
- Login activity monitoring
- Training quality metrics
- Access at: http://localhost:3000/admin
- Login: admin / admin123

### 🧠 **AI-Powered Security**
- CNN-based feature extraction
- Anti-spoofing through live detection
- High accuracy with low false positives
- Robust against lighting variations

### 📊 **Analytics & Monitoring**
- Real-time authentication logs
- User registration metrics
- System performance tracking
- Training quality assessment

## 🔧 Troubleshooting

### ❌ Common Installation Issues

**1. Python not found:**
```cmd
# Try these alternatives:
py --version
python3 --version
```

**2. pip not found:**
```cmd
# Try:
py -m pip --version
python -m pip --version
```

**3. TensorFlow installation fails:**
```cmd
# Install specific version:
pip install tensorflow==2.13.0 --no-cache-dir
```

**4. OpenCV installation issues:**
```cmd
# Try alternative:
pip install opencv-python-headless
```

**5. Virtual environment activation fails:**
```cmd
# Windows alternative:
venv\Scripts\activate.bat
```

**6. Port already in use:**
```cmd
# Kill process on port 5000:
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

### 🔍 Face Recognition Issues

**1. "No face detected":**
- Ensure good lighting
- Face should be clearly visible
- Remove glasses/masks if possible
- Try different angles

**2. "Face not recognized":**
- Register with multiple clear photos
- Ensure consistent lighting during registration
- Re-register if recognition fails consistently

**3. "Low training quality":**
- Use 3-5 high-quality photos
- Vary facial angles slightly
- Ensure good lighting in all photos

## 🚀 Performance Tips

### For Better Recognition Accuracy:
1. **Use 3-5 registration photos** from different angles
2. **Consistent lighting** during registration and login
3. **Clear, high-resolution images** (webcam should be good quality)
4. **Face should occupy 30-50%** of the image frame
5. **Avoid extreme expressions** during registration

### For Better System Performance:
1. **Use SSD storage** for faster image processing
2. **At least 8GB RAM** recommended for TensorFlow
3. **GPU acceleration** can be enabled for faster processing
4. **Close unnecessary applications** during setup

## 📚 Libraries & Dependencies Explained

### 🐍 **Python Backend Libraries**

| Library | Version | Purpose |
|---------|---------|---------|
| **Flask** | 2.3.3 | Lightweight web framework for API endpoints |
| **TensorFlow** | 2.13.0 | Deep learning framework for CNN operations |
| **OpenCV** | 4.8.0 | Computer vision for image processing |
| **MediaPipe** | 0.10.3 | Google's face detection and landmarks |
| **scikit-learn** | 1.3.0 | Machine learning utilities (cosine similarity) |
| **Pandas** | 2.0.3 | Data manipulation for user records |
| **NumPy** | 1.24.3 | Numerical computing for array operations |

### 🟢 **Node.js Frontend Libraries**

| Library | Version | Purpose |
|---------|---------|---------|
| **Next.js** | 15.4.5 | React framework with App Router |
| **React** | 19.1.0 | UI library with concurrent features |
| **React Webcam** | 7.2.0 | Camera integration for live capture |
| **TypeScript** | 5.x | Type-safe JavaScript development |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |

## 📈 System Requirements

### **Minimum Requirements:**
- **OS:** Windows 10/11, macOS 10.14+, Ubuntu 18.04+
- **RAM:** 4GB (8GB recommended)
- **Storage:** 2GB free space
- **Python:** 3.9+ (3.11+ recommended)
- **Node.js:** 16+ (18+ recommended)
- **Camera:** Any USB/built-in webcam

### **Recommended Requirements:**
- **RAM:** 8GB or more
- **Storage:** SSD with 5GB+ free space
- **Camera:** 720p or higher resolution
- **GPU:** Optional, for faster processing

## 🤝 Usage Guide

### **For New Users:**

1. **First Time Setup:**
   - Follow installation steps above
   - Start both backend and frontend servers
   - Navigate to http://localhost:3000

2. **User Registration:**
   - Click "Register" on the homepage
   - Fill in your details
   - Take 3-5 clear photos when prompted
   - Wait for processing confirmation

3. **User Login:**
   - Click "Login" on the homepage
   - Position your face in the camera frame
   - Wait for recognition (2-3 seconds)
   - Access granted upon successful recognition

4. **Admin Access:**
   - Navigate to http://localhost:3000/admin
   - Login with: **admin** / **admin123**
   - View all registered users
   - Monitor login activities
   - Check system statistics

## 🎉 You're All Set!

Once everything is installed and running, you'll have a fully functional AI-powered face recognition authentication system! 

**🔗 Quick Links:**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Admin Panel:** http://localhost:3000/admin *(admin/admin123)*

**💡 Pro Tip:** Keep both terminal windows open while using the application. If you close them, the servers will stop running.

---

### 🆘 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Ensure all prerequisites are properly installed
3. Verify both servers are running
4. Check terminal outputs for error messages
5. Try restarting both servers

**Happy coding! 🚀🤖**
