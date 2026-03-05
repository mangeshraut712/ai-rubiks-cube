# Gemini Rubik's Tutor - Feature Documentation (2026 Edition)

## 🚀 Overview

This document outlines all the features and improvements added in the 2026 edition of the Gemini Rubik's Tutor project.

---

## 📦 Core Projects

### 1. Main 3x3 Rubik's Cube Tutor (frontend + backend)

- **Location**: `frontend/` and `backend/`
- **Description**: AI-powered Rubik's Cube tutoring with Google Gemini Live API

### 2. Legacy 2x2 Solver

- **Location**: `frontend/public/legacy-2x2-solver/`
- **Description**: Standalone 2x2 cube solver with BFS/A\*/IDS algorithms

---

## 🆕 New Features (2026)

### State Management (Zustand)

**File**: `frontend/src/store/cubeStore.js`

Modern state management with Zustand + Immer:

- ✅ Global cube state management
- ✅ Undo/Redo functionality
- ✅ Move history tracking
- ✅ Statistics persistence
- ✅ Settings storage
- ✅ Import/Export functionality
- ✅ Tutorial progress tracking

**Usage**:

```javascript
import { useCubeStore } from "./store/cubeStore";

// Access state
const cubeState = useCubeStore((state) => state.cubeState);

// Use actions
const { applyMove, undoMove, redoMove } = useCubeStore();
```

---

### Keyboard Shortcuts

**File**: `frontend/src/hooks/useKeyboardShortcuts.js`

Comprehensive keyboard control:

| Shortcut                         | Action                          |
| -------------------------------- | ------------------------------- |
| `U, R, F, D, L, B`               | Basic cube moves                |
| `Shift + Letter`                 | Prime moves (counter-clockwise) |
| `2 + Letter`                     | Double moves (180°)             |
| `Space`                          | Start/End session               |
| `Ctrl + Z`                       | Undo                            |
| `Ctrl + Y` or `Ctrl + Shift + Z` | Redo                            |
| `H`                              | Request hint                    |
| `Shift + C`                      | Toggle challenge mode           |
| `Shift + D`                      | Toggle dark mode                |
| `Ctrl + ,`                       | Open settings                   |

---

### Voice Commands

**File**: `frontend/src/hooks/useVoiceCommands.js`

Hands-free cube control using Web Speech API:

| Voice Command                        | Action          |
| ------------------------------------ | --------------- |
| "Turn up"                            | U               |
| "Up prime" or "Up counter-clockwise" | U'              |
| "Up twice" or "Up double"            | U2              |
| "Reset"                              | Reset cube      |
| "Scramble"                           | Scramble cube   |
| "Solve"                              | Auto-solve      |
| "Hint"                               | Request hint    |
| "Undo" / "Redo"                      | Undo/Redo moves |

---

### Tutorial Mode

**File**: `frontend/src/components/Tutorial.jsx`

Interactive 8-step tutorial for beginners:

1. Welcome introduction
2. Understanding cube structure
3. Move notation explained
4. Keyboard shortcuts guide
5. CFOP method overview
6. Voice commands tutorial
7. Challenge mode introduction
8. Ready to start!

---

### Statistics Dashboard

**File**: `frontend/src/components/Statistics.jsx`

Comprehensive analytics:

- Total sessions and solved cubes
- Best time and average time tracking
- Total moves and average moves per session
- Move accuracy percentage
- Progress bars towards mastery levels
- Achievement system

---

### Settings Panel

**File**: `frontend/src/components/Settings.jsx`

Configurable options:

- Dark mode toggle
- Sound effects on/off
- Auto-rotation setting
- Voice commands enable/disable
- Animation speed adjustment
- Haptic feedback (mobile)
- High contrast mode
- Show hints option

---

### Dark Mode Support

**File**: `frontend/src/index.css`

Full dark mode implementation:

- CSS variables for theming
- Automatic system preference detection
- Manual toggle with persistence
- Smooth transitions between themes
- Glass morphism support in both modes

---

### PWA Support

**Files**:

- `frontend/public/manifest.json`
- `frontend/vite.config.js` (Vite PWA plugin)

Progressive Web App features:

- Installable on desktop/mobile
- Offline caching with Workbox
- Service worker auto-updates
- App shortcuts
- Optimized icons for all sizes
- Runtime caching for fonts and images

---

### Testing Suite

**Files**:

- `frontend/vitest.config.js`
- `frontend/src/test/setup.js`
- `frontend/src/**/*.test.js`

Modern testing with Vitest:

- Unit tests for utilities
- Hook testing with renderHook
- Component testing with React Testing Library
- Mocked browser APIs (WebSocket, SpeechRecognition, etc.)
- Coverage reporting with v8

**Run tests**:

```bash
npm run test        # Run tests
npm run test:ui     # Run with UI
```

