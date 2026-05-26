# Hand Kombat - Gesture-Controlled Fighting Game

A real-time fighting game controlled by hand gestures using MediaPipe, with an AI opponent powered by LangGraph.

## 🎮 Features

- **Gesture Recognition**: Control your fighter using hand gestures detected via webcam
- **AI Opponent**: Intelligent enemy that adapts to your fighting style
- **Real-time Combat**: Smooth gameplay with instant gesture-to-action response
- **Coaching Tips**: Get strategic advice based on your fighting patterns

## 🏗️ Architecture

The project consists of three main components:

1. **Frontend** (Vite + Vanilla JS): Game UI and MediaPipe hand tracking
2. **Backend** (Node.js + WebSocket): Real-time communication bridge
3. **AI Service** (FastAPI + LangGraph): Gesture recognition and AI opponent logic

```
Frontend (Port 5173)
    ↓ WebSocket
Backend (Port 5050)
    ↓ HTTP
AI Service (Port 8000)
```

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **Webcam** (for gesture detection)

## 🚀 Installation

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install AI Service Dependencies

```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## ▶️ Running the Application

You need to start all three services. Open **three separate terminals**:

### Terminal 1: Start AI Service

```bash
cd ai-service
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The AI service will be available at `http://localhost:8000`

### Terminal 2: Start Backend WebSocket Server

```bash
cd backend
node src/socket.js
```

The WebSocket server will run on `ws://localhost:5050`

### Terminal 3: Start Frontend

```bash
cd frontend
npm run dev
```

The game will be available at `http://localhost:5173`

## 🎯 How to Play

1. **Allow Camera Access**: When prompted, grant camera permissions
2. **Start Game**: Click "Start Game" on the menu
3. **Control Your Fighter**:
   - **Punch**: Extend your hand forward with fingers up (hand high, fingers extended)
   - **Kick**: Show both hands or place hand very low
   - **Block**: Hold hand in defensive position (fingers up, hand centered)
   - **Idle**: No gesture or hand down

4. **Win Condition**: Reduce enemy health to zero before yours runs out!

## 🤖 AI Opponent Behavior

The AI opponent uses LangGraph to:
- Analyze your fighting patterns
- Adapt difficulty based on your aggression
- Counter your moves strategically
- Provide coaching tips to improve your gameplay

## 🛠️ Gesture Recognition

The system uses MediaPipe Hands to track 21 hand landmarks in real-time. The AI service processes these landmarks to classify gestures:

- **Hand Position**: Vertical position determines action type
- **Finger Extension**: Detects punch vs block
- **Hand Count**: Two hands trigger kick action
- **Movement Patterns**: Tracked for AI prediction

## 📁 Project Structure

```
Hand-Kombat/
├── frontend/
│   ├── src/
│   │   ├── game/
│   │   │   ├── GameEngine.js      # Main game logic
│   │   │   ├── Player.js          # Player character
│   │   │   ├── Enemy.js           # Enemy character
│   │   │   └── gesture/
│   │   │       ├── handtracking.js # MediaPipe integration
│   │   │       └── socket/
│   │   │           └── socket.js   # WebSocket client
│   │   ├── UI/
│   │   │   └── HealthBar.js       # Health display
│   │   ├── App.js                 # Main app entry
│   │   └── Menu.js                # Game menu
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── server.js              # Express server
│   │   └── socket.js              # WebSocket server
│   └── package.json
├── ai-service/
│   ├── graph/
│   │   ├── agent_graph.py         # LangGraph workflow
│   │   ├── nodes.py               # AI logic nodes
│   │   └── state.py               # State management
│   ├── main.py                    # FastAPI server
│   └── requirements.txt
└── README.md
```

## 🔧 Configuration

### Ports

- Frontend: `5173` (Vite default)
- Backend WebSocket: `5050`
- AI Service: `8000`

To change ports, update:
- Frontend: `frontend/src/game/gesture/socket/socket.js` (line 1)
- Backend: `backend/src/socket.js` (line 5)
- AI Service: Run with `--port` flag

## 🐛 Troubleshooting

### Camera Not Working
- Ensure browser has camera permissions
- Check if another application is using the camera
- Try refreshing the page

### WebSocket Connection Failed
- Verify backend is running on port 5050
- Check browser console for connection errors
- Ensure no firewall is blocking the connection

### AI Service Not Responding
- Confirm AI service is running on port 8000
- Check terminal for Python errors
- Verify all dependencies are installed
- Make sure virtual environment is activated

### Gestures Not Detected
- Ensure good lighting conditions
- Keep hand within camera frame
- Try adjusting hand distance from camera
- Check browser console for MediaPipe errors

## 🎨 Customization

### Adjust Gesture Sensitivity

Edit `ai-service/graph/nodes.py` in the `gesture_node` function to modify gesture detection thresholds.

### Modify AI Difficulty

Edit `ai-service/graph/nodes.py` in the `difficulty_node` function to adjust aggression levels.

### Change Damage Values

Edit `frontend/src/game/GameEngine.js` in the `update` method to modify damage amounts:
- Punch: 10 damage
- Kick: 15 damage
- Blocking reduces damage to 0

## 📝 Development

### Adding New Gestures

1. Update gesture detection in `ai-service/graph/nodes.py`
2. Add corresponding animations in `frontend/src/game/Player.js` and `frontend/src/game/Enemy.js`
3. Update damage logic in `frontend/src/game/GameEngine.js`

### Enhancing AI Behavior

Modify the LangGraph workflow in `ai-service/graph/agent_graph.py` to add new nodes or change the decision flow.

## 🔄 Data Flow

1. **Frontend** captures webcam feed and extracts hand landmarks using MediaPipe
2. **Frontend** sends landmarks to **Backend** via WebSocket
3. **Backend** forwards landmarks to **AI Service** via HTTP
4. **AI Service** processes landmarks through LangGraph:
   - Recognizes gesture (punch/kick/block/idle)
   - Updates player history
   - Predicts player's next move
   - Adjusts difficulty
   - Decides enemy action
   - Generates coaching tip
5. **AI Service** returns player action, enemy action, and tip
6. **Backend** sends response back to **Frontend** via WebSocket
7. **Frontend** updates game state, animations, and health bars

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

---

**Enjoy the game! 🥊👊**
