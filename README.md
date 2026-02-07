# CV Supreme

**CV Supreme** is an AI-powered ping pong coaching system that analyzes gameplay in real-time to help players improve their skills and develop winning strategies. Using advanced computer vision and AI, the system provides detailed feedback on technique, opponent analysis, and strategic recommendations.

## 🎯 Project Overview

CV Supreme was born from a vision to create the ultimate ping pong coaching assistant, one that could analyze gameplay from a first-person perspective using wearable technology. The project initially aimed to leverage **Meta Ray-Ban glasses** to capture live gameplay from the player's point of view, enabling real-time analysis and coaching feedback.

The system has evolved into a comprehensive coaching platform that combines multiple computer vision technologies to extract rich gameplay data, analyze player behavior, and provide actionable insights for improvement.

## 🚀 What It Does

CV Supreme operates in three distinct modes, each designed for different coaching scenarios:

### 1. **Competitive Mode (1st Person View)**
Analyzes your opponent's gameplay from your perspective during a match. The camera faces the opponent, capturing their paddle movements, shot patterns, and positioning. This mode helps you:
- Understand your opponent's playstyle and tendencies
- Identify weaknesses in their technique
- Develop counter-strategies based on real-time analysis
- Track shot placement patterns and spin preferences

### 2. **Competitive Mode (3rd Person View)**
Analyzes both players from a side view of the table, providing a comprehensive view of the entire match. This mode offers:
- Full court analysis and positioning heatmaps
- Both players' shot patterns and strategies
- Rally analysis and point construction
- Tactical insights for both offensive and defensive play

### 3. **Training Mode**
Focuses on improving your own technique through constructive feedback. This mode:
- Analyzes your form, swing mechanics, and footwork
- Identifies technical errors and areas for improvement
- Provides personalized coaching recommendations
- Tracks progress over time

## 🎯 Objectives

The primary goal of CV Supreme is to **coach players on how to become better ping pong players** through data-driven analysis and AI-powered insights. The system achieves this by:

1. **Opponent Analysis (Competitive Modes)**
   - Detecting and analyzing opponent shots in real-time
   - Identifying playstyle characteristics (aggressive, defensive, spin-heavy, etc.)
   - Mapping position heatmaps to reveal court coverage patterns
   - Determining handedness and dominant shot preferences
   - Generating strategic recommendations to exploit weaknesses

2. **Self-Improvement (Training Mode)**
   - Analyzing your own technique and form
   - Identifying technical errors (poor follow-through, incorrect paddle angle, etc.)
   - Providing constructive feedback on swing mechanics
   - Tracking improvement over multiple sessions

3. **Strategic Intelligence**
   - Combining multiple data sources (pose, ball tracking, paddle analysis) for comprehensive insights
   - Using AI to infer strategy, tendencies, and optimal counter-strategies
   - Generating actionable recommendations based on detected patterns

## 🛠️ Tech Stack

CV Supreme leverages a powerful combination of computer vision and AI technologies:

### **Overshoot SDK** - Paddle & Shot Analysis
- **Purpose**: Extracts detailed metadata about paddle movements, shot types, and spin characteristics
- **What it detects**:
  - Paddle visibility and strike detection
  - Paddle face orientation (vertical angle, lateral angle)
  - Motion primitives (horizontal direction, vertical component, motion plane)
  - Speed and follow-through patterns
  - Handedness (left/right hand)
  - Paddle distance from camera
  - Rotation and wrist action
- **How it's used**: 
  - Analyzes short video clips (0.6 seconds) to detect opponent shots
  - Extracts structured JSON data about each shot (spin type, paddle angle, motion direction)
  - Provides confidence scores for each detected characteristic
  - Enables temporal reasoning by comparing frames over time

### **MediaPipe** - Pose Detection & Biomechanics
- **Purpose**: Tracks body pose, joint angles, and movement patterns
- **What it detects**:
  - Full body pose landmarks (33 key points)
  - Joint angles (elbows, knees, shoulders, hips)
  - Range of motion (ROM) for each joint
  - Left/right symmetry and asymmetry
  - Arm swing velocity and acceleration