---

## 🔄 Legacy 2x2 Solver Fixes

### Cube Engine

**File**: `frontend/public/legacy-2x2-solver/cube-engine.js`

Fixed issues:

- Corrected 2x2 cube state representation
- Proper sticker color mappings
- Standard Rubik's cube colors
- Correct face orientations

### Solver Algorithms

**Files**: `solver.js`, `a-star-solver.js`, `web-worker-solver.js`

Fixed:

- Correct move permutations for 2x2 cube
- Updated SOLVED state constant
- Consistent state format across all solvers

---

## 📦 Updated Dependencies (2026)

### Frontend

- **React**: 18.3.1 → 19.0.0
- **Vite**: 7.1.3 → 6.0.11
- **Tailwind CSS**: 4.1.13 → 4.0.0
- **Three.js**: 0.179.1 → 0.172.0
- **New**: Zustand 5, Framer Motion 11, React Hot Toast 2

### Backend

- **Express**: 4.21.2 → 5.0.1
- **@google/genai**: Latest
- **New**: Winston (logging), Zod (validation), Helmet (security)

---

## 🎨 UI Enhancements

### CubeViewer Improvements

- Smoother animations (easeInOutQuart easing)
- Better lighting setup with rim light
- Animation state tracking
- Dynamic shadow effects
- Improved visual feedback

### Color System

- Standard Rubik's cube colors
- Material Design color variants
- High contrast mode support

---

## 🛡️ Error Handling

### WebRTC Helpers

**File**: `frontend/src/utils/webrtcHelpers.js`

Enhanced error handling:

- Permission denial handling with user-friendly messages
- Audio-only fallback for camera failures
- Silence detection to reduce bandwidth
- Browser capability checking

### Gemini Live Client

**File**: `backend/src/geminiLiveClient.js`

Improvements:

- Try-catch for all API calls
- Multiple model fallbacks
- Better connection resilience
- Improved error logging

---

## 🚀 Performance Optimizations

### Build Optimizations

- Code splitting with manual chunks
- Terser minification
- Source maps for debugging
- Tree shaking

### Runtime Optimizations

- Motion detection for video frames
- Silence detection for audio
- Lazy loading for 3D components
- Service worker caching strategies

---

## 📱 Accessibility

- Full keyboard navigation
- Screen reader support
- Focus indicators
- Reduced motion support
- High contrast mode
- ARIA labels

---

## 🔧 Configuration

### Environment Variables

**Backend** (`.env`):

```env
GEMINI_API_KEY=your_key_here
GEMINI_LIVE_MODEL=gemini-2.5-flash-native-audio-preview
PORT=8080
DEMO_MODE=false
```

**Frontend** (`.env.local`):

```env
VITE_BACKEND_ORIGIN=http://localhost:8080
```

---

## 📝 API Documentation

### WebSocket Events

**Client → Server**:

- `video_frame`: Send webcam frame
- `user_text`: Send text message
- `interrupt`: Interrupt AI
- `move_applied`: User performed move
- `hint_request`: Request a hint
- `challenge_mode`: Toggle challenge mode
- `solve_request`: Request solution
- `auto_solve`: Auto-solve the cube
- `end_session`: End the session

**Server → Client**:

- `status`: Connection status
- `text_response`: AI text response
- `audio_response`: AI audio response
- `move_instruction`: Next move to perform
- `cube_state_update`: Updated cube state
- `move_history_update`: Move history update
- `hint_response`: Hint from AI
- `challenge_update`: Challenge mode update
- `interruption`: Playback interrupted
- `thinking`: AI thinking state
- `solution_response`: Solution preview
- `solve_complete`: Solve finished

---

## 🎯 Usage Examples

### Start a Session

1. Click "Start Session" or press `Space`
2. Allow camera and microphone access
3. Show your cube to the camera
4. Follow Cubey's voice instructions

### Use Keyboard Shortcuts

1. Press `U` to turn Up face clockwise
2. Press `Shift+R` to turn Right face counter-clockwise
3. Press `Ctrl+Z` to undo a move

### Enable Voice Commands

1. Open Settings (`Ctrl+,`)
2. Toggle "Voice Commands" on
3. Say "Turn right" to perform R move
4. Say "Up prime" to perform U' move

---

## 📊 Future Roadmap

### Planned Features

- [ ] WebAssembly solver for better performance
- [ ] Multiplayer challenge mode with WebRTC
- [ ] More cube sizes (4x4, 5x5)
- [ ] Machine learning move prediction
- [ ] AR cube scanning
- [ ] Mobile app with React Native

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests: `npm run test`
4. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Credits

- **Developer**: Mangesh Raut
- **AI Technology**: Google Gemini Live API
- **Challenge**: Gemini Live Agent Challenge 2025/2026

---

_Last Updated: 2026_
