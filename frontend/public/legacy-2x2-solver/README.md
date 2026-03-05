# 🧊 2×2 Rubik's Cube Solver - Web Application

> **Version 3.0** | Modern Apple-inspired UI with Bidirectional BFS, A*, and IDA* algorithms

## 🚀 Quick Start

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

## 📁 Files

| File                   | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `index.html`           | Main UI with Apple-style design, shadcn/ui tokens |
| `solver.js`            | Bidirectional BFS & IDA\* algorithms              |
| `a-star-solver.js`     | A\* search with heuristics                        |
| `cube-engine.js`       | Three.js 3D visualization                         |
| `app.js`               | Application controller with step-by-step hints    |
| `web-worker-solver.js` | Background solving (optional)                     |

## ⌨️ Shortcuts

| Key     | Action   |
| ------- | -------- |
| `Space` | Scramble |
| `Enter` | Solve    |
| `R`     | Reset    |
| `H`     | Help     |

## 🧠 Algorithms

1. **BFS** ⭐ - Bidirectional, fastest for any scramble
2. **A\*** - Heuristic search, good for short scrambles
3. **IDA\*** - Memory efficient, heuristic pruning

## 🎨 Features

- ☀️ Apple-style white theme
- 🎬 Smooth motion animations
- 💡 Step-by-step solution overlay
- 🎉 Confetti on solve
- 📱 Responsive design

## 📊 Performance

| Scramble | BFS           | A\*  | IDA\* |
| -------- | ------------- | ---- | ----- |
| 20 moves | **0.014s** ⭐ | ~30s | ~30s  |

---

_See main [README.md](../../../README.md) for full documentation_
