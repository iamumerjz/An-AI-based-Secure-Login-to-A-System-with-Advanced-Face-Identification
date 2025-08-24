from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
import pickle
import os
import datetime
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.applications import VGG16
from tensorflow.keras.preprocessing.image import img_to_array
from sklearn.metrics.pairwise import cosine_similarity
import mediapipe as mp
from statistics import mean
import uuid

app = Flask(__name__)
CORS(app)

DB_DIR = './db'
PHOTOS_DIR = './db/photos'
PICKLES_DIR = './db/pickles'
LOG_PATH = './log.txt'
USERS_CSV = './db/users.csv'

# Ensure directories exist
os.makedirs(DB_DIR, exist_ok=True)
os.makedirs(PHOTOS_DIR, exist_ok=True)
os.makedirs(PICKLES_DIR, exist_ok=True)

# Initialize MediaPipe face detection
mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils

class EnhancedCNNFaceRecognizer:
    def __init__(self):
        # Load pre-trained VGG16 model and remove the top layers
        base_model = VGG16(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
        # Use features from the last convolutional layer
        self.model = Model(inputs=base_model.input, outputs=base_model.layers[-2].output)
        self.model.trainable = False
        
        # Initialize face detection
        self.face_detection = mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)
        
        # Recognition thresholds
        self.strict_threshold = 0.75  # For single photo comparison
        self.multi_photo_threshold = 0.70  # For multi-photo average comparison
        self.min_photos_for_training = 3  # Minimum photos for reliable training
    
    def detect_faces(self, image):
        """Detect faces using MediaPipe"""
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_detection.process(rgb_image)
        
        faces = []
        if results.detections:
            h, w, _ = image.shape
            for detection in results.detections:
                bbox = detection.location_data.relative_bounding_box
                x = int(bbox.xmin * w)
                y = int(bbox.ymin * h)
                width = int(bbox.width * w)
                height = int(bbox.height * h)
                
                # Ensure coordinates are within image bounds
                x = max(0, x)
                y = max(0, y)
                width = min(width, w - x)
                height = min(height, h - y)
                
                if width > 0 and height > 0:
                    face = image[y:y+height, x:x+width]
                    faces.append({
                        'face': face,
                        'bbox': (x, y, width, height),
                        'confidence': detection.score[0] if hasattr(detection, 'score') else 0.9
                    })
        
        return faces
    
    def preprocess_face(self, face):
        """Preprocess face for CNN input"""
        try:
            # Resize to 224x224 for VGG16
            face_resized = cv2.resize(face, (224, 224))
            # Convert to array and normalize
            face_array = img_to_array(face_resized)
            face_array = np.expand_dims(face_array, axis=0)
            face_array = tf.keras.applications.vgg16.preprocess_input(face_array)
            return face_array
        except Exception as e:
            print(f"Face preprocessing error: {e}")
            return None
    
    def extract_features(self, face):
        """Extract CNN features from face"""
        processed_face = self.preprocess_face(face)
        if processed_face is None:
            return None
        
        try:
            features = self.model.predict(processed_face, verbose=0)
            # Flatten the features
            features = features.flatten()
            # Normalize features
            features = features / np.linalg.norm(features)
            return features
        except Exception as e:
            print(f"Feature extraction error: {e}")
            return None
    
    def extract_features_from_multiple_images(self, images):
        """Extract features from multiple images and create ensemble features"""
        all_features = []
        valid_images = 0
        
        for i, image in enumerate(images):
            faces = self.detect_faces(image)
            
            if not faces:
                print(f"No face detected in image {i+1}")
                continue
                
            # Use the largest face (most confident detection)
            largest_face = max(faces, key=lambda x: x['bbox'][2] * x['bbox'][3])
            features = self.extract_features(largest_face['face'])
            
            if features is not None:
                all_features.append(features)
                valid_images += 1
                print(f"Successfully extracted features from image {i+1}")
            else:
                print(f"Failed to extract features from image {i+1}")
        
        if len(all_features) < 2:  # Need at least 2 valid images for reliable recognition
            return None, valid_images
        
        # Create ensemble features by averaging
        ensemble_features = np.mean(all_features, axis=0)
        # Re-normalize the ensemble features
        ensemble_features = ensemble_features / np.linalg.norm(ensemble_features)
        
        # Also store individual features for advanced matching
        training_data = {
            'ensemble_features': ensemble_features,
            'individual_features': all_features,
            'num_photos': len(all_features),
            'training_quality': len(all_features) / len(images)  # Quality metric
        }
        
        return training_data, valid_images
    
    def compare_features_advanced(self, stored_data, unknown_features):
        """Advanced comparison using multiple matching strategies"""
        if stored_data is None or unknown_features is None:
            return False, 0.0
        
        try:
            # Strategy 1: Compare with ensemble features
            ensemble_similarity = cosine_similarity([stored_data['ensemble_features']], [unknown_features])[0][0]
            
            # Strategy 2: Compare with individual features and take best match
            individual_similarities = []
            for individual_features in stored_data['individual_features']:
                similarity = cosine_similarity([individual_features], [unknown_features])[0][0]
                individual_similarities.append(similarity)
            
            best_individual_similarity = max(individual_similarities) if individual_similarities else 0.0
            avg_individual_similarity = mean(individual_similarities) if individual_similarities else 0.0
            
            # Strategy 3: Weighted scoring based on training quality
            quality_weight = min(stored_data['training_quality'], 1.0)
            
            # Final score combines multiple strategies
            final_score = (
                ensemble_similarity * 0.4 +  # 40% ensemble
                best_individual_similarity * 0.3 +  # 30% best individual match
                avg_individual_similarity * 0.3  # 30% average individual match
            ) * quality_weight
            
            # Dynamic threshold based on number of training photos
            if stored_data['num_photos'] >= 3:
                threshold = self.multi_photo_threshold
            else:
                threshold = self.strict_threshold
            
            is_match = final_score >= threshold
            
            print(f"Recognition scores - Ensemble: {ensemble_similarity:.3f}, "
                  f"Best Individual: {best_individual_similarity:.3f}, "
                  f"Avg Individual: {avg_individual_similarity:.3f}, "
                  f"Final: {final_score:.3f}, Threshold: {threshold:.3f}")
            
            return is_match, final_score
            
        except Exception as e:
            print(f"Feature comparison error: {e}")
            return False, 0.0
    
    def compare_features_simple(self, features1, features2, threshold=None):
        """Simple comparison for backward compatibility"""
        if threshold is None:
            threshold = self.strict_threshold
            
        try:
            similarity = cosine_similarity([features1], [features2])[0][0]
            return similarity >= threshold, similarity
        except Exception as e:
            print(f"Feature comparison error: {e}")
            return False, 0.0