- **How it's used**:
  - Calculates arm angles during swings to infer shot type and power
  - Detects rapid arm movements (swing detection) to identify hit moments
  - Tracks body positioning to understand court coverage
  - Analyzes biomechanics to identify technical errors (poor form, asymmetry)
  - Provides real-time visual feedback with skeleton overlays

### **OpenCV** - Ball Tracking
- **Purpose**: Detects and tracks the ping pong ball throughout gameplay
- **What it detects**:
  - Ball position (x, y coordinates) in each frame
  - Ball velocity and trajectory
  - Bounce detection (downward to upward velocity changes)
  - Ball confidence scores
- **How it's used**:
  - Tracks ball movement to understand shot placement patterns
  - Detects bounces to identify when the ball hits the table
  - Combines with pose data to correlate ball position with player movements
  - Creates position heatmaps showing where shots land
  - Validates hit detection (ball near paddle + swing detected = hit)

### **Google Gemini** - AI Analysis & Strategy
- **Purpose**: Synthesizes all collected data to generate strategic insights
- **What it analyzes**:
  - Combined data from Overshoot, MediaPipe, and OpenCV
  - Shot sequences and patterns
  - Opponent positioning and movement tendencies
  - Playstyle characteristics
- **How it's used**:
  - Receives key frames around detected hits (before, during, after)
  - Analyzes opponent paddle motion, spin, and shot type
  - Infers playstyle (aggressive, defensive, spin-focused, etc.)
  - Generates position heatmaps based on ball landing locations
  - Determines handedness and dominant shot preferences
  - Creates strategic recommendations to exploit weaknesses
  - In Training Mode: provides constructive feedback on user errors

## 🔍 Characteristics & Data Extraction

CV Supreme extracts a rich set of characteristics to build a comprehensive understanding of gameplay:

### **Paddle Characteristics** (via Overshoot)
- **Paddle face angle**: Vertical angle (0-180°) to infer spin type (topspin vs backspin)
- **Motion direction**: Horizontal (left-to-right, right-to-left) and vertical (upward, downward)
- **Speed**: Qualitative assessment (very slow to very fast)
- **Follow-through**: Length and type of follow-through motion
- **Rotation**: Wrist action and paddle rotation patterns

### **Biomechanical Characteristics** (via MediaPipe)
- **Arm angles**: Elbow and shoulder angles during swings
- **Swing velocity**: Speed of arm movement to infer shot power
- **Body positioning**: Court position and movement patterns
- **Symmetry**: Left/right arm symmetry to identify technical issues
- **Range of motion**: Joint flexibility and movement limits

### **Ball Characteristics** (via OpenCV)
- **Trajectory**: Ball path through the air
- **Landing zones**: Where the ball hits the table (near net, mid-table, deep, corners)
- **Bounce patterns**: Detection of table bounces
- **Speed**: Ball velocity in pixels per second

### **Derived Characteristics** (via Gemini)
- **Playstyle**: Aggressive, defensive, spin-focused, placement-focused
- **Position heatmaps**: Court coverage patterns showing preferred shot locations
- **Handedness**: Dominant hand and shot preferences
- **Tendencies**: Recurring patterns in shot selection and placement
- **Weaknesses**: Areas where the opponent struggles or makes errors

## 🧠 Strategy Inference

By combining all these data sources, CV Supreme can infer sophisticated strategic insights:

1. **Playstyle Identification**
   - Analyzes shot patterns, spin preferences, and positioning to classify playstyle
   - Identifies if opponent is aggressive (fast, attacking shots) or defensive (slow, placement-focused)
   - Detects spin-heavy players vs power players

2. **Position Heatmaps**
   - Tracks ball landing locations to create visual heatmaps
   - Reveals opponent's preferred shot zones (forehand corner, backhand side, etc.)
   - Identifies coverage gaps where opponent struggles

3. **Handedness & Dominance**
   - Determines if opponent is left or right-handed
   - Identifies dominant shot side (forehand vs backhand preference)
   - Suggests strategies to exploit weaker side