# Initialize enhanced CNN face recognizer
cnn_recognizer = EnhancedCNNFaceRecognizer()

def initialize_users_csv():
    """Initialize the users CSV file with headers if it doesn't exist"""
    if not os.path.exists(USERS_CSV):
        columns = [
            'user_id', 'name', 'email', 'phone', 'date_of_birth', 'gender', 
            'address', 'department', 'position', 'emergency_contact', 
            'emergency_phone', 'registration_date', 'last_login', 'login_count'
        ]
        df = pd.DataFrame(columns=columns)
        df.to_csv(USERS_CSV, index=False)
        print("Users CSV file initialized")

def email_exists(email):
    """Check if email already exists in the database"""
    try:
        if os.path.exists(USERS_CSV):
            df = pd.read_csv(USERS_CSV)
            return email.lower() in df['email'].str.lower().values
        return False
    except Exception as e:
        print(f"Error checking email existence: {e}")
        return False

def save_user_data(user_data, user_id):
    """Save user data to CSV file"""
    try:
        # Prepare the data
        new_user = {
            'user_id': user_id,
            'name': user_data.get('name', ''),
            'email': user_data.get('email', '').lower().strip(),
            'phone': user_data.get('phone', ''),
            'date_of_birth': user_data.get('dateOfBirth', ''),
            'gender': user_data.get('gender', ''),
            'address': user_data.get('address', ''),
            'department': user_data.get('department', ''),
            'position': user_data.get('position', ''),
            'emergency_contact': user_data.get('emergencyContact', ''),
            'emergency_phone': user_data.get('emergencyPhone', ''),
            'registration_date': datetime.datetime.now().isoformat(),
            'last_login': '',
            'login_count': 0
        }
        
        # Load existing data or create new DataFrame
        if os.path.exists(USERS_CSV):
            df = pd.read_csv(USERS_CSV)
        else:
            df = pd.DataFrame()
        
        # Add new user
        new_df = pd.DataFrame([new_user])
        df = pd.concat([df, new_df], ignore_index=True)
        
        # Save to CSV
        df.to_csv(USERS_CSV, index=False)
        return True
        
    except Exception as e:
        print(f"Error saving user data: {e}")
        return False

def get_user_data(user_id):
    """Get user data from CSV file"""
    try:
        if os.path.exists(USERS_CSV):
            df = pd.read_csv(USERS_CSV)
            user_data = df[df['user_id'] == user_id]
            if not user_data.empty:
                return user_data.iloc[0].to_dict()
        return None
    except Exception as e:
        print(f"Error getting user data: {e}")
        return None

def update_login_info(user_id):
    """Update last login time and increment login count"""
    try:
        if os.path.exists(USERS_CSV):
            df = pd.read_csv(USERS_CSV)
            user_idx = df[df['user_id'] == user_id].index
            if len(user_idx) > 0:
                df.loc[user_idx[0], 'last_login'] = datetime.datetime.now().isoformat()
                df.loc[user_idx[0], 'login_count'] = df.loc[user_idx[0], 'login_count'] + 1
                df.to_csv(USERS_CSV, index=False)
                return True
        return False
    except Exception as e:
        print(f"Error updating login info: {e}")
        return False

def decode_image(base64_str):
    try:
        img_bytes = base64.b64decode(base64_str.split(',')[1])
        np_arr = np.frombuffer(img_bytes, np.uint8)
        return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        print("Image decoding error:", e)
        return None

def recognize_user_enhanced(img):
    """Enhanced recognition using multi-photo trained models"""
    # Detect faces in the image
    faces = cnn_recognizer.detect_faces(img)
    
    if not faces:
        return 'no_persons_found'
    
    # Use the largest face
    largest_face = max(faces, key=lambda x: x['bbox'][2] * x['bbox'][3])
    unknown_features = cnn_recognizer.extract_features(largest_face['face'])
    
    if unknown_features is None:
        return 'no_persons_found'
    
    best_match = None
    best_score = 0.0
    
    # Compare with stored user features
    for file in os.listdir(PICKLES_DIR):
        if file.endswith('.pickle'):
            try:
                with open(os.path.join(PICKLES_DIR, file), 'rb') as f:
                    stored_data = pickle.load(f)
                
                # Handle both old and new format
                if isinstance(stored_data, dict) and 'ensemble_features' in stored_data:
                    # New multi-photo format
                    is_match, score = cnn_recognizer.compare_features_advanced(stored_data, unknown_features)
                else:
                    # Old single-photo format
                    is_match, score = cnn_recognizer.compare_features_simple(stored_data, unknown_features)
                
                if is_match and score > best_score:
                    best_score = score
                    best_match = file[:-7]  # Remove .pickle to get user_id
                    
            except Exception as e:
                print(f"Error loading features from {file}: {e}")
                continue
    
    print(f"Best match: {best_match}, Score: {best_score:.3f}")
    return best_match if best_match else 'unknown_person'