4. **Strategic Recommendations**
   - Generates actionable advice based on detected patterns
   - Suggests shot placement to exploit weaknesses
   - Recommends counter-strategies (e.g., "Opponent struggles with backhand, target that side")
   - In Training Mode: Suggests technical improvements (e.g., "Improve follow-through on forehand shots")

## 📊 Data Flow

```
Camera Feed (iVCam/Webcam)
    ↓
┌─────────────────────────────────────┐
│  Parallel Processing:                │
│  • Overshoot: Paddle analysis       │
│  • MediaPipe: Pose detection        │
│  • OpenCV: Ball tracking            │
└─────────────────────────────────────┘
    ↓
Hit Detection (combines ball bounce + swing)
    ↓
Frame Selection (capture frames around hit)
    ↓
Gemini Analysis (synthesize all data)
    ↓
Strategic Insights & Recommendations
```

## 🏗️ Project Structure

```
CV-Supreme/
├── competition-mode-v2/    # Latest integrated competitive mode
│   ├── src/
│   │   ├── camera/         # Camera management (iVCam support)
│   │   ├── ball/           # Ball tracking client
│   │   ├── pose/           # MediaPipe pose detection
│   │   └── core/           # Event bus, config, main orchestrator
│   └── index.html
├── comp_mode/              # Original competitive mode (1st person)
│   └── src/                # Overshoot integration, pose detection
├── training-mode/          # Training mode (3rd person, both players)
│   └── src/                # Overshoot analysis for training feedback
├── training-mode-openCV/   # OpenCV ball tracking backend
│   ├── ball_tracker.py     # Ball detection algorithm
│   └── server.py           # Flask API server
└── user-interface/         # Next.js web interface
    └── src/app/            # React components, camera view
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.8+
- Camera (webcam or iVCam for phone streaming)
- API keys:
  - Overshoot API key ([platform.overshoot.ai](https://platform.overshoot.ai/api-keys))
  - Google Gemini API key (for advanced analysis)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CV-Supreme
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```
   VITE_OVERSHOOT_API_KEY=your_overshoot_key_here
   VITE_GEMINI_API_KEY=your_gemini_key_here
   ```

4. **Set up OpenCV backend** (for ball tracking)
   ```bash
   cd training-mode-openCV
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python3 server.py
   ```

5. **Start the frontend**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Navigate to the URL shown (e.g., `http://localhost:5173`)

## 📝 Development History

CV Supreme started as a hackathon project designed for **Meta Ray-Ban glasses**, aiming to provide real-time coaching feedback from a first-person perspective. The initial vision was to:

- Capture gameplay directly from the player's point of view
- Analyze opponent movements and shots in real-time
- Provide instant strategic recommendations

As development progressed, the project expanded to support:
- Multiple camera sources (webcam, iVCam for phone streaming)
- Third-person analysis for comprehensive match review
- Training mode for self-improvement
- Integration of multiple computer vision technologies

The name "CV Supreme" pays homage to "Marty Supreme," reflecting the project's ambition to be the ultimate computer vision-powered ping pong coaching system.

## 🎓 Use Cases

- **Competitive Players**: Analyze opponents during matches to develop winning strategies
- **Training Sessions**: Get detailed feedback on technique and form
- **Coaches**: Use data to identify areas for improvement in students
- **Match Analysis**: Review recorded matches to understand patterns and tendencies

## 🔮 Future Enhancements

- Real-time voice coaching feedback
- Multi-session progress tracking
- Advanced spin detection and classification
- Integration with wearable devices (Meta Ray-Ban glasses)
- Cloud-based analysis for remote coaching
- Mobile app for on-the-go analysis

## 📄 License

MIT License
## 🙏 Acknowledgments

- Built with [Overshoot](https://overshoot.ai) for vision reasoning
- Powered by [MediaPipe](https://mediapipe.dev) for pose detection
- Enhanced with [OpenCV](https://opencv.org) for ball tracking
- Analyzed by [Google Gemini](https://deepmind.google/technologies/gemini/) for strategic insights

---