@app.route('/admin/data', methods=['GET'])
def get_admin_data():
    try:
        # Get all users data
        users_data = []
        if os.path.exists(USERS_CSV):
            df = pd.read_csv(USERS_CSV)
            users_data = df.to_dict('records')
            print(f"Found {len(users_data)} users in CSV")
        else:
            print("Users CSV file not found")
        
        # Get training quality data
        training_stats = {}
        pickle_files = [f for f in os.listdir(PICKLES_DIR) if f.endswith('.pickle')]
        print(f"Found {len(pickle_files)} pickle files")
        
        for file in pickle_files:
            user_id = file[:-7]  # Remove .pickle
            try:
                with open(os.path.join(PICKLES_DIR, file), 'rb') as f:
                    stored_data = pickle.load(f)
                
                if isinstance(stored_data, dict) and 'num_photos' in stored_data:
                    training_stats[user_id] = {
                        'photos': stored_data['num_photos'],
                        'quality': stored_data.get('training_quality', 1.0),
                        'type': 'multi-photo'
                    }
                else:
                    training_stats[user_id] = {
                        'photos': 1,
                        'quality': 1.0,
                        'type': 'single-photo'
                    }
            except Exception as e:
                print(f"Error reading {file}: {e}")
                training_stats[user_id] = {
                    'photos': 0,
                    'quality': 0.0,
                    'type': 'error'
                }
        
        # Get recent login logs only (last 50 entries)
        login_logs = []
        if os.path.exists(LOG_PATH):
            try:
                with open(LOG_PATH, 'r') as f:
                    all_logs = []
                    for line in f:
                        parts = line.strip().split(',')
                        if len(parts) >= 4:
                            all_logs.append({
                                'user_id': parts[0],
                                'name': parts[1],
                                'timestamp': parts[2],
                                'action': parts[3]
                            })
                    # Keep only recent 50 logs
                    login_logs = sorted(all_logs, key=lambda x: x['timestamp'], reverse=True)[:50]
                print(f"Returning {len(login_logs)} recent log entries")
            except Exception as e:
                print(f"Error reading logs: {e}")
        
        # Calculate statistics
        total_users = len(users_data)
        multi_photo_users = sum(1 for stats in training_stats.values() if stats['photos'] > 1)
        total_logins = sum(1 for log in login_logs if log['action'] == 'in')
        
        # Get user data with only first image (for profile display)
        users_with_essential_data = []
        for user in users_data:
            user_id = user.get('user_id', '') if not pd.isna(user.get('user_id')) else ''
            
            # Get only the first/main image
            user_image = None
            # Try main image first
            img_path = os.path.join(PHOTOS_DIR, f'{user_id}.jpg')
            if not os.path.exists(img_path):
                # Try first numbered image
                img_path = os.path.join(PHOTOS_DIR, f'{user_id}_1.jpg')
            
            if os.path.exists(img_path):
                try:
                    image = cv2.imread(img_path)
                    if image is not None:
                        # Resize image to reduce payload size
                        image = cv2.resize(image, (100, 100))
                        _, buffer = cv2.imencode('.jpg', image, [cv2.IMWRITE_JPEG_QUALITY, 80])
                        user_image = base64.b64encode(buffer).decode('utf-8')
                except Exception as e:
                    print(f"Error reading image {img_path}: {e}")
            
            # Create user data with only essential fields
            user_essential = {
                'user_id': user_id,
                'name': user.get('name', '') if not pd.isna(user.get('name')) else '',
                'email': user.get('email', '') if not pd.isna(user.get('email')) else '',
                'phone': user.get('phone', '') if not pd.isna(user.get('phone')) else '',
                'date_of_birth': user.get('date_of_birth', '') if not pd.isna(user.get('date_of_birth')) else '',
                'gender': user.get('gender', '') if not pd.isna(user.get('gender')) else '',
                'address': user.get('address', '') if not pd.isna(user.get('address')) else '',
                'department': user.get('department', '') if not pd.isna(user.get('department')) else '',
                'position': user.get('position', '') if not pd.isna(user.get('position')) else '',
                'emergency_contact': user.get('emergency_contact', '') if not pd.isna(user.get('emergency_contact')) else '',
                'emergency_phone': user.get('emergency_phone', '') if not pd.isna(user.get('emergency_phone')) else '',
                'registration_date': user.get('created_at', '') if not pd.isna(user.get('created_at')) else '',
                'last_login': user.get('last_login', '') if not pd.isna(user.get('last_login')) else '',
                'login_count': int(user.get('login_count', 0)) if not pd.isna(user.get('login_count')) else 0,
                'images': [user_image] if user_image else [],
                'training_stats': training_stats.get(user_id, {
                    'photos': 0,
                    'quality': 0.0,
                    'type': 'no-data'
                })
            }
            
            users_with_essential_data.append(user_essential)
        
        response_data = {
            'success': True,
            'data': {
                'statistics': {
                    'total_users': total_users,
                    'multi_photo_users': multi_photo_users,
                    'single_photo_users': total_users - multi_photo_users,
                    'total_logins': total_logins,
                    'avg_photos_per_user': round(sum(stats['photos'] for stats in training_stats.values()) / max(total_users, 1), 2) if total_users > 0 else 0
                },
                'users': users_with_essential_data,
                'logs': login_logs  # Already sorted and limited
            }
        }
        
        print(f"Returning optimized data for {total_users} users")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Admin data error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify(success=False, message=f'Admin data error: {str(e)}')

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    image = decode_image(data['image'])
    
    if image is None:
        return jsonify(success=False, message='Invalid image data.')
    
    user_id = recognize_user_enhanced(image)

    if user_id in ['no_persons_found', 'unknown_person']:
        return jsonify(success=False, message='Face not recognized.')

    # Get user data from CSV
    user_data = get_user_data(user_id)
    if not user_data:
        return jsonify(success=False, message='User data not found.')
    
    # Update login information
    update_login_info(user_id)

    # Log the login event
    with open(LOG_PATH, 'a') as f:
        f.write(f'{user_id},{user_data["name"]},{datetime.datetime.now()},in\n')

    # Return stored image (use the first training image if multiple exist)
    image_path = os.path.join(PHOTOS_DIR, f'{user_id}_1.jpg')
    if not os.path.exists(image_path):
        # Fallback to old single image format
        image_path = os.path.join(PHOTOS_DIR, f'{user_id}.jpg')
    
    if not os.path.exists(image_path):
        return jsonify(success=False, message='Stored image not found.')

    stored_image = cv2.imread(image_path)
    _, buffer = cv2.imencode('.jpg', stored_image)
    img_b64 = base64.b64encode(buffer).decode('utf-8')

    # Prepare response with user data
    response_data = {
    'success': True,
    'user_id': user_id,
    'name': user_data.get('name', '') if not pd.isna(user_data.get('name')) else '',
    'email': user_data.get('email', '') if not pd.isna(user_data.get('email')) else '',
    'phone': user_data.get('phone', '') if not pd.isna(user_data.get('phone')) else '',
    'date_of_birth': user_data.get('date_of_birth', '') if not pd.isna(user_data.get('date_of_birth')) else '',
    'gender': user_data.get('gender', '') if not pd.isna(user_data.get('gender')) else '',
    'address': user_data.get('address', '') if not pd.isna(user_data.get('address')) else '',
    'department': user_data.get('department', '') if not pd.isna(user_data.get('department')) else '',
    'position': user_data.get('position', '') if not pd.isna(user_data.get('position')) else '',
    'emergency_contact': user_data.get('emergency_contact', '') if not pd.isna(user_data.get('emergency_contact')) else '',
    'emergency_phone': user_data.get('emergency_phone', '') if not pd.isna(user_data.get('emergency_phone')) else '',
    'registration_date': user_data.get('registration_date', '') if not pd.isna(user_data.get('registration_date')) else '',
    'last_login': user_data.get('last_login', '') if not pd.isna(user_data.get('last_login')) else '',
    'login_count': int(user_data.get('login_count', 0)) + 1 if not pd.isna(user_data.get('login_count')) else 1,
    'image': img_b64
}

    return jsonify(response_data)

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    
    # Extract all form data - no validation except for required fields
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    date_of_birth = data.get('dateOfBirth', '').strip()
    gender = data.get('gender', '').strip()
    address = data.get('address', '').strip()
    department = data.get('department', '').strip()
    position = data.get('position', '').strip()
    emergency_contact = data.get('emergencyContact', '').strip()
    emergency_phone = data.get('emergencyPhone', '').strip()
    images_data = data.get('images', [])

    # Only check if images provided
    if not images_data:
        return jsonify(success=False, message='No images provided.')
    
    if len(images_data) < 2:
        return jsonify(success=False, message=f'At least 2 images are required for reliable recognition. Received {len(images_data)}.')

    # Check if email already exists (only if email is provided)
    if email and email_exists(email):
        return jsonify(success=False, message='A user with this email address already exists.')

    # Decode all images
    images = []
    for i, img_data in enumerate(images_data):
        image = decode_image(img_data)
        if image is None:
            return jsonify(success=False, message=f'Invalid image data for image {i+1}.')
        images.append(image)

    # Check if any face already exists under another user using the first image
    matched_user_id = recognize_user_enhanced(images[0])
    if matched_user_id not in ['no_persons_found', 'unknown_person']:
        matched_user_data = get_user_data(matched_user_id)
        user_name = matched_user_data['name'] if matched_user_data else matched_user_id
        return jsonify(success=False, message=f'This face is already registered under "{user_name}".')

    # Generate unique user ID
    user_id = str(uuid.uuid4())[:8]  # 8-character unique ID
    
    # Extract and save enhanced CNN features from multiple images
    training_data, valid_images = cnn_recognizer.extract_features_from_multiple_images(images)
    
    if training_data is None:
        return jsonify(success=False, message=f'Failed to extract features. Only {valid_images} out of {len(images)} images had detectable faces.')

    # Save enhanced training data
    pickle_path = os.path.join(PICKLES_DIR, f'{user_id}.pickle')
    with open(pickle_path, 'wb') as f:
        pickle.dump(training_data, f)

    # Save all training photos
    for i, image in enumerate(images):
        photo_path = os.path.join(PHOTOS_DIR, f'{user_id}_{i+1}.jpg')
        cv2.imwrite(photo_path, image)

    # Also save the first image with the old naming convention for compatibility
    first_photo_path = os.path.join(PHOTOS_DIR, f'{user_id}.jpg')
    cv2.imwrite(first_photo_path, images[0])

    # Save user data to CSV
    user_data = {
        'name': name,
        'email': email,
        'phone': phone,
        'dateOfBirth': date_of_birth,
        'gender': gender,
        'address': address,
        'department': department,
        'position': position,
        'emergencyContact': emergency_contact,
        'emergencyPhone': emergency_phone
    }
    
    if not save_user_data(user_data, user_id):
        # Clean up if user data saving failed
        try:
            os.remove(pickle_path)
            for i in range(len(images)):
                photo_path = os.path.join(PHOTOS_DIR, f'{user_id}_{i+1}.jpg')
                if os.path.exists(photo_path):
                    os.remove(photo_path)
            if os.path.exists(first_photo_path):
                os.remove(first_photo_path)
        except:
            pass
        return jsonify(success=False, message='Failed to save user data.')

    return jsonify(
        success=True, 
        user_id=user_id,
        name=name,
        email=email,
        training_photos=len(images),
        valid_photos=valid_images,
        training_quality=training_data['training_quality']
    )

@app.route('/logout', methods=['POST'])
def logout():
    data = request.json
    user_id = data.get('user_id', '').strip()
    name = data.get('name', '').strip()
    
    if not user_id and not name:
        return jsonify(success=False, message='User ID or name is required.')
    
    # If only name is provided, try to find user_id
    if not user_id and name:
        # For backward compatibility, assume name is user_id
        user_id = name
    
    # Log the logout event
    with open(LOG_PATH, 'a') as f:
        f.write(f'{user_id},{name},{datetime.datetime.now()},out\n')
    
    return jsonify(success=True, message='Logout logged successfully.')

# Initialize the application
initialize_users_csv()

if __name__ == '__main__':
    app.run(debug=True)